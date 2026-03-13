import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, PlayCircle, X } from 'lucide-react'
import { modalVariants } from '../animations/motion'

export function AdminStationStatusModal({
  station,
  open,
  blocking,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
  loading,
}) {
  const MotionDiv = motion.div

  return (
    <AnimatePresence>
      {open && station ? (
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
              <p>스테이션 상태 변경</p>
              <h2>{blocking ? `${station.name}을(를) 중지하시겠습니까?` : `${station.name}을(를) 다시 시작하시겠습니까?`}</h2>
            </div>

            {blocking ? (
              <label className="field">
                <span>
                  <AlertTriangle size={16} />
                  중지 사유
                </span>
                <textarea
                  rows="4"
                  value={reason}
                  onChange={(event) => onReasonChange(event.target.value)}
                  placeholder="점검으로 인해 잠시 이용이 중지되었습니다."
                />
              </label>
            ) : (
              <div className="submit-message">
                <PlayCircle size={16} />
                재개하면 예약 페이지에서 이 스테이션을 다시 바로 선택할 수 있습니다.
              </div>
            )}

            <div className="modal__actions">
              <button className="button button--ghost" type="button" onClick={onClose}>
                취소
              </button>
              <button
                className={`button ${blocking ? 'button--danger' : 'button--primary'}`}
                type="button"
                onClick={onConfirm}
                disabled={loading}
              >
                {blocking ? '스테이션 중지' : '스테이션 재개'}
              </button>
            </div>
          </MotionDiv>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
