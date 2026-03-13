import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ListFilter, LogOut, Search } from 'lucide-react'
import { AdminExpandableSection } from '../components/AdminExpandableSection'
import { AdminLoginForm } from '../components/AdminLoginForm'
import { AdminOperationStatusModal } from '../components/AdminOperationStatusModal'
import { AdminPasswordForm } from '../components/AdminPasswordForm'
import { AdminSiteSettingsForm } from '../components/AdminSiteSettingsForm'
import { AdminStationControlPanel } from '../components/AdminStationControlPanel'
import { AdminStationStatusModal } from '../components/AdminStationStatusModal'
import { AdminTodaySummaryModal } from '../components/AdminTodaySummaryModal'
import { ExamModeToggle } from '../components/ExamModeToggle'
import { AdminReservationTable } from '../components/AdminReservationTable'
import { ReservationDetailModal } from '../components/ReservationDetailModal'
import { StatusBadge } from '../components/StatusBadge'
import { ADMIN_TOKEN_KEY } from '../lib/constants'
import { api } from '../lib/api'
import { getToday } from '../lib/date'

export function AdminPage() {
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
  const [stationModalOpen, setStationModalOpen] = useState(false)
  const [selectedStation, setSelectedStation] = useState(null)
  const [stationReason, setStationReason] = useState('')
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
    const response = await api.getAdminReservations(getToday(), token, { fresh: true })
    setTodayReservations(response.data.reservations)
  }, [todaySummaryOpen, token])

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

  const handleStationStatus = async () => {
    if (!selectedStation) return
    try {
      setActionLoading(true)
      setActionError('')
      await api.patchAdminStation(
        selectedStation.id,
        {
          isBlocked: !selectedStation.isBlocked,
          reason: stationReason,
        },
        token,
      )
      setStationModalOpen(false)
      setSelectedStation(null)
      setStationReason('')
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
          <StatusBadge variant="brand">관리자 대시보드</StatusBadge>
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
              onToggle={(station) => {
                setActionError('')
                setSelectedStation(station)
                setStationReason(station.isBlocked ? '' : station.blockReason || '')
                setStationModalOpen(true)
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

      <AdminStationStatusModal
        open={stationModalOpen}
        station={selectedStation}
        blocking={!selectedStation?.isBlocked}
        reason={stationReason}
        onReasonChange={setStationReason}
        onClose={() => {
          setStationModalOpen(false)
          setSelectedStation(null)
          setStationReason('')
        }}
        onConfirm={handleStationStatus}
        loading={actionLoading}
      />

      <AdminExpandableSection
        title="운영자 설정"
        description="문구 수정, 총학생회 교체 대응, 관리자 비밀번호 변경"
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
