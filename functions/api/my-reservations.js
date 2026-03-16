import { fail, ok, readJson } from '../_lib/http.js'
import { enforceRateLimit } from '../_lib/rate-limit.js'
import { hashAccessToken, normalizeAccessTokens } from '../_lib/reservation-access.js'

function getCurrentKstDateHour() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(new Date())
  const valueByType = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    date: `${valueByType.year}-${valueByType.month}-${valueByType.day}`,
    hour: Number(valueByType.hour ?? 0),
  }
}

export async function onRequestPost(context) {
  const rateLimitResponse = await enforceRateLimit(context.env, context.request, {
    key: 'my-reservations',
    limit: 8,
    windowMs: 15_000,
    message: '예약 조회 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const payload = await readJson(context.request)
  if (!payload) {
    return fail(400, '요청 본문이 JSON 형식이어야 합니다.')
  }

  const tokens = normalizeAccessTokens(payload.tokens)
  if (!tokens.length) {
    return ok({ reservations: [] })
  }

  const tokenHashes = await Promise.all(tokens.map((token) => hashAccessToken(token)))
  const placeholders = tokenHashes.map(() => '?').join(', ')
  const now = getCurrentKstDateHour()

  await context.env.DB.prepare(
    `
      UPDATE reservations
      SET access_token_hash = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE access_token_hash IN (${placeholders})
        AND status = 'confirmed'
        AND (
          reservation_date < ?
          OR (reservation_date = ? AND end_hour <= ?)
        )
    `,
  )
    .bind(...tokenHashes, now.date, now.date, now.hour)
    .run()

  const result = await context.env.DB.prepare(
    `
      SELECT
        reservations.id,
        reservations.station_id,
        stations.name AS station_name,
        reservations.reservation_date,
        reservations.start_hour,
        reservations.end_hour,
        reservations.duration_hours,
        reservations.representative_name,
        reservations.people_count,
        reservations.access_token_hash,
        reservations.status,
        reservations.created_at,
        reservations.updated_at
      FROM reservations
      INNER JOIN stations ON stations.id = reservations.station_id
      WHERE reservations.access_token_hash IN (${placeholders})
        AND reservations.status = 'confirmed'
      ORDER BY reservations.reservation_date ASC, reservations.start_hour ASC, reservations.station_id ASC
    `,
  )
    .bind(...tokenHashes)
    .all()

  const reservations = (result.results ?? []).map(({ access_token_hash, ...reservation }) => reservation)
  const activeTokenHashes = [...new Set((result.results ?? []).map((reservation) => reservation.access_token_hash).filter(Boolean))]

  return ok({
    reservations,
    activeTokenHashes,
  })
}
