import { requireAdmin } from '../../_lib/auth.js'
import { fail, ok } from '../../_lib/http.js'
import { incrementMetric } from '../../_lib/metrics.js'
import { isValidDate } from '../../_lib/reservations.js'

export async function onRequestGet(context) {
  const auth = await requireAdmin(context.request, context.env)
  if (auth.error) return auth.error
  await incrementMetric(context.env, 'req:admin:reservations')

  const date = new URL(context.request.url).searchParams.get('date')
  if (!isValidDate(date)) {
    return fail(400, 'date 쿼리는 YYYY-MM-DD 형식이어야 합니다.')
  }

  const result = await context.env.DB.prepare(
    `
      SELECT
        id,
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
        created_at,
        updated_at
      FROM reservations
      WHERE reservation_date = ?
      ORDER BY start_hour ASC, station_id ASC
    `,
  )
    .bind(date)
    .all()

  return ok({
    reservations: result.results ?? [],
  })
}
