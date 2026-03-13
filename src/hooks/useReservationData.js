import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getToday } from '../lib/date'

function buildSnapshotValue(bootstrapData) {
  return JSON.stringify({
    stations: bootstrapData?.stations ?? [],
    settings: bootstrapData?.settings ?? null,
    availability: bootstrapData?.availability ?? null,
  })
}

export function useReservationData(initialDate = getToday()) {
  const [date, setDate] = useState(initialDate)
  const [stations, setStations] = useState([])
  const [settings, setSettings] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [snapshotValue, setSnapshotValue] = useState('')

  const fetchBootstrap = useCallback(async (targetDate = date, options = {}) => {
    try {
      if (!options.silent) {
        setLoading(true)
      }
      setError('')
      const bootstrapResponse = await api.getBootstrap(targetDate, { fresh: Boolean(options.fresh) })
      setStations(bootstrapResponse.data.stations)
      setSettings(bootstrapResponse.data.settings)
      setAvailability(bootstrapResponse.data.availability)
      setSnapshotValue(buildSnapshotValue(bootstrapResponse.data))
      return bootstrapResponse.data
    } catch (fetchError) {
      setError(fetchError.message)
      return null
    } finally {
      if (!options.silent) {
        setLoading(false)
      }
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
    snapshotValue,
    refetch: fetchBootstrap,
  }
}
