import { hashPassword, requireAdmin } from '../../_lib/auth.js'
import { fail, ok, readJson } from '../../_lib/http.js'
export async function onRequestPost(context) {
  const auth = await requireAdmin(context.request, context.env)
  if (auth.error) return auth.error

  const payload = await readJson(context.request)
  const currentPassword = String(payload?.currentPassword ?? '')
  const nextPassword = String(payload?.nextPassword ?? '')

  if (!currentPassword || !nextPassword) {
    return fail(400, '현재 비밀번호와 새 비밀번호를 모두 입력해야 합니다.')
  }

  if (nextPassword.length < 4) {
    return fail(400, '새 비밀번호는 최소 4자 이상이어야 합니다.')
  }

  const admin = await context.env.DB.prepare(
    `SELECT id, password_hash FROM admin_users WHERE username = ? LIMIT 1`,
  )
    .bind(auth.admin.username)
    .first()

  if (!admin) {
    return fail(404, '관리자 계정을 찾을 수 없습니다.')
  }

  const currentHash = await hashPassword(currentPassword)
  if (currentHash !== admin.password_hash) {
    return fail(401, '현재 비밀번호가 올바르지 않습니다.')
  }

  const nextHash = await hashPassword(nextPassword)
  await context.env.DB.prepare(`UPDATE admin_users SET password_hash = ? WHERE id = ?`)
    .bind(nextHash, admin.id)
    .run()

  return ok({ changed: true })
}
