'use client'

/**
 * Quick Access Buttons
 * Provides shortcuts to view lists from any page without interacting with 3D scene
 * Available on ALL views - airport, warehouse, and interior
 */

import { Plane, Truck, Package } from 'lucide-react'
import { useCargoFlightStore } from '@/lib/stores/useCargoFlightStore'
import { useTruckStore } from '@/lib/stores/truckStore'
import { useUnifiedCargoStore } from '@/lib/stores/unifiedCargoStore'
import { usePanelStore } from '@/lib/stores/panelStore'

interface QuickAccessButtonsProps {
  // No view prop needed - show all buttons on all pages
}

export function QuickAccessButtons({}: QuickAccessButtonsProps) {
  const { flights, selectFlight } = useCargoFlightStore()
  const { trucks, selectTruck } = useTruckStore()
  const { trolleys, selectTrolley } = useUnifiedCargoStore()
  const { setPanel, isOpen, closePanel } = usePanelStore()

  // Get counts
  const arrivalCount = flights.filter(
    f => f.status === 'INBOUND' || f.status === 'ARRIVED' || f.status === 'UNLOADING'
  ).length
  const departureCount = flights.filter(
    f => f.status === 'LOADING' || (f.status !== 'INBOUND' && f.status !== 'ARRIVED' && f.status !== 'UNLOADING' && f.status !== 'DEPARTED')
  ).length
  const truckCount = trucks.filter(t => t.status !== 'gone').length
  const trolleyCount = trolleys.filter(t => t.status !== 'gone').length

  const handleTogglePanel = (panelType: 'flight-list-arrivals' | 'flight-list-departures' | 'truck-list' | 'uld-list') => {
    // Close all individual detail panels when opening a list panel
    selectFlight(null)
    selectTruck(null)
    selectTrolley(null)
    
    if (isOpen(panelType)) {
      closePanel()
    } else {
      setPanel(panelType)
    }
  }

  // Show ALL buttons on ALL pages
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-full shadow-2xl border border-gray-700 px-3 py-2 flex items-center gap-2">
        {/* Arrivals */}
        <button
          onClick={() => handleTogglePanel('flight-list-arrivals')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
            isOpen('flight-list-arrivals')
              ? 'bg-belli-orange-600 text-white shadow-lg shadow-belli-orange-500/50'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
          title="View Arrival Flights"
        >
          <Plane className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Arrivals</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
            isOpen('flight-list-arrivals') ? 'bg-white/20' : 'bg-belli-orange-500/20 text-belli-orange-400'
          }`}>
            {arrivalCount}
          </span>
        </button>

        <div className="w-px h-5 bg-gray-700" />

        {/* Departures */}
        <button
          onClick={() => handleTogglePanel('flight-list-departures')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
            isOpen('flight-list-departures')
              ? 'bg-belli-orange-600 text-white shadow-lg shadow-belli-orange-500/50'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
          title="View Departure Flights"
        >
          <Plane className="w-3.5 h-3.5 rotate-45" />
          <span className="text-xs font-semibold">Departures</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
            isOpen('flight-list-departures') ? 'bg-white/20' : 'bg-belli-orange-500/20 text-belli-orange-400'
          }`}>
            {departureCount}
          </span>
        </button>

        <div className="w-px h-5 bg-gray-700" />

        {/* Trucks */}
        <button
          onClick={() => handleTogglePanel('truck-list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
            isOpen('truck-list')
              ? 'bg-gray-700 text-white shadow-lg'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
          title="View Active Trucks"
        >
          <Truck className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Trucks</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
            isOpen('truck-list') ? 'bg-white/20' : 'bg-gray-200 text-gray-800'
          }`}>
            {truckCount}
          </span>
        </button>

        <div className="w-px h-5 bg-gray-700" />

        {/* ULD Trolleys */}
        <button
          onClick={() => handleTogglePanel('uld-list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
            isOpen('uld-list')
              ? 'bg-belli-orange-600 text-white shadow-lg shadow-belli-orange-500/50'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
          title="View ULDs"
        >
          <Package className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">ULDs</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
            isOpen('uld-list') ? 'bg-white/20' : 'bg-belli-orange-500/20 text-belli-orange-400'
          }`}>
            {trolleyCount}
          </span>
        </button>
      </div>
    </div>
  )
}
