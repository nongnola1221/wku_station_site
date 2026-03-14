import { fail, ok } from '../_lib/http.js'
import { buildAvailability, isValidDate } from '../_lib/reservations.js'

export async function onRequestGet(context) {
  const date = context.request.url ? new URL(context.request.url).searchParams.get('date') : null

  if (!isValidDate(date)) {
    return fail(400, 'date 쿼리는 YYYY-MM-DD 형식이어야 합니다.')
  }

  const availability = await buildAvailability(context.env, date)
  return ok(availability)
}
