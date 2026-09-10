import type { 
  Warehouse, 
  Truck, 
  CargoItem, 
  Shelf, 
  Priority 
} from './types'

// Helper to generate random ID
function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

// Random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Random number in range
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Destinations
const destinations = [
  'Tokyo, Japan',
  'Los Angeles, USA',
  'Singapore',
  'Hong Kong',
  'Shanghai, China',
  'Seoul, Korea',
  'Bangkok, Thailand',
  'Sydney, Australia',
  'Frankfurt, Germany',
  'London, UK',
]

// Origins
const origins = [
  'Narita, Japan',
  'San Francisco, USA',
  'Taipei, Taiwan',
  'Manila, Philippines',
  'Jakarta, Indonesia',
  'Kuala Lumpur, Malaysia',
  'Ho Chi Minh, Vietnam',
  'Mumbai, India',
  'Dubai, UAE',
  'Amsterdam, Netherlands',
]

// Cargo descriptions
const cargoDescriptions = [
  'Electronic Components',
  'Medical Supplies',
  'Automotive Parts',
  'Fashion Apparel',
  'Fresh Seafood',
  'Pharmaceutical Products',
  'Industrial Machinery',
  'Consumer Electronics',
  'Aircraft Components',
  'Chemical Materials',
  'Luxury Goods',
  'Agricultural Products',
  'Scientific Equipment',
  'Perishable Foods',
  'Hazardous Materials',
]

// Trucking companies
const truckingCompanies = [
  'ANA Cargo Logistics',
  'Nippon Express',
  'Yamato Transport',
  'Sagawa Express',
  'Japan Post Logistics',
]

// Driver names
const driverNames = [
  'Tanaka Hiroshi',
  'Suzuki Kenji',
  'Watanabe Yuki',
  'Takahashi Ryo',
  'Ito Masaru',
  'Yamamoto Koji',
  'Nakamura Shun',
  'Kobayashi Taro',
]

// ANA flight numbers
const anaFlightNumbers = [
  'NH 101',
  'NH 203',
  'NH 305',
  'NH 407',
  'NH 509',
  'NH 611',
  'NH 713',
  'NH 815',
]

// Generate a cargo item
export function generateCargoItem(): CargoItem {
  const priorities: Priority[] = ['standard', 'express', 'priority']
  const priority = randomItem(priorities)
  
  return {
    id: generateId('PKG'),
    description: randomItem(cargoDescriptions),
    weight: randomInRange(5, 500),
    dimensions: {
      w: randomInRange(20, 120),
      h: randomInRange(20, 100),
      d: randomInRange(20, 150),
    },
    destination: randomItem(destinations),
    origin: randomItem(origins),
    priority,
    handler: randomItem(anaFlightNumbers),
    trackingNumber: `AWB${randomInRange(100000000, 999999999)}`,
  }
}

// Generate a shelf
export function generateShelf(warehouseId: string, row: number, level: number): Shelf {
  const items = Array.from({ length: randomInRange(3, 8) }, generateCargoItem)
  const currentWeight = items.reduce((sum, item) => sum + item.weight, 0)
  
  return {
    id: generateId('SHF'),
    warehouseId,
    position: { row, level },
    itemCount: items.length,
    maxWeight: 2000,
    currentWeight,
    items,
  }
}

// Generate warehouse shelves - more for larger warehouses
export function generateShelves(warehouseId: string): Shelf[] {
  const shelves: Shelf[] = []
  for (let row = 0; row < 6; row++) {
    for (let level = 0; level < 4; level++) {
      shelves.push(generateShelf(warehouseId, row, level))
    }
  }
  return shelves
}

// Pre-generated warehouses - 2 large air cargo terminals
export const warehouses: Warehouse[] = [
  {
    id: 'warehouse-1',
    name: 'Import Cargo Terminal',
    code: 'NRT-A1',
    capacity: { used: 18500, total: 25000 },
    temperature: 'Ambient (15-25°C)',
    status: 'operational',
    currentCargo: Array.from({ length: 120 }, generateCargoItem),
    shelves: generateShelves('warehouse-1'),
    location: 'Terminal West',
  },
  {
    id: 'warehouse-2',
    name: 'Export Cargo Terminal',
    code: 'NRT-A2',
    capacity: { used: 21200, total: 25000 },
    temperature: 'Ambient (15-25°C)',
    status: 'operational',
    currentCargo: Array.from({ length: 145 }, generateCargoItem),
    shelves: generateShelves('warehouse-2'),
    location: 'Terminal East',
  },
]

// Generate a truck
export function generateTruck(): Truck {
  const packages = Array.from({ length: randomInRange(8, 20) }, generateCargoItem)
  const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0)
  
  const plateChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const plateNumber = `${randomItem([...plateChars])}${randomItem([...plateChars])}-${randomInRange(10, 99)}-${randomInRange(10, 99)}`
  
  return {
    id: generateId('TRK'),
    plateNumber,
    driver: randomItem(driverNames),
    company: randomItem(truckingCompanies),
    origin: randomItem(origins),
    destination: randomItem(destinations),
    packages,
    arrivalTime: new Date(Date.now() - randomInRange(0, 3600000)),
    status: 'approaching',
    totalWeight,
  }
}

// Get warehouse by ID
export function getWarehouseById(id: string): Warehouse | undefined {
  return warehouses.find(w => w.id === id)
}

// Get shelf by ID from all warehouses
export function getShelfById(id: string): Shelf | undefined {
  for (const warehouse of warehouses) {
    const shelf = warehouse.shelves.find(s => s.id === id)
    if (shelf) return shelf
  }
  return undefined
}

// Get cargo item by ID from all warehouses
export function getCargoItemById(id: string): CargoItem | undefined {
  for (const warehouse of warehouses) {
    for (const shelf of warehouse.shelves) {
      const item = shelf.items.find(i => i.id === id)
      if (item) return item
    }
  }
  return undefined
}
