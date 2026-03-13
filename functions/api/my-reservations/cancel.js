import { fail, ok, readJson } from '../../_lib/http.js'
import { hashAccessToken, normalizeAccessTokens } from '../../_lib/reservation-access.js'
import { clearReservedTimeSlots } from '../../_lib/reservations.js'

export async function onRequestPost(context) {
  const payload = await readJson(context.request)
  if (!payload) {
    return fail(400, '요청 본문이 JSON 형식이어야 합니다.')
  }

  const reservationId = Number(payload.reservationId)
  if (!Number.isInteger(reservationId)) {
    return fail(400, '예약 ID가 올바르지 않습니다.')
  }

  const tokens = normalizeAccessTokens(payload.tokens)
  if (!tokens.length) {
    return fail(401, '예약 확인 토큰이 필요합니다.')
  }

  const tokenHashes = await Promise.all(tokens.map((token) => hashAccessToken(token)))
  const placeholders = tokenHashes.map(() => '?').join(', ')

  const result = await context.env.DB.prepare(
    `
      UPDATE reservations
      SET status = 'cancelled',
          access_token_hash = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND status = 'confirmed'
        AND access_token_hash IN (${placeholders})
    `,
  )
    .bind(reservationId, ...tokenHashes)
    .run()

  if (!result.success || result.meta.changes < 1) {
    return fail(404, '취소할 예약을 찾을 수 없습니다.')
  }

  await clearReservedTimeSlots(context.env, reservationId)

  return ok({
    reservationId,
    status: 'cancelled',
  })
}
