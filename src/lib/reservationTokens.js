import { RESERVATION_TOKEN_KEY } from './constants'

export function getStoredReservationTokens() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RESERVATION_TOKEN_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value) => typeof value === 'string' && value.length >= 16)
  } catch {
    return []
  }
}

export function storeReservationToken(token) {
  if (!token) return
  const nextTokens = [token, ...getStoredReservationTokens().filter((value) => value !== token)].slice(0, 20)
  localStorage.setItem(RESERVATION_TOKEN_KEY, JSON.stringify(nextTokens))
}

export function clearStoredReservationTokens() {
  localStorage.removeItem(RESERVATION_TOKEN_KEY)
}
