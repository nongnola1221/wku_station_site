import { cn } from '../lib/utils'

export function ExamModeToggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      className={cn('toggle', checked && 'toggle--checked')}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span className="toggle__track">
        <span className="toggle__thumb" />
      </span>
      <span className="toggle__label">{checked ? '시험기간 운영 중' : '일반 운영 중'}</span>
    </button>
  )
}
