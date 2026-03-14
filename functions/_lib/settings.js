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
  heroBadge: '스테이션 예약 사이트',
  heroDescription:
    '원하는 스테이션과 시간을 한 화면에서 확인하고 바로 신청할 수 있는 예약 사이트입니다.',
  heroPanelTitle: '스테이션 예약 안내',
  heroPanelBody:
    '원하는 스테이션과 이용 시간을 선택해 예약할 수 있습니다.\n일반 운영시간과 시험기간 운영시간이 구분되어 적용됩니다.\n관리자 페이지에서 운영 상태와 예약 현황을 관리할 수 있습니다.',
  locationLabel: '운영 위치: 학생회관 3층 스테이션 존',
  reservationPolicy: '대표자 기준 하루 최대 5시간, 중복 시간 예약 불가',
  generalNotice:
    '일반 기간에는 10:00부터 17:00까지 예약할 수 있습니다.',
  examNotice:
    '시험기간에는 24시간 예약이 가능합니다. 단, 동일 대표자 기준 하루 최대 5시간 제한은 유지됩니다.',
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
