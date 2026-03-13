import { ArrowRight, CalendarClock, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatHourRange } from '../lib/date'
import { StatusBadge } from './StatusBadge'

export function HeroSection({ examMode, operatingHours, onQuickReserve, onCouncilBadgePress, settings }) {
  const MotionHeading = motion.h1
  const MotionParagraph = motion.p
  const operatingLabel = examMode
    ? '시험기간 운영: 24시간 자유 예약'
    : `일반 운영: ${formatHourRange(operatingHours.startHour, operatingHours.endHour)}`

  return (
    <section className="hero">
      <div className="hero__copy">
        <button type="button" className="hero__badge-button" onClick={onCouncilBadgePress}>
          <StatusBadge variant="brand">{settings?.councilLabel || settings?.heroBadge}</StatusBadge>
        </button>
        <MotionHeading
          className="hero__title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {settings?.serviceTitle}
        </MotionHeading>
        <MotionParagraph
          className="hero__description"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: 'easeOut' }}
        >
          {settings?.heroDescription}
        </MotionParagraph>

        <div className="hero__meta">
          <div className="hero__meta-card">
            <CalendarClock size={18} />
            <div>
              <strong>운영시간</strong>
              <span>{operatingLabel}</span>
            </div>
          </div>
          <div className="hero__meta-card">
            <ShieldCheck size={18} />
            <div>
              <strong>예약 정책</strong>
              <span>{settings?.reservationPolicy}</span>
            </div>
          </div>
        </div>

        <div className="hero__actions">
          <button className="button button--primary" type="button" onClick={onQuickReserve}>
            바로 예약하기
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}
