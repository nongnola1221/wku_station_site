import { requireAdmin } from '../../_lib/auth.js'
import { ok, fail } from '../../_lib/http.js'
import { buildUsageSummary, getDailyMetricsMap, getMetricsDateKey, getResetInfo, incrementMetric } from '../../_lib/metrics.js'

export async function onRequestGet(context) {
  const auth = await requireAdmin(context.request, context.env)
  if (auth.error) return auth.error

  await incrementMetric(context.env, 'req:admin:usage')

  const dateKey = getMetricsDateKey()
  const metrics = await getDailyMetricsMap(context.env, dateKey)
  if (!metrics) {
    return fail(500, '사용량 통계를 불러오지 못했습니다.')
  }

  return ok({
    dateKey,
    metrics,
    summary: buildUsageSummary(metrics),
    resetInfo: getResetInfo(),
  })
}
