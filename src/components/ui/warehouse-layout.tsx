'use client'

import { useState, DragEvent } from 'react'
import { useWarehouseInventory, TrackedPackage } from '@/lib/warehouse-inventory'
import type { Warehouse } from '@/lib/types'

function PriorityDot({ priority }: { priority: string }) {
  const colors = {
    priority: 'bg-red-500',
    express: 'bg-amber-500',
    standard: 'bg-gray-400',
  }
  return (
    <span className={`w-2 h-2 rounded-full ${colors[priority as keyof typeof colors] || colors.standard}`} />
  )
}

function DraggablePackage({ 
  pkg, 
  onSelect,
  isDragging,
}: { 
  pkg: TrackedPackage
  onSelect: () => void
  isDragging: boolean
}) {
  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('packageId', pkg.id)
    e.dataTransfer.setData('sourceRack', String(pkg.shelfRow ?? 0))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className={`group bg-white rounded-lg p-2 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-ana-blue/30 transition-all ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <PriorityDot priority={pkg.priority} />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] text-ana-blue truncate">{pkg.trackingNumber}</p>
          <p className="text-[10px] text-gray-500 truncate">{pkg.weight}kg</p>
        </div>
      </div>
    </div>
  )
}

function RackDropZone({
  rackNumber,
  packages,
  isOver,
  onDrop,
  onDragOver,
  onDragLeave,
  onPackageSelect,
  selectedRack,
  onRackSelect,
}: {
  rackNumber: number
  packages: TrackedPackage[]
  isOver: boolean
  onDrop: (e: DragEvent<HTMLDivElement>) => void
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onPackageSelect: (pkg: TrackedPackage) => void
  selectedRack: number | null
  onRackSelect: (rack: number) => void
}) {
  const isSelected = selectedRack === rackNumber
  const hasPackages = packages.length > 0
  const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0)

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => onRackSelect(rackNumber)}
      className={`relative rounded-xl transition-all duration-200 ${
        isOver 
          ? 'bg-ana-blue/10 border-2 border-dashed border-ana-blue scale-[1.02]' 
          : isSelected
            ? 'bg-ana-sky/30 border-2 border-ana-blue'
            : hasPackages
              ? 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 hover:border-ana-blue/50'
              : 'bg-gray-50 border border-dashed border-gray-300'
      }`}
    >
      <div className={`px-3 py-2 border-b ${isSelected ? 'border-ana-blue/30' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
              hasPackages ? 'bg-ana-blue text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {rackNumber}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">Rack {rackNumber}</p>
              <p className="text-[10px] text-gray-400">{packages.length} items • {totalWeight}kg</p>
            </div>
          </div>
          {hasPackages && (
            <div className="flex -space-x-1">
              {packages.slice(0, 3).map((pkg, i) => (
                <div key={pkg.id} className="w-4 h-4 rounded-full bg-ana-blue/80 border border-white" style={{ zIndex: 3 - i }} />
              ))}
              {packages.length > 3 && (
                <div className="w-4 h-4 rounded-full bg-gray-300 border border-white flex items-center justify-center text-[8px] font-bold text-gray-600">
                  +{packages.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-2 min-h-[80px]">
        {packages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
            {isOver ? 'Drop here' : 'Empty rack'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {packages.slice(0, 6).map((pkg) => (
              <DraggablePackage
                key={pkg.id}
                pkg={pkg}
                onSelect={() => onPackageSelect(pkg)}
                isDragging={false}
              />
            ))}
            {packages.length > 6 && (
              <div className="col-span-2 text-center text-[10px] text-gray-400 py-1">
                +{packages.length - 6} more packages
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PackageDetail({ pkg, onClose }: { pkg: TrackedPackage; onClose: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">AWB Number</p>
          <p className="font-mono text-sm font-bold text-ana-blue">{pkg.trackingNumber}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Description</p>
        <p className="text-sm font-medium">{pkg.description}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-[10px] text-gray-400">Weight</p>
          <p className="text-sm font-bold">{pkg.weight} kg</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-[10px] text-gray-400">Priority</p>
          <div className="flex items-center gap-1">
            <PriorityDot priority={pkg.priority} />
            <span className="text-sm font-medium capitalize">{pkg.priority}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-400">Origin</p>
          <p className="font-medium truncate">{pkg.origin}</p>
        </div>
        <div>
          <p className="text-gray-400">Destination</p>
          <p className="font-medium truncate">{pkg.destination}</p>
        </div>
      </div>
      
      <div className="bg-purple-50 rounded-lg p-2">
        <p className="text-[10px] text-purple-400">Current Location</p>
        <p className="text-sm font-bold text-purple-700">Rack {(pkg.shelfRow ?? 0) + 1}</p>
      </div>
    </div>
  )
}

export function WarehouseLayoutPanel({ data, onClose }: { data: Warehouse; onClose: () => void }) {
  const { getShelvesByWarehouse, movePackageToRack } = useWarehouseInventory()
  const [dragOverRack, setDragOverRack] = useState<number | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<TrackedPackage | null>(null)
  const [selectedRack, setSelectedRack] = useState<number | null>(null)
  const [moveMessage, setMoveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const shelves = getShelvesByWarehouse(data.id)
  
  const rackData = Array.from({ length: 6 }, (_, i) => {
    const rackShelves = shelves.filter(s => s.row === i)
    const packages = rackShelves.flatMap(s => s.packages)
    return { rackNumber: i + 1, packages }
  })
  
  const totalPackages = rackData.reduce((sum, rack) => sum + rack.packages.length, 0)
  const totalWeight = rackData.reduce((sum, rack) => 
    sum + rack.packages.reduce((w, pkg) => w + pkg.weight, 0), 0
  )

  const handleDragOver = (e: DragEvent<HTMLDivElement>, rackNumber: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverRack(rackNumber)
  }

  const handleDragLeave = () => {
    setDragOverRack(null)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetRack: number) => {
    e.preventDefault()
    const packageId = e.dataTransfer.getData('packageId')
    const sourceRack = parseInt(e.dataTransfer.getData('sourceRack'))
    
    if (sourceRack + 1 === targetRack) {
      setDragOverRack(null)
      return
    }
    
    const success = movePackageToRack(packageId, data.id, targetRack - 1)
    
    if (success) {
      setMoveMessage({ type: 'success', text: `Package moved to Rack ${targetRack}` })
      if (selectedPackage?.id === packageId) {
        setSelectedPackage(null)
      }
    } else {
      setMoveMessage({ type: 'error', text: 'Failed to move package - rack may be full' })
    }
    
    setTimeout(() => setMoveMessage(null), 2000)
    
    setDragOverRack(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative m-auto w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-ana-blue to-ana-light-blue px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">{data.name}</h2>
              <p className="text-white/70 text-sm">{data.code} • {data.location}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-400">Total Packages</p>
              <p className="text-lg font-bold text-gray-800">{totalPackages}</p>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <p className="text-xs text-gray-400">Total Weight</p>
              <p className="text-lg font-bold text-gray-800">{totalWeight.toLocaleString()} kg</p>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <p className="text-xs text-gray-400">Capacity</p>
              <p className="text-lg font-bold text-ana-blue">
                {Math.round((totalWeight / data.capacity.total) * 100)}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Drag packages to move between racks
          </div>
        </div>
        
        {moveMessage && (
          <div className={`px-6 py-2 text-sm font-medium flex items-center gap-2 ${
            moveMessage.type === 'success' 
              ? 'bg-green-50 text-green-700 border-b border-green-100' 
              : 'bg-red-50 text-red-700 border-b border-red-100'
          }`}>
            {moveMessage.type === 'success' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {moveMessage.text}
          </div>
        )}
        
        <div className="flex-1 overflow-auto p-6">
          <div className="flex gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded animate-pulse" />
                  <span className="text-xs font-medium text-gray-600">Front Door (Trucks)</span>
                </div>
                <div className="flex-1 mx-4 border-t border-dashed border-gray-300" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">Back Door (ULD)</span>
                  <div className="w-3 h-3 bg-blue-500 rounded animate-pulse" />
                </div>
              </div>
              
              <div className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-2xl p-4 border border-gray-200">
                <div className="text-center mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">
                    Main Aisle
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 flex items-center justify-center">
                      <span className="text-[10px] text-gray-400 -rotate-90 whitespace-nowrap">West Side</span>
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      {rackData.slice(0, 3).map((rack) => (
                        <RackDropZone
                          key={rack.rackNumber}
                          rackNumber={rack.rackNumber}
                          packages={rack.packages}
                          isOver={dragOverRack === rack.rackNumber}
                          onDrop={(e) => handleDrop(e, rack.rackNumber)}
                          onDragOver={(e) => handleDragOver(e, rack.rackNumber)}
                          onDragLeave={handleDragLeave}
                          onPackageSelect={setSelectedPackage}
                          selectedRack={selectedRack}
                          onRackSelect={setSelectedRack}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-8" />
                    <div className="flex-1 flex items-center">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                      <div className="px-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="text-[10px] text-gray-400">Forklift Path</span>
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 flex items-center justify-center">
                      <span className="text-[10px] text-gray-400 -rotate-90 whitespace-nowrap">East Side</span>
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      {rackData.slice(3, 6).map((rack) => (
                        <RackDropZone
                          key={rack.rackNumber}
                          rackNumber={rack.rackNumber}
                          packages={rack.packages}
                          isOver={dragOverRack === rack.rackNumber}
                          onDrop={(e) => handleDrop(e, rack.rackNumber)}
                          onDragOver={(e) => handleDragOver(e, rack.rackNumber)}
                          onDragLeave={handleDragLeave}
                          onPackageSelect={setSelectedPackage}
                          selectedRack={selectedRack}
                          onRackSelect={setSelectedRack}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-ana-blue" />
                  <span>Has packages</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gray-200 border border-dashed border-gray-300" />
                  <span>Empty rack</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Priority</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Express</span>
                </div>
              </div>
            </div>
            
            {selectedPackage && (
              <div className="w-64 shrink-0">
                <PackageDetail pkg={selectedPackage} onClose={() => setSelectedPackage(null)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
