'use client'

import { useState, useMemo } from 'react'
import { useWarehouseInventory, TrackedPackage, PackageStatus } from '@/lib/warehouse-inventory'

type FilterStage = 'all' | 'on-truck' | 'in-warehouse' | 'on-uld'

const stageLabels: Record<FilterStage, string> = {
  'all': 'All Cargo',
  'on-truck': 'On Truck',
  'in-warehouse': 'In Warehouse',
  'on-uld': 'On ULD',
}

const stageColors: Record<PackageStatus, { bg: string; text: string; dot: string }> = {
  'on-truck': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'unloading': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'in-warehouse': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'loading-to-uld': { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  'on-uld': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'delivered': { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
}

function StatusBadge({ status }: { status: PackageStatus }) {
  const colors = stageColors[status] || stageColors['in-warehouse']
  const label = status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  )
}

function PriorityIndicator({ priority }: { priority: string }) {
  if (priority === 'priority' || priority === 'high') {
    return <span className="text-red-500 text-xs font-bold">●</span>
  }
  if (priority === 'express') {
    return <span className="text-amber-500 text-xs font-bold">●</span>
  }
  return null
}

function PackageRow({ pkg }: { pkg: TrackedPackage }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <PriorityIndicator priority={pkg.priority} />
          <span className="font-mono text-sm font-semibold text-ana-blue">
            {pkg.trackingNumber}
          </span>
        </div>
        <StatusBadge status={pkg.status} />
      </div>
      
      <p className="text-sm text-gray-700 mb-2">{pkg.description}</p>
      
      <div className="flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span>{pkg.weight} kg</span>
          <span>→ {pkg.destination}</span>
        </div>
        {pkg.shelfId && (
          <span className="text-purple-600">
            Rack {(pkg.shelfRow ?? 0) + 1}
          </span>
        )}
        {pkg.uldId && (
          <span className="text-green-600">
            {pkg.uldId}
          </span>
        )}
      </div>
    </div>
  )
}

function StageTab({ 
  stage, 
  count, 
  isActive, 
  onClick 
}: { 
  stage: FilterStage
  count: number
  isActive: boolean
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
        isActive 
          ? 'bg-ana-blue text-white shadow-sm' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {stageLabels[stage]}
      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
        isActive ? 'bg-white/20' : 'bg-gray-200'
      }`}>
        {count}
      </span>
    </button>
  )
}

export function CargoMenu({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean
  onClose: () => void 
}) {
  const { getAllPackages } = useWarehouseInventory()
  const [activeStage, setActiveStage] = useState<FilterStage>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  const allPackages = getAllPackages()
  
  const stageCounts = useMemo(() => {
    const counts: Record<FilterStage, number> = {
      'all': allPackages.length,
      'on-truck': 0,
      'in-warehouse': 0,
      'on-uld': 0,
    }
    
    allPackages.forEach(pkg => {
      if (pkg.status === 'on-truck' || pkg.status === 'unloading') {
        counts['on-truck']++
      } else if (pkg.status === 'in-warehouse') {
        counts['in-warehouse']++
      } else if (pkg.status === 'on-uld' || pkg.status === 'loading-to-uld') {
        counts['on-uld']++
      }
    })
    
    return counts
  }, [allPackages])
  
  const filteredPackages = useMemo(() => {
    let filtered = allPackages
    
    if (activeStage !== 'all') {
      filtered = filtered.filter(pkg => {
        if (activeStage === 'on-truck') {
          return pkg.status === 'on-truck' || pkg.status === 'unloading'
        }
        if (activeStage === 'in-warehouse') {
          return pkg.status === 'in-warehouse'
        }
        if (activeStage === 'on-uld') {
          return pkg.status === 'on-uld' || pkg.status === 'loading-to-uld'
        }
        return true
      })
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(pkg => 
        pkg.trackingNumber.toLowerCase().includes(query) ||
        pkg.description.toLowerCase().includes(query) ||
        pkg.destination.toLowerCase().includes(query)
      )
    }
    
    return filtered.sort((a, b) => {
      const timeA = a.shelvedAt?.getTime() || a.arrivedAt?.getTime() || a.createdAt.getTime()
      const timeB = b.shelvedAt?.getTime() || b.arrivedAt?.getTime() || b.createdAt.getTime()
      return timeB - timeA
    })
  }, [allPackages, activeStage, searchQuery])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative ml-auto w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="bg-ana-blue px-4 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-white font-semibold text-lg">Cargo Tracking</h2>
            <p className="text-white/70 text-sm">{allPackages.length} packages in system</p>
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
        
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search AWB, description, destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ana-blue/20 focus:border-ana-blue"
            />
          </div>
        </div>
        
        <div className="px-4 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto">
          {(['all', 'on-truck', 'in-warehouse', 'on-uld'] as FilterStage[]).map(stage => (
            <StageTab
              key={stage}
              stage={stage}
              count={stageCounts[stage]}
              isActive={activeStage === stage}
              onClick={() => setActiveStage(stage)}
            />
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
          {filteredPackages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No packages found</p>
              <p className="text-gray-400 text-sm mt-1">
                {activeStage === 'all' 
                  ? 'Packages will appear as trucks arrive'
                  : `No packages currently ${stageLabels[activeStage].toLowerCase()}`
                }
              </p>
            </div>
          ) : (
            filteredPackages.map(pkg => (
              <PackageRow key={pkg.id} pkg={pkg} />
            ))
          )}
        </div>
        
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-amber-600">{stageCounts['on-truck']}</p>
              <p className="text-xs text-gray-500">Incoming</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-purple-600">{stageCounts['in-warehouse']}</p>
              <p className="text-xs text-gray-500">Stored</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-green-600">{stageCounts['on-uld']}</p>
              <p className="text-xs text-gray-500">Outgoing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
