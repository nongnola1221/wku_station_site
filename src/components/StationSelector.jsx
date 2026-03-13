import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '../animations/motion'
import { cn } from '../lib/utils'
import { StatusBadge } from './StatusBadge'

export function StationSelector({ stations, selectedStationId, onChange }) {
  const MotionDiv = motion.div
  const MotionButton = motion.button

  return (
    <div className="station-selector">
      <div className="section-heading">
        <div>
          <p className="section-heading__eyebrow">스테이션 선택</p>
          <h2>원하는 스테이션을 선택해주세요</h2>
        </div>
      </div>

      <MotionDiv
        className="station-selector__grid"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {stations.length === 0 ? (
          <div className="empty-state">스테이션 정보를 불러오는 중입니다.</div>
        ) : stations.map((station) => {
          const isSelected = station.id === selectedStationId
          const isBlocked = Boolean(station.isBlocked)
          return (
            <MotionButton
              key={station.id}
              type="button"
              variants={staggerItem}
              className={cn(
                'station-card',
                isSelected && 'station-card--selected',
                isBlocked && 'station-card--blocked',
              )}
              onClick={() => !isBlocked && onChange(station.id)}
              disabled={isBlocked}
            >
              <div className="station-card__content">
                <p className="station-card__title">{station.name}</p>
                <span>{station.location || '학생회관 스테이션 존'}</span>
                {isBlocked ? (
                  <small className="station-card__reason">{station.blockReason || '현재 이용할 수 없습니다.'}</small>
                ) : null}
              </div>
              <StatusBadge variant={isBlocked ? 'danger' : isSelected ? 'brand' : 'neutral'}>
                {isBlocked ? '중지됨' : isSelected ? '선택됨' : '선택 가능'}
              </StatusBadge>
            </MotionButton>
          )
        })}
      </MotionDiv>
    </div>
  )
}
