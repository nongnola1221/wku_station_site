function UsageBar({ label, value, tone = 'brand' }) {
  return (
    <div className="usage-panel__bar-row">
      <div className="usage-panel__bar-copy">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="usage-panel__bar-track">
        <div
          className={`usage-panel__bar-fill usage-panel__bar-fill--${tone}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}

export function AdminUsagePanel({ stats }) {
  if (!stats) return null

  const requestPercent = Number(stats.summary?.usagePercent ?? 0)
  const requestSafetyPercent = Number((100 - requestPercent).toFixed(2))

  return (
    <section className="panel usage-panel">
      <div className="section-heading">
        <div>
          <p className="section-heading__eyebrow">운영 지표</p>
          <h2>오늘 허용량 추정 현황</h2>
        </div>
      </div>

      <div className="usage-panel__grid">
        <article className="usage-panel__card">
          <span>오늘 추정 요청 수</span>
          <strong>{Number(stats.summary?.totalRequests ?? 0).toLocaleString()}회</strong>
          <small>Cloudflare Functions 무료 한도 기준 추정치</small>
        </article>
        <article className="usage-panel__card">
          <span>한도 사용률</span>
          <strong>{requestPercent}%</strong>
          <small>남은 여유 {requestSafetyPercent}%</small>
        </article>
        <article className="usage-panel__card">
          <span>추정 추가 예약 가능 수</span>
          <strong>{Number(stats.summary?.estimatedRemainingReservations ?? 0).toLocaleString()}건</strong>
          <small>현재 평균 요청 패턴 기준 추정</small>
        </article>
        <article className="usage-panel__card">
          <span>차단 발생 수</span>
          <strong>{Number(stats.summary?.rateLimitedCount ?? 0).toLocaleString()}회</strong>
          <small>연타/과도한 접근 방지 작동 횟수</small>
        </article>
      </div>

      <div className="usage-panel__bars">
        <UsageBar label="Functions 무료 한도 사용률" value={requestPercent} tone={requestPercent >= 80 ? 'danger' : requestPercent >= 50 ? 'warning' : 'brand'} />
      </div>

      <div className="usage-panel__meta">
        <div>
          <span>오늘 예약 생성</span>
          <strong>{Number(stats.summary?.reservationCreateCount ?? 0).toLocaleString()}건</strong>
        </div>
        <div>
          <span>예약 1건당 평균 요청</span>
          <strong>{Number(stats.summary?.estimatedRequestsPerReservation ?? 0)}회</strong>
        </div>
        <div>
          <span>리셋 시각</span>
          <strong>{stats.resetInfo?.resetsAtKst ?? '-'}</strong>
        </div>
      </div>
    </section>
  )
}
