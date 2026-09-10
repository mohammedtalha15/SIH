import { create } from 'zustand'
import { useCargoFlightStore } from './useCargoFlightStore'
import { useTruckStore } from './truckStore'
import { usePanelStore } from './panelStore'

// ULD positions outside warehouse near CHS 7 build-up area
// Building 8 eastern wall is at x=100, CHS 7 area spans z=-17.5 to z=37.5
// Positioned outside the loading docks, lined up near the build-up area
const ULD_TROLLEY_POSITIONS: [number, number, number][] = [
  [108, 0, 30],    // Outside door 1 - lined up at loading area
  [108, 0, 20],    // Outside door 2
  [108, 0, 10],    // Outside door 3
  [108, 0, 0],     // Outside door 4
  [108, 0, -10],   // Outside door 5
  [108, 0, -20],   // Outside door 6
]

export interface CargoPackage {
  id: string
  awb: string
  weight: number
  pieces: number
  destination: string
  description: string
  shipper: string
  consignee: string
  currentLocation: string
  status: 'in_truck_incoming' | 'in_warehouse' | 'in_uld_trolley' | 'in_uld_plane' | 'in_truck_outgoing' | 'delivered'
  flightNumber?: string
  truckId?: string
  uldId?: string
  trolleyId?: string
}

export interface ULDTrolley {
  id: string
  type: 'AKE' | 'AKH' | 'LD3' | 'LD7' | 'PMC'
  position: [number, number, number]
  rotation: [number, number, number]
  status: 'loading' | 'loaded' | 'unloading' | 'empty' | 'gone'
  packages: CargoPackage[]
  flightNumber?: string
  arrivalTime: Date
  departureTime?: Date
}

interface UnifiedCargoStore {
  packages: Map<string, CargoPackage>
  trolleys: ULDTrolley[]
  selectedTrolley: ULDTrolley | null
  initializeTrolleys: () => void
  selectTrolley: (trolleyId: string | null) => void
  startSimulation: () => void
  getPackagesByLocation: (location: string) => CargoPackage[]
  transferPackagesToTruck: (packageIds: string[], truckId: string) => void
  transferPackagesToTrolley: (packageIds: string[], trolleyId: string) => void
  transferPackagesToPlane: (packageIds: string[], flightNumber: string, uldId: string) => void
}

// Generate random cargo
function generateRandomPackages(count: number, status: CargoPackage['status']): CargoPackage[] {
  const destinations = ['NRT', 'HND', 'KIX', 'NGO', 'FUK', 'CTS', 'Tokyo', 'Osaka']
  const descriptions = ['Electronics', 'Automotive Parts', 'Textiles', 'Machinery', 'Food Products']
  const shippers = ['Yamato', 'Sagawa', 'Japan Post', 'DHL', 'FedEx', 'Nippon Express']
  
  return Array.from({ length: count }, () => ({
    id: `PKG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    awb: `125-${Math.floor(10000000 + Math.random() * 90000000)}`,
    weight: Math.floor(10 + Math.random() * 100),
    pieces: Math.floor(1 + Math.random() * 10),
    destination: destinations[Math.floor(Math.random() * destinations.length)],
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    shipper: shippers[Math.floor(Math.random() * shippers.length)],
    consignee: shippers[Math.floor(Math.random() * shippers.length)],
    currentLocation: status === 'in_warehouse' ? 'CHS 7 Build-up Area' : 'Unknown',
    status,
  }))
}

export const useUnifiedCargoStore = create<UnifiedCargoStore>((set, get) => ({
  packages: new Map(),
  trolleys: [],
  selectedTrolley: null,

  initializeTrolleys: () => {
    // Get departure flights from cargo flight store to link trolleys
    const cargoFlights = useCargoFlightStore.getState().flights
    const departureFlights = cargoFlights.filter(
      f => f.status === 'LOADING' || (f.status !== 'INBOUND' && f.status !== 'ARRIVED' && f.status !== 'UNLOADING' && f.status !== 'DEPARTED')
    )
    
    // Start with 2-3 trolleys
    const initialTrolleyCount = Math.floor(2 + Math.random() * 2)
    const trolleys: ULDTrolley[] = []
    const uldTypes: ULDTrolley['type'][] = ['AKE', 'AKH', 'LD3', 'LD7', 'PMC']
    
    for (let i = 0; i < initialTrolleyCount; i++) {
      const position = ULD_TROLLEY_POSITIONS[i % ULD_TROLLEY_POSITIONS.length]
      const packages = generateRandomPackages(Math.floor(5 + Math.random() * 10), 'in_uld_trolley')
      const trolleyId = `TROLLEY-${Date.now()}-${i}`
      
      // Link with actual departure flight if available
      const assignedFlight = departureFlights[i % departureFlights.length]
      const flightNumber = assignedFlight?.flightNumber || `NH${8000 + i}`
      
      // Update packages with trolley ID and flight info
      packages.forEach(pkg => {
        pkg.trolleyId = trolleyId
        pkg.flightNumber = flightNumber
        pkg.currentLocation = 'ULD Trolley - CHS 7 Build-up'
      })
      
      trolleys.push({
        id: trolleyId,
        type: uldTypes[Math.floor(Math.random() * uldTypes.length)],
        position,
        rotation: [0, Math.PI / 2, 0],
        status: 'loaded',
        packages,
        flightNumber, // Now linked to real departure flight
        arrivalTime: new Date(Date.now() - Math.random() * 300000),
      })
      
      // Add packages to store
      packages.forEach(pkg => {
        get().packages.set(pkg.id, pkg)
      })
    }
    
    set({ trolleys })
  },

  selectTrolley: (trolleyId) => {
    const trolleys = get().trolleys
    const selectedTrolley = trolleyId ? trolleys.find(t => t.id === trolleyId) || null : null
    
    // Close other detail panels when selecting a trolley
    if (selectedTrolley) {
      useCargoFlightStore.getState().selectFlight(null)
      useTruckStore.getState().selectTruck(null)
    }
    
    set({ selectedTrolley })
  },

  startSimulation: () => {
    // Update trolley statuses every 5 seconds
    setInterval(() => {
      const state = get()
      const now = new Date()
      let updatedTrolleys = [...state.trolleys]
      let needsUpdate = false

      // Update existing trolleys
      updatedTrolleys = updatedTrolleys.map(trolley => {
        const timeSinceArrival = now.getTime() - trolley.arrivalTime.getTime()
        
        // Loaded -> Unloading (after 10 seconds)
        if (trolley.status === 'loaded' && timeSinceArrival > 10000) {
          needsUpdate = true
          return { ...trolley, status: 'unloading' as const }
        }
        
        // Unloading -> Empty (after 30-45 seconds)
        if (trolley.status === 'unloading' && timeSinceArrival > 30000 + Math.random() * 15000) {
          needsUpdate = true
          // Move packages from trolley to plane
          trolley.packages.forEach(pkg => {
            const updatedPkg = { ...pkg, status: 'in_uld_plane' as const, currentLocation: `Flight ${trolley.flightNumber}` }
            state.packages.set(pkg.id, updatedPkg)
          })
          return { ...trolley, status: 'empty' as const, packages: [], departureTime: now }
        }
        
        // Empty -> Gone (after 10 seconds)
        if (trolley.status === 'empty' && trolley.departureTime && 
            now.getTime() - trolley.departureTime.getTime() > 10000) {
          needsUpdate = true
          return { ...trolley, status: 'gone' as const }
        }
        
        return trolley
      })

      // Remove trolleys that are gone
      const activeTrolleys = updatedTrolleys.filter(t => t.status !== 'gone')
      
      // Auto-close panel if selected trolley is gone
      if (state.selectedTrolley && !activeTrolleys.find(t => t.id === state.selectedTrolley?.id)) {
        set({ selectedTrolley: null })
      }
      
      // Add new trolleys randomly (if we have less than 4 trolleys)
      if (activeTrolleys.length < 4 && Math.random() > 0.6) {
        const position = ULD_TROLLEY_POSITIONS[Math.floor(Math.random() * ULD_TROLLEY_POSITIONS.length)]
        const packages = generateRandomPackages(Math.floor(5 + Math.random() * 10), 'in_uld_trolley')
        const uldTypes: ULDTrolley['type'][] = ['AKE', 'AKH', 'LD3', 'LD7', 'PMC']
        const trolleyId = `TROLLEY-${Date.now()}-${Math.random()}`
        const flightNum = `NH${8000 + Math.floor(Math.random() * 10)}`
        
        // Update packages with trolley ID
        packages.forEach(pkg => {
          pkg.trolleyId = trolleyId
          pkg.flightNumber = flightNum
          pkg.currentLocation = 'ULD Trolley - CHS 7'
          state.packages.set(pkg.id, pkg)
        })
        
        activeTrolleys.push({
          id: trolleyId,
          type: uldTypes[Math.floor(Math.random() * uldTypes.length)],
          position,
          rotation: [0, Math.PI / 2, 0],
          status: 'loading',
          packages,
          flightNumber: flightNum,
          arrivalTime: now,
        })
        needsUpdate = true
      }

      if (needsUpdate) {
        set({ trolleys: activeTrolleys })
      }
    }, 5000)
  },

  getPackagesByLocation: (location) => {
    return Array.from(get().packages.values()).filter(pkg => 
      pkg.currentLocation.includes(location)
    )
  },

  transferPackagesToTruck: (packageIds, truckId) => {
    const packages = get().packages
    packageIds.forEach(id => {
      const pkg = packages.get(id)
      if (pkg) {
        packages.set(id, {
          ...pkg,
          status: 'in_truck_outgoing',
          truckId,
          currentLocation: `Truck ${truckId}`,
        })
      }
    })
    set({ packages: new Map(packages) })
  },

  transferPackagesToTrolley: (packageIds, trolleyId) => {
    const packages = get().packages
    packageIds.forEach(id => {
      const pkg = packages.get(id)
      if (pkg) {
        packages.set(id, {
          ...pkg,
          status: 'in_uld_trolley',
          trolleyId,
          currentLocation: `ULD Trolley ${trolleyId}`,
        })
      }
    })
    set({ packages: new Map(packages) })
  },

  transferPackagesToPlane: (packageIds, flightNumber, uldId) => {
    const packages = get().packages
    packageIds.forEach(id => {
      const pkg = packages.get(id)
      if (pkg) {
        packages.set(id, {
          ...pkg,
          status: 'in_uld_plane',
          flightNumber,
          uldId,
          currentLocation: `Flight ${flightNumber} - ULD ${uldId}`,
        })
      }
    })
    set({ packages: new Map(packages) })
  },
}))
