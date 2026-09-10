'use client'

import { ProblemAlertMarker } from './problem-alert'
import { mockAlerts } from '@/lib/mock-alerts'
import type { ViewMode } from '@/lib/types'

type AlertSystemProps = {
  viewMode: ViewMode
  showAlerts: boolean
}

export function AlertSystem({ viewMode, showAlerts }: AlertSystemProps) {
  // Only show alerts in exterior view and when toggled on
  if (viewMode !== 'exterior' || !showAlerts) {
    return null
  }

  return (
    <group>
      {mockAlerts.map((alert) => (
        <ProblemAlertMarker key={alert.id} alert={alert} />
      ))}
    </group>
  )
}
