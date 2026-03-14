import { requireAdmin } from '../../../_lib/auth.js'
import { fail, ok, readJson } from '../../../_lib/http.js'
import { incrementMetric } from '../../../_lib/metrics.js'
import { SITE_SETTING_KEYS, upsertSetting } from '../../../_lib/settings.js'

export async function onRequestPatch(context) {
  const auth = await requireAdmin(context.request, context.env)
  if (auth.error) return auth.error
  await incrementMetric(context.env, 'req:admin:operation-status')

  const payload = await readJson(context.request)
  if (typeof payload?.operationStopped !== 'boolean') {
    return fail(400, 'operationStopped는 boolean 값이어야 합니다.')
  }

  if (payload.operationStopped && !String(payload?.reason ?? '').trim()) {
    return fail(400, '서비스 중지 사유를 입력해야 합니다.')
  }

  await upsertSetting(context.env, SITE_SETTING_KEYS.operationStopped, payload.operationStopped ? 'true' : 'false')
  await upsertSetting(
    context.env,
    SITE_SETTING_KEYS.operationStopReason,
    payload.operationStopped ? String(payload.reason).trim() : '',
  )

  return ok({
    operationStopped: payload.operationStopped,
    reason: payload.operationStopped ? String(payload.reason).trim() : '',
  })
}
