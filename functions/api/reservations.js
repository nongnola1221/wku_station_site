import { fail, ok, readJson } from '../_lib/http.js'
import { incrementMetric } from '../_lib/metrics.js'
import { enforceRateLimit } from '../_lib/rate-limit.js'
import { createAccessToken, hashAccessToken } from '../_lib/reservation-access.js'
import {
  assertReservationRules,
  buildAvailability,
  clearReservedTimeSlots,
  getExamMode,
  RESERVATION_CONFLICT_MESSAGE,
  reserveTimeSlots,
  validatePhone,
  validateReservationInput,
} from '../_lib/reservations.js'

export async function onRequestPost(context) {
  await incrementMetric(context.env, 'req:public:create-reservation')

  const rateLimitResponse = await enforceRateLimit(context.env, context.request, {
    key: 'create-reservation',
    limit: 3,
    windowMs: 30_000,
    message: '예약 요청이 너무 빠르게 반복되고 있습니다. 잠시 후 다시 시도해주세요.',
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const payload = await readJson(context.request)
  if (!payload) {
    return fail(400, '요청 본문이 JSON 형식이어야 합니다.')
  }

  const examMode = await getExamMode(context.env)
  const { valid, errors, normalized } = validateReservationInput(payload, examMode)
  if (!valid) {
    return fail(400, '입력값 검증에 실패했습니다.', errors)
  }

  if (!normalized.representativeName) {
    return fail(400, '대표자 이름은 필수입니다.')
  }

  if (!validatePhone(normalized.phone)) {
    return fail(400, '전화번호 형식이 올바르지 않습니다.')
  }

  if (!normalized.consentChecked) {
    return fail(400, '개인정보 동의가 필요합니다.')
  }

  if (!normalized.signatureConfirmed) {
    return fail(400, '서명 확인이 필요합니다.')
  }

  const ruleViolation = await assertReservationRules(context.env, normalized)
  if (ruleViolation) {
    return fail(409, ruleViolation)
  }

  const reservationToken = createAccessToken()
  const accessTokenHash = await hashAccessToken(reservationToken)

  const insertResult = await context.env.DB.prepare(
    `
      INSERT INTO reservations (
        station_id,
        reservation_date,
        start_hour,
        end_hour,
        duration_hours,
        representative_name,
        phone,
        people_count,
        consent_checked,
        signature_confirmed,
        status,
        access_token_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
    `,
  )
    .bind(
      normalized.stationId,
      normalized.reservationDate,
      normalized.startHour,
      normalized.endHour,
      normalized.durationHours,
      normalized.representativeName,
      normalized.phone,
      normalized.peopleCount,
      normalized.consentChecked ? 1 : 0,
      normalized.signatureConfirmed ? 1 : 0,
      accessTokenHash,
    )
    .run()

  try {
    await reserveTimeSlots(context.env, insertResult.meta.last_row_id, normalized)
  } catch {
    await context.env.DB.prepare(`DELETE FROM reservations WHERE id = ?`)
      .bind(insertResult.meta.last_row_id)
      .run()
    await clearReservedTimeSlots(context.env, insertResult.meta.last_row_id)
    return fail(409, RESERVATION_CONFLICT_MESSAGE)
  }

  const availability = await buildAvailability(context.env, normalized.reservationDate)

  return ok(
    {
      reservationId: insertResult.meta.last_row_id,
      reservationToken,
      availability,
    },
    { status: 201 },
  )
}
