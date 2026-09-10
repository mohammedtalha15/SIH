'use client'

/**
 * Unified Detail Panel
 * Single panel that shows flight, truck, or ULD details based on what's selected
 */

import { X, Plane, Package, TrendingUp, Warehouse, AlertTriangle, Truck as TruckIcon } from 'lucide-react'
import { useCargoFlightStore } from '@/lib/stores/useCargoFlightStore'
import { useTruckStore } from '@/lib/stores/truckStore'
import { useUnifiedCargoStore } from '@/lib/stores/unifiedCargoStore'

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'inbound':
        return 'bg-belli-orange-500 text-white'
      case 'arrived':
        return 'bg-green-500 text-white'
      case 'unloading':
        return 'bg-yellow-500 text-white'
      case 'loading':
        return 'bg-orange-500 text-white'
      case 'departed':
        return 'bg-gray-500 text-white'
      case 'at_dock':
        return 'bg-belli-orange-500 text-white'
      case 'departing':
        return 'bg-green-500 text-white'
      case 'gone':
        return 'bg-gray-500 text-white'
      case 'ready':
        return 'bg-green-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
      {status.toUpperCase()}
    </span>
  )
}

export function UnifiedDetailPanel() {
  const { selectedFlight, selectFlight } = useCargoFlightStore()
  const { selectedTruck, selectTruck } = useTruckStore()
  const { selectedTrolley, selectTrolley, trolleys } = useUnifiedCargoStore()

  // Determine what to show
  const hasSelection = selectedFlight || selectedTruck || selectedTrolley

  if (!hasSelection) return null

  const handleClose = () => {
    selectFlight(null)
    selectTruck(null)
    selectTrolley(null)
  }

  // FLIGHT DETAILS
  if (selectedFlight) {
    const totalPackages = selectedFlight.ulds.reduce((sum, uld) => sum + uld.packages.length, 0)
    const totalWeight = selectedFlight.ulds.reduce(
      (sum, uld) => sum + uld.packages.reduce((s, pkg) => s + pkg.weight, 0),
      0
    )

    const linkedTrolleys = trolleys.filter(t => t.flightNumber === selectedFlight.flightNumber && t.status !== 'gone')
    
    const isArrival = selectedFlight.status === 'INBOUND' || selectedFlight.status === 'ARRIVED' || selectedFlight.status === 'UNLOADING'

    return (
      <div className="fixed top-20 right-4 w-96 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl z-[110] max-h-[80vh] overflow-y-auto border border-gray-700">
        <div className="sticky top-0 bg-gradient-to-r from-belli-orange-600 to-belli-red-500 text-white p-5 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{selectedFlight.flightNumber}</h2>
              <p className="text-sm text-orange-100 font-medium mt-1">{selectedFlight.aircraft}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-300 transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Status</span>
            <StatusBadge status={selectedFlight.status} />
          </div>

          {/* Times */}
          <div className="bg-gray-800/50 p-4 rounded-lg space-y-2 border border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Arrival Time</span>
              <span className="font-medium text-gray-200">
                {new Date(selectedFlight.arrivalTime).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Departure Time</span>
              <span className="font-medium text-gray-200">
                {new Date(selectedFlight.departureTime).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Cargo Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
              <Package className="w-5 h-5 text-belli-orange-500 mb-2" />
              <p className="text-2xl font-bold text-gray-200">{totalPackages}</p>
              <p className="text-xs text-belli-orange-400">Packages</p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
              <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
              <p className="text-2xl font-bold text-gray-200">{totalWeight.toFixed(0)}</p>
              <p className="text-xs text-green-400">kg Total</p>
            </div>
          </div>

          {/* ULD Connections */}
          {linkedTrolleys.length > 0 && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <h4 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                ULDs (CHS 7)
              </h4>
              <div className="space-y-2">
                {linkedTrolleys.map(trolley => (
                  <div key={trolley.id} className="flex items-center justify-between text-sm bg-gray-900 p-2 rounded border border-gray-700">
                    <span className="font-medium text-gray-300">{trolley.id}</span>
                    <span className="text-xs text-gray-500">{trolley.packages.length} pkgs • {trolley.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ULDs */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 mb-2">Unit Load Devices</h3>
            <div className="space-y-2">
              {selectedFlight.ulds.map((uld) => (
                <div key={uld.id} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-200">{uld.id}</span>
                    <span className="text-xs text-gray-500">{uld.type}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {uld.packages.length} packages • {uld.packages.reduce((sum, pkg) => sum + pkg.weight, 0).toFixed(1)} kg
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // TRUCK DETAILS
  if (selectedTruck) {
    const totalWeight = selectedTruck.cargo.reduce((sum, pkg) => sum + pkg.weight, 0)

    return (
      <div className="fixed top-20 right-4 w-96 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl z-[110] max-h-[80vh] overflow-y-auto border border-gray-700">
        <div className="sticky top-0 bg-gradient-to-r from-belli-orange-600 to-belli-red-500 text-white p-5 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <TruckIcon className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Truck {selectedTruck.id.split('-')[1]}</h2>
                <p className="text-sm text-orange-100 font-medium mt-1">
                  {selectedTruck.type === 'incoming' ? 'Incoming Cargo' : 'Outgoing Cargo'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-300 transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Status</span>
            <StatusBadge status={selectedTruck.status} />
          </div>

          {/* Arrival Time */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Arrival Time</span>
              <span className="font-medium text-gray-200">
                {new Date(selectedTruck.arrivalTime).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Cargo Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
              <Package className="w-5 h-5 text-belli-orange-500 mb-2" />
              <p className="text-2xl font-bold text-gray-200">{selectedTruck.cargo.length}</p>
              <p className="text-xs text-belli-orange-400">Packages</p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
              <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
              <p className="text-2xl font-bold text-gray-200">{totalWeight.toFixed(0)}</p>
              <p className="text-xs text-green-400">kg Total</p>
            </div>
          </div>

          {/* Cargo List */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 mb-2">Cargo Manifest</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedTruck.cargo.map((pkg) => (
                <div key={pkg.id} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-200 text-sm">{pkg.id}</span>
                    <span className="text-xs text-gray-500">{pkg.weight.toFixed(1)} kg</span>
                  </div>
                  <div className="text-xs text-gray-400">{pkg.description}</div>
                  <div className="text-xs text-gray-500 mt-1">→ {pkg.destination}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ULD DETAILS
  if (selectedTrolley) {
    const totalWeight = selectedTrolley.packages.reduce((sum, pkg) => sum + pkg.weight, 0)

    return (
      <div className="fixed top-20 right-4 w-96 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl z-[110] max-h-[80vh] overflow-y-auto border border-gray-700">
        <div className="sticky top-0 bg-gradient-to-r from-belli-orange-600 to-belli-red-500 text-white p-5 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{selectedTrolley.id}</h2>
                <p className="text-sm text-orange-100 font-medium mt-1">{selectedTrolley.type} Container</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-300 transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Status</span>
            <StatusBadge status={selectedTrolley.status} />
          </div>

          {/* Flight Connection */}
          {selectedTrolley.flightNumber && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <h4 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
                <Plane className="w-4 h-4" />
                Assigned Flight
              </h4>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-belli-orange-400">{selectedTrolley.flightNumber}</span>
                <span className="text-xs text-belli-orange-500">Departure</span>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Current Location</span>
              <span className="font-medium text-gray-200">CHS 7</span>
            </div>
          </div>

          {/* Cargo Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
              <Package className="w-5 h-5 text-belli-orange-500 mb-2" />
              <p className="text-2xl font-bold text-gray-200">{selectedTrolley.packages.length}</p>
              <p className="text-xs text-belli-orange-400">Packages</p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
              <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
              <p className="text-2xl font-bold text-gray-200">{totalWeight.toFixed(0)}</p>
              <p className="text-xs text-green-400">kg Total</p>
            </div>
          </div>

          {/* Cargo Manifest */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 mb-2">Cargo Manifest</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedTrolley.packages.map((pkg) => (
                <div key={pkg.id} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-200 text-sm">{pkg.id}</span>
                    <span className="text-xs text-gray-500">{pkg.weight.toFixed(1)} kg</span>
                  </div>
                  <div className="text-xs text-gray-400">{pkg.description}</div>
                  <div className="text-xs text-gray-500 mt-1">→ {pkg.destination}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
