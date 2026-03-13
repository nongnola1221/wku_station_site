import { CheckCircle2, LockKeyhole } from 'lucide-react'
import { cn } from '../lib/utils'

export function PrivacyConsentSection({ checked, onToggle, disabled }) {
  return (
    <div className={cn('consent-card', checked && 'consent-card--checked')}>
      <div className="consent-card__header">
        <LockKeyhole size={18} />
        <div>
          <strong>개인정보 수집 및 이용 동의</strong>
          <p>예약 확인 및 운영 관리를 위해 최소한의 정보만 수집합니다.</p>
        </div>
      </div>
      <div className="consent-card__body">
        <ul>
          <li>수집 항목: 대표자 이름, 연락처, 인원 수, 예약 시간</li>
          <li>이용 목적: 예약 확인, 현장 운영, 관리자 연락</li>
          <li>보관 기간: 운영 정책에 따른 기간 내 자동 관리</li>
        </ul>
      </div>
      <button className="consent-card__toggle" type="button" onClick={onToggle} disabled={disabled}>
        <CheckCircle2 size={18} />
        {checked ? '동의 완료' : '동의하고 계속하기'}
      </button>
    </div>
  )
}
