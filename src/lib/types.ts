// ANA Cargo Terminal - Type Definitions

export type Priority = 'standard' | 'express' | 'priority'

export type WarehouseStatus = 'operational' | 'maintenance' | 'full'

export type TruckStatus = 'approaching' | 'unloading' | 'departing'

export type Dimensions = {
  w: number
  h: number
  d: number
}

export type Position3D = {
  x: number
  y: number
  z: number
}

// Cargo item - individual package
export type CargoItem = {
  id: string
  description: string
  weight: number // in kg
  dimensions: Dimensions // in cm
  destination: string
  origin: string
  priority: Priority
  handler: string // ANA flight number or truck ID
  trackingNumber: string
}

// Shelf inside warehouse
export type Shelf = {
  id: string
  warehouseId: string
  position: { row: number; level: number }
  itemCount: number
  maxWeight: number // in kg
  currentWeight: number // in kg
  items: CargoItem[]
}

// Warehouse building
export type Warehouse = {
  id: string
  name: string
  code: string // e.g., "NRT-W1"
  capacity: { 
    used: number // in cubic meters
    total: number // in cubic meters
  }
  temperature: string // e.g., "Ambient (15-25°C)"
  status: WarehouseStatus
  currentCargo: CargoItem[]
  shelves: Shelf[]
  location: string
}

// Truck for delivery
export type Truck = {
  id: string
  plateNumber: string
  driver: string
  company: string
  origin: string
  destination: string
  packages: CargoItem[]
  arrivalTime: Date
  departureTime?: Date
  status: TruckStatus
  totalWeight: number // in kg
  // Unloading progress tracking
  unloadedCount?: number
  totalToUnload?: number
}

// Package for ULD (simplified cargo item)
export type Package = {
  id: string
  trackingNumber: string
  weight: number
  dimensions: { length: number; width: number; height: number }
  destination: string
  handler: string
  status: string
  priority: 'normal' | 'high'
}

// Selected object for info panel
export type SelectedObjectType = 'warehouse' | 'truck' | 'cargo' | 'shelf' | 'uld'

export type SelectedObject = {
  type: SelectedObjectType
  id: string
  position?: [number, number, number]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Warehouse | Truck | CargoItem | Shelf | any
}

// Animation state
export type TruckAnimationState = {
  phase: 'approaching' | 'parking' | 'unloading' | 'departing' | 'waiting'
  progress: number // 0 to 1
}
