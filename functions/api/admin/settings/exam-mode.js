import { requireAdmin } from '../../../_lib/auth.js'
import { fail, ok, readJson } from '../../../_lib/http.js'
export async function onRequestPatch(context) {
  const auth = await requireAdmin(context.request, context.env)
  if (auth.error) return auth.error

  const payload = await readJson(context.request)
  if (typeof payload?.examMode !== 'boolean') {
    return fail(400, 'examMode는 boolean 값이어야 합니다.')
  }

  await context.env.DB.prepare(
    `
      INSERT INTO settings (key, value, updated_at)
      VALUES ('exam_mode', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `,
  )
    .bind(payload.examMode ? 'true' : 'false')
    .run()

  return ok({
    examMode: payload.examMode,
  })
}
