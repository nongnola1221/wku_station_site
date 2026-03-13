import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, RotateCcw, X } from 'lucide-react'
import { modalVariants } from '../animations/motion'
import { getToday } from '../lib/date'
import { AvailabilityGrid } from './AvailabilityGrid'
import { TimeSlotPicker } from './TimeSlotPicker'

export function DateTimeSelectionModal({
  open,
  date,
  onDateChange,
  availability,
  selectedStationId,
  selectedHours,
  onToggleHour,
  onConfirm,
  onClear,
  disabled,
  onClose,
}) {
  const MotionDiv = motion.div

  return (
    <AnimatePresence>
      {open ? (
        <div className="modal-backdrop" onClick={onClose}>
          <MotionDiv
            className="modal modal--wide modal--scrollable"
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
              <p>날짜와 시간 선택</p>
              <h2>예약 날짜와 이용 시간을 선택해주세요</h2>
            </div>

            <label className="field field--full date-time-modal__date-field">
              <span>
                <CalendarDays size={16} />
                예약 날짜
              </span>
              <input type="date" value={date} min={getToday()} onChange={(event) => onDateChange(event.target.value)} />
            </label>

            <div className="date-time-modal__content">
              {availability ? (
                <AvailabilityGrid
                  availability={availability}
                  selectedStationId={selectedStationId}
                  selectedHours={selectedHours}
                  maxSelectableHours={availability.maxSelectableHours ?? 2}
                  onToggleHour={onToggleHour}
                  disabled={disabled}
                />
              ) : null}
              <TimeSlotPicker selectedHours={selectedHours} maxSelectableHours={availability?.maxSelectableHours ?? 2} />
            </div>

            <div className="modal__actions">
              <button className="button button--ghost" type="button" onClick={onClear}>
                <RotateCcw size={16} />
                선택 초기화
              </button>
              <button className="button button--primary" type="button" onClick={onConfirm} disabled={!selectedHours.length || disabled}>
                시간 선택 완료
              </button>
            </div>
          </MotionDiv>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
