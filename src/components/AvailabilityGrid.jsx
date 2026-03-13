import { formatHourRange } from '../lib/date'
import { cn } from '../lib/utils'

export function AvailabilityGrid({
  availability,
  selectedStationId,
  selectedHours,
  maxSelectableHours,
  onToggleHour,
  disabled,
}) {
  const selectedStation = availability?.stations?.find((station) => station.id === selectedStationId)

  if (!selectedStation) {
    return null
  }

  const sortedSelectedHours = [...selectedHours].sort((first, second) => first - second)
  const firstSelectedHour = sortedSelectedHours[0]
  const lastSelectedHour = sortedSelectedHours[sortedSelectedHours.length - 1]

  return (
    <div className="availability-grid">
      <div className="section-heading">
        <div>
          <p className="section-heading__eyebrow">예약 가능 시간</p>
          <h2>{selectedStation.name}의 시간대 선택</h2>
        </div>
      </div>

      <div className="availability-grid__legend">
        <span><i className="dot dot--available" />예약 가능</span>
        <span><i className="dot dot--partial" />선택 중</span>
        <span><i className="dot dot--unavailable" />예약 불가</span>
      </div>

      <div className="availability-grid__slots">
        {selectedStation.availability.map((slot) => {
          const isSelected = selectedHours.includes(slot.startHour)
          const isAdjacentExtension =
            selectedHours.length > 0 &&
            (slot.startHour === firstSelectedHour - 1 || slot.startHour === lastSelectedHour + 1)
          const slotState = isSelected
            ? 'partial'
            : slot.isAvailable
              ? 'available'
              : 'unavailable'
          const isDisabled =
            disabled ||
            !slot.isAvailable ||
            (selectedHours.length >= maxSelectableHours && !isSelected && isAdjacentExtension)

          return (
            <button
              key={slot.startHour}
              type="button"
              className={cn(
                'availability-slot',
                `availability-slot--${slotState}`,
                isSelected && 'availability-slot--active',
              )}
              disabled={isDisabled}
              onClick={() => onToggleHour(slot.startHour)}
            >
              <strong>{formatHourRange(slot.startHour, slot.startHour + 1)}</strong>
              <span>
                {isSelected
                  ? '선택됨'
                  : slot.isAvailable
                    ? '누르면 선택'
                    : '예약 불가'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
