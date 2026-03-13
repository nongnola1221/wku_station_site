import { Lock, LogIn } from 'lucide-react'

export function AdminLoginForm({ credentials, onChange, onSubmit, loading, error }) {
  return (
    <form className="admin-login" onSubmit={onSubmit}>
      <div className="admin-login__badge">
        <Lock size={18} />
        관리자 인증
      </div>
      <h1>예약 운영 대시보드</h1>
      <p>시험기간 모드 전환, 시간표 조회, 예약 수정 및 취소를 이 화면에서 처리합니다.</p>

      <label className="field">
        <span>아이디</span>
        <input
          type="text"
          value={credentials.username}
          onChange={(event) => onChange('username', event.target.value)}
          placeholder="admin"
          required
        />
      </label>

      <label className="field">
        <span>비밀번호</span>
        <input
          type="password"
          value={credentials.password}
          onChange={(event) => onChange('password', event.target.value)}
          placeholder="비밀번호 입력"
          required
        />
      </label>

      {error ? <div className="submit-message submit-message--error">{error}</div> : null}

      <button className="button button--primary button--submit" type="submit" disabled={loading}>
        <LogIn size={18} />
        {loading ? '로그인 중...' : '관리자 로그인'}
      </button>
    </form>
  )
}
