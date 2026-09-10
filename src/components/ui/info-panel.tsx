'use client'

import { useState } from 'react'
import type { SelectedObject, Warehouse, Truck, CargoItem, Shelf, Package } from '@/lib/types'
import { useWarehouseInventory, TrackedPackage } from '@/lib/warehouse-inventory'
import { WarehouseLayoutPanel } from './warehouse-layout'

// ULD data type
type ULDData = {
  id: string
  containerId: string
  flight: string
  destination: string
  capacity: number
  maxWeight: number
  packages: Package[]
  totalWeight: number
  loadedCount: number
  totalToLoad: number
  status: 'waiting' | 'loading' | 'departing'
  warehouseId: string
}

// Priority badge component
function PriorityBadge({ priority }: { priority: string }) {
  const classes = {
    standard: 'bg-ana-gray text-ana-dark',
    express: 'bg-ana-light-blue text-white',
    priority: 'bg-ana-red text-white',
  }
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${classes[priority as keyof typeof classes] || classes.standard}`}>
      {priority.toUpperCase()}
    </span>
  )
}

// Rack card component for warehouse view
function RackCard({ 
  rackNumber, 
  packages, 
  isExpanded, 
  onToggle,
  onPackageClick,
}: { 
  rackNumber: number
  packages: TrackedPackage[]
  isExpanded: boolean
  onToggle: () => void
  onPackageClick: (pkg: TrackedPackage) => void
}) {
  const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0)
  const hasPackages = packages.length > 0
  
  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${
      hasPackages ? 'border-ana-blue/30 bg-white' : 'border-gray-200 bg-gray-50'
    }`}>
      <button
        onClick={onToggle}
        className={`w-full px-3 py-2 flex items-center justify-between text-left transition-colors ${
          hasPackages ? 'hover:bg-ana-sky/20' : ''
        }`}
        disabled={!hasPackages}
      >
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold ${
            hasPackages ? 'bg-ana-blue text-white' : 'bg-gray-200 text-gray-400'
          }`}>
            {rackNumber}
          </div>
          <div>
            <p className={`text-sm font-medium ${hasPackages ? 'text-ana-dark' : 'text-gray-400'}`}>
              Rack {rackNumber}
            </p>
            <p className="text-xs text-gray-500">
              {packages.length} package{packages.length !== 1 ? 's' : ''} • {totalWeight} kg
            </p>
          </div>
        </div>
        {hasPackages && (
          <svg 
            className={`w-4 h-4 text-ana-blue transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      
      {isExpanded && hasPackages && (
        <div className="border-t border-gray-100 p-2 space-y-1 max-h-40 overflow-y-auto bg-gray-50">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => onPackageClick(pkg)}
              className="w-full text-left p-2 rounded bg-white hover:bg-ana-sky/30 transition-colors border border-transparent hover:border-ana-blue/20"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-ana-blue font-medium truncate">
                    AWB: {pkg.trackingNumber}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{pkg.description}</p>
                </div>
                <span className="text-xs font-medium text-gray-500 ml-2">{pkg.weight} kg</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Package detail view within warehouse panel
function PackageDetailView({ 
  pkg, 
  onBack 
}: { 
  pkg: TrackedPackage
  onBack: () => void 
}) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-ana-blue hover:text-ana-blue/80 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Warehouse
      </button>
      
      <div className="bg-ana-sky/30 rounded-lg p-3">
        <p className="text-xs text-ana-dark/60 mb-1">AWB Tracking Number</p>
        <p className="font-mono text-lg font-semibold text-ana-blue">{pkg.trackingNumber}</p>
      </div>
      
      <div>
        <p className="text-xs text-ana-dark/60 mb-1">Description</p>
        <p className="font-medium text-ana-dark">{pkg.description}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-ana-dark/60 mb-1">Weight</p>
          <p className="font-semibold">{pkg.weight} kg</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-ana-dark/60 mb-1">Priority</p>
          <PriorityBadge priority={pkg.priority} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-ana-dark/60 mb-1">Origin</p>
          <p className="text-sm">{pkg.origin}</p>
        </div>
        <div>
          <p className="text-xs text-ana-dark/60 mb-1">Destination</p>
          <p className="text-sm">{pkg.destination}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded p-2 text-center">
          <p className="text-xs text-ana-dark/60">L</p>
          <p className="text-sm font-medium">{pkg.dimensions.w} cm</p>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <p className="text-xs text-ana-dark/60">W</p>
          <p className="text-sm font-medium">{pkg.dimensions.h} cm</p>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <p className="text-xs text-ana-dark/60">H</p>
          <p className="text-sm font-medium">{pkg.dimensions.d} cm</p>
        </div>
      </div>
      
      <div className="border-t border-ana-soft-gray pt-3">
        <p className="text-xs text-ana-dark/60 mb-1">Location</p>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
            Rack {(pkg.shelfRow ?? 0) + 1}
          </span>
          <span className="text-sm text-gray-500">
            Level {(pkg.shelfLevel ?? 0) + 1}
          </span>
        </div>
      </div>
    </div>
  )
}

// Warehouse info panel with rack drill-down
function WarehousePanel({ data }: { data: Warehouse }) {
  const { getShelvesByWarehouse } = useWarehouseInventory()
  const [expandedRack, setExpandedRack] = useState<number | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<TrackedPackage | null>(null)
  const [showFullLayout, setShowFullLayout] = useState(false)
  
  const shelves = getShelvesByWarehouse(data.id)
  
  // Group packages by rack (row)
  const rackData = Array.from({ length: 6 }, (_, i) => {
    const rackShelves = shelves.filter(s => s.row === i)
    const packages = rackShelves.flatMap(s => s.packages)
    return { rackNumber: i + 1, packages }
  })
  
  const totalPackages = rackData.reduce((sum, rack) => sum + rack.packages.length, 0)
  const totalWeight = rackData.reduce((sum, rack) => 
    sum + rack.packages.reduce((w, pkg) => w + pkg.weight, 0), 0
  )
  
  if (selectedPackage) {
    return (
      <PackageDetailView 
        pkg={selectedPackage} 
        onBack={() => setSelectedPackage(null)} 
      />
    )
  }
  
  const capacityPercent = data.capacity.total > 0 
    ? Math.min(100, Math.round((totalWeight / data.capacity.total) * 100))
    : 0
  
  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-ana-sky/50 rounded-lg p-3">
            <p className="text-xs text-ana-dark/60 mb-1">Code</p>
            <p className="font-semibold text-ana-blue">{data.code}</p>
          </div>
          <div className="bg-ana-sky/50 rounded-lg p-3">
            <p className="text-xs text-ana-dark/60 mb-1">Location</p>
            <p className="font-semibold text-ana-dark">{data.location}</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-ana-blue to-ana-light-blue rounded-lg p-3 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-white/70">Total Packages</p>
              <p className="text-2xl font-bold">{totalPackages}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70">Total Weight</p>
              <p className="text-2xl font-bold">{totalWeight.toLocaleString()} kg</p>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>Capacity</span>
              <span>{capacityPercent}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all"
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowFullLayout(true)}
          className="w-full bg-ana-sky/30 hover:bg-ana-sky/50 border border-ana-blue/20 rounded-lg p-3 flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5 text-ana-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <span className="font-medium text-ana-blue">Open Full Layout View</span>
          <span className="text-xs text-ana-dark/50">(Drag & Drop)</span>
        </button>
        
        <div>
          <p className="text-xs text-ana-dark/60 mb-2 font-medium">Quick View</p>
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="grid grid-cols-3 gap-2">
              {rackData.map((rack) => (
                <button
                  key={rack.rackNumber}
                  onClick={() => setExpandedRack(expandedRack === rack.rackNumber ? null : rack.rackNumber)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all ${
                    rack.packages.length > 0 
                      ? 'bg-ana-blue text-white hover:bg-ana-blue/90 shadow-sm' 
                      : 'bg-white text-gray-400 border border-gray-200'
                  } ${expandedRack === rack.rackNumber ? 'ring-2 ring-ana-blue ring-offset-2' : ''}`}
                >
                  <span className="font-bold text-lg">{rack.rackNumber}</span>
                  <span className="opacity-80">{rack.packages.length} pkg</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>← Front Door</span>
              <span>Back Door →</span>
            </div>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-ana-dark/60 mb-2 font-medium">Rack Details</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {rackData.map((rack) => (
              <RackCard
                key={rack.rackNumber}
                rackNumber={rack.rackNumber}
                packages={rack.packages}
                isExpanded={expandedRack === rack.rackNumber}
                onToggle={() => setExpandedRack(expandedRack === rack.rackNumber ? null : rack.rackNumber)}
                onPackageClick={setSelectedPackage}
              />
            ))}
          </div>
        </div>
      </div>
      
      {showFullLayout && (
        <WarehouseLayoutPanel data={data} onClose={() => setShowFullLayout(false)} />
      )}
    </>
  )
}

// Truck info panel
function TruckPanel({ data }: { data: Truck }) {
  const isUnloading = data.status === 'unloading'
  const isComplete = data.unloadedCount !== undefined && data.totalToUnload !== undefined 
    && data.unloadedCount >= data.totalToUnload
  const unloadingPercent = data.totalToUnload 
    ? Math.round(((data.unloadedCount || 0) / data.totalToUnload) * 100)
    : 0
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-ana-sky/50 rounded-lg p-3">
          <p className="text-xs text-ana-dark/60 mb-1">Plate Number</p>
          <p className="font-semibold text-ana-blue">{data.plateNumber}</p>
        </div>
        <div className="bg-ana-sky/50 rounded-lg p-3">
          <p className="text-xs text-ana-dark/60 mb-1">Status</p>
          <span className={`font-semibold ${
            data.status === 'approaching' ? 'text-amber-600' :
            data.status === 'unloading' ? 'text-ana-blue' : 'text-green-600'
          }`}>
            {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
          </span>
        </div>
      </div>
      
      <div>
        <p className="text-xs text-ana-dark/60 mb-1">Driver</p>
        <p className="font-medium">{data.driver}</p>
        <p className="text-xs text-ana-dark/60">{data.company}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-ana-dark/60 mb-1">Origin</p>
          <p className="text-sm">{data.origin}</p>
        </div>
        <div>
          <p className="text-xs text-ana-dark/60 mb-1">Destination</p>
          <p className="text-sm">{data.destination}</p>
        </div>
      </div>
      
      {data.totalToUnload !== undefined && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-ana-dark/70">Unloading Progress</span>
            <span className="font-medium">{data.unloadedCount || 0} / {data.totalToUnload} packages</span>
          </div>
          <div className="w-full bg-ana-gray rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-ana-blue'}`}
              style={{ width: `${unloadingPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-ana-dark/60">
              {unloadingPercent}% complete
            </p>
            {isUnloading && !isComplete && (
              <span className="text-xs text-ana-blue font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-ana-blue rounded-full animate-pulse" />
                Unloading...
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className="border-t border-ana-soft-gray pt-3">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-ana-dark/60 font-medium">
            {isComplete ? 'All Packages Unloaded' : `Remaining Packages (${data.packages.length})`}
          </p>
          <p className="text-xs font-medium">{data.totalWeight.toLocaleString()} kg</p>
        </div>
        
        <div className="max-h-40 overflow-y-auto space-y-1.5">
          {data.packages.length === 0 ? (
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-sm text-green-600 font-medium">✓ Unloading Complete</p>
              <p className="text-xs text-green-500 mt-1">All packages transferred to warehouse</p>
            </div>
          ) : (
            <>
              {data.packages.map((pkg, i) => (
                <div key={pkg.id || i} className="bg-ana-sky/30 rounded px-2 py-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-ana-blue font-medium truncate">AWB: {pkg.trackingNumber}</p>
                      <p className="text-xs text-ana-dark/70 truncate">{pkg.description}</p>
                    </div>
                    <span className="text-xs font-medium text-ana-dark ml-2 whitespace-nowrap">{pkg.weight} kg</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-ana-dark/50 truncate">→ {pkg.destination}</span>
                    <PriorityBadge priority={pkg.priority} />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Cargo item info panel
function CargoPanel({ data }: { data: CargoItem }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-ana-dark/60 mb-1">Tracking Number</p>
          <p className="font-mono text-sm font-medium text-ana-blue">{data.trackingNumber}</p>
        </div>
        <PriorityBadge priority={data.priority} />
      </div>
      
      <div>
        <p className="text-xs text-ana-dark/60 mb-1">Description</p>
        <p className="font-medium">{data.description}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-ana-sky/50 rounded-lg p-3">
          <p className="text-xs text-ana-dark/60 mb-1">Weight</p>
          <p className="font-semibold">{data.weight} kg</p>
        </div>
        <div className="bg-ana-sky/50 rounded-lg p-3">
          <p className="text-xs text-ana-dark/60 mb-1">Dimensions</p>
          <p className="font-semibold text-sm">
            {data.dimensions.w}×{data.dimensions.h}×{data.dimensions.d} cm
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-ana-dark/60 mb-1">Origin</p>
          <p className="text-sm">{data.origin}</p>
        </div>
        <div>
          <p className="text-xs text-ana-dark/60 mb-1">Destination</p>
          <p className="text-sm">{data.destination}</p>
        </div>
      </div>
      
      <div className="border-t border-ana-soft-gray pt-3">
        <p className="text-xs text-ana-dark/60 mb-1">Handler</p>
        <p className="text-sm font-medium text-ana-blue">{data.handler}</p>
      </div>
    </div>
  )
}

// Shelf info panel
function ShelfPanel({ data }: { data: Shelf }) {
  const weightPercent = data.maxWeight > 0 
    ? Math.min(100, Math.round((data.currentWeight / data.maxWeight) * 100))
    : 0
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-ana-sky/50 rounded-lg p-3">
          <p className="text-xs text-ana-dark/60 mb-1">Rack ID</p>
          <p className="font-mono text-sm font-semibold text-ana-blue">Rack {data.position.row + 1}</p>
        </div>
        <div className="bg-ana-sky/50 rounded-lg p-3">
          <p className="text-xs text-ana-dark/60 mb-1">Packages</p>
          <p className="font-semibold text-ana-dark">{data.itemCount} items</p>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-ana-dark/70">Weight Load</span>
          <span className="font-medium">{weightPercent}%</span>
        </div>
        <div className="w-full bg-ana-gray rounded-full h-3">
          <div 
            className={`rounded-full h-3 transition-all duration-500 ${
              weightPercent > 90 ? 'bg-red-500' : 
              weightPercent > 70 ? 'bg-amber-500' : 'bg-ana-blue'
            }`}
            style={{ width: `${weightPercent}%` }}
          />
        </div>
        <p className="text-xs text-ana-dark/60 mt-1">
          {data.currentWeight.toLocaleString()} / {data.maxWeight.toLocaleString()} kg
        </p>
      </div>
      
      <div className="border-t border-ana-soft-gray pt-3">
        <p className="text-xs text-ana-dark/60 mb-2 font-medium">Stored Packages:</p>
        {data.items.length === 0 ? (
          <div className="bg-ana-gray/30 rounded-lg p-4 text-center">
            <p className="text-sm text-ana-dark/50 italic">No packages stored</p>
            <p className="text-xs text-ana-dark/40 mt-1">Waiting for incoming cargo</p>
          </div>
        ) : (
          <div className="max-h-40 overflow-y-auto space-y-1.5">
            {data.items.map((item, i) => (
              <div key={item.id || i} className="bg-ana-sky/30 rounded px-2 py-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-ana-blue font-medium truncate">AWB: {item.trackingNumber}</p>
                    <p className="text-xs text-ana-dark/70 truncate">{item.description}</p>
                  </div>
                  <span className="text-xs font-medium text-ana-dark ml-2 whitespace-nowrap">{item.weight} kg</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-ana-dark/50 truncate">→ {item.destination}</span>
                  <PriorityBadge priority={item.priority} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ULD info panel
function ULDPanel({ data }: { data: ULDData }) {
  const loadingPercent = Math.round((data.loadedCount / data.totalToLoad) * 100)
  const isLoading = data.status === 'loading'
  const isParked = data.status === 'parked' as string
  const isComplete = data.loadedCount === data.totalToLoad
  
  const packagesInWarehouse = (data as { packagesInWarehouse?: number }).packagesInWarehouse ?? 0
  const minPackagesRequired = (data as { minPackagesRequired?: number }).minPackagesRequired ?? 10
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-ana-sky/50 rounded-lg p-3">
          <p className="text-xs text-ana-dark/60 mb-1">Container ID</p>
          <p className="font-mono text-sm font-semibold text-ana-blue">{data.containerId}</p>
        </div>
        <div className="bg-ana-sky/50 rounded-lg p-3">
          <p className="text-xs text-ana-dark/60 mb-1">Status</p>
          <span className={`font-semibold ${
            isParked ? 'text-gray-500' :
            data.status === 'waiting' ? 'text-amber-600' :
            data.status === 'loading' ? 'text-ana-blue' : 'text-green-600'
          }`}>
            {isParked ? 'Parked - Standby' : data.status.charAt(0).toUpperCase() + data.status.slice(1)}
          </span>
        </div>
      </div>
      
      {isParked && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-sm">Waiting for Packages</span>
          </div>
          <p className="text-xs text-amber-600 mb-2">
            ULD will begin loading when warehouse has {minPackagesRequired}+ packages
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-amber-700">Warehouse packages:</span>
            <span className="text-sm font-bold text-amber-700">{packagesInWarehouse} / {minPackagesRequired}</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-2 mt-1">
            <div 
              className="bg-amber-500 rounded-full h-2 transition-all"
              style={{ width: `${Math.min(100, (packagesInWarehouse / minPackagesRequired) * 100)}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-ana-dark/60 mb-1">Flight</p>
          <p className="font-semibold text-ana-blue">{data.flight}</p>
        </div>
        <div>
          <p className="text-xs text-ana-dark/60 mb-1">Destination</p>
          <p className="font-semibold">{data.destination}</p>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-ana-dark/70">Loading Progress</span>
          <span className="font-medium">{data.loadedCount} / {data.totalToLoad} packages</span>
        </div>
        <div className="w-full bg-ana-gray rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-ana-blue'}`}
            style={{ width: `${loadingPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-xs text-ana-dark/60">
            {loadingPercent}% complete
          </p>
          {isLoading && !isComplete && (
            <span className="text-xs text-ana-blue font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-ana-blue rounded-full animate-pulse" />
              Loading...
            </span>
          )}
        </div>
      </div>
      
      <div className="border-t border-ana-soft-gray pt-3">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-ana-dark/60 font-medium">Loaded Packages ({data.packages.length})</p>
          <p className="text-xs font-medium">{data.totalWeight.toLocaleString()} kg</p>
        </div>
        <div className="max-h-40 overflow-y-auto space-y-1.5">
          {data.packages.length === 0 ? (
            <div className="bg-ana-gray/30 rounded-lg p-3 text-center">
              <p className="text-sm text-ana-dark/50 italic">
                {isLoading ? 'Loading packages from warehouse...' : 'No packages loaded yet'}
              </p>
              <p className="text-xs text-ana-dark/40 mt-1">
                {isLoading ? 'Packages will appear here as loaded' : 'Waiting for cargo'}
              </p>
            </div>
          ) : (
            <>
              {data.packages.map((pkg, i) => (
                <div key={pkg.id || i} className="bg-green-50 rounded px-2 py-2 animate-in fade-in duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-green-700 font-medium truncate">AWB: {pkg.trackingNumber}</p>
                      <p className="text-xs text-ana-dark/70 truncate">{pkg.destination}</p>
                    </div>
                    <span className="text-xs font-medium text-ana-dark ml-2 whitespace-nowrap">{pkg.weight} kg</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      
      <div className="bg-ana-sky/30 rounded-lg p-3">
        <p className="text-xs text-ana-dark/60 mb-1">ULD Capacity</p>
        <p className="text-sm">
          Max Volume: <span className="font-semibold">{data.capacity} L</span> • 
          Max Weight: <span className="font-semibold">{data.maxWeight} kg</span>
        </p>
      </div>
    </div>
  )
}

// Main info panel component
export function InfoPanel({ 
  selected, 
  onClose 
}: { 
  selected: SelectedObject
  onClose: () => void
}) {
  const titles: Record<string, string> = {
    truck: 'Truck Manifest',
    cargo: 'Package Details',
    shelf: 'Shelf Information',
    uld: 'ULD Container',
    warehouse: 'Warehouse Info',
  }
  
  const getTitle = () => {
    if (selected.type === 'uld') {
      return (selected.data as ULDData).containerId
    }
    return titles[selected.type]
  }

  return (
    <div className="absolute right-4 top-20 z-20 w-80 bg-white rounded-xl shadow-2xl border border-ana-soft-gray overflow-hidden animate-in slide-in-from-right-5 duration-300">
      <div className="bg-ana-blue px-4 py-3 flex justify-between items-center">
        <div>
          <p className="text-white/70 text-xs uppercase tracking-wide">{titles[selected.type]}</p>
          <h3 className="text-white font-semibold">{getTitle()}</h3>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="p-4">
        {selected.type === 'warehouse' && <WarehousePanel data={selected.data as Warehouse} />}
        {selected.type === 'truck' && <TruckPanel data={selected.data as Truck} />}
        {selected.type === 'cargo' && <CargoPanel data={selected.data as CargoItem} />}
        {selected.type === 'shelf' && <ShelfPanel data={selected.data as Shelf} />}
        {selected.type === 'uld' && <ULDPanel data={selected.data as ULDData} />}
      </div>
      
      <div className="bg-ana-gray/50 px-4 py-2 border-t border-ana-soft-gray">
        <p className="text-xs text-ana-dark/50 text-center">
          Click elsewhere to close • ESC to dismiss
        </p>
      </div>
    </div>
  )
}
