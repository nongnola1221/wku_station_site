import { motion } from 'framer-motion'
import { Clock3, Sparkles } from 'lucide-react'
import { staggerContainer, staggerItem } from '../animations/motion'
import { formatHour, getCurrentHour, getIsToday } from '../lib/date'
import { StatusBadge } from './StatusBadge'

export function ReservationOverview({ availability, selectedDate, settings }) {
  const MotionDiv = motion.div
  const MotionArticle = motion.article
  const currentHour = getCurrentHour()
  const isToday = getIsToday(selectedDate)

  const cards = (availability?.stations ?? []).map((station) => {
    const currentSlot = station.availability.find((slot) => slot.startHour === currentHour)
    const nextAvailable = station.availability.find((slot) => slot.startHour >= currentHour && slot.durations[1])
    const firstAvailable = station.availability.find((slot) => slot.durations[1])

    if (isToday && currentSlot && !currentSlot.durations[1]) {
      return {
        id: station.id,
        title: station.name,
        description: '현재 사용 중',
        detail: nextAvailable ? `다음 가능 ${formatHour(nextAvailable.startHour)}` : '오늘 추가 가능 시간 없음',
        tone: 'warning',
      }
    }

    if (isToday && currentSlot?.durations[1]) {
      return {
        id: station.id,
        title: station.name,
        description: '지금 예약 가능',
        detail: `${formatHour(currentHour)}부터 선택 가능`,
        tone: 'success',
      }
    }

    return {
      id: station.id,
      title: station.name,
      description: isToday ? '다음 가능 시간 안내' : '선택 날짜 기준 가능',
      detail: firstAvailable ? `${formatHour(firstAvailable.startHour)}부터 가능` : '예약 가능 시간 없음',
      tone: firstAvailable ? 'brand' : 'warning',
    }
  })

  return (
    <div className="overview">
      <div className="section-heading">
        <div>
          <p className="section-heading__eyebrow">예약 현황 요약</p>
          <h2>{isToday ? `현재 시각 ${formatHour(currentHour)} 기준 스테이션 현황` : `${selectedDate} 예약 가능 현황`}</h2>
        </div>
        <StatusBadge variant={settings?.examMode ? 'danger' : 'neutral'}>
          <Sparkles size={14} />
          {settings?.examMode ? '시험기간 운영 적용' : '일반 운영'}
        </StatusBadge>
      </div>

      <MotionDiv
        className="overview__grid"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        {cards.map(({ id, title, description, detail, tone }) => {
          return (
            <MotionArticle key={id} className={`overview-card overview-card--${tone}`} variants={staggerItem}>
              <Clock3 size={20} />
              <span>{title}</span>
              <strong>{description}</strong>
              <p>{detail}</p>
            </MotionArticle>
          )
        })}
      </MotionDiv>
    </div>
  )
}
