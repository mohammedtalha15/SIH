'use client'

import { useState, useCallback } from 'react'

export function useAlerts() {
  const [showAlerts, setShowAlerts] = useState(false)

  const toggleAlerts = useCallback(() => {
    setShowAlerts((prev) => !prev)
  }, [])

  return {
    showAlerts,
    setShowAlerts,
    toggleAlerts,
  }
}
