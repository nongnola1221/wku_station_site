async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error?.message || '요청 처리 중 오류가 발생했습니다.')
  }
  return data
}

function withFreshQuery(url, fresh) {
  if (!fresh) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}t=${Date.now()}`
}

export const api = {
  getBootstrap: (date, options = {}) =>
    request(withFreshQuery(`/api/bootstrap?date=${date}`, options.fresh), {
      cache: options.fresh ? 'no-store' : 'default',
    }),
  getStations: (options = {}) =>
    request(withFreshQuery('/api/stations', options.fresh), {
      cache: options.fresh ? 'no-store' : 'default',
    }),
  getPublicSettings: (options = {}) =>
    request(withFreshQuery('/api/settings/public', options.fresh), {
      cache: options.fresh ? 'no-store' : 'default',
    }),
  getAvailability: (date) => request(`/api/availability?date=${date}`),
  createReservation: (payload) =>
    request('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyReservations: (tokens) =>
    request('/api/my-reservations', {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({ tokens }),
    }),
  cancelMyReservation: (reservationId, tokens) =>
    request('/api/my-reservations/cancel', {
      method: 'POST',
      body: JSON.stringify({ reservationId, tokens }),
    }),
  adminLogin: (payload) =>
    request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAdminReservations: (date, token, options = {}) =>
    request(withFreshQuery(`/api/admin/reservations?date=${date}`, options.fresh), {
      cache: options.fresh ? 'no-store' : 'default',
      headers: { Authorization: `Bearer ${token}` },
    }),
  patchAdminReservation: (id, payload, token) =>
    request(`/api/admin/reservations/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  deleteAdminReservation: (id, token) =>
    request(`/api/admin/reservations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
  patchExamMode: (payload, token) =>
    request('/api/admin/settings/exam-mode', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  patchSiteContent: (payload, token) =>
    request('/api/admin/settings/site-content', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  changeAdminPassword: (payload, token) =>
    request('/api/admin/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  patchOperationStatus: (payload, token) =>
    request('/api/admin/settings/operation-status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  patchAdminStation: (id, payload, token) =>
    request(`/api/admin/stations/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
}
