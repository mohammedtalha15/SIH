'use client'

import { create } from 'zustand'
import type { Package, AWB, CargoStatus, ULD, Truck, CargoStats } from '@/lib/types/cargo-types'

/**
 * Cargo Simulation Store
 * Manages continuous simulation of cargo flow through the terminal
 */

type CargoStore = {
  packages: Map<AWB, Package>
  ulds: Map<string, ULD>
  trucks: Map<string, Truck>
  isSimulating: boolean
  simulationSpeed: number
  startSimulation: () => void
  stopSimulation: () => void
  addPackage: (pkg: Package) => void
  updatePackageStatus: (awb: AWB, status: CargoStatus, location: string, notes?: string) => void
  getPackage: (awb: AWB) => Package | undefined
  getPackagesByStatus: (status: CargoStatus) => Package[]
  getStats: () => CargoStats
}

// Generate AWB number
function generateAWB(): AWB {
  const prefix = ['ANA', 'NH', 'JL'][Math.floor(Math.random() * 3)]
  const number = Math.floor(10000000 + Math.random() * 90000000)
  return `${prefix}-${number}`
}

// Generate random package
function generateRandomPackage(type: 'inbound' | 'outbound'): Package {
  const cargoTypes = ['general', 'perishable', 'dangerous', 'valuable', 'oversized'] as const
  const priorities = ['low', 'normal', 'high', 'urgent'] as const
  
  const origins = ['NRT', 'HND', 'KIX', 'FUK', 'CTS']
  const destinations = ['LAX', 'JFK', 'LHR', 'CDG', 'SIN', 'HKG', 'PVG']
  
  const companies = [
    'Toyota Motor Corp',
    'Sony Electronics',
    'Panasonic',
    'Mitsubishi',
    'Canon',
    'Nikon',
    'Fujifilm',
    'Hitachi',
    'Toshiba',
  ]
  
  const awb = generateAWB()
  const cargoType = cargoTypes[Math.floor(Math.random() * cargoTypes.length)]
  const priority = priorities[Math.floor(Math.random() * priorities.length)]
  
  const origin = type === 'inbound' ? destinations[Math.floor(Math.random() * destinations.length)] : origins[Math.floor(Math.random() * origins.length)]
  const destination = type === 'inbound' ? origins[Math.floor(Math.random() * origins.length)] : destinations[Math.floor(Math.random() * destinations.length)]
  
  const status: CargoStatus = type === 'inbound' ? 'arriving' : 'in-warehouse'
  const location = type === 'inbound' ? `Flight NH${Math.floor(100 + Math.random() * 900)}` : 'Warehouse Zone A'
  
  const now = new Date()
  
  return {
    awb,
    status,
    type: cargoType,
    weight: Math.floor(10 + Math.random() * 500),
    volume: parseFloat((0.1 + Math.random() * 2).toFixed(2)),
    pieces: Math.floor(1 + Math.random() * 10),
    description: `${cargoType.charAt(0).toUpperCase() + cargoType.slice(1)} cargo`,
    shipper: companies[Math.floor(Math.random() * companies.length)],
    consignee: companies[Math.floor(Math.random() * companies.length)],
    origin,
    destination,
    priority,
    flightInfo: {
      flightNumber: `NH${Math.floor(100 + Math.random() * 900)}`,
      origin: type === 'inbound' ? origin : 'NRT',
      destination: type === 'inbound' ? 'NRT' : destination,
      scheduledTime: new Date(now.getTime() + (type === 'inbound' ? -2 : 3) * 60 * 60 * 1000),
    },
    currentLocation: location,
    timeline: [{
      timestamp: now,
      status,
      location,
      notes: type === 'inbound' ? 'Package arrived at terminal' : 'Package received for export',
    }],
    createdAt: now,
    updatedAt: now,
  }
}

// Cargo flow state machine
const FLOW_TRANSITIONS: Record<CargoStatus, { next: CargoStatus[], duration: number }> = {
  'arriving': { next: ['unloading-plane'], duration: 5 },
  'unloading-plane': { next: ['customs-import'], duration: 10 },
  'customs-import': { next: ['in-warehouse'], duration: 15 },
  'in-warehouse': { next: ['loading-truck', 'customs-export'], duration: 30 },
  'customs-export': { next: ['loading-plane'], duration: 15 },
  'loading-truck': { next: ['in-transit-truck'], duration: 10 },
  'in-transit-truck': { next: ['delivered'], duration: 20 },
  'delivered': { next: [], duration: 0 },
  'loading-plane': { next: ['departed'], duration: 15 },
  'departed': { next: [], duration: 0 },
}

const LOCATION_MAP: Record<CargoStatus, string> = {
  'arriving': 'Airside - Arrival Gate',
  'unloading-plane': 'Cargo Ramp',
  'customs-import': 'Import Customs Area',
  'in-warehouse': 'Cargo Terminal - Warehouse',
  'customs-export': 'Export Customs Area',
  'loading-truck': 'Truck Loading Bay',
  'in-transit-truck': 'En Route',
  'delivered': 'Delivered',
  'loading-plane': 'Aircraft Loading',
  'departed': 'Departed',
}

export const useCargoStore = create<CargoStore>((set, get) => ({
  packages: new Map(),
  ulds: new Map(),
  trucks: new Map(),
  isSimulating: false,
  simulationSpeed: 1,

  startSimulation: () => {
    set({ isSimulating: true })
    
    // Generate initial packages
    for (let i = 0; i < 20; i++) {
      const type = Math.random() > 0.5 ? 'inbound' : 'outbound'
      const pkg = generateRandomPackage(type)
      get().addPackage(pkg)
    }
    
    // Start simulation loop
    const interval = setInterval(() => {
      const store = get()
      if (!store.isSimulating) {
        clearInterval(interval)
        return
      }
      
      // Add new packages randomly
      if (Math.random() > 0.7) {
        const type = Math.random() > 0.5 ? 'inbound' : 'outbound'
        const pkg = generateRandomPackage(type)
        store.addPackage(pkg)
      }
      
      // Progress packages through workflow
      store.packages.forEach((pkg) => {
        const transitions = FLOW_TRANSITIONS[pkg.status]
        if (transitions.next.length === 0) return // Terminal state
        
        // Random chance to progress based on duration
        if (Math.random() > 0.3) return
        
        const nextStatus = transitions.next[Math.floor(Math.random() * transitions.next.length)]
        const nextLocation = LOCATION_MAP[nextStatus]
        
        store.updatePackageStatus(pkg.awb, nextStatus, nextLocation)
      })
      
      // Remove completed packages after some time
      const now = new Date()
      store.packages.forEach((pkg, awb) => {
        if ((pkg.status === 'delivered' || pkg.status === 'departed') && 
            (now.getTime() - pkg.updatedAt.getTime()) > 60000) {
          const newPackages = new Map(store.packages)
          newPackages.delete(awb)
          set({ packages: newPackages })
        }
      })
      
    }, 2000) // Update every 2 seconds
  },

  stopSimulation: () => {
    set({ isSimulating: false })
  },

  addPackage: (pkg) => {
    set((state) => {
      const newPackages = new Map(state.packages)
      newPackages.set(pkg.awb, pkg)
      return { packages: newPackages }
    })
  },

  updatePackageStatus: (awb, status, location, notes) => {
    set((state) => {
      const pkg = state.packages.get(awb)
      if (!pkg) return state
      
      const now = new Date()
      const updatedPackage: Package = {
        ...pkg,
        status,
        currentLocation: location,
        updatedAt: now,
        timeline: [
          ...pkg.timeline,
          {
            timestamp: now,
            status,
            location,
            notes,
          },
        ],
      }
      
      const newPackages = new Map(state.packages)
      newPackages.set(awb, updatedPackage)
      return { packages: newPackages }
    })
  },

  getPackage: (awb) => {
    return get().packages.get(awb)
  },

  getPackagesByStatus: (status) => {
    return Array.from(get().packages.values()).filter(pkg => pkg.status === status)
  },

  getStats: () => {
    const packages = Array.from(get().packages.values())
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const inboundToday = packages.filter(pkg => 
      pkg.createdAt >= today && 
      ['arriving', 'unloading-plane', 'customs-import'].includes(pkg.status)
    ).length
    
    const outboundToday = packages.filter(pkg => 
      pkg.createdAt >= today && 
      ['customs-export', 'loading-plane', 'departed'].includes(pkg.status)
    ).length
    
    const inWarehouse = packages.filter(pkg => pkg.status === 'in-warehouse').length
    const inTransit = packages.filter(pkg => 
      ['loading-truck', 'in-transit-truck', 'loading-plane'].includes(pkg.status)
    ).length
    
    const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0)
    
    return {
      totalPackages: packages.length,
      inboundToday,
      outboundToday,
      inWarehouse,
      inTransit,
      totalWeight,
      totalValue: 0,
      averageProcessingTime: 45,
    }
  },
}))
