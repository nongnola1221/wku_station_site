import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { modalVariants } from '../animations/motion'

export function OperationStoppedOverlay({ open, reason }) {
  const MotionDiv = motion.div

  return (
    <AnimatePresence>
      {open ? (
        <div className="modal-backdrop modal-backdrop--locked">
          <MotionDiv
            className="modal operation-stopped-modal"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
          >
            <div className="modal__header">
              <p>서비스 중지 안내</p>
              <h2>현재 스테이션 예약 서비스가 중지되었습니다.</h2>
            </div>

            <div className="operation-stopped-modal__body">
              <AlertTriangle size={22} />
              <p>{reason || '현재 스테이션 서비스가 중지되었습니다.'}</p>
            </div>
          </MotionDiv>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
