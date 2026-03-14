import { fail, okWithCache } from '../_lib/http.js'
import { incrementMetric } from '../_lib/metrics.js'
import { enforceRateLimit } from '../_lib/rate-limit.js'
import { buildAvailability, getExamMode, isValidDate } from '../_lib/reservations.js'
import { SITE_SETTING_DEFAULTS, SITE_SETTING_KEYS, getSettingsMap } from '../_lib/settings.js'

async function getStations(env) {
  const result = await env.DB.prepare(
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

  return result.results ?? []
}

async function getPublicSettings(env) {
  const examMode = await getExamMode(env)
  const values = await getSettingsMap(env, [
    SITE_SETTING_KEYS.retentionDays,
    SITE_SETTING_KEYS.serviceTitle,
    SITE_SETTING_KEYS.councilLabel,
    SITE_SETTING_KEYS.heroBadge,
    SITE_SETTING_KEYS.heroDescription,
    SITE_SETTING_KEYS.heroPanelTitle,
    SITE_SETTING_KEYS.heroPanelBody,
    SITE_SETTING_KEYS.locationLabel,
    SITE_SETTING_KEYS.reservationPolicy,
    SITE_SETTING_KEYS.generalNotice,
    SITE_SETTING_KEYS.examNotice,
    SITE_SETTING_KEYS.operationStopped,
    SITE_SETTING_KEYS.operationStopReason,
  ])

  return {
    examMode,
    retentionDays: Number(values[SITE_SETTING_KEYS.retentionDays] ?? 30),
    serviceTitle: values[SITE_SETTING_KEYS.serviceTitle] ?? SITE_SETTING_DEFAULTS.serviceTitle,
    councilLabel: values[SITE_SETTING_KEYS.councilLabel] ?? SITE_SETTING_DEFAULTS.councilLabel,
    heroBadge: values[SITE_SETTING_KEYS.heroBadge] ?? SITE_SETTING_DEFAULTS.heroBadge,
    heroDescription: values[SITE_SETTING_KEYS.heroDescription] ?? SITE_SETTING_DEFAULTS.heroDescription,
    heroPanelTitle: values[SITE_SETTING_KEYS.heroPanelTitle] ?? SITE_SETTING_DEFAULTS.heroPanelTitle,
    heroPanelBody: values[SITE_SETTING_KEYS.heroPanelBody] ?? SITE_SETTING_DEFAULTS.heroPanelBody,
    locationLabel: values[SITE_SETTING_KEYS.locationLabel] ?? SITE_SETTING_DEFAULTS.locationLabel,
    reservationPolicy: values[SITE_SETTING_KEYS.reservationPolicy] ?? SITE_SETTING_DEFAULTS.reservationPolicy,
    generalNotice: values[SITE_SETTING_KEYS.generalNotice] ?? SITE_SETTING_DEFAULTS.generalNotice,
    examNotice: values[SITE_SETTING_KEYS.examNotice] ?? SITE_SETTING_DEFAULTS.examNotice,
    operationStopped: values[SITE_SETTING_KEYS.operationStopped] === 'true',
    operationStopReason: values[SITE_SETTING_KEYS.operationStopReason] ?? SITE_SETTING_DEFAULTS.operationStopReason,
  }
}

export async function onRequestGet(context) {
  await incrementMetric(context.env, 'req:public:bootstrap')

  const rateLimitResponse = await enforceRateLimit(context.env, context.request, {
    key: 'bootstrap',
    limit: 12,
    windowMs: 10_000,
    message: '요청이 너무 많습니다. 잠시 후 다시 새로고침해주세요.',
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const date = new URL(context.request.url).searchParams.get('date')

  if (!isValidDate(date)) {
    return fail(400, 'date 쿼리는 YYYY-MM-DD 형식이어야 합니다.')
  }

  const [stations, settings, availability] = await Promise.all([
    getStations(context.env),
    getPublicSettings(context.env),
    buildAvailability(context.env, date),
  ])

  return okWithCache({
    stations,
    settings,
    availability,
  }, 'public, max-age=10, s-maxage=30')
}
