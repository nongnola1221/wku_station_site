import { okWithCache } from '../../_lib/http.js'
import { incrementMetric } from '../../_lib/metrics.js'
import { getExamMode } from '../../_lib/reservations.js'
import { SITE_SETTING_DEFAULTS, SITE_SETTING_KEYS, getSettingsMap } from '../../_lib/settings.js'

export async function onRequestGet(context) {
  await incrementMetric(context.env, 'req:public:settings')

  const examMode = await getExamMode(context.env)
  const values = await getSettingsMap(context.env, [
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

  return okWithCache({
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
  }, 'public, max-age=30, s-maxage=120')
}
