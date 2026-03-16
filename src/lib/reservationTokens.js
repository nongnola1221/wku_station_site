import { RESERVATION_TOKEN_KEY } from './constants'

const encoder = new TextEncoder()

function normalizeTokens(tokens) {
  return [...new Set(
    tokens.filter((value) => typeof value === 'string' && value.length >= 16),
  )].slice(0, 20)
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

export function getStoredReservationTokens() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RESERVATION_TOKEN_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return normalizeTokens(parsed)
  } catch {
    return []
  }
}

export function storeReservationToken(token) {
  if (!token) return
  const nextTokens = normalizeTokens([token, ...getStoredReservationTokens().filter((value) => value !== token)])
  localStorage.setItem(RESERVATION_TOKEN_KEY, JSON.stringify(nextTokens))
}

export function setStoredReservationTokens(tokens) {
  const nextTokens = normalizeTokens(tokens)
  if (!nextTokens.length) {
    clearStoredReservationTokens()
    return
  }
  localStorage.setItem(RESERVATION_TOKEN_KEY, JSON.stringify(nextTokens))
}

export async function filterReservationTokensByHashes(tokens, activeHashes) {
  const normalizedTokens = normalizeTokens(tokens)
  const allowedHashes = new Set(
    Array.isArray(activeHashes)
      ? activeHashes.filter((value) => typeof value === 'string' && value.length === 64)
      : [],
  )

  if (!normalizedTokens.length || !allowedHashes.size) {
    return []
  }

  const results = await Promise.all(
    normalizedTokens.map(async (token) => {
      const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token))
      return {
        token,
        hash: toHex(digest),
      }
    }),
  )

  return results.filter((entry) => allowedHashes.has(entry.hash)).map((entry) => entry.token)
}

export function clearStoredReservationTokens() {
  localStorage.removeItem(RESERVATION_TOKEN_KEY)
}
