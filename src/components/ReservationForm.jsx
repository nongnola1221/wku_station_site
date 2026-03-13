import { LoaderCircle, SendHorizonal } from 'lucide-react'
import { formatPhoneInput } from '../lib/utils'
import { PrivacyConsentSection } from './PrivacyConsentSection'
import { SignatureConsentCard } from './SignatureConsentCard'

export function ReservationForm({
  form,
  onFieldChange,
  onPhoneChange,
  onSubmit,
  submitting,
  submitMessage,
  disabled,
}) {
  return (
    <form className="reservation-form" onSubmit={onSubmit}>
      <div className="section-heading">
        <div>
          <p className="section-heading__eyebrow">예약 정보 입력</p>
          <h2>대표자 정보를 입력하고 신청을 완료하세요</h2>
        </div>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>대표자 이름</span>
          <input
            type="text"
            value={form.representativeName}
            onChange={(event) => onFieldChange('representativeName', event.target.value)}
            placeholder="김원광"
            required
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span>인원</span>
          <input
            type="text"
            inputMode="numeric"
            value={form.peopleCount}
            onChange={(event) => {
              const digitsOnly = event.target.value.replace(/\D/g, '')
              if (!digitsOnly) {
                onFieldChange('peopleCount', '')
                return
              }

              const normalized = String(Math.min(Number(digitsOnly), 20))
              onFieldChange('peopleCount', normalized)
            }}
            placeholder="1명"
            required
            disabled={disabled}
          />
        </label>

        <label className="field field--full">
          <span>대표자 전화번호</span>
          <input
            type="tel"
            value={formatPhoneInput(form.phone)}
            onChange={(event) => onPhoneChange(event.target.value)}
            placeholder="010-1234-5678"
            required
            disabled={disabled}
          />
        </label>
      </div>

      <div className="consent-grid">
        <PrivacyConsentSection
          checked={form.consentChecked}
          onToggle={() => !disabled && onFieldChange('consentChecked', !form.consentChecked)}
          disabled={disabled}
        />
        <SignatureConsentCard
          checked={form.signatureConfirmed}
          representativeName={form.representativeName}
          onToggle={() => !disabled && onFieldChange('signatureConfirmed', !form.signatureConfirmed)}
          disabled={disabled}
        />
      </div>

      {submitMessage ? <div className={`submit-message ${submitMessage.includes('선택해주세요') || submitMessage.includes('입력해주세요') || submitMessage.includes('동의') || submitMessage.includes('확인') ? 'submit-message--error' : ''}`}>{submitMessage}</div> : null}

      <button className="button button--primary button--submit" type="submit" disabled={submitting || disabled}>
        {submitting ? <LoaderCircle className="spin" size={18} /> : <SendHorizonal size={18} />}
        {submitting ? '예약 처리 중...' : '예약 완료하기'}
      </button>
    </form>
  )
}
