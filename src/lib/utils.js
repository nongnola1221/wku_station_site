export function cn(...values) {
  return values.filter(Boolean).join(' ')
}

export function formatPhoneInput(rawValue) {
  const digits = rawValue.replace(/\D/g, '').slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function getStationName(stationId) {
  return `스테이션 ${stationId}`
}
