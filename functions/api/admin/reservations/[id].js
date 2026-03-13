import { requireAdmin } from '../../../_lib/auth.js'
import { fail, ok, readJson } from '../../../_lib/http.js'
import {
  assertReservationRules,
  clearReservedTimeSlots,
  getExamMode,
  reserveTimeSlots,
  validateReservationInput,
} from '../../../_lib/reservations.js'

export async function onRequestPatch(context) {
  const auth = await requireAdmin(context.request, context.env)
  if (auth.error) return auth.error

  const reservationId = Number(context.params.id)
  if (!Number.isInteger(reservationId)) {
    return fail(400, '예약 ID가 올바르지 않습니다.')
  }

  const existing = await context.env.DB.prepare(
    `SELECT * FROM reservations WHERE id = ? LIMIT 1`,
  )
    .bind(reservationId)
    .first()

  if (!existing) {
    return fail(404, '예약을 찾을 수 없습니다.')
  }

  const payload = await readJson(context.request)
  if (!payload) {
    return fail(400, '요청 본문이 JSON 형식이어야 합니다.')
  }

  const examMode = await getExamMode(context.env)
  const mergedPayload = {
    stationId: payload.stationId ?? existing.station_id,
    reservationDate: payload.reservationDate ?? existing.reservation_date,
    startHour: payload.startHour ?? existing.start_hour,
    durationHours: payload.durationHours ?? existing.duration_hours,
    representativeName: existing.representative_name,
    phone: existing.phone,
    peopleCount: payload.peopleCount ?? existing.people_count,
    consentChecked: Boolean(existing.consent_checked),
    signatureConfirmed: Boolean(existing.signature_confirmed),
  }

  const { valid, errors, normalized } = validateReservationInput(mergedPayload, examMode)
  if (!valid) {
    return fail(400, '입력값 검증에 실패했습니다.', errors)
  }

  const ruleViolation = await assertReservationRules(context.env, normalized, {
    excludeReservationId: reservationId,
  })
  if (ruleViolation) {
    return fail(409, ruleViolation)
  }

  await context.env.DB.prepare(
    `
      UPDATE reservations
      SET station_id = ?,
          reservation_date = ?,
          start_hour = ?,
          end_hour = ?,
          duration_hours = ?,
          people_count = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  )
    .bind(
      normalized.stationId,
      normalized.reservationDate,
      normalized.startHour,
      normalized.endHour,
      normalized.durationHours,
      normalized.peopleCount,
      reservationId,
    )
    .run()

  await clearReservedTimeSlots(context.env, reservationId)

  try {
    await reserveTimeSlots(context.env, reservationId, normalized)
  } catch {
    await context.env.DB.prepare(
      `
        UPDATE reservations
        SET station_id = ?,
            reservation_date = ?,
            start_hour = ?,
            end_hour = ?,
            duration_hours = ?,
            people_count = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
    )
      .bind(
        existing.station_id,
        existing.reservation_date,
        existing.start_hour,
        existing.end_hour,
        existing.duration_hours,
        existing.people_count,
        reservationId,
      )
      .run()

    await reserveTimeSlots(context.env, reservationId, {
      stationId: existing.station_id,
      reservationDate: existing.reservation_date,
      startHour: existing.start_hour,
      endHour: existing.end_hour,
    })

    return fail(409, '같은 날짜와 스테이션에 겹치는 예약이 이미 존재합니다.')
  }

  return ok({
    reservationId,
  })
}

export async function onRequestDelete(context) {
  const auth = await requireAdmin(context.request, context.env)
  if (auth.error) return auth.error

  const reservationId = Number(context.params.id)
  if (!Number.isInteger(reservationId)) {
    return fail(400, '예약 ID가 올바르지 않습니다.')
  }

  const result = await context.env.DB.prepare(
    `
      UPDATE reservations
      SET status = 'cancelled',
          access_token_hash = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  )
    .bind(reservationId)
    .run()

  await clearReservedTimeSlots(context.env, reservationId)

  if (!result.success || result.meta.changes < 1) {
    return fail(404, '취소할 예약을 찾을 수 없습니다.')
  }

  return ok({
    reservationId,
    status: 'cancelled',
  })
}
