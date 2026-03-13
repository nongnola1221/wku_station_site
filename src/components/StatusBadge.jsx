import { cn } from '../lib/utils'

export function StatusBadge({ variant = 'neutral', children }) {
  return <span className={cn('status-badge', `status-badge--${variant}`)}>{children}</span>
}
