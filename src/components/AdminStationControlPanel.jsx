import { useMemo, useState } from 'react'
import { Ban, PlayCircle } from 'lucide-react'
import { StatusBadge } from './StatusBadge'

export function AdminStationControlPanel({ stations, onToggle, loading }) {
  const [editingStationId, setEditingStationId] = useState(null)
  const [reasonDraft, setReasonDraft] = useState('')

  const editingStation = useMemo(
    () => stations.find((station) => station.id === editingStationId) ?? null,
    [editingStationId, stations],
  )

  const openInlineEditor = (station) => {
    setEditingStationId(station.id)
    setReasonDraft(station.isBlocked ? '' : station.blockReason || '')
  }

  const closeInlineEditor = () => {
    setEditingStationId(null)
    setReasonDraft('')
  }

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
              onClick={() => openInlineEditor(station)}
              disabled={loading}
            >
              {station.isBlocked ? <PlayCircle size={16} /> : <Ban size={16} />}
              {station.isBlocked ? '스테이션 재개' : '스테이션 중지'}
            </button>

            {editingStation?.id === station.id ? (
              <div className="station-control__editor">
                {!station.isBlocked ? (
                  <label className="field">
                    <span>중지 사유</span>
                    <textarea
                      value={reasonDraft}
                      onChange={(event) => setReasonDraft(event.target.value)}
                      placeholder="예: 행사 운영으로 인해 잠시 이용이 중지되었습니다."
                      rows={3}
                    />
                  </label>
                ) : null}
                <div className="station-control__actions">
                  <button
                    type="button"
                    className={`button ${station.isBlocked ? 'button--primary' : 'button--danger-soft'}`}
                    onClick={() => onToggle(station, reasonDraft, closeInlineEditor)}
                    disabled={loading}
                  >
                    {station.isBlocked ? '이 스테이션을 재개합니다' : '이 스테이션을 중지합니다'}
                  </button>
                  <button type="button" className="button button--ghost" onClick={closeInlineEditor} disabled={loading}>
                    닫기
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
