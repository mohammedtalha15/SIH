'use client'

import { useEffect } from 'react'
import { ClickableTruck } from './clickable-truck'
import { useTruckStore } from '@/lib/stores/truckStore'

export function SimulatedTrucks() {
  const { trucks, initializeTrucks, startSimulation, selectTruck } = useTruckStore()

  useEffect(() => {
    initializeTrucks()
    startSimulation()
  }, [initializeTrucks, startSimulation])

  return (
    <group>
      {trucks
        .filter(truck => truck.status !== 'gone')
        .map(truck => (
          <ClickableTruck
            key={truck.id}
            position={truck.position}
            rotation={truck.rotation}
            color={truck.color}
            status={truck.status}
            onClick={() => selectTruck(truck.id)}
          />
        ))}
    </group>
  )
}
