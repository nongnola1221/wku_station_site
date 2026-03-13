export const GENERAL_OPEN_HOUR = 10
export const GENERAL_CLOSE_HOUR = 17
export const EXAM_OPEN_HOUR = 0
export const EXAM_CLOSE_HOUR = 24
export const MAX_RESERVATION_HOURS = 2

export function normalizePhone(phone) {
  return String(phone ?? '').replace(/\D/g, '')
}

export function validatePhone(phone) {
  return /^01\d{8,9}$/.test(normalizePhone(phone))
}

export function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))
}

export function getOperatingHours(examMode) {
  return examMode
    ? {
        startHour: EXAM_OPEN_HOUR,
        endHour: EXAM_CLOSE_HOUR,
        label: '시험기간 24시간 운영',
      }
    : {
        startHour: GENERAL_OPEN_HOUR,
        endHour: GENERAL_CLOSE_HOUR,
        label: '일반 운영 10:00 - 17:00',
      }
}

export function getHourSlots(examMode) {
  const { startHour, endHour } = getOperatingHours(examMode)
  return Array.from({ length: endHour - startHour }, (_, index) => startHour + index)
}

export function doesOverlap(startHour, endHour, existingStartHour, existingEndHour) {
  return existingStartHour < endHour && existingEndHour > startHour
}

export function buildHourSlotsForReservation(startHour, endHour) {
  return Array.from({ length: endHour - startHour }, (_, index) => startHour + index)
}

export async function getExamMode(env) {
  const result = await env.DB.prepare(
    `SELECT value FROM settings WHERE key = 'exam_mode' LIMIT 1`,
  ).first()
  return result?.value === 'true'
}

export async function getOperationStopState(env) {
  const result = await env.DB.prepare(
    `SELECT value FROM settings WHERE key = 'operation_stopped' LIMIT 1`,
  ).first()
  return result?.value === 'true'
}

export async function getStationBlockState(env, stationId) {
  const result = await env.DB.prepare(
    `
      SELECT
        is_active AS isActive,
        is_blocked AS isBlocked,
        COALESCE(block_reason, '') AS blockReason
      FROM stations
      WHERE id = ?
      LIMIT 1
    `,
  )
    .bind(stationId)
    .first()

  if (!result || Number(result.isActive) !== 1) {
    return {
      exists: false,
      isBlocked: false,
      blockReason: '',
    }
  }

  return {
    exists: true,
    isBlocked: Number(result.isBlocked) === 1,
    blockReason: result.blockReason ?? '',
  }
}

export async function findOverlappingReservation(env, { stationId, reservationDate, startHour, endHour, excludeReservationId }) {
  const result = await env.DB.prepare(
    `
      SELECT id, station_id, reservation_date, start_hour, end_hour
      FROM reservations
      WHERE station_id = ?
        AND reservation_date = ?
        AND status = 'confirmed'
        AND start_hour < ?
        AND end_hour > ?
        AND (? IS NULL OR id != ?)
      LIMIT 1
    `,
  )
    .bind(stationId, reservationDate, endHour, startHour, excludeReservationId ?? null, excludeReservationId ?? null)
    .first()

  return result ?? null
}

export async function getPhoneUsageHours(env, { phone, reservationDate, excludeReservationId }) {
  const result = await env.DB.prepare(
    `
      SELECT COALESCE(SUM(duration_hours), 0) AS total_hours
      FROM reservations
      WHERE phone = ?
        AND reservation_date = ?
        AND status = 'confirmed'
        AND (? IS NULL OR id != ?)
    `,
  )
    .bind(normalizePhone(phone), reservationDate, excludeReservationId ?? null, excludeReservationId ?? null)
    .first()

  return Number(result?.total_hours ?? 0)
}

export function validateReservationInput(payload, examMode) {
  const errors = []
  const stationId = Number(payload.stationId)
  const startHour = Number(payload.startHour)
  const durationHours = Number(payload.durationHours)
  const peopleCount = Number(payload.peopleCount)
  const reservationDate = String(payload.reservationDate ?? '')
  const endHour = startHour + durationHours
  const { startHour: openingHour, endHour: closingHour } = getOperatingHours(examMode)

  if (!Number.isInteger(stationId) || stationId < 1 || stationId > 7) {
    errors.push('스테이션 번호가 올바르지 않습니다.')
  }

  if (!isValidDate(reservationDate)) {
    errors.push('예약 날짜 형식이 올바르지 않습니다.')
  }

  if (!Number.isInteger(startHour) || startHour < 0 || startHour > 23) {
    errors.push('시작 시간은 0시부터 23시 사이의 정수여야 합니다.')
  }

  if (!Number.isInteger(durationHours) || durationHours < 1 || durationHours > MAX_RESERVATION_HOURS) {
    errors.push(`예약 시간은 1시간부터 ${MAX_RESERVATION_HOURS}시간까지만 가능합니다.`)
  }

  if (!Number.isInteger(peopleCount) || peopleCount < 1 || peopleCount > 20) {
    errors.push('인원은 1명 이상 20명 이하로 입력해야 합니다.')
  }

  if (startHour < openingHour || endHour > closingHour) {
    errors.push('운영시간 내에서만 예약할 수 있습니다.')
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized: {
      stationId,
      reservationDate,
      startHour,
      endHour,
      durationHours,
      peopleCount,
      representativeName: String(payload.representativeName ?? '').trim(),
      phone: normalizePhone(payload.phone),
      consentChecked: Boolean(payload.consentChecked),
      signatureConfirmed: Boolean(payload.signatureConfirmed),
    },
  }
}

export async function buildAvailability(env, reservationDate) {
  const examMode = await getExamMode(env)
  const operationStopped = await getOperationStopState(env)
  const stationsResult = await env.DB.prepare(
    `
      SELECT
        id,
        name,
        location,
        is_blocked AS isBlocked,
        COALESCE(block_reason, '') AS blockReason
      FROM stations
      WHERE is_active = 1
      ORDER BY id ASC
    `,
  ).all()
  const reservationSlotsResult = await env.DB.prepare(
    `
      SELECT station_id, hour_slot
      FROM reservation_slots
      WHERE reservation_date = ?
    `,
  )
    .bind(reservationDate)
    .all()

  const stations = stationsResult.results ?? []
  const reservationSlots = reservationSlotsResult.results ?? []
  const slots = getHourSlots(examMode)
  const operatingHours = getOperatingHours(examMode)

  const stationsWithAvailability = stations.map((station) => {
    const occupiedHours = new Set(
      reservationSlots
        .filter((reservationSlot) => reservationSlot.station_id === station.id)
        .map((reservationSlot) => reservationSlot.hour_slot),
    )

    const availability = slots.map((startHour) => {
      const endHour = startHour + 1
      const withinOperatingHours =
        startHour >= operatingHours.startHour && endHour <= operatingHours.endHour

      return {
        startHour,
        isAvailable:
          !operationStopped &&
          !station.isBlocked &&
          withinOperatingHours &&
          !occupiedHours.has(startHour),
      }
    })

    return {
      ...station,
      availability,
    }
  })

  const availableStations = stationsWithAvailability.filter((station) =>
    station.availability.some((slot) => slot.isAvailable),
  ).length
  const reservedStations = stations.filter((station) =>
    reservationSlots.some((reservationSlot) => reservationSlot.station_id === station.id),
  ).length

  return {
    date: reservationDate,
    examMode,
    operationStopped,
    maxSelectableHours: MAX_RESERVATION_HOURS,
    operatingHours,
    slots,
    summary: {
      totalStations: stations.length,
      availableStations,
      reservedStations,
    },
    stations: stationsWithAvailability,
  }
}

export async function assertReservationRules(env, reservationData, options = {}) {
  const operationStopped = await getOperationStopState(env)
  if (operationStopped) {
    return '현재 스테이션 운영이 중지되어 예약할 수 없습니다.'
  }

  const stationState = await getStationBlockState(env, reservationData.stationId)
  if (!stationState.exists) {
    return '선택한 스테이션 정보를 찾을 수 없습니다.'
  }

  if (stationState.isBlocked) {
    return stationState.blockReason || '선택한 스테이션은 현재 이용할 수 없습니다.'
  }

  const overlappingReservation = await findOverlappingReservation(env, {
    stationId: reservationData.stationId,
    reservationDate: reservationData.reservationDate,
    startHour: reservationData.startHour,
    endHour: reservationData.endHour,
    excludeReservationId: options.excludeReservationId,
  })

  if (overlappingReservation) {
    return '같은 날짜와 스테이션에 겹치는 예약이 이미 존재합니다.'
  }

  const usageHours = await getPhoneUsageHours(env, {
    phone: reservationData.phone,
    reservationDate: reservationData.reservationDate,
    excludeReservationId: options.excludeReservationId,
  })

  if (usageHours + reservationData.durationHours > 2) {
    return '같은 전화번호는 하루 총 2시간까지만 예약할 수 있습니다. 다른 시간대 1시간 + 1시간 예약은 가능합니다.'
  }

  return null
}

export async function reserveTimeSlots(env, reservationId, reservationData) {
  const hourSlots = buildHourSlotsForReservation(reservationData.startHour, reservationData.endHour)
  const statements = hourSlots.map((hourSlot) =>
    env.DB.prepare(
      `
        INSERT INTO reservation_slots (
          reservation_id,
          station_id,
          reservation_date,
          hour_slot
        ) VALUES (?, ?, ?, ?)
      `,
    )
      .bind(
        reservationId,
        reservationData.stationId,
        reservationData.reservationDate,
        hourSlot,
      ),
  )

  return env.DB.batch(statements)
}

export async function clearReservedTimeSlots(env, reservationId) {
  return env.DB.prepare(
    `DELETE FROM reservation_slots WHERE reservation_id = ?`,
  )
    .bind(reservationId)
    .run()
}
