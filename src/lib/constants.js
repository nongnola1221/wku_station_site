import dayjs from 'dayjs'

export const APP_TITLE = '원광대학교 총학생회 스테이션'
export const STATION_COUNT = 7
export const GENERAL_OPEN_HOUR = 10
export const GENERAL_CLOSE_HOUR = 17
export const EXAM_OPEN_HOUR = 0
export const EXAM_CLOSE_HOUR = 24
export const MAX_RESERVATION_HOURS = 5

export const DEFAULT_FORM = {
  stationId: 1,
  reservationDate: dayjs().format('YYYY-MM-DD'),
  startHour: null,
  durationHours: 0,
  representativeName: '',
  peopleCount: '',
  phone: '',
  consentChecked: false,
  signatureConfirmed: false,
}

export const ADMIN_TOKEN_KEY = 'wkustation-admin-token'
export const RESERVATION_TOKEN_KEY = 'wkustation-reservation-tokens'
