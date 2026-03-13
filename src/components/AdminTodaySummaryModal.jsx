import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, Users, X } from 'lucide-react'
import { modalVariants } from '../animations/motion'
import { formatHourRange } from '../lib/date'

function groupByStation(reservations) {
  return reservations.reduce((accumulator, reservation) => {
    const key = reservation.station_id
    if (!accumulator[key]) accumulator[key] = []
    accumulator[key].push(reservation)
    return accumulator
  }, {})
}

export function AdminTodaySummaryModal({ open, reservations, onClose }) {
  const MotionDiv = motion.div
  const confirmedReservations = reservations.filter((reservation) => reservation.status === 'confirmed')
  const cancelledReservations = reservations.filter((reservation) => reservation.status === 'cancelled')
  const grouped = groupByStation(confirmedReservations)

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
              <p>오늘 예약 빠르게 보기</p>
              <h2>오늘 예약 요약</h2>
              <span>시간표를 내리지 않고 현재 예약만 빠르게 확인할 수 있습니다.</span>
            </div>

            <div className="today-summary">
              <div className="today-summary__hero">
                <div>
                  <span>현재 예약 건수</span>
                  <strong>{confirmedReservations.length}건</strong>
                </div>
                <div>
                  <span>취소된 예약</span>
                  <strong>{cancelledReservations.length}건</strong>
                </div>
              </div>

              <div className="today-summary__grid">
                {Array.from({ length: 7 }, (_, index) => index + 1).map((stationId) => {
                  const stationReservations = (grouped[stationId] ?? []).sort((first, second) => first.start_hour - second.start_hour)
                  return (
                    <article key={stationId} className="today-summary__card">
                      <div className="today-summary__card-head">
                        <h3>스테이션 {stationId}</h3>
                        <span>{stationReservations.length}건</span>
                      </div>
                      {stationReservations.length ? (
                        <ul className="today-summary__list">
                          {stationReservations.map((reservation) => (
                            <li key={reservation.id}>
                              <CalendarClock size={14} />
                              <div>
                                <strong>{formatHourRange(reservation.start_hour, reservation.end_hour)}</strong>
                                <span>{reservation.representative_name}</span>
                              </div>
                              <small>
                                <Users size={12} />
                                {reservation.people_count}
                              </small>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="today-summary__empty">오늘 예약이 없습니다.</p>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>
          </MotionDiv>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
