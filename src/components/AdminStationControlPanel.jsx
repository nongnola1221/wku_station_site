import { Ban, PlayCircle } from 'lucide-react'
import { StatusBadge } from './StatusBadge'

export function AdminStationControlPanel({ stations, onToggle, loading }) {
  return (
    <section className="panel station-control">
      <div className="section-heading">
        <div>
          <p className="section-heading__eyebrow">스테이션 관리</p>
          <h2>스테이션별 이용 가능 상태를 조정하세요</h2>
        </div>
      </div>

      <div className="station-control__grid">
        {stations.map((station) => (
          <article key={station.id} className={`station-control__card ${station.isBlocked ? 'station-control__card--blocked' : ''}`}>
            <div className="station-control__header">
              <div>
                <strong>{station.name}</strong>
                <p>{station.location || '학생회관 3층'}</p>
              </div>
              <StatusBadge variant={station.isBlocked ? 'danger' : 'success'}>
                {station.isBlocked ? '중지됨' : '정상 운영'}
              </StatusBadge>
            </div>

            <p className="station-control__reason">
              {station.isBlocked ? station.blockReason || '관리자에 의해 일시 중지되었습니다.' : '현재 예약 가능한 상태입니다.'}
            </p>

            <button
              type="button"
              className={`button ${station.isBlocked ? 'button--primary' : 'button--danger-soft'}`}
              onClick={() => onToggle(station)}
              disabled={loading}
            >
              {station.isBlocked ? <PlayCircle size={16} /> : <Ban size={16} />}
              {station.isBlocked ? '스테이션 재개' : '스테이션 중지'}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
