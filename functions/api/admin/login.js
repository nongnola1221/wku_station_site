import { createToken, hashPassword } from '../../_lib/auth.js'
import { fail, ok, readJson } from '../../_lib/http.js'

export async function onRequestPost(context) {
  const payload = await readJson(context.request)
  if (!payload?.username || !payload?.password) {
    return fail(400, '아이디와 비밀번호를 모두 입력해야 합니다.')
  }

  const admin = await context.env.DB.prepare(
    `SELECT id, username, password_hash, display_name FROM admin_users WHERE username = ? LIMIT 1`,
  )
    .bind(String(payload.username).trim())
    .first()

  if (!admin) {
    return fail(401, '관리자 계정을 찾을 수 없습니다.')
  }

  const passwordHash = await hashPassword(String(payload.password))
  if (passwordHash !== admin.password_hash) {
    return fail(401, '비밀번호가 올바르지 않습니다.')
  }

  const token = await createToken(
    {
      sub: admin.id,
      username: admin.username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
    },
    context.env.ADMIN_SESSION_SECRET,
  )

  return ok({
    token,
    admin: {
      username: admin.username,
      displayName: admin.display_name,
    },
  })
}
