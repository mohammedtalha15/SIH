'use client'

/**
 * Navigation Bar Component - Rachata Design Theme
 * Professional glass-morphism navigation matching the screenshot
 */

import { useState, useEffect } from 'react'
import { Building2, Home, Map, Plane, Package, Settings2, PenTool } from 'lucide-react'
import { useWarehouseContext } from '@/lib/contexts/warehouse-context'
import { CargoTracking } from './CargoTracking'

interface NavigationBarProps {
  currentView?: string
  onViewChange?: (view: string) => void
}

export function NavigationBar({ currentView, onViewChange }: NavigationBarProps) {
  const { viewMode } = useWarehouseContext()
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [showCargoTracking, setShowCargoTracking] = useState(false)
  
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      
      // Format date: "Thu, Jan 15, 2026"
      const dateStr = now.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      
      // Format time: "09:47:16"
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      
      setCurrentDate(dateStr)
      setCurrentTime(timeStr)
    }
    
    updateDateTime()
    const interval = setInterval(updateDateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Use currentView from props if provided, otherwise use viewMode from context
  const activeView = currentView || viewMode.viewMode
  
  const handleViewClick = (view: string) => {
    if (onViewChange) {
      onViewChange(view)
    } else {
      // Switch between airport, exterior, interior, and layout modes
      if (view === 'airport') {
        viewMode.setAirport()
      } else if (view === 'warehouse') {
        viewMode.setExterior()
      } else if (view === 'interior') {
        viewMode.setInterior('building8') // Default to building 8 interior
      } else if (view === 'layout') {
        viewMode.setLayout()
      }
    }
  }
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Main Navigation Bar - Dark Theme */}
      <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-xl border-b border-gray-700">
        <div className="max-w-[1920px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* View Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleViewClick('airport')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeView === 'airport'
                    ? 'bg-belli-orange-500 text-white shadow-lg shadow-belli-orange-500/50'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <Plane className="w-4 h-4" />
                <span>Airport</span>
              </button>
              
              <button
                onClick={() => handleViewClick('warehouse')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeView === 'exterior'
                    ? 'bg-belli-orange-500 text-white shadow-lg shadow-belli-orange-500/50'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <Map className="w-4 h-4" />
                <span>Warehouse Exterior</span>
              </button>
              
              <button
                onClick={() => handleViewClick('interior')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeView === 'interior'
                    ? 'bg-belli-orange-500 text-white shadow-lg shadow-belli-orange-500/50'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Warehouse Interior</span>
              </button>
              
              {/* Layout Editor Button */}
              <button
                onClick={() => handleViewClick('layout')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeView === 'layout'
                    ? 'bg-belli-orange-500 text-white shadow-lg shadow-belli-orange-500/50'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span>Layout</span>
              </button>
              
              {/* Cargo Tracking Button */}
              <button
                onClick={() => setShowCargoTracking(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all bg-gradient-to-r from-belli-orange-600 to-belli-red-500 text-white shadow-lg shadow-belli-orange-500/50 hover:shadow-xl hover:shadow-belli-orange-500/70"
              >
                <Package className="w-4 h-4" />
                <span>Cargo Tracking</span>
              </button>
            </div>
            
            {/* Live Status Badge with Date/Time - Dark Theme */}
            <div className="flex items-center gap-3">
              {/* Date and Time */}
              <div className="text-right">
                <div className="text-xs text-gray-400 leading-none mb-1">{currentDate}</div>
                <div className="text-sm font-semibold text-belli-orange-400 font-mono leading-none">{currentTime}</div>
              </div>
              
              {/* Divider */}
              <div className="w-px h-10 bg-gray-700" />
              
              {/* Live Status */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-800 rounded-lg border border-gray-700">
                <div className="relative">
                  <div className="w-2 h-2 bg-belli-orange-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-belli-orange-500 rounded-full animate-ping"></div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 leading-none mb-0.5">Live Status</div>
                  <div className="text-sm font-semibold text-belli-orange-400 leading-none">Operational</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Cargo Tracking Modal */}
      {showCargoTracking && (
        <CargoTracking onClose={() => setShowCargoTracking(false)} />
      )}
    </div>
  )
}
