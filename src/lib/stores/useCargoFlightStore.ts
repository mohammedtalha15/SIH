import { create } from 'zustand'
import { useTruckStore } from './truckStore'
import { useUnifiedCargoStore } from './unifiedCargoStore'
import { usePanelStore } from './panelStore'

// Gate positions around the airport - parked adjacent to terminal buildings
// Positioned outside and alongside the terminal gates (orange/yellow buildings)
// Moved slightly to the right
const GATE_POSITIONS: [number, number, number][] = [
  [-35, 0.5, 25],   // Gate 1 - left side of terminal
  [-25, 0.5, 25],   // Gate 2
  [-15, 0.5, 25],   // Gate 3
  [-5, 0.5, 25],    // Gate 4
  [5, 0.5, 25],     // Gate 5
  [15, 0.5, 25],    // Gate 6
]

export interface CargoPackage {
  id: string
  awb: string // Air Waybill number
  weight: number
  dimensions: { length: number; width: number; height: number }
  destination: string
  status: 'IN_ULD' | 'UNLOADED' | 'IN_WAREHOUSE' | 'LOADED'
  uldId: string
}

export interface ULD {
  id: string
  type: 'AKE' | 'AKH' | 'LD3' | 'LD7' | 'PMC'
  position: { x: number; y: number; z: number }
  packages: CargoPackage[]
  status: 'LOADED' | 'UNLOADING' | 'EMPTY'
}

export interface CargoFlight {
  flightNumber: string
  aircraft: string
  status: 'INBOUND' | 'ARRIVED' | 'UNLOADING' | 'LOADING' | 'DEPARTED'
  gatePosition: [number, number, number]
  rotation: [number, number, number]
  ulds: ULD[]
  arrivalTime: string
  departureTime: string
}

interface CargoFlightStore {
  flights: CargoFlight[]
  selectedFlight: CargoFlight | null
  initializeFlights: () => void
  updateFlightStatus: (flightNumber: string, status: CargoFlight['status']) => void
  unloadULD: (flightNumber: string, uldId: string) => void
  selectFlight: (flightNumber: string | null) => void
  startSimulation: () => void
}

// Generate random cargo packages
function generatePackages(count: number, uldId: string): CargoPackage[] {
  const destinations = ['NRT', 'HND', 'KIX', 'NGO', 'FUK', 'CTS']
  const packages: CargoPackage[] = []
  
  for (let i = 0; i < count; i++) {
    packages.push({
      id: `PKG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      awb: `125-${Math.floor(10000000 + Math.random() * 90000000)}`,
      weight: Math.floor(10 + Math.random() * 100),
      dimensions: {
        length: Math.floor(30 + Math.random() * 70),
        width: Math.floor(30 + Math.random() * 70),
        height: Math.floor(20 + Math.random() * 50),
      },
      destination: destinations[Math.floor(Math.random() * destinations.length)],
      status: 'IN_ULD',
      uldId,
    })
  }
  
  return packages
}

// Generate random ULDs for a flight
function generateULDs(count: number): ULD[] {
  const uldTypes: ULD['type'][] = ['AKE', 'AKH', 'LD3', 'LD7', 'PMC']
  const ulds: ULD[] = []
  
  for (let i = 0; i < count; i++) {
    const uldId = `ULD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const packageCount = Math.floor(3 + Math.random() * 8)
    
    ulds.push({
      id: uldId,
      type: uldTypes[Math.floor(Math.random() * uldTypes.length)],
      position: { x: i * 2, y: 0, z: 0 },
      packages: generatePackages(packageCount, uldId),
      status: 'LOADED',
    })
  }
  
  return ulds
}

export const useCargoFlightStore = create<CargoFlightStore>((set, get) => ({
  flights: [],
  selectedFlight: null,

  initializeFlights: () => {
    const currentTime = new Date()
    const flights: CargoFlight[] = []
    
    // Create 6 flights, one for each gate
    for (let i = 0; i < 6; i++) {
      const flightNum = `NH${8000 + i}`
      const arrivalTime = new Date(currentTime.getTime() - (5 - i) * 30 * 60000) // Staggered arrivals
      const departureTime = new Date(arrivalTime.getTime() + 120 * 60000) // 2 hours later
      
      flights.push({
        flightNumber: flightNum,
        aircraft: 'Boeing 767-300F',
        status: i < 2 ? 'ARRIVED' : 'INBOUND',
        gatePosition: GATE_POSITIONS[i],
        rotation: [0, Math.PI, 0], // Facing terminal
        ulds: generateULDs(Math.floor(4 + Math.random() * 6)),
        arrivalTime: arrivalTime.toISOString(),
        departureTime: departureTime.toISOString(),
      })
    }
    
    set({ flights })
  },

  updateFlightStatus: (flightNumber, status) => {
    set((state) => ({
      flights: state.flights.map((flight) =>
        flight.flightNumber === flightNumber ? { ...flight, status } : flight
      ),
    }))
  },

  unloadULD: (flightNumber, uldId) => {
    set((state) => ({
      flights: state.flights.map((flight) => {
        if (flight.flightNumber === flightNumber) {
          return {
            ...flight,
            ulds: flight.ulds.map((uld) =>
              uld.id === uldId
                ? {
                    ...uld,
                    status: 'EMPTY' as const,
                    packages: uld.packages.map((pkg) => ({
                      ...pkg,
                      status: 'UNLOADED' as const,
                    })),
                  }
                : uld
            ),
          }
        }
        return flight
      }),
    }))
  },

  selectFlight: (flightNumber) => {
    const flights = get().flights
    const selectedFlight = flightNumber
      ? flights.find((f) => f.flightNumber === flightNumber) || null
      : null
    
    // Close other detail panels when selecting a flight
    if (selectedFlight) {
      useTruckStore.getState().selectTruck(null)
      useUnifiedCargoStore.getState().selectTrolley(null)
    }
    
    set({ selectedFlight })
  },

  startSimulation: () => {
    // Simulate flight status changes every 30 seconds
    setInterval(() => {
      const state = get()
      state.flights.forEach((flight) => {
        const arrivalTime = new Date(flight.arrivalTime)
        const now = new Date()
        const timeSinceArrival = now.getTime() - arrivalTime.getTime()
        
        // Update status based on time since arrival
        if (flight.status === 'INBOUND' && timeSinceArrival > 0) {
          state.updateFlightStatus(flight.flightNumber, 'ARRIVED')
        } else if (flight.status === 'ARRIVED' && timeSinceArrival > 10 * 60000) {
          state.updateFlightStatus(flight.flightNumber, 'UNLOADING')
        } else if (flight.status === 'UNLOADING' && timeSinceArrival > 60 * 60000) {
          state.updateFlightStatus(flight.flightNumber, 'LOADING')
        } else if (flight.status === 'LOADING' && timeSinceArrival > 90 * 60000) {
          state.updateFlightStatus(flight.flightNumber, 'DEPARTED')
        }
      })
      
      // Auto-close panel if selected flight has departed
      const selectedFlight = state.selectedFlight
      if (selectedFlight && selectedFlight.status === 'DEPARTED') {
        state.selectFlight(null)
      }
    }, 30000) // Check every 30 seconds
  },
}))
