import { fail } from './http.js'

const encoder = new TextEncoder()

function toBase64Url(value) {
  const base64 = btoa(value)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  return atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function hashPassword(password) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(password))
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

async function signMessage(message, secret) {
  const key = await importHmacKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return toBase64Url(String.fromCharCode(...new Uint8Array(signature)))
}

export async function createToken(payload, secret) {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = toBase64Url(JSON.stringify(payload))
  const signature = await signMessage(`${header}.${body}`, secret)
  return `${header}.${body}.${signature}`
}

export async function verifyToken(token, secret) {
  const [header, body, signature] = token.split('.')
  if (!header || !body || !signature) return null
  const expected = await signMessage(`${header}.${body}`, secret)
  if (expected !== signature) return null
  const payload = JSON.parse(fromBase64Url(body))
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}

export async function requireAdmin(request, env) {
  const authorization = request.headers.get('Authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) {
    return { error: fail(401, '관리자 인증 토큰이 필요합니다.') }
  }

  const payload = await verifyToken(token, env.ADMIN_SESSION_SECRET)
  if (!payload) {
    return { error: fail(401, '유효하지 않거나 만료된 관리자 토큰입니다.') }
  }

  return { admin: payload }
}
