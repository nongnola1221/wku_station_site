const encoder = new TextEncoder()

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

function toBase64Url(bytes) {
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export async function hashAccessToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(token ?? '')))
  return toHex(digest)
}

export function createAccessToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return toBase64Url(bytes)
}

export function normalizeAccessTokens(tokens) {
  if (!Array.isArray(tokens)) return []

  return [...new Set(
    tokens
      .map((token) => String(token ?? '').trim())
      .filter((token) => token.length >= 16),
  )].slice(0, 20)
}
