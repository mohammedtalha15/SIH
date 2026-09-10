/**
 * Cargo Tracking Data Types
 * AWB (Air Waybill) system for package tracking
 */

export type AWB = string // Format: XXX-12345678

export type CargoStatus = 
  | 'arriving'           // Plane arriving at airport
  | 'unloading-plane'    // Being unloaded from aircraft
  | 'customs-import'     // Import customs inspection
  | 'in-warehouse'       // Stored in cargo warehouse
  | 'customs-export'     // Export customs inspection
  | 'loading-truck'      // Being loaded onto truck
  | 'in-transit-truck'   // On truck for delivery
  | 'delivered'          // Delivered to recipient
  | 'loading-plane'      // Being loaded onto aircraft
  | 'departed'           // Departed on aircraft

export type CargoType = 'general' | 'perishable' | 'dangerous' | 'valuable' | 'oversized'

export type FlightInfo = {
  flightNumber: string
  origin: string
  destination: string
  scheduledTime: Date
  actualTime?: Date
}

export type Package = {
  awb: AWB
  status: CargoStatus
  type: CargoType
  weight: number // kg
  volume: number // m³
  pieces: number
  description: string
  shipper: string
  consignee: string
  origin: string
  destination: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  flightInfo?: FlightInfo
  warehouseZone?: string
  uld?: string // ULD container ID
  truckId?: string
  currentLocation: string
  timeline: CargoEvent[]
  createdAt: Date
  updatedAt: Date
}

export type CargoEvent = {
  timestamp: Date
  status: CargoStatus
  location: string
  notes?: string
}

export type ULD = {
  id: string // e.g., AKE68912NH
  type: 'AKE' | 'AKH' | 'PMC' | 'AMA'
  capacity: number // kg
  currentWeight: number
  packages: AWB[]
  status: 'empty' | 'loading' | 'full' | 'unloading'
  location: string
}

export type Truck = {
  id: string
  capacity: number // kg
  currentWeight: number
  packages: AWB[]
  status: 'available' | 'loading' | 'in-transit' | 'unloading'
  destination?: string
}

export type CargoStats = {
  totalPackages: number
  inboundToday: number
  outboundToday: number
  inWarehouse: number
  inTransit: number
  totalWeight: number
  totalValue: number
  averageProcessingTime: number // minutes
}
