'use client'

import { SignLabel } from '@/components/canvas/sign-label'
import { useCargoFlightStore } from '@/lib/stores/useCargoFlightStore'

interface FlightLabelsProps {
  onShowArrivals: () => void
  onShowDepartures: () => void
}

export function FlightLabels({ onShowArrivals, onShowDepartures }: FlightLabelsProps) {
  const { flights } = useCargoFlightStore()

  // Get arrival and departure flights
  const arrivalFlights = flights.filter(
    f => f.status === 'INBOUND' || f.status === 'ARRIVED' || f.status === 'UNLOADING'
  )

  const departureFlights = flights.filter(
    f => f.status === 'LOADING' || (f.status !== 'INBOUND' && f.status !== 'ARRIVED' && f.status !== 'UNLOADING' && f.status !== 'DEPARTED')
  )

  return (
    <group>
      {/* Arrival Label - Left side of gate area - CLICKABLE - Always visible */}
      <SignLabel
        position={[-30, 12, 25]}
        text={`${arrivalFlights.length} Arrivals`}
        subtext={`Inbound Flights`}
        color="#FF6B35"
        isLarge={true}
        onClick={onShowArrivals}
      />

      {/* Departure Label - Right side of gate area - CLICKABLE - Always visible */}
      <SignLabel
        position={[10, 12, 25]}
        text={`${departureFlights.length} Departures`}
        subtext={`Outbound Flights`}
        color="#FF6B35"
        isLarge={true}
        onClick={onShowDepartures}
      />
    </group>
  )
}
