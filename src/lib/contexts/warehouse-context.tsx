'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useViewMode } from '@/lib/hooks/use-view-mode'
import { useZoneSelection } from '@/lib/hooks/use-zone-selection'
import { useAlerts } from '@/lib/hooks/use-alerts'

type WarehouseContextType = {
  viewMode: ReturnType<typeof useViewMode>
  zoneSelection: ReturnType<typeof useZoneSelection>
  alerts: ReturnType<typeof useAlerts>
}

const WarehouseContext = createContext<WarehouseContextType | null>(null)

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const viewMode = useViewMode()
  const zoneSelection = useZoneSelection()
  const alerts = useAlerts()

  return (
    <WarehouseContext.Provider value={{ viewMode, zoneSelection, alerts }}>
      {children}
    </WarehouseContext.Provider>
  )
}

export function useWarehouseContext() {
  const context = useContext(WarehouseContext)
  if (!context) {
    throw new Error('useWarehouseContext must be used within WarehouseProvider')
  }
  return context
}
