'use client'

/**
 * Data Stats Overlay
 * Shows key operational metrics and insights at a glance
 */

import { Package, Plane, TrendingUp, TrendingDown, Truck, Clock, AlertTriangle } from 'lucide-react'
import { useCargoFlightStore } from '@/lib/stores/useCargoFlightStore'
import { useTruckStore } from '@/lib/stores/truckStore'
import { useUnifiedCargoStore } from '@/lib/stores/unifiedCargoStore'
import { useCargoStore } from '@/lib/stores/cargo-store'

export function DataStatsOverlay() {
  const { flights } = useCargoFlightStore()
  const { trucks } = useTruckStore()
  const { trolleys } = useUnifiedCargoStore()
  const { packages, getStats } = useCargoStore()
  
  const stats = getStats()
  
  // Calculate real-time metrics
  const activeFlights = flights.filter(f => f.status !== 'DEPARTED').length
  const arrivingFlights = flights.filter(f => f.status === 'INBOUND' || f.status === 'ARRIVED').length
  const departingFlights = flights.filter(f => f.status === 'LOADING').length
  const activeTrucks = trucks.filter(t => t.status !== 'gone').length
  const activeULDs = trolleys.filter(t => t.status !== 'gone').length
  
  // Calculate total cargo weight across all active operations
  const totalCargoWeight = Array.from(packages.values()).reduce((sum, pkg) => sum + pkg.weight, 0)
  
  // Calculate packages in transit (not yet delivered)
  const packagesInTransit = Array.from(packages.values()).filter(
    pkg => pkg.status !== 'delivered' && pkg.status !== 'departed' && pkg.status !== 'in-warehouse'
  ).length

  return (
    <div className="fixed top-1/2 left-4 -translate-y-1/2 z-40 pointer-events-none">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-700 p-4 pointer-events-auto w-80">
        <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-belli-orange-500" />
          Live Operations Dashboard
        </h3>
        
        <div className="space-y-2">
          {/* Active Flights */}
          <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-300">Active Flights</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-200">{activeFlights}</span>
              <span className="text-xs text-gray-400">({arrivingFlights}↓ {departingFlights}↑)</span>
            </div>
          </div>

          {/* Active Trucks */}
          <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-300">Active Trucks</span>
            </div>
            <span className="text-sm font-bold text-gray-200">{activeTrucks}</span>
          </div>

          {/* Active ULDs */}
          <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-300">Active ULDs</span>
            </div>
            <span className="text-sm font-bold text-gray-200">{activeULDs}</span>
          </div>

          {/* Total Packages */}
          <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-300">Total Packages</span>
            </div>
            <span className="text-sm font-bold text-gray-200">{stats.totalPackages}</span>
          </div>

          {/* Packages In Transit */}
          <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-300">In Transit</span>
            </div>
            <span className="text-sm font-bold text-gray-200">{packagesInTransit}</span>
          </div>

          {/* Total Cargo Weight */}
          <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-300">Total Weight</span>
            </div>
            <span className="text-sm font-bold text-gray-200">{totalCargoWeight.toFixed(0)} kg</span>
          </div>

          {/* Warehouse Capacity */}
          <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-300">In Warehouse</span>
            </div>
            <span className="text-sm font-bold text-gray-200">{stats.inWarehouse}</span>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-belli-orange-500 rounded-full animate-pulse"></div>
            <span className="font-medium">System Operational</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {stats.inboundToday} inbound • {stats.outboundToday} outbound today
          </div>
        </div>
      </div>
    </div>
  )
}
