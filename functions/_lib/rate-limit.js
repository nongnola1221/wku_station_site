import { fail } from './http.js'

function getClientIp(request) {
  const cfIp = request.headers.get('CF-Connecting-IP')
  if (cfIp) return cfIp.trim()

  const forwardedFor = request.headers.get('X-Forwarded-For')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  return 'unknown'
}

export async function enforceRateLimit(env, request, options) {
  const ip = getClientIp(request)
  const now = Date.now()
  const windowStart = Math.floor(now / options.windowMs) * options.windowMs
  const rateKey = `${options.key}:${ip}`

  await env.DB.prepare(
    `
      INSERT INTO rate_limits (
        rate_key,
        window_start,
        request_count
      ) VALUES (?, ?, 1)
      ON CONFLICT(rate_key) DO UPDATE SET
        request_count = CASE
          WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.request_count + 1
          ELSE 1
        END,
        window_start = excluded.window_start,
        updated_at = CURRENT_TIMESTAMP
    `,
  )
    .bind(rateKey, windowStart)
    .run()

  const state = await env.DB.prepare(
    `
      SELECT window_start, request_count
      FROM rate_limits
      WHERE rate_key = ?
      LIMIT 1
    `,
  )
    .bind(rateKey)
    .first()

  const requestCount = Number(state?.request_count ?? 0)
  if (requestCount <= options.limit) {
    return null
  }

  const retryAfterSeconds = Math.max(1, Math.ceil(((Number(state?.window_start ?? windowStart) + options.windowMs) - now) / 1000))

  return fail(
    429,
    options.message ?? `요청이 너무 많습니다. ${retryAfterSeconds}초 후 다시 시도해주세요.`,
    {
      retryAfterSeconds,
    },
    {
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
    },
  )
}
