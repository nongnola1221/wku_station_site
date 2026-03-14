import { okWithCache } from '../_lib/http.js'
import { incrementMetric } from '../_lib/metrics.js'

export async function onRequestGet(context) {
  await incrementMetric(context.env, 'req:public:stations')

  const result = await context.env.DB.prepare(
    `
      SELECT
        id,
        name,
        location,
        description,
        is_blocked AS isBlocked,
        COALESCE(block_reason, '') AS blockReason
      FROM stations
      WHERE is_active = 1
      ORDER BY id ASC
    `,
  ).all()

  return okWithCache({
    stations: result.results ?? [],
  }, 'public, max-age=60, s-maxage=300')
}
