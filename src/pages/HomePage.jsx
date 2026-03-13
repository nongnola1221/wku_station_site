import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CalendarDays, Clock3 } from 'lucide-react'
import { AnimatedSection } from '../components/AnimatedSection'
import { DateTimeSelectionModal } from '../components/DateTimeSelectionModal'
import { HeroSection } from '../components/HeroSection'
import { MyReservationsModal } from '../components/MyReservationsModal'
import { StationSelector } from '../components/StationSelector'
import { OperationStoppedOverlay } from '../components/OperationStoppedOverlay'
import { ReservationForm } from '../components/ReservationForm'
import { DEFAULT_FORM, MAX_RESERVATION_HOURS } from '../lib/constants'
import { api } from '../lib/api'
import { useReservationData } from '../hooks/useReservationData'
import { formatHourRange, getToday } from '../lib/date'
import { clearStoredReservationTokens, getStoredReservationTokens, storeReservationToken } from '../lib/reservationTokens'

export function HomePage() {
  const MotionDiv = motion.div
  const stationRef = useRef(null)
  const reservationRef = useRef(null)
  const formRef = useRef(null)
  const councilTapTimeoutRef = useRef(null)
  const councilTapCountRef = useRef(0)
  const { date, setDate, stations, settings, availability, loading, error, refetch } = useReservationData(getToday())
  const [form, setForm] = useState(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [dateTimeModalOpen, setDateTimeModalOpen] = useState(false)
  const [selectedHours, setSelectedHours] = useState([])
  const [myReservations, setMyReservations] = useState([])
  const [myReservationsOpen, setMyReservationsOpen] = useState(false)
  const [myReservationsLoaded, setMyReservationsLoaded] = useState(false)
  const [showCouncilToast, setShowCouncilToast] = useState(false)

  const selectedStationAvailability = useMemo(
    () => availability?.stations?.find((station) => station.id === form.stationId),
    [availability, form.stationId],
  )
  const handleFieldChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const validateReservationForm = () => {
    if (settings?.operationStopped) return settings.operationStopReason || '현재 스테이션 운영이 중지되었습니다.'
    if (!form.reservationDate) return '날짜를 선택해주세요.'
    if (!form.stationId) return '스테이션을 선택해주세요.'
    if (form.startHour === null || form.durationHours < 1) return '시간을 선택해주세요.'
    if (!String(form.representativeName).trim()) return '대표자 이름을 입력해주세요.'
    if (!form.peopleCount || Number(form.peopleCount) < 1) return '인원을 입력해주세요.'
    if (!String(form.phone).trim()) return '전화번호를 입력해주세요.'
    if (!form.consentChecked) return '개인정보 동의를 선택해주세요.'
    if (!form.signatureConfirmed) return '서명 확인을 선택해주세요.'
    return ''
  }

  const handleDateChange = (nextDate) => {
    setDate(nextDate)
    setForm((current) => ({
      ...current,
      reservationDate: nextDate,
      startHour: null,
      durationHours: 0,
    }))
    setSelectedHours([])
  }

  const handlePhoneChange = (value) => {
    setForm((current) => ({ ...current, phone: value.replace(/\D/g, '') }))
  }

  const handleSelectStation = (stationId) => {
    if (settings?.operationStopped) return
    setForm((current) => ({
      ...current,
      stationId,
      startHour: null,
      durationHours: 0,
    }))
    setSelectedHours([])
    setDateTimeModalOpen(true)
    window.setTimeout(() => {
      reservationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const handleToggleHour = (hour) => {
    const slotMap = new Map(selectedStationAvailability?.availability?.map((slot) => [slot.startHour, slot.isAvailable]) ?? [])
    if (!slotMap.get(hour) && !selectedHours.includes(hour)) return

    setSelectedHours((current) => {
      const sorted = [...current].sort((first, second) => first - second)
      const firstHour = sorted[0]
      const lastHour = sorted[sorted.length - 1]
      let next = sorted

      if (!sorted.length) {
        next = [hour]
      } else if (sorted.includes(hour)) {
        if (sorted.length === 1) {
          next = []
        } else if (hour === lastHour) {
          next = sorted.slice(0, -1)
        } else if (hour === firstHour) {
          next = sorted.slice(1)
        } else {
          next = [hour]
        }
      } else if (hour === lastHour + 1 && sorted.length < MAX_RESERVATION_HOURS && slotMap.get(hour)) {
        next = [...sorted, hour]
      } else if (hour === firstHour - 1 && sorted.length < MAX_RESERVATION_HOURS && slotMap.get(hour)) {
        next = [hour, ...sorted]
      } else {
        next = slotMap.get(hour) ? [hour] : sorted
      }

      setForm((currentForm) => ({
        ...currentForm,
        startHour: next.length ? next[0] : null,
        durationHours: next.length,
      }))

      return next
    })
  }

  const handleConfirmSelectedHours = () => {
    if (!selectedHours.length) return
    setDateTimeModalOpen(false)
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const handleClearSelectedHours = () => {
    setSelectedHours([])
    setForm((current) => ({
      ...current,
      startHour: null,
      durationHours: 0,
    }))
  }

  const fetchMyReservations = async (options = {}) => {
    const storedTokens = getStoredReservationTokens()
    if (!storedTokens.length) {
      setMyReservations([])
      setMyReservationsLoaded(true)
      return
    }

    try {
      const response = await api.getMyReservations(storedTokens)
      const reservations = response.data.reservations ?? []
      setMyReservations(reservations)
      if (reservations.length && options.autoOpen !== false) {
        setMyReservationsOpen(true)
      } else {
        if (!reservations.length) {
          clearStoredReservationTokens()
          setMyReservationsOpen(false)
        }
      }
    } catch {
      setMyReservations([])
    } finally {
      setMyReservationsLoaded(true)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitMessage('')
    const validationMessage = validateReservationForm()
    if (validationMessage) {
      setSubmitMessage(validationMessage)
      return
    }

    try {
      setSubmitting(true)
      const response = await api.createReservation({
        stationId: Number(form.stationId),
        reservationDate: form.reservationDate,
        startHour: Number(form.startHour),
        durationHours: Number(form.durationHours),
        representativeName: form.representativeName,
        peopleCount: Number(form.peopleCount),
        phone: form.phone,
        consentChecked: form.consentChecked,
        signatureConfirmed: form.signatureConfirmed,
      })
      if (response.data.reservationToken) {
        storeReservationToken(response.data.reservationToken)
      }
      setSubmitMessage('예약되었습니다.')
      setForm((current) => ({
        ...DEFAULT_FORM,
        stationId: current.stationId,
        reservationDate: current.reservationDate,
      }))
      setSelectedHours([])
      await refetch(date)
      await fetchMyReservations()
    } catch (submitError) {
      setSubmitMessage(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const scrollToStation = () => {
    stationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleCouncilBadgePress = () => {
    window.clearTimeout(councilTapTimeoutRef.current)
    councilTapCountRef.current += 1

    if (councilTapCountRef.current >= 5) {
      councilTapCountRef.current = 0
      setShowCouncilToast(true)
      window.setTimeout(() => {
        setShowCouncilToast(false)
      }, 2200)
    }

    councilTapTimeoutRef.current = window.setTimeout(() => {
      councilTapCountRef.current = 0
    }, 900)
  }

  useEffect(() => {
    if (myReservationsLoaded) return
    fetchMyReservations()
  }, [myReservationsLoaded])

  const handleCancelMyReservation = async (reservationId) => {
    try {
      setSubmitting(true)
      await api.cancelMyReservation(reservationId, getStoredReservationTokens())
      await refetch(date)
      await fetchMyReservations()
      setSubmitMessage('예약이 취소되었습니다.')
    } catch (cancelError) {
      setSubmitMessage(cancelError.message)
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => () => {
    window.clearTimeout(councilTapTimeoutRef.current)
  }, [])

  return (
    <main className="page page--home">
      <OperationStoppedOverlay
        open={Boolean(settings?.operationStopped)}
        reason={settings?.operationStopReason}
      />

      <HeroSection
        examMode={settings?.examMode}
        operatingHours={availability?.operatingHours ?? { startHour: 10, endHour: 17 }}
        onQuickReserve={scrollToStation}
        onCouncilBadgePress={handleCouncilBadgePress}
        settings={settings}
      />

      <AnimatedSection className="panel panel--notice" delay={0.04}>
        <div className="notice-banner">
          <div className="notice-banner__icon">
            <AlertTriangle size={20} />
          </div>
          <div>
            <strong>{settings?.operationStopped ? '서비스 중지 안내' : '스테이션 예약 사이트'}</strong>
            <p>
              {settings?.operationStopped
                ? settings?.operationStopReason
                : settings?.examMode
                ? '시험기간에는 24시간 예약할 수 있습니다.'
                : '운영시간을 확인한 뒤 원하는 시간으로 예약해주세요.'}
            </p>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="panel" delay={0.12} id="station-section">
        <div ref={stationRef} />
        {loading ? <div className="skeleton-grid" /> : null}
        {error ? <div className="submit-message submit-message--error">{error}</div> : null}
        <StationSelector
          stations={stations}
          selectedStationId={form.stationId}
          onChange={handleSelectStation}
        />
      </AnimatedSection>

      <AnimatedSection className="panel" delay={0.16} id="reservation-section">
        <div ref={reservationRef} />
        <div className="section-heading">
          <div>
            <p className="section-heading__eyebrow">날짜와 시간 선택</p>
            <h2>선택한 스테이션에 맞춰 예약 시간을 정해주세요</h2>
          </div>
        </div>

        <div className="reservation-flow-card">
          <div className="reservation-flow-card__grid">
            <div className="reservation-flow-card__item">
              <span>
                <CalendarDays size={15} />
                예약 날짜
              </span>
              <strong>{date}</strong>
            </div>
            <div className="reservation-flow-card__item">
              <span>
                <Clock3 size={15} />
                예약 시간
              </span>
              <strong>
                {form.startHour === null ? '아직 선택하지 않았습니다.' : formatHourRange(form.startHour, form.startHour + form.durationHours)}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="button button--primary"
            onClick={() => setDateTimeModalOpen(true)}
            disabled={!form.stationId || settings?.operationStopped}
          >
            날짜와 시간 선택 열기
          </button>
        </div>
      </AnimatedSection>

      <AnimatedSection className="panel panel--form" delay={0.2}>
        <div ref={formRef} />
        <ReservationForm
          form={form}
          onFieldChange={handleFieldChange}
          onPhoneChange={handlePhoneChange}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitMessage={submitMessage}
          disabled={settings?.operationStopped}
        />
      </AnimatedSection>

      <DateTimeSelectionModal
        open={dateTimeModalOpen}
        date={date}
        onDateChange={handleDateChange}
        availability={availability}
        selectedStationId={form.stationId}
        selectedHours={selectedHours}
        onToggleHour={handleToggleHour}
        onConfirm={handleConfirmSelectedHours}
        onClear={handleClearSelectedHours}
        disabled={settings?.operationStopped}
        onClose={() => setDateTimeModalOpen(false)}
      />

      <MyReservationsModal
        open={myReservationsOpen}
        reservations={myReservations}
        onClose={() => setMyReservationsOpen(false)}
        onCancelReservation={handleCancelMyReservation}
        loading={submitting}
      />

      <AnimatePresence>
        {showCouncilToast ? (
          <div className="floating-easter-egg-wrap">
            <MotionDiv
              className="floating-easter-egg"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              56대 총학생회 한운영이 만들었습니다ㅎ
            </MotionDiv>
          </div>
        ) : null}
      </AnimatePresence>
    </main>
  )
}
