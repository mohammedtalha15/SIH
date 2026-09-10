'use client'

import { SignLabel } from './sign-label'
import { useTruckStore } from '@/lib/stores/truckStore'
import { useUnifiedCargoStore } from '@/lib/stores/unifiedCargoStore'

interface VehicleCountLabelsProps {
  onShowTrucks: () => void
  onShowTrolleys: () => void
}

export function VehicleCountLabels({ onShowTrucks, onShowTrolleys }: VehicleCountLabelsProps) {
  const { trucks } = useTruckStore()
  const { trolleys } = useUnifiedCargoStore()

  // Count active trucks by type
  const incomingTrucks = trucks.filter(t => t.type === 'incoming' && t.status !== 'gone').length
  const outgoingTrucks = trucks.filter(t => t.type === 'outgoing' && t.status !== 'gone').length
  const totalTrucks = incomingTrucks + outgoingTrucks

  // Count active trolleys
  const activeTrolleysList = trolleys.filter(t => t.status !== 'gone')
  const loadedTrolleys = trolleys.filter(t => t.status === 'loaded' || t.status === 'loading').length

  return (
    <group>
      {/* Truck Loading Bay Label - Top (North) - Warehouse sign style - CLICKABLE - Always visible */}
      <SignLabel
        position={[0, 12, 115]}
        text={`${totalTrucks} Trucks`}
        subtext={`${incomingTrucks} Incoming • ${outgoingTrucks} Outgoing`}
        color="#FF6B35"
        isLarge={true}
        onClick={onShowTrucks}
      />

        {/* ULD Area Label - CHS 7 Build-up - Warehouse sign style - CLICKABLE - Always visible */}
        <SignLabel
          position={[108, 12, 5]}
          text={`${activeTrolleysList.length} ULDs`}
          subtext={`${loadedTrolleys} Ready • CHS 7 Build-up`}
          color="#FF6B35"
          isLarge={true}
          onClick={onShowTrolleys}
        />
    </group>
  )
}
