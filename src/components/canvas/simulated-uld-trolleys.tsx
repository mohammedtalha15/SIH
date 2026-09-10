'use client'

import { useEffect } from 'react'
import { ULDTrolleyModel } from './uld-trolley'
import { useUnifiedCargoStore } from '@/lib/stores/unifiedCargoStore'

export function SimulatedULDTrolleys() {
  const { trolleys, initializeTrolleys, startSimulation, selectTrolley } = useUnifiedCargoStore()

  useEffect(() => {
    initializeTrolleys()
    startSimulation()
  }, [initializeTrolleys, startSimulation])

  return (
    <group>
      {trolleys
        .filter(trolley => trolley.status !== 'gone')
        .map(trolley => (
          <ULDTrolleyModel
            key={trolley.id}
            position={trolley.position}
            rotation={trolley.rotation}
            status={trolley.status}
            uldType={trolley.type}
            onClick={() => selectTrolley(trolley.id)}
          />
        ))}
    </group>
  )
}
