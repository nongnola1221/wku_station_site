import { Clock3 } from 'lucide-react'
import { formatHourRange } from '../lib/date'

export function TimeSlotPicker({ selectedHours, maxSelectableHours }) {
  const sortedHours = [...selectedHours].sort((first, second) => first - second)
  const startHour = sortedHours[0]
  const endHour = sortedHours[sortedHours.length - 1] + 1

  return (
    <div className="picker-summary">
      <Clock3 size={18} />
      {selectedHours.length === 0 ? (
        <span>연속된 시간 칸을 눌러 예약 시간을 선택해주세요.</span>
      ) : (
        <span>선택된 이용 시간: {formatHourRange(startHour, endHour)} · {selectedHours.length}시간 선택됨 · 최대 {maxSelectableHours}시간</span>
      )}
    </div>
  )
}
