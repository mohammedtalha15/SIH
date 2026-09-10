import { create } from 'zustand'
import { useCargoFlightStore } from './useCargoFlightStore'
import { useUnifiedCargoStore } from './unifiedCargoStore'
import { usePanelStore } from './panelStore'

// Truck positions from exterior-elements.tsx
// Only using the long line on one side (removed short line on the other side)
const TRUCK_POSITIONS = [
  { position: [-80, 0, 107] as [number, number, number], rotation: [0, Math.PI, 0] as [number, number, number], type: 'incoming' as const },
  { position: [-40, 0, 107] as [number, number, number], rotation: [0, Math.PI, 0] as [number, number, number], type: 'incoming' as const },
  { position: [0, 0, 107] as [number, number, number], rotation: [0, Math.PI, 0] as [number, number, number], type: 'incoming' as const },
  { position: [40, 0, 107] as [number, number, number], rotation: [0, Math.PI, 0] as [number, number, number], type: 'outgoing' as const },
  { position: [80, 0, 107] as [number, number, number], rotation: [0, Math.PI, 0] as [number, number, number], type: 'outgoing' as const },
]

export interface TruckCargo {
  id: string
  awb: string
  weight: number
  pieces: number
  destination: string
  description: string
  shipper: string
}

export interface SimulatedTruck {
  id: string
  position: [number, number, number]
  rotation: [number, number, number]
  type: 'incoming' | 'outgoing' // incoming = freight forwarder → warehouse, outgoing = warehouse → distribution
  status: 'arriving' | 'unloading' | 'departing' | 'gone'
  cargo: TruckCargo[]
  arrivalTime: Date
  departureTime?: Date
  color: string
}

interface TruckStore {
  trucks: SimulatedTruck[]
  selectedTruck: SimulatedTruck | null
  initializeTrucks: () => void
  selectTruck: (truckId: string | null) => void
  startSimulation: () => void
}

// Generate random cargo for a truck
function generateTruckCargo(count: number, type: 'incoming' | 'outgoing'): TruckCargo[] {
  const destinations = ['NRT', 'HND', 'KIX', 'NGO', 'FUK', 'Tokyo', 'Osaka', 'Yokohama']
  const shippers = [
    'Yamato Transport',
    'Sagawa Express',
    'Japan Post',
    'DHL Japan',
    'FedEx Japan',
    'Nippon Express',
    'Seino Transportation',
  ]
  
  const descriptions = [
    'Electronics',
    'Automotive Parts',
    'Textiles',
    'Machinery',
    'Consumer Goods',
    'Medical Equipment',
    'Food Products',
    'Documents',
  ]
  
  return Array.from({ length: count }, (_, i) => ({
    id: `CARGO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    awb: `125-${Math.floor(10000000 + Math.random() * 90000000)}`,
    weight: Math.floor(50 + Math.random() * 500),
    pieces: Math.floor(1 + Math.random() * 20),
    destination: destinations[Math.floor(Math.random() * destinations.length)],
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    shipper: shippers[Math.floor(Math.random() * shippers.length)],
  }))
}

export const useTruckStore = create<TruckStore>((set, get) => ({
  trucks: [],
  selectedTruck: null,

  initializeTrucks: () => {
    // Start with 2-3 trucks visible
    const initialTruckCount = Math.floor(2 + Math.random() * 2)
    const trucks: SimulatedTruck[] = []
    
    for (let i = 0; i < initialTruckCount; i++) {
      const posData = TRUCK_POSITIONS[Math.floor(Math.random() * TRUCK_POSITIONS.length)]
      const cargoCount = Math.floor(5 + Math.random() * 15)
      
      trucks.push({
        id: `TRUCK-${Date.now()}-${i}`,
        position: posData.position,
        rotation: posData.rotation,
        type: posData.type,
        status: 'unloading',
        cargo: generateTruckCargo(cargoCount, posData.type),
        arrivalTime: new Date(Date.now() - Math.random() * 300000), // Arrived 0-5 min ago
        color: posData.type === 'incoming' ? '#2563EB' : '#1E3A5F',
      })
    }
    
    set({ trucks })
  },

  selectTruck: (truckId) => {
    const trucks = get().trucks
    const selectedTruck = truckId ? trucks.find(t => t.id === truckId) || null : null
    
    // Close other detail panels when selecting a truck
    if (selectedTruck) {
      useCargoFlightStore.getState().selectFlight(null)
      useUnifiedCargoStore.getState().selectTrolley(null)
    }
    
    set({ selectedTruck })
  },

  startSimulation: () => {
    // Update truck statuses every 3 seconds
    setInterval(() => {
      const state = get()
      const now = new Date()
      let updatedTrucks = [...state.trucks]
      let needsUpdate = false

      // Update existing trucks
      updatedTrucks = updatedTrucks.map(truck => {
        const timeSinceArrival = now.getTime() - truck.arrivalTime.getTime()
        
        // Arriving -> Unloading (after 5 seconds)
        if (truck.status === 'arriving' && timeSinceArrival > 5000) {
          needsUpdate = true
          return { ...truck, status: 'unloading' as const }
        }
        
        // Unloading -> Departing (after 30-60 seconds)
        if (truck.status === 'unloading' && timeSinceArrival > 30000 + Math.random() * 30000) {
          needsUpdate = true
          return { ...truck, status: 'departing' as const, departureTime: now }
        }
        
        // Departing -> Gone (after 5 seconds)
        if (truck.status === 'departing' && truck.departureTime && 
            now.getTime() - truck.departureTime.getTime() > 5000) {
          needsUpdate = true
          return { ...truck, status: 'gone' as const }
        }
        
        return truck
      })

      // Remove trucks that are gone
      const activeTrucks = updatedTrucks.filter(t => t.status !== 'gone')
      
      // Auto-close panel if selected truck is gone
      if (state.selectedTruck && !activeTrucks.find(t => t.id === state.selectedTruck?.id)) {
        set({ selectedTruck: null })
      }
      
      // Add new trucks randomly (if we have less than 5 trucks)
      if (activeTrucks.length < 5 && Math.random() > 0.7) {
        const posData = TRUCK_POSITIONS[Math.floor(Math.random() * TRUCK_POSITIONS.length)]
        const cargoCount = Math.floor(5 + Math.random() * 15)
        
        activeTrucks.push({
          id: `TRUCK-${Date.now()}-${Math.random()}`,
          position: posData.position,
          rotation: posData.rotation,
          type: posData.type,
          status: 'arriving',
          cargo: generateTruckCargo(cargoCount, posData.type),
          arrivalTime: now,
          color: posData.type === 'incoming' ? '#2563EB' : '#1E3A5F',
        })
        needsUpdate = true
      }

      if (needsUpdate) {
        set({ trucks: activeTrucks })
      }
    }, 3000)
  },
}))
