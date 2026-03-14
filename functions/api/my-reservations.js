import { fail, ok, readJson } from '../_lib/http.js'
import { incrementMetric } from '../_lib/metrics.js'
import { hashAccessToken, normalizeAccessTokens } from '../_lib/reservation-access.js'

export async function onRequestPost(context) {
  await incrementMetric(context.env, 'req:public:my-reservations')

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

  return ok({
    reservations: result.results ?? [],
  })
}
