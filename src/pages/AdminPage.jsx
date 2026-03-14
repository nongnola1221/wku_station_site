import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ListFilter, LogOut, Search } from 'lucide-react'
import { AdminUsagePanel } from '../components/AdminUsagePanel'
import { AdminExpandableSection } from '../components/AdminExpandableSection'
import { AdminLoginForm } from '../components/AdminLoginForm'
import { AdminOperationStatusModal } from '../components/AdminOperationStatusModal'
import { AdminPasswordForm } from '../components/AdminPasswordForm'
import { AdminSiteSettingsForm } from '../components/AdminSiteSettingsForm'
import { AdminStationControlPanel } from '../components/AdminStationControlPanel'
import { AdminTodaySummaryModal } from '../components/AdminTodaySummaryModal'
import { ExamModeToggle } from '../components/ExamModeToggle'
import { AdminReservationTable } from '../components/AdminReservationTable'
import { ReservationDetailModal } from '../components/ReservationDetailModal'
import { StatusBadge } from '../components/StatusBadge'
import { ADMIN_TOKEN_KEY } from '../lib/constants'
import { api } from '../lib/api'
import { getToday } from '../lib/date'

export function AdminPage() {
  const lastInteractionRef = useRef(Date.now())
  const metricsTapTimeoutRef = useRef(null)
  const metricsTapCountRef = useRef(0)
  const [token, setToken] = useState(localStorage.getItem(ADMIN_TOKEN_KEY) ?? '')
  const [credentials, setCredentials] = useState({ username: 'admin', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardReady, setDashboardReady] = useState(false)
  const [date, setDate] = useState(getToday())
  const [stations, setStations] = useState([])
  const [settings, setSettings] = useState(null)
  const [reservations, setReservations] = useState([])
  const [query, setQuery] = useState('')
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [stationControlOpen, setStationControlOpen] = useState(false)
  const [todaySummaryOpen, setTodaySummaryOpen] = useState(false)
  const [todayReservations, setTodayReservations] = useState([])
  const [operationModalOpen, setOperationModalOpen] = useState(false)
  const [operationReason, setOperationReason] = useState('')
  const [siteSettingsForm, setSiteSettingsForm] = useState({
    serviceTitle: '',
    councilLabel: '',
    heroBadge: '',
    heroDescription: '',
    locationLabel: '',
    reservationPolicy: '',
    generalNotice: '',
    examNotice: '',
    stationLocation: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    nextPassword: '',
  })
  const [usageOpen, setUsageOpen] = useState(false)
  const [usageStats, setUsageStats] = useState(null)

  const fetchDashboard = useCallback(async (targetDate = date, authToken = token, options = {}) => {
    if (!authToken) return
    try {
      if (!options.silent && !dashboardReady) {
        setDashboardLoading(true)
      }
      const shouldFetchMeta = options.includeMeta || stations.length === 0 || !settings

      if (shouldFetchMeta) {
        const [stationsResponse, settingsResponse, reservationsResponse] = await Promise.all([
          api.getStations({ fresh: true }),
          api.getPublicSettings({ fresh: true }),
          api.getAdminReservations(targetDate, authToken, { fresh: true }),
        ])
        setStations(stationsResponse.data.stations)
        setSettings(settingsResponse.data)
        setReservations(reservationsResponse.data.reservations)
        setSiteSettingsForm({
          serviceTitle: settingsResponse.data.serviceTitle ?? '',
          councilLabel: settingsResponse.data.councilLabel ?? '',
          heroBadge: settingsResponse.data.heroBadge ?? '',
          heroDescription: settingsResponse.data.heroDescription ?? '',
          locationLabel: settingsResponse.data.locationLabel ?? '',
          reservationPolicy: settingsResponse.data.reservationPolicy ?? '',
          generalNotice: settingsResponse.data.generalNotice ?? '',
          examNotice: settingsResponse.data.examNotice ?? '',
          stationLocation: stationsResponse.data.stations?.[0]?.location ?? '',
        })
      } else {
        const reservationsResponse = await api.getAdminReservations(targetDate, authToken, { fresh: true })
        setReservations(reservationsResponse.data.reservations)
      }
      setDashboardReady(true)
    } catch (fetchError) {
      setLoginError(fetchError.message)
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      setToken('')
      setDashboardReady(false)
    } finally {
      if (!options.silent && !dashboardReady) {
        setDashboardLoading(false)
      }
    }
  }, [dashboardReady, date, settings, stations.length, token])

  useEffect(() => {
    fetchDashboard(date, token)
  }, [date, token, fetchDashboard])

  const refreshTodaySummaryIfNeeded = useCallback(async () => {
    if (!todaySummaryOpen) return
    if (date === getToday()) {
      setTodayReservations(reservations)
      return
    }
    const response = await api.getAdminReservations(getToday(), token, { fresh: true })
    setTodayReservations(response.data.reservations)
  }, [date, reservations, todaySummaryOpen, token])

  useEffect(() => {
    if (!token || !dashboardReady) return undefined

    let polling = false
    const markInteraction = () => {
      lastInteractionRef.current = Date.now()
    }

    const intervalId = window.setInterval(async () => {
      const isVisible = document.visibilityState === 'visible'
      const interactedRecently = Date.now() - lastInteractionRef.current < 60000

      if (!isVisible || !interactedRecently || polling) return
      polling = true
      try {
        await fetchDashboard(date, token, { silent: true })
        await refreshTodaySummaryIfNeeded()
        if (usageOpen) {
          await fetchUsageStats(token)
        }
      } finally {
        polling = false
      }
    }, 5000)

    window.addEventListener('pointerdown', markInteraction)
    window.addEventListener('keydown', markInteraction)
    window.addEventListener('focus', markInteraction)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('pointerdown', markInteraction)
      window.removeEventListener('keydown', markInteraction)
      window.removeEventListener('focus', markInteraction)
    }
  }, [dashboardReady, date, fetchDashboard, fetchUsageStats, refreshTodaySummaryIfNeeded, token, usageOpen])

  const filteredReservations = useMemo(() => {
    if (!query.trim()) return reservations
    const normalized = query.trim().toLowerCase()
    return reservations.filter((reservation) =>
      String(reservation.representative_name ?? '')
        .trim()
        .toLowerCase()
        .includes(normalized),
    )
  }, [query, reservations])

  const handleLogin = async (event) => {
    event.preventDefault()
    try {
      setLoginLoading(true)
      setLoginError('')
      const response = await api.adminLogin(credentials)
      localStorage.setItem(ADMIN_TOKEN_KEY, response.data.token)
      setToken(response.data.token)
    } catch (loginErrorValue) {
      setLoginError(loginErrorValue.message)
    } finally {
      setLoginLoading(false)
    }
  }

  const fetchUsageStats = useCallback(async (authToken = token) => {
    if (!authToken) return
    const response = await api.getAdminUsage(authToken, { fresh: true })
    setUsageStats(response.data)
  }, [token])

  const handleToggleExamMode = async (checked) => {
    try {
      setActionLoading(true)
      await api.patchExamMode({ examMode: checked }, token)
      await fetchDashboard(date, token, { includeMeta: true, silent: true })
    } catch (toggleError) {
      setActionError(toggleError.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveSiteSettings = async (event) => {
    event.preventDefault()
    try {
      setActionLoading(true)
      setActionError('')
      await api.patchSiteContent(siteSettingsForm, token)
      await fetchDashboard(date, token, { includeMeta: true, silent: true })
    } catch (saveError) {
      setActionError(saveError.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePasswordChange = async (event) => {
    event.preventDefault()
    try {
      setActionLoading(true)
      setActionError('')
      await api.changeAdminPassword(passwordForm, token)
      setPasswordForm({ currentPassword: '', nextPassword: '' })
    } catch (changeError) {
      setActionError(changeError.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenTodaySummary = async () => {
    try {
      setActionLoading(true)
      setActionError('')
      const response = await api.getAdminReservations(getToday(), token)
      setTodayReservations(response.data.reservations)
      setTodaySummaryOpen(true)
    } catch (summaryError) {
      setActionError(summaryError.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleOperationStatus = async () => {
    try {
      setActionLoading(true)
      setActionError('')
      await api.patchOperationStatus(
        {
          operationStopped: !settings?.operationStopped,
          reason: operationReason,
        },
        token,
      )
      setOperationModalOpen(false)
      setOperationReason('')
      await fetchDashboard(date, token, { includeMeta: true, silent: true })
      setActionError('')
    } catch (operationError) {
      setActionError(operationError.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleStationStatus = async (station, reason, closeInlineEditor) => {
    if (!station) return
    try {
      setActionLoading(true)
      setActionError('')
      await api.patchAdminStation(
        station.id,
        {
          isBlocked: !station.isBlocked,
          reason,
        },
        token,
      )
      closeInlineEditor?.()
      await fetchDashboard(date, token, { includeMeta: true, silent: true })
      setActionError('')
    } catch (stationError) {
      setActionError(stationError.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleModalChange = (key, value) => {
    setSelectedReservation((current) => ({
      ...current,
      [key]: value,
      ...(key === 'start_hour' || key === 'duration_hours'
        ? { end_hour: key === 'start_hour' ? value + current.duration_hours : current.start_hour + value }
        : {}),
    }))
  }

  const handleSaveReservation = async () => {
    try {
      setActionLoading(true)
      setActionError('')
      await api.patchAdminReservation(
        selectedReservation.id,
        {
          stationId: selectedReservation.station_id,
          reservationDate: selectedReservation.reservation_date,
          startHour: selectedReservation.start_hour,
          durationHours: selectedReservation.duration_hours,
          peopleCount: selectedReservation.people_count,
        },
        token,
      )
      await fetchDashboard(date, token, { silent: true })
      await refreshTodaySummaryIfNeeded()
      setSelectedReservation(null)
    } catch (saveError) {
      setActionError(saveError.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteReservation = async () => {
    try {
      setActionLoading(true)
      setActionError('')
      await api.deleteAdminReservation(selectedReservation.id, token)
      await fetchDashboard(date, token, { silent: true })
      await refreshTodaySummaryIfNeeded()
      setSelectedReservation(null)
    } catch (deleteError) {
      setActionError(deleteError.message)
    } finally {
      setActionLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    setToken('')
  }

  const handleMetricsBadgePress = async () => {
    window.clearTimeout(metricsTapTimeoutRef.current)
    metricsTapCountRef.current += 1

    if (metricsTapCountRef.current >= 4) {
      metricsTapCountRef.current = 0
      const nextOpen = !usageOpen
      setUsageOpen(nextOpen)
      if (!usageOpen) {
        try {
          await fetchUsageStats(token)
        } catch (usageError) {
          setActionError(usageError.message)
        }
      }
    }

    metricsTapTimeoutRef.current = window.setTimeout(() => {
      metricsTapCountRef.current = 0
    }, 900)
  }

  useEffect(() => () => {
    window.clearTimeout(metricsTapTimeoutRef.current)
  }, [])

  if (!token) {
    return (
      <main className="page page--admin page--admin-login">
        <AdminLoginForm
          credentials={credentials}
          onChange={(key, value) => setCredentials((current) => ({ ...current, [key]: value }))}
          onSubmit={handleLogin}
          loading={loginLoading}
          error={loginError}
        />
      </main>
    )
  }

  return (
    <main className="page page--admin">
      <section className="admin-hero panel">
        <div>
          <button type="button" className="admin-hero__badge-button" onClick={handleMetricsBadgePress}>
            <StatusBadge variant="brand">관리자 대시보드</StatusBadge>
          </button>
          <h1>스테이션 대시보드</h1>
        </div>
        <div className="admin-hero__actions">
          <button type="button" className="button button--ghost" onClick={handleOpenTodaySummary}>
            오늘 예약 빠르게 보기
          </button>
          <button
            type="button"
            className={`button ${settings?.operationStopped ? 'button--primary' : 'button--danger-soft'}`}
            onClick={() => setOperationModalOpen(true)}
          >
            {settings?.operationStopped ? '서비스 재개' : '서비스 중지'}
          </button>
          <button type="button" className="button button--ghost" onClick={logout}>
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </section>

      {usageOpen ? <AdminUsagePanel stats={usageStats} /> : null}

      <section className="panel admin-toolbar">
        <label className="field field--date">
          <span>
            <CalendarDays size={16} />
            조회 날짜
          </span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>

        <label className="field">
          <span>
            <Search size={16} />
            검색
          </span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="대표자 이름으로 검색"
          />
        </label>

        <div className="admin-toolbar__toggle">
          <span>
            <ListFilter size={16} />
            운영 모드
          </span>
          <ExamModeToggle checked={Boolean(settings?.examMode)} onChange={handleToggleExamMode} disabled={actionLoading} />
        </div>
      </section>

      {actionError ? <div className="submit-message submit-message--error">{actionError}</div> : null}
      {dashboardLoading && !dashboardReady ? <div className="skeleton-grid skeleton-grid--large" /> : null}

      {dashboardReady ? (
        <>
          <AdminExpandableSection
            title="스테이션 관리"
            description="스테이션 이용 가능 상태 조정"
            open={stationControlOpen}
            onToggle={() => setStationControlOpen((current) => !current)}
          >
            <AdminStationControlPanel
              stations={stations}
              loading={actionLoading}
              onToggle={(station, reason, closeInlineEditor) => {
                setActionError('')
                handleStationStatus(station, reason, closeInlineEditor)
              }}
            />
          </AdminExpandableSection>

          <AdminReservationTable
            date={date}
            stations={stations}
            reservations={filteredReservations}
            examMode={Boolean(settings?.examMode)}
            onReservationClick={(reservation) => {
              setActionError('')
              setSelectedReservation({ ...reservation })
            }}
          />
        </>
      ) : null}

      <ReservationDetailModal
        key={selectedReservation?.id ?? 'reservation-detail'}
        reservation={selectedReservation}
        stations={stations}
        onClose={() => setSelectedReservation(null)}
        onChange={handleModalChange}
        onSave={handleSaveReservation}
        onDelete={handleDeleteReservation}
        loading={actionLoading}
        error={actionError}
      />

      <AdminTodaySummaryModal
        open={todaySummaryOpen}
        reservations={todayReservations}
        onClose={() => setTodaySummaryOpen(false)}
      />

      <AdminOperationStatusModal
        open={operationModalOpen}
        stopping={!settings?.operationStopped}
        reason={operationReason}
        onReasonChange={setOperationReason}
        onClose={() => {
          setOperationModalOpen(false)
          setOperationReason('')
        }}
        onConfirm={handleOperationStatus}
        loading={actionLoading}
      />

      <AdminExpandableSection
        title="문구 수정"
        description="사이트 문구와 관리자 비밀번호를 관리합니다"
        open={settingsOpen}
        onToggle={() => setSettingsOpen((current) => !current)}
      >
        <AdminSiteSettingsForm
          form={siteSettingsForm}
          onChange={(key, value) => setSiteSettingsForm((current) => ({ ...current, [key]: value }))}
          onSubmit={handleSaveSiteSettings}
          loading={actionLoading}
        />
        <AdminPasswordForm
          form={passwordForm}
          onChange={(key, value) => setPasswordForm((current) => ({ ...current, [key]: value }))}
          onSubmit={handlePasswordChange}
          loading={actionLoading}
        />
      </AdminExpandableSection>
    </main>
  )
}
