'use client'

import { useEffect, useState } from 'react'
import { useCargoStore } from '@/lib/stores/cargo-store'
import { Package, CargoStatus } from '@/lib/types/cargo-types'
import { X, Search, Filter, TrendingUp, TrendingDown, Package as PackageIcon, Warehouse, Truck, Plane } from 'lucide-react'

/**
 * Cargo Tracking Dashboard
 * Real-time tracking of all cargo packages with AWB numbers
 */

interface CargoTrackingProps {
  onClose: () => void
}

const STATUS_CONFIG: Record<CargoStatus, { label: string; color: string }> = {
  'arriving': { label: 'Arriving', color: 'bg-belli-orange-500' },
  'unloading-plane': { label: 'Unloading', color: 'bg-belli-orange-400' },
  'customs-import': { label: 'Import Customs', color: 'bg-belli-orange-600' },
  'in-warehouse': { label: 'In Warehouse', color: 'bg-belli-orange-500' },
  'customs-export': { label: 'Export Customs', color: 'bg-belli-orange-600' },
  'loading-truck': { label: 'Loading Truck', color: 'bg-belli-orange-400' },
  'in-transit-truck': { label: 'In Transit', color: 'bg-belli-orange-500' },
  'delivered': { label: 'Delivered', color: 'bg-gray-600' },
  'loading-plane': { label: 'Loading Plane', color: 'bg-belli-orange-400' },
  'departed': { label: 'Departed', color: 'bg-gray-500' },
}

const PRIORITY_COLORS = {
  urgent: 'text-red-600 font-bold',
  high: 'text-orange-600 font-semibold',
  normal: 'text-gray-700',
  low: 'text-gray-500',
}

type ProcessStep = 'all' | 'arriving' | 'customs' | 'warehouse' | 'transit' | 'completed'

export function CargoTracking({ onClose }: CargoTrackingProps) {
  const { packages, getStats, isSimulating, startSimulation } = useCargoStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [processStep, setProcessStep] = useState<ProcessStep>('all')
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  
  const stats = getStats()
  const packageList = Array.from(packages.values())
  
  // Start simulation on mount
  useEffect(() => {
    if (!isSimulating) {
      startSimulation()
    }
  }, [isSimulating, startSimulation])
  
  // Filter packages by process step
  const filteredPackages = packageList.filter(pkg => {
    const matchesSearch = searchTerm === '' || 
      pkg.awb.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.shipper.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.consignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.destination.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesStep = true
    if (processStep === 'arriving') {
      matchesStep = pkg.status === 'arriving' || pkg.status === 'unloading-plane'
    } else if (processStep === 'customs') {
      matchesStep = pkg.status === 'customs-import' || pkg.status === 'customs-export'
    } else if (processStep === 'warehouse') {
      matchesStep = pkg.status === 'in-warehouse'
    } else if (processStep === 'transit') {
      matchesStep = pkg.status === 'loading-truck' || pkg.status === 'in-transit-truck' || pkg.status === 'loading-plane'
    } else if (processStep === 'completed') {
      matchesStep = pkg.status === 'delivered' || pkg.status === 'departed'
    }
    
    return matchesSearch && matchesStep
  })
  
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden border border-gray-700">
        {/* Header - Compact */}
        <div className="bg-gradient-to-r from-belli-orange-600 to-belli-red-500 text-white p-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Cargo Tracking System</h2>
            <p className="text-xs text-orange-100">Real-time AWB tracking</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Stats Bar - Compact */}
        <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
          <StatCard
            icon={<PackageIcon className="w-4 h-4 text-belli-orange-600" />}
            label="Total"
            value={stats.totalPackages}
          />
          <StatCard
            icon={<TrendingDown className="w-4 h-4 text-belli-orange-600" />}
            label="Inbound"
            value={stats.inboundToday}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4 text-belli-orange-600" />}
            label="Outbound"
            value={stats.outboundToday}
          />
          <StatCard
            icon={<Warehouse className="w-4 h-4 text-belli-orange-600" />}
            label="Warehouse"
            value={stats.inWarehouse}
          />
        </div>
        
        {/* Process Step Tabs - One Line Compact */}
        <div className="px-3 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3 h-3 text-gray-600" />
            <StageButton
              stage="All"
              count={packageList.length}
              isActive={processStep === 'all'}
              onClick={() => setProcessStep('all')}
            />
            <StageButton
              stage="Arriving"
              count={packageList.filter(p => p.status === 'arriving' || p.status === 'unloading-plane').length}
              isActive={processStep === 'arriving'}
              onClick={() => setProcessStep('arriving')}
            />
            <StageButton
              stage="Customs"
              count={packageList.filter(p => p.status === 'customs-import' || p.status === 'customs-export').length}
              isActive={processStep === 'customs'}
              onClick={() => setProcessStep('customs')}
            />
            <StageButton
              stage="Warehouse"
              count={packageList.filter(p => p.status === 'in-warehouse').length}
              isActive={processStep === 'warehouse'}
              onClick={() => setProcessStep('warehouse')}
            />
            <StageButton
              stage="Transit"
              count={packageList.filter(p => p.status === 'loading-truck' || p.status === 'in-transit-truck' || p.status === 'loading-plane').length}
              isActive={processStep === 'transit'}
              onClick={() => setProcessStep('transit')}
            />
            <StageButton
              stage="Completed"
              count={packageList.filter(p => p.status === 'delivered' || p.status === 'departed').length}
              isActive={processStep === 'completed'}
              onClick={() => setProcessStep('completed')}
            />
          </div>
        </div>
        
        {/* Search Filter - Compact */}
        <div className="px-3 py-2 border-b border-gray-700 bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by AWB, shipper, consignee, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-belli-orange-500 focus:border-transparent"
              />
            </div>
            <div className="text-xs text-gray-400 whitespace-nowrap">
              <span className="font-semibold text-belli-orange-400">{filteredPackages.length}</span> packages
            </div>
          </div>
        </div>
        
        {/* Package List */}
        <div className="flex-1 overflow-auto bg-gray-900">
          <table className="w-full">
            <thead className="bg-gray-800 sticky top-0 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">AWB</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Priority</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Route</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Weight</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Location</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredPackages.map((pkg) => (
                <tr
                  key={pkg.awb}
                  onClick={() => setSelectedPackage(pkg)}
                  className="hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-belli-orange-400">{pkg.awb}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={pkg.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm uppercase text-xs ${PRIORITY_COLORS[pkg.priority]}`}>
                      {pkg.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 capitalize">{pkg.type}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-300">
                    {pkg.origin} → {pkg.destination}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{pkg.weight} kg</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{pkg.currentLocation}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(pkg.updatedAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPackages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <PackageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No packages found matching your search</p>
            </div>
          )}
        </div>
        
        {/* Package Detail Modal */}
        {selectedPackage && (
          <PackageDetailModal
            package={selectedPackage}
            onClose={() => setSelectedPackage(null)}
          />
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-2 shadow-sm border border-gray-700">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-gray-700">
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-lg font-bold text-gray-200">{value}</p>
        </div>
      </div>
    </div>
  )
}

function StageCard({ 
  stage, 
  count, 
  isActive, 
  onClick 
}: { 
  stage: string; 
  count: number; 
  isActive?: boolean; 
  onClick?: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
        isActive ? 'bg-belli-orange-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'
      } border border-gray-200`}
    >
      <span className="text-xs font-semibold">{stage}</span>
      <p className={`text-2xl font-bold ${isActive ? 'text-white' : 'text-gray-900'}`}>
        {count}
      </p>
      <p className={`text-xs ${isActive ? 'text-orange-100' : 'text-gray-500'}`}>
        packages
      </p>
    </button>
  )
}

function StageButton({ 
  stage, 
  count, 
  isActive, 
  onClick 
}: { 
  stage: string; 
  count: number; 
  isActive?: boolean; 
  onClick?: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
        isActive ? 'bg-belli-orange-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      } border border-gray-700`}
    >
      {stage} ({count})
    </button>
  )
}

function StatusBadge({ status }: { status: CargoStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-xs font-medium ${config.color}`}>
      <span>{config.label}</span>
    </span>
  )
}

function PackageDetailModal({ package: pkg, onClose }: { package: Package; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto border border-gray-700" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-belli-orange-600 to-belli-red-500 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-1">Package Details</h3>
              <p className="text-xl font-mono">{pkg.awb}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4">
            <StatusBadge status={pkg.status} />
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6 bg-gray-900">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Type" value={pkg.type} />
            <InfoField label="Priority" value={pkg.priority.toUpperCase()} />
            <InfoField label="Weight" value={`${pkg.weight} kg`} />
            <InfoField label="Volume" value={`${pkg.volume} m³`} />
            <InfoField label="Pieces" value={pkg.pieces.toString()} />
            <InfoField label="Description" value={pkg.description} />
          </div>
          
          {/* Route */}
          <div>
            <h4 className="font-semibold text-gray-200 mb-3">Route Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Origin" value={pkg.origin} />
              <InfoField label="Destination" value={pkg.destination} />
              <InfoField label="Shipper" value={pkg.shipper} />
              <InfoField label="Consignee" value={pkg.consignee} />
            </div>
          </div>
          
          {/* Flight Info */}
          {pkg.flightInfo && (
            <div>
              <h4 className="font-semibold text-gray-200 mb-3">Flight Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Flight Number" value={pkg.flightInfo.flightNumber} />
                <InfoField label="Scheduled" value={new Date(pkg.flightInfo.scheduledTime).toLocaleString()} />
              </div>
            </div>
          )}
          
          {/* Timeline */}
          <div>
            <h4 className="font-semibold text-gray-200 mb-3">Timeline</h4>
            <div className="space-y-3">
              {pkg.timeline.map((event, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-24 text-sm text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="flex-1 bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={event.status} />
                    </div>
                    <p className="text-sm text-gray-400">{event.location}</p>
                    {event.notes && <p className="text-sm text-gray-500 mt-1">{event.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-200">{value}</p>
    </div>
  )
}
