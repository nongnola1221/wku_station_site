export const SITE_SETTING_KEYS = {
  examMode: 'exam_mode',
  retentionDays: 'retention_days',
  serviceTitle: 'service_title',
  councilLabel: 'council_label',
  heroBadge: 'hero_badge',
  heroDescription: 'hero_description',
  heroPanelTitle: 'hero_panel_title',
  heroPanelBody: 'hero_panel_body',
  locationLabel: 'location_label',
  reservationPolicy: 'reservation_policy',
  generalNotice: 'general_notice',
  examNotice: 'exam_notice',
  operationStopped: 'operation_stopped',
  operationStopReason: 'operation_stop_reason',
}

export const SITE_SETTING_DEFAULTS = {
  serviceTitle: '원광대학교 총학생회 스테이션',
  councilLabel: '57대 총학생회',
  heroBadge: '총학생회 공식 예약 서비스',
  heroDescription:
    '당일 예약 현황, 시험기간 운영 모드, 1시간·2시간 예약 흐름을 한 화면에서 확인하고 바로 신청할 수 있는 원페이지 예약 사이트입니다.',
  heroPanelTitle: '현황이 먼저 보이는 예약 경험',
  heroPanelBody: '스테이션 1번부터 7번까지 실시간 상태 확인\n2시간 예약을 한 번에 처리하는 서버 검증\n관리자 모드에서 시간표·상세 모달·시험기간 토글 제공',
  locationLabel: '운영 위치: 학생회관 3층 스테이션 존',
  reservationPolicy: '전화번호 기준 하루 최대 2시간, 중복 시간 예약 불가',
  generalNotice:
    '일반 기간에는 10:00부터 17:00까지 예약할 수 있습니다.',
  examNotice:
    '시험기간에는 24시간 예약이 가능합니다. 단, 동일 전화번호 기준 하루 최대 2시간 제한은 유지됩니다.',
  operationStopped: 'false',
  operationStopReason: '',
}

export async function getSettingsMap(env, keys) {
  const placeholders = keys.map(() => '?').join(', ')
  const result = await env.DB.prepare(
    `SELECT key, value FROM settings WHERE key IN (${placeholders})`,
  )
    .bind(...keys)
    .all()

  return Object.fromEntries((result.results ?? []).map((row) => [row.key, row.value]))
}

export async function upsertSetting(env, key, value) {
  return env.DB.prepare(
    `
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `,
  )
    .bind(key, String(value))
    .run()
}
