import { Save } from 'lucide-react'

export function AdminSiteSettingsForm({ form, onChange, onSubmit, loading }) {
  return (
    <section className="panel admin-settings">
      <div className="section-heading">
        <div>
          <p className="section-heading__eyebrow">사이트 운영 설정</p>
          <h2>문구와 위치 정보를 관리자 화면에서 바로 수정</h2>
        </div>
      </div>

      <form className="admin-settings__form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>사이트 제목</span>
            <input
              type="text"
              value={form.serviceTitle}
              onChange={(event) => onChange('serviceTitle', event.target.value)}
              placeholder="원광대학교 총학생회 스테이션"
            />
          </label>

          <label className="field">
            <span>총학생회 명칭</span>
            <input
              type="text"
              value={form.councilLabel}
              onChange={(event) => onChange('councilLabel', event.target.value)}
              placeholder="57대 총학생회"
            />
          </label>

          <label className="field">
            <span>상단 배지 문구</span>
            <input
              type="text"
              value={form.heroBadge}
              onChange={(event) => onChange('heroBadge', event.target.value)}
              placeholder="총학생회 공식 예약 서비스"
            />
          </label>

          <label className="field">
            <span>운영 위치 문구</span>
            <input
              type="text"
              value={form.locationLabel}
              onChange={(event) => onChange('locationLabel', event.target.value)}
              placeholder="운영 위치: 학생회관 3층 스테이션 존"
            />
          </label>

          <label className="field field--full">
            <span>메인 소개 문구</span>
            <textarea
              rows="3"
              value={form.heroDescription}
              onChange={(event) => onChange('heroDescription', event.target.value)}
              placeholder="사이트 첫 화면 설명"
            />
          </label>

          <label className="field">
            <span>예약 정책 문구</span>
            <input
              type="text"
              value={form.reservationPolicy}
              onChange={(event) => onChange('reservationPolicy', event.target.value)}
              placeholder="전화번호 기준 하루 최대 2시간..."
            />
          </label>

          <label className="field field--full">
            <span>일반 기간 안내 배너</span>
            <textarea
              rows="3"
              value={form.generalNotice}
              onChange={(event) => onChange('generalNotice', event.target.value)}
              placeholder="일반 운영 안내 문구"
            />
          </label>

          <label className="field field--full">
            <span>시험기간 안내 배너</span>
            <textarea
              rows="3"
              value={form.examNotice}
              onChange={(event) => onChange('examNotice', event.target.value)}
              placeholder="시험기간 운영 안내 문구"
            />
          </label>

          <label className="field">
            <span>모든 스테이션 공통 위치</span>
            <input
              type="text"
              value={form.stationLocation}
              onChange={(event) => onChange('stationLocation', event.target.value)}
              placeholder="학생회관 3층"
            />
          </label>
        </div>

        <button className="button button--primary admin-settings__submit" type="submit" disabled={loading}>
          <Save size={18} />
          {loading ? '저장 중...' : '사이트 설정 저장'}
        </button>
      </form>
    </section>
  )
}
