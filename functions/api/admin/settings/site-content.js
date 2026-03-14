import { requireAdmin } from '../../../_lib/auth.js'
import { fail, ok, readJson } from '../../../_lib/http.js'
import { incrementMetric } from '../../../_lib/metrics.js'
import { SITE_SETTING_KEYS, upsertSetting } from '../../../_lib/settings.js'

export async function onRequestPatch(context) {
  const auth = await requireAdmin(context.request, context.env)
  if (auth.error) return auth.error
  await incrementMetric(context.env, 'req:admin:site-content')

  const payload = await readJson(context.request)
  if (!payload) {
    return fail(400, '요청 본문이 JSON 형식이어야 합니다.')
  }

  const updates = [
    [SITE_SETTING_KEYS.serviceTitle, payload.serviceTitle],
    [SITE_SETTING_KEYS.councilLabel, payload.councilLabel],
    [SITE_SETTING_KEYS.heroBadge, payload.heroBadge],
    [SITE_SETTING_KEYS.heroDescription, payload.heroDescription],
    [SITE_SETTING_KEYS.locationLabel, payload.locationLabel],
    [SITE_SETTING_KEYS.reservationPolicy, payload.reservationPolicy],
    [SITE_SETTING_KEYS.generalNotice, payload.generalNotice],
    [SITE_SETTING_KEYS.examNotice, payload.examNotice],
  ]

  for (const [key, value] of updates) {
    if (value === undefined) continue
    if (typeof value !== 'string') {
      return fail(400, `${key} 값은 문자열이어야 합니다.`)
    }
    await upsertSetting(context.env, key, value.trim())
  }

  if (typeof payload.stationLocation === 'string' && payload.stationLocation.trim()) {
    await context.env.DB.prepare(
      `UPDATE stations SET location = ?, updated_at = CURRENT_TIMESTAMP`,
    )
      .bind(payload.stationLocation.trim())
      .run()
  }

  return ok({
    saved: true,
  })
}
