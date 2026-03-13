export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(init.headers ?? {}),
    },
    ...init,
  })
}

export function ok(data, init = {}) {
  return json({ success: true, data }, init)
}

export function okWithCache(data, cacheControl, init = {}) {
  return json(
    { success: true, data },
    {
      headers: {
        'Cache-Control': cacheControl,
        ...(init.headers ?? {}),
      },
      ...init,
    },
  )
}

export function fail(status, message, details = null) {
  return json(
    {
      success: false,
      error: {
        message,
        details,
      },
    },
    { status },
  )
}

export async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}
