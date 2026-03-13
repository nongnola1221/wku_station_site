import { useEffect, useState } from 'react'

function getRouteFromHash() {
  return window.location.hash === '#admin' ? 'admin' : 'home'
}

export function useHashRoute() {
  const [route, setRoute] = useState(getRouteFromHash())

  useEffect(() => {
    const handleHashChange = () => setRoute(getRouteFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return route
}
