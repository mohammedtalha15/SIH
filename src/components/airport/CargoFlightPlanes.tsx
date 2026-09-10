import { useEffect } from 'react'
import { SimplePlane } from './SimplePlane'
import { useCargoFlightStore } from '@/lib/stores/useCargoFlightStore'

export function CargoFlightPlanes() {
  const { flights, initializeFlights, startSimulation, selectFlight } = useCargoFlightStore()

  useEffect(() => {
    initializeFlights()
    startSimulation()
  }, [initializeFlights, startSimulation])

  return (
    <group>
      {flights
        .filter(flight => flight.status !== 'DEPARTED')
        .map(flight => (
          <SimplePlane
            key={flight.flightNumber}
            position={flight.gatePosition}
            rotation={flight.rotation}
            status={flight.status}
            scale={0.35}
            onClick={() => selectFlight(flight.flightNumber)}
          />
        ))}
    </group>
  )
}
