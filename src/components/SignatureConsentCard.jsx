import { BadgeCheck, PenTool } from 'lucide-react'
import { cn } from '../lib/utils'

export function SignatureConsentCard({ checked, onToggle, representativeName, disabled }) {
  return (
    <div className={cn('signature-card', checked && 'signature-card--confirmed')}>
      <div className="signature-card__header">
        <PenTool size={18} />
        <div>
          <strong>서명 확인</strong>
          <p>초기 버전에서는 약식 전자동의 방식으로 서명을 대체합니다.</p>
        </div>
      </div>
      <div className="signature-card__body">
        <span>대표자 확인 이름</span>
        <strong>{representativeName || '대표자 이름 입력 후 확인'}</strong>
      </div>
      <button type="button" className="consent-card__toggle" onClick={onToggle} disabled={disabled}>
        <BadgeCheck size={18} />
        {checked ? '서명 확인 완료' : '대표자 확인으로 서명 동의'}
      </button>
    </div>
  )
}
