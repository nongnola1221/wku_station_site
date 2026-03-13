import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { modalVariants } from '../animations/motion'
import { formatHourRange } from '../lib/date'

const durationOptions = [1, 2]

export function ReservationDetailModal({
  reservation,
  stations,
  onClose,
  onChange,
  onSave,
  onDelete,
  loading,
  error,
}) {
  const MotionDiv = motion.div
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <AnimatePresence>
      {reservation ? (
        <div className="modal-backdrop" onClick={onClose}>
          <MotionDiv
            className="modal"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="modal__close" onClick={onClose}>
              <X size={18} />
            </button>

            <div className="modal__header">
              <p>예약 상세 / 수정</p>
              <h2>{reservation.representative_name}</h2>
              <span>{reservation.phone}</span>
            </div>

            <div className="modal__summary">
              <div>
                <span>현재 예약</span>
                <strong>{formatHourRange(reservation.start_hour, reservation.end_hour)}</strong>
              </div>
              <div>
                <span>인원</span>
                <strong>{reservation.people_count}명</strong>
              </div>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>스테이션</span>
                <select
                  value={reservation.station_id}
                  onChange={(event) => onChange('station_id', Number(event.target.value))}
                >
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>시작 시간</span>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={reservation.start_hour}
                  onChange={(event) => onChange('start_hour', Number(event.target.value))}
                />
              </label>

              <label className="field">
                <span>이용 시간</span>
                <select
                  value={reservation.duration_hours}
                  onChange={(event) => onChange('duration_hours', Number(event.target.value))}
                >
                  {durationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}시간
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>인원</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={reservation.people_count}
                  onChange={(event) => {
                    const digitsOnly = event.target.value.replace(/\D/g, '')
                    if (!digitsOnly) {
                      onChange('people_count', '')
                      return
                    }

                    onChange('people_count', Math.min(Number(digitsOnly), 20))
                  }}
                />
              </label>
            </div>

            {error ? <div className="submit-message submit-message--error">{error}</div> : null}

            {confirmDelete ? (
              <div className="danger-confirm">
                <div className="danger-confirm__copy">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>삭제하시겠습니까?</strong>
                    <p>예약을 취소하면 다시 되돌릴 수 없습니다.</p>
                  </div>
                </div>
                <div className="danger-confirm__actions">
                  <button className="button button--ghost" type="button" onClick={() => setConfirmDelete(false)}>
                    아니요
                  </button>
                  <button className="button button--danger" type="button" onClick={onDelete} disabled={loading}>
                    네, 삭제
                  </button>
                </div>
              </div>
            ) : null}

            <div className="modal__actions">
              <button
                className="button button--danger-soft"
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={loading}
              >
                예약 취소
              </button>
              <button className="button button--primary" type="button" onClick={onSave} disabled={loading}>
                변경 저장
              </button>
            </div>
          </MotionDiv>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
