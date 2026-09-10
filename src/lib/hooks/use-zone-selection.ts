'use client'

import { useState, useCallback } from 'react'
import type { Zone } from '@/lib/types'

export function useZoneSelection() {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)

  const selectZone = useCallback((zone: Zone | null) => {
    setSelectedZone(zone)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedZone(null)
  }, [])

  return {
    selectedZone,
    selectZone,
    clearSelection,
  }
}
