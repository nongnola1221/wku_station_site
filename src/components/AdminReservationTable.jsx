import { GENERAL_CLOSE_HOUR, GENERAL_OPEN_HOUR } from '../lib/constants'
import { formatHourRange } from '../lib/date'
import { getStationName } from '../lib/utils'
import { StatusBadge } from './StatusBadge'

function findReservationForCell(reservations, stationId, hour) {
  return reservations.find(
    (reservation) =>
      reservation.station_id === stationId &&
      reservation.status === 'confirmed' &&
      reservation.start_hour <= hour &&
      reservation.end_hour > hour,
  )
}

export function AdminReservationTable({ date, stations, reservations, onReservationClick, examMode }) {
  const hours = examMode
    ? Array.from({ length: 24 }, (_, index) => index)
    : Array.from({ length: GENERAL_CLOSE_HOUR - GENERAL_OPEN_HOUR }, (_, index) => GENERAL_OPEN_HOUR + index)

  return (
    <div className="admin-table-wrap">
      <div className="section-heading">
        <div>
          <p className="section-heading__eyebrow">예약 시간표</p>
          <h2>{date} 예약 운영 보드</h2>
        </div>
      </div>

      <div className="admin-timetable">
        <div className="admin-timetable__header">시간</div>
        {stations.map((station) => (
          <div key={station.id} className="admin-timetable__header">
            {station.name}
          </div>
        ))}

        {hours.map((hour) => (
          <div key={hour} className="admin-timetable__row-fragment">
            <div className="admin-timetable__hour">
              {formatHourRange(hour, hour + 1)}
            </div>
            {stations.map((station) => {
              const reservation = findReservationForCell(reservations, station.id, hour)
              return (
                <button
                  key={`${station.id}-${hour}`}
                  type="button"
                  className={`admin-cell ${reservation ? 'admin-cell--reserved' : ''}`}
                  onClick={() => reservation && onReservationClick(reservation)}
                >
                  {reservation ? (
                    <div className="admin-cell__content">
                      <strong>{reservation.representative_name}</strong>
                      <span>{formatHourRange(reservation.start_hour, reservation.end_hour)}</span>
                      <StatusBadge variant="brand">{getStationName(reservation.station_id)}</StatusBadge>
                    </div>
                  ) : (
                    <span className="admin-cell__empty">비어 있음</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
