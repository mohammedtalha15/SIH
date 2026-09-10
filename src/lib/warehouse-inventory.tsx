'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// Package tracking status
export type PackageStatus = 'on-truck' | 'unloading' | 'in-warehouse' | 'loading-to-uld' | 'on-uld' | 'delivered'

// Tracked package with full lifecycle info
export type TrackedPackage = {
  id: string
  trackingNumber: string
  description: string
  weight: number
  dimensions: { w: number; h: number; d: number }
  origin: string
  destination: string
  priority: 'standard' | 'express' | 'priority'
  status: PackageStatus
  
  // Location tracking
  warehouseId?: string
  shelfId?: string
  shelfRow?: number
  shelfLevel?: number
  truckId?: string
  uldId?: string
  
  // Timestamps
  createdAt: Date
  arrivedAt?: Date
  shelvedAt?: Date
  loadedToUldAt?: Date
}

// Shelf in warehouse
export type WarehouseShelf = {
  id: string
  warehouseId: string
  row: number
  level: number
  packages: TrackedPackage[]
  maxWeight: number
  currentWeight: number
}

// Warehouse inventory state
type WarehouseInventoryState = {
  packages: Map<string, TrackedPackage>
  shelves: Map<string, WarehouseShelf>
}

// Context type
type WarehouseInventoryContextType = {
  // Package operations
  getPackage: (id: string) => TrackedPackage | undefined
  getAllPackages: () => TrackedPackage[]
  getPackagesByWarehouse: (warehouseId: string) => TrackedPackage[]
  getPackagesByShelf: (shelfId: string) => TrackedPackage[]
  
  // Shelf operations
  getShelf: (shelfId: string) => WarehouseShelf | undefined
  getShelvesByWarehouse: (warehouseId: string) => WarehouseShelf[]
  
  // Truck unloading - adds packages to warehouse
  unloadPackagesToWarehouse: (packages: TrackedPackage[], warehouseId: string) => void
  
  // ULD loading - removes packages from warehouse
  loadPackagesToULD: (warehouseId: string, uldId: string, count: number) => TrackedPackage[]
  
  // Move package between racks
  movePackageToRack: (packageId: string, warehouseId: string, targetRackRow: number) => boolean
  
  // Stats
  getWarehouseStats: (warehouseId: string) => { totalPackages: number; totalWeight: number }
}

const WarehouseInventoryContext = createContext<WarehouseInventoryContextType | null>(null)

// Generate unique shelf ID
function generateShelfId(warehouseId: string, row: number, level: number): string {
  return `${warehouseId}-shelf-${row}-${level}`
}

// Initialize shelves for a warehouse
function initializeShelves(warehouseId: string): Map<string, WarehouseShelf> {
  const shelves = new Map<string, WarehouseShelf>()
  
  // 6 rows x 4 levels = 24 shelves per warehouse
  for (let row = 0; row < 6; row++) {
    for (let level = 0; level < 4; level++) {
      const shelfId = generateShelfId(warehouseId, row, level)
      shelves.set(shelfId, {
        id: shelfId,
        warehouseId,
        row,
        level,
        packages: [],
        maxWeight: 2000,
        currentWeight: 0,
      })
    }
  }
  
  return shelves
}

// Provider component
export function WarehouseInventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WarehouseInventoryState>(() => {
    // Initialize with empty warehouses
    const shelves = new Map<string, WarehouseShelf>()
    
    // Initialize shelves for both warehouses
    const warehouse1Shelves = initializeShelves('warehouse-1')
    const warehouse2Shelves = initializeShelves('warehouse-2')
    
    warehouse1Shelves.forEach((shelf, id) => shelves.set(id, shelf))
    warehouse2Shelves.forEach((shelf, id) => shelves.set(id, shelf))
    
    return {
      packages: new Map(),
      shelves,
    }
  })
  
  const getPackage = useCallback((id: string) => {
    return state.packages.get(id)
  }, [state.packages])
  
  const getAllPackages = useCallback(() => {
    return Array.from(state.packages.values())
  }, [state.packages])
  
  const getPackagesByWarehouse = useCallback((warehouseId: string) => {
    return Array.from(state.packages.values()).filter(
      pkg => pkg.warehouseId === warehouseId && pkg.status === 'in-warehouse'
    )
  }, [state.packages])
  
  const getPackagesByShelf = useCallback((shelfId: string) => {
    return state.shelves.get(shelfId)?.packages || []
  }, [state.shelves])
  
  const getShelf = useCallback((shelfId: string) => {
    return state.shelves.get(shelfId)
  }, [state.shelves])
  
  const getShelvesByWarehouse = useCallback((warehouseId: string) => {
    return Array.from(state.shelves.values()).filter(
      shelf => shelf.warehouseId === warehouseId
    )
  }, [state.shelves])
  
  const unloadPackagesToWarehouse = useCallback((packages: TrackedPackage[], warehouseId: string) => {
    setState(prev => {
      const newPackages = new Map(prev.packages)
      const newShelves = new Map(prev.shelves)
      
      // Get available shelves for this warehouse
      const warehouseShelves = Array.from(newShelves.values())
        .filter(s => s.warehouseId === warehouseId)
        .sort((a, b) => {
          // Prioritize lower levels and lower rows
          if (a.level !== b.level) return a.level - b.level
          return a.row - b.row
        })
      
      packages.forEach(pkg => {
        // Find a shelf with capacity
        const targetShelf = warehouseShelves.find(
          shelf => shelf.currentWeight + pkg.weight <= shelf.maxWeight
        )
        
        if (targetShelf) {
          // Update package
          const updatedPkg: TrackedPackage = {
            ...pkg,
            status: 'in-warehouse',
            warehouseId,
            shelfId: targetShelf.id,
            shelfRow: targetShelf.row,
            shelfLevel: targetShelf.level,
            shelvedAt: new Date(),
          }
          
          newPackages.set(pkg.id, updatedPkg)
          
          // Update shelf
          const updatedShelf: WarehouseShelf = {
            ...targetShelf,
            packages: [...targetShelf.packages, updatedPkg],
            currentWeight: targetShelf.currentWeight + pkg.weight,
          }
          
          newShelves.set(targetShelf.id, updatedShelf)
          
          // Update our reference for next iteration
          const shelfIndex = warehouseShelves.findIndex(s => s.id === targetShelf.id)
          if (shelfIndex !== -1) {
            warehouseShelves[shelfIndex] = updatedShelf
          }
        }
      })
      
      return { packages: newPackages, shelves: newShelves }
    })
  }, [])
  
  const loadPackagesToULD = useCallback((warehouseId: string, uldId: string, count: number) => {
    const loadedPackages: TrackedPackage[] = []
    
    setState(prev => {
      const newPackages = new Map(prev.packages)
      const newShelves = new Map(prev.shelves)
      
      // Get packages from this warehouse (oldest first based on shelvedAt)
      const warehousePackages = Array.from(newPackages.values())
        .filter(pkg => pkg.warehouseId === warehouseId && pkg.status === 'in-warehouse')
        .sort((a, b) => {
          const timeA = a.shelvedAt?.getTime() || 0
          const timeB = b.shelvedAt?.getTime() || 0
          return timeA - timeB
        })
      
      // Take the requested count
      const packagesToLoad = warehousePackages.slice(0, count)
      
      packagesToLoad.forEach(pkg => {
        // Update package status
        const updatedPkg: TrackedPackage = {
          ...pkg,
          status: 'on-uld',
          uldId,
          loadedToUldAt: new Date(),
        }
        
        newPackages.set(pkg.id, updatedPkg)
        loadedPackages.push(updatedPkg)
        
        // Remove from shelf
        if (pkg.shelfId) {
          const shelf = newShelves.get(pkg.shelfId)
          if (shelf) {
            const updatedShelf: WarehouseShelf = {
              ...shelf,
              packages: shelf.packages.filter(p => p.id !== pkg.id),
              currentWeight: shelf.currentWeight - pkg.weight,
            }
            newShelves.set(pkg.shelfId, updatedShelf)
          }
        }
      })
      
      return { packages: newPackages, shelves: newShelves }
    })
    
    return loadedPackages
  }, [])
  
  const movePackageToRack = useCallback((packageId: string, warehouseId: string, targetRackRow: number) => {
    let success = false
    
    setState(prev => {
      const newPackages = new Map(prev.packages)
      const newShelves = new Map(prev.shelves)
      
      const pkg = newPackages.get(packageId)
      if (!pkg || pkg.status !== 'in-warehouse') {
        return prev // No change
      }
      
      // Find target shelf (use level 0 for simplicity, or find one with capacity)
      const targetShelves = Array.from(newShelves.values())
        .filter(s => s.warehouseId === warehouseId && s.row === targetRackRow)
        .sort((a, b) => a.level - b.level)
      
      const targetShelf = targetShelves.find(
        shelf => shelf.currentWeight + pkg.weight <= shelf.maxWeight
      )
      
      if (!targetShelf) {
        return prev // No capacity
      }
      
      // Remove from old shelf
      if (pkg.shelfId) {
        const oldShelf = newShelves.get(pkg.shelfId)
        if (oldShelf) {
          const updatedOldShelf: WarehouseShelf = {
            ...oldShelf,
            packages: oldShelf.packages.filter(p => p.id !== pkg.id),
            currentWeight: oldShelf.currentWeight - pkg.weight,
          }
          newShelves.set(pkg.shelfId, updatedOldShelf)
        }
      }
      
      // Update package with new location
      const updatedPkg: TrackedPackage = {
        ...pkg,
        shelfId: targetShelf.id,
        shelfRow: targetShelf.row,
        shelfLevel: targetShelf.level,
      }
      newPackages.set(packageId, updatedPkg)
      
      // Add to new shelf
      const updatedTargetShelf: WarehouseShelf = {
        ...targetShelf,
        packages: [...targetShelf.packages, updatedPkg],
        currentWeight: targetShelf.currentWeight + pkg.weight,
      }
      newShelves.set(targetShelf.id, updatedTargetShelf)
      
      success = true
      return { packages: newPackages, shelves: newShelves }
    })
    
    return success
  }, [])
  
  const getWarehouseStats = useCallback((warehouseId: string) => {
    const packages = Array.from(state.packages.values()).filter(
      pkg => pkg.warehouseId === warehouseId && pkg.status === 'in-warehouse'
    )
    
    return {
      totalPackages: packages.length,
      totalWeight: packages.reduce((sum, pkg) => sum + pkg.weight, 0),
    }
  }, [state.packages])
  
  return (
    <WarehouseInventoryContext.Provider
      value={{
        getPackage,
        getAllPackages,
        getPackagesByWarehouse,
        getPackagesByShelf,
        getShelf,
        getShelvesByWarehouse,
        unloadPackagesToWarehouse,
        loadPackagesToULD,
        movePackageToRack,
        getWarehouseStats,
      }}
    >
      {children}
    </WarehouseInventoryContext.Provider>
  )
}

export function useWarehouseInventory() {
  const context = useContext(WarehouseInventoryContext)
  if (!context) {
    throw new Error('useWarehouseInventory must be used within WarehouseInventoryProvider')
  }
  return context
}
