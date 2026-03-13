import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getToday } from '../lib/date'

export function useReservationData(initialDate = getToday()) {
  const [date, setDate] = useState(initialDate)
  const [stations, setStations] = useState([])
  const [settings, setSettings] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchBootstrap = useCallback(async (targetDate = date, options = {}) => {
    try {
      setLoading(true)
      setError('')
      const bootstrapResponse = await api.getBootstrap(targetDate, { fresh: Boolean(options.fresh) })
      setStations(bootstrapResponse.data.stations)
      setSettings(bootstrapResponse.data.settings)
      setAvailability(bootstrapResponse.data.availability)
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchBootstrap(date)
  }, [date, fetchBootstrap])

  return {
    date,
    setDate,
    stations,
    settings,
    availability,
    loading,
    error,
    refetch: fetchBootstrap,
  }
}
