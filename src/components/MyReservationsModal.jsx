import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CalendarDays, Clock3, UserRound, X } from 'lucide-react'
import { modalVariants } from '../animations/motion'
import { formatHourRange, formatKoreanDate } from '../lib/date'
import { StatusBadge } from './StatusBadge'

export function MyReservationsModal({ open, reservations, onClose, onCancelReservation, loading }) {
  const MotionDiv = motion.div
  const [confirmReservationId, setConfirmReservationId] = useState(null)
  const groupedReservations = useMemo(
    () =>
      reservations.reduce((accumulator, reservation) => {
        const key = reservation.reservation_date
        if (!accumulator[key]) accumulator[key] = []
        accumulator[key].push(reservation)
        return accumulator
      }, {}),
    [reservations],
  )

  return (
    <AnimatePresence>
      {open ? (
        <div className="modal-backdrop" onClick={onClose}>
          <MotionDiv
            className="modal modal--scrollable"
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
              <p>내 예약 확인</p>
              <h2>이 브라우저에서 예약한 내역입니다</h2>
              <span>같은 기기와 브라우저로 다시 들어오면 자동으로 보여줍니다.</span>
            </div>

            <div className="my-reservations">
              {Object.entries(groupedReservations).map(([date, items]) => (
                <section key={date} className="my-reservations__section">
                  <div className="my-reservations__head">
                    <strong>{formatKoreanDate(date)}</strong>
                    <StatusBadge variant="brand">{items.length}건</StatusBadge>
                  </div>

                  <div className="my-reservations__list">
                    {items.map((reservation) => (
                      <article key={reservation.id} className="my-reservations__item">
                        <div className="my-reservations__item-main">
                          <strong>{reservation.station_name}</strong>
                          <span>{reservation.representative_name}</span>
                        </div>
                        <div className="my-reservations__meta">
                          <span>
                            <Clock3 size={14} />
                            {formatHourRange(reservation.start_hour, reservation.end_hour)}
                          </span>
                          <span>
                            <UserRound size={14} />
                            {reservation.people_count}명
                          </span>
                          <span>
                            <CalendarDays size={14} />
                            {reservation.status === 'confirmed' ? '예약 확정' : '예약 취소'}
                          </span>
                        </div>
                        {confirmReservationId === reservation.id ? (
                          <div className="danger-confirm danger-confirm--compact">
                            <div className="danger-confirm__copy">
                              <AlertTriangle size={18} />
                              <div>
                                <strong>정말 예약 취소하겠습니까?</strong>
                              </div>
                            </div>
                            <div className="danger-confirm__actions">
                              <button className="button button--ghost" type="button" onClick={() => setConfirmReservationId(null)}>
                                아니요
                              </button>
                              <button
                                className="button button--danger"
                                type="button"
                                onClick={() => onCancelReservation(reservation.id)}
                                disabled={loading}
                              >
                                예약 취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="button button--danger-soft my-reservations__cancel"
                            onClick={() => setConfirmReservationId(reservation.id)}
                            disabled={loading}
                          >
                            예약 취소
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </MotionDiv>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
