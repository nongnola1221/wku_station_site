import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, PlayCircle, X } from 'lucide-react'
import { modalVariants } from '../animations/motion'

export function AdminOperationStatusModal({
  open,
  stopping,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
  loading,
}) {
  const MotionDiv = motion.div

  return (
    <AnimatePresence>
      {open ? (
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
              <p>서비스 상태 변경</p>
              <h2>{stopping ? '정말 스테이션 서비스를 중지하시겠습니까?' : '스테이션 서비스를 다시 시작하시겠습니까?'}</h2>
            </div>

            {stopping ? (
              <label className="field">
                <span>
                  <AlertTriangle size={16} />
                  서비스 중지 사유
                </span>
                <textarea
                  rows="4"
                  value={reason}
                  onChange={(event) => onReasonChange(event.target.value)}
                  placeholder="원스티벌 행사 진행으로 인해 잠시 이용이 중지되었습니다"
                />
              </label>
            ) : (
              <div className="submit-message">
                <PlayCircle size={16} />
                서비스 재개 시 예약 페이지에서 중지 안내가 즉시 사라지고 다시 예약 가능합니다.
              </div>
            )}

            <div className="modal__actions">
              <button className="button button--ghost" type="button" onClick={onClose}>
                취소
              </button>
              <button
                className={`button ${stopping ? 'button--danger' : 'button--primary'}`}
                type="button"
                onClick={onConfirm}
                disabled={loading}
              >
                {stopping ? '서비스 중지' : '서비스 재개'}
              </button>
            </div>
          </MotionDiv>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
