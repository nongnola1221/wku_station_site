INSERT OR IGNORE INTO stations (id, name, location, description)
VALUES
  (1, '스테이션 1', '학생회관 3층', '빠른 이용을 위한 기본 스테이션'),
  (2, '스테이션 2', '학생회관 3층', '중앙 안내데스크 인접 좌석'),
  (3, '스테이션 3', '학생회관 3층', '창가형 집중 이용 좌석'),
  (4, '스테이션 4', '학생회관 3층', '단체 사용에 적합한 스테이션'),
  (5, '스테이션 5', '학생회관 3층', '행사 운영 지원 스테이션'),
  (6, '스테이션 6', '학생회관 3층', '야간 운영 대응 스테이션'),
  (7, '스테이션 7', '학생회관 3층', '확장형 운영 스테이션');

INSERT OR IGNORE INTO settings (key, value)
VALUES
  ('exam_mode', 'false'),
  ('retention_days', '30'),
  ('service_title', '원광대학교 총학생회 스테이션'),
  ('council_label', '57대 총학생회'),
  ('hero_badge', '총학생회 공식 예약 서비스'),
  ('hero_description', '원하는 스테이션과 시간을 한 화면에서 확인하고 바로 신청할 수 있는 예약 사이트입니다.'),
  ('hero_panel_title', '현황이 먼저 보이는 예약 경험'),
  ('hero_panel_body', '스테이션 1번부터 7번까지 실시간 상태 확인\n2시간 예약을 한 번에 처리하는 서버 검증\n관리자 모드에서 시간표·상세 모달·시험기간 토글 제공'),
  ('location_label', '운영 위치: 학생회관 3층 스테이션 존'),
  ('reservation_policy', '전화번호 기준 하루 총 2시간까지 예약할 수 있습니다.'),
  ('general_notice', '일반 기간에는 10:00부터 17:00까지 예약할 수 있습니다.'),
  ('exam_notice', '시험기간에는 24시간 예약이 가능합니다. 단, 동일 전화번호 기준 하루 최대 2시간 제한은 유지됩니다.'),
  ('operation_stopped', 'false'),
  ('operation_stop_reason', '');

INSERT OR IGNORE INTO admin_users (id, username, password_hash, display_name)
VALUES
  (1, 'admin', '286aee2ea4a5ba67539432dc5ea3865c3b204d3caaccb662995388d156a279cf', '총학생회 관리자');
