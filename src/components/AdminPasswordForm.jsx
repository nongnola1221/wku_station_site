import { KeyRound } from 'lucide-react'

export function AdminPasswordForm({ form, onChange, onSubmit, loading }) {
  return (
    <section className="panel admin-settings">
      <div className="section-heading">
        <div>
          <p className="section-heading__eyebrow">관리자 보안</p>
          <h2>관리자 비밀번호 변경</h2>
        </div>
      </div>

      <form className="admin-settings__form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>현재 비밀번호</span>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(event) => onChange('currentPassword', event.target.value)}
              placeholder="현재 비밀번호"
            />
          </label>

          <label className="field">
            <span>새 비밀번호</span>
            <input
              type="password"
              value={form.nextPassword}
              onChange={(event) => onChange('nextPassword', event.target.value)}
              placeholder="새 비밀번호"
            />
          </label>
        </div>

        <button className="button button--primary admin-settings__submit" type="submit" disabled={loading}>
          <KeyRound size={18} />
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </section>
  )
}
