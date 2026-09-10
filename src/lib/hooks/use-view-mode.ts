'use client'

import { useState, useCallback } from 'react'
import type { ViewMode } from '@/lib/types'

export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>('airport')
  const [targetBuildingId, setTargetBuildingId] = useState<string | null>(null)

  const setAirport = useCallback(() => {
    setViewMode('airport')
    setTargetBuildingId(null)
  }, [])

  const setExterior = useCallback(() => {
    setViewMode('exterior')
    setTargetBuildingId(null)
  }, [])

  const setInterior = useCallback((buildingId?: string) => {
    setViewMode('interior')
    setTargetBuildingId(buildingId || null)
  }, [])

  const setLayout = useCallback(() => {
    setViewMode('layout')
    setTargetBuildingId(null)
  }, [])

  const enterBuilding = useCallback((buildingId: string) => {
    setViewMode('interior')
    setTargetBuildingId(buildingId)
  }, [])

  return {
    viewMode,
    targetBuildingId,
    setViewMode,
    setAirport,
    setExterior,
    setInterior,
    setLayout,
    enterBuilding,
  }
}
