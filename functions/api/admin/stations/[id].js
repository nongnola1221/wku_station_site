import { requireAdmin } from '../../../_lib/auth.js'
import { fail, ok, readJson } from '../../../_lib/http.js'
import { incrementMetric } from '../../../_lib/metrics.js'

export async function onRequestPatch(context) {
  const auth = await requireAdmin(context.request, context.env)
  if (auth.error) return auth.error
  await incrementMetric(context.env, 'req:admin:station-status')

  const stationId = Number(context.params.id)
  if (!Number.isInteger(stationId) || stationId < 1) {
    return fail(400, '스테이션 번호가 올바르지 않습니다.')
  }

  const payload = await readJson(context.request)
  if (!payload || typeof payload.isBlocked !== 'boolean') {
    return fail(400, 'isBlocked 값이 필요합니다.')
  }

  const blockReason = payload.isBlocked ? String(payload.reason ?? '').trim() : ''
  if (payload.isBlocked && !blockReason) {
    return fail(400, '스테이션 중지 사유를 입력해주세요.')
  }

  const station = await context.env.DB.prepare(
    `SELECT id FROM stations WHERE id = ? AND is_active = 1 LIMIT 1`,
  )
    .bind(stationId)
    .first()

  if (!station) {
    return fail(404, '스테이션 정보를 찾을 수 없습니다.')
  }

  await context.env.DB.prepare(
    `
      UPDATE stations
      SET is_blocked = ?, block_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  )
    .bind(payload.isBlocked ? 1 : 0, blockReason, stationId)
    .run()

  return ok({
    stationId,
    isBlocked: payload.isBlocked,
    blockReason,
  })
}
