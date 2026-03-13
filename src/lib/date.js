import dayjs from 'dayjs'

export function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`
}

export function formatHourRange(startHour, endHour) {
  return `${formatHour(startHour)} - ${formatHour(endHour)}`
}

export function formatKoreanDate(date) {
  return dayjs(date).format('YYYY년 M월 D일')
}

export function getToday() {
  return dayjs().format('YYYY-MM-DD')
}

export function getIsToday(date) {
  return dayjs(date).isSame(dayjs(), 'day')
}

export function getCurrentHour() {
  return dayjs().hour()
}
