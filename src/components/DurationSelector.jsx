import { DURATION_OPTIONS } from '../lib/constants'
import { cn } from '../lib/utils'

export function DurationSelector({ duration, onChange, disabled }) {
  return (
    <div className="duration-selector">
      <div className="section-heading">
        <div>
          <p className="section-heading__eyebrow">이용 시간 선택</p>
          <h2>1시간 또는 2시간을 한 번에 예약</h2>
        </div>
      </div>

      <div className="duration-selector__group">
        {DURATION_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={cn('choice-chip', duration === option && 'choice-chip--selected')}
            onClick={() => onChange(option)}
            disabled={disabled}
          >
            {option}시간
          </button>
        ))}
      </div>
    </div>
  )
}
