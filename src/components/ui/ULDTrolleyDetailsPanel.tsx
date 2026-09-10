import { ULDTrolley } from '@/lib/stores/unifiedCargoStore'
import { useCargoFlightStore } from '@/lib/stores/useCargoFlightStore'
import { Plane, Package, TrendingUp } from 'lucide-react'

interface ULDTrolleyDetailsPanelProps {
  trolley: ULDTrolley
  onClose: () => void
}

export function ULDTrolleyDetailsPanel({ trolley, onClose }: ULDTrolleyDetailsPanelProps) {
  const totalWeight = trolley.packages.reduce((sum, pkg) => sum + pkg.weight, 0)
  const totalPieces = trolley.packages.reduce((sum, pkg) => sum + pkg.pieces, 0)
  
  const timeSinceArrival = Math.floor((Date.now() - trolley.arrivalTime.getTime()) / 1000)
  const minutes = Math.floor(timeSinceArrival / 60)
  const seconds = timeSinceArrival % 60

  // Get the linked flight information
  const { flights } = useCargoFlightStore()
  const linkedFlight = flights.find(f => f.flightNumber === trolley.flightNumber)

  return (
    <div className="fixed top-20 right-4 w-96 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-[100] max-h-[80vh] overflow-y-auto border border-gray-200">
      <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-5 rounded-t-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">📦 ULD</h2>
            <p className="text-sm text-indigo-100 font-medium mt-1">{trolley.type} - {trolley.id.split('-')[1]}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-indigo-200 transition-colors p-1 hover:bg-white/10 rounded-lg"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {trolley.flightNumber && (
            <span className="px-3 py-1 rounded-full text-xs font-bold shadow-sm bg-white text-indigo-700">
              ✈️ {trolley.flightNumber}
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
            trolley.status === 'loading' ? 'bg-yellow-400 text-yellow-900' :
            trolley.status === 'loaded' ? 'bg-green-400 text-green-900' :
            trolley.status === 'unloading' ? 'bg-orange-400 text-orange-900' :
            'bg-gray-400 text-gray-900'
          }`}>
            {trolley.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* Flight Connection - Interconnected Info */}
        {linkedFlight && (
          <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-belli-orange-600 rounded-lg text-white">
                <Plane className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  Loading for Flight {linkedFlight.flightNumber}
                  <span className="text-xs px-2 py-0.5 bg-belli-orange-100 text-belli-orange-700 rounded-full font-bold">
                    {linkedFlight.status}
                  </span>
                </h3>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-bold">Aircraft:</span> {linkedFlight.aircraft}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Departure:</span> {new Date(linkedFlight.departureTime).toLocaleString()}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-belli-orange-700">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="font-bold">This ULD's cargo will be loaded onto this flight</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location Info */}
        <div className="mb-5 p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg">
            <p className="text-sm text-gray-700 font-medium">
              <span className="font-bold">📍 Current Location: </span>
              CHS 7 Build-up Area
            </p>
        </div>

        {/* ULD Summary */}
        <div className="mb-5 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">ULD Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium">ULD Type</span>
              <span className="text-xl font-bold text-gray-900">{trolley.type}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium">Packages</span>
              <span className="text-xl font-bold text-gray-900">{trolley.packages.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium">Total Weight</span>
              <span className="text-xl font-bold text-gray-900">{totalWeight.toFixed(0)} kg</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium">Total Pieces</span>
              <span className="text-xl font-bold text-gray-900">{totalPieces}</span>
            </div>
            <div className="flex flex-col col-span-2">
              <span className="text-gray-500 text-xs font-medium">Time at CHS</span>
              <span className="text-sm font-bold text-gray-900 font-mono">{minutes}m {seconds}s</span>
            </div>
          </div>
        </div>

        {/* Cargo List */}
        <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Cargo Manifest</h3>
        <div className="space-y-2">
          {trolley.packages.map((pkg) => (
            <div 
              key={pkg.id} 
              className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all bg-white"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{pkg.description}</p>
                  <p className="text-xs text-gray-500 font-mono font-bold mt-1">AWB: {pkg.awb}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{pkg.weight} kg</p>
                  <p className="text-xs text-gray-600 font-bold">{pkg.pieces} pcs</p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-2 pt-2 border-t border-gray-100">
                <span>
                  <span className="font-bold">From:</span> {pkg.shipper}
                </span>
                <span>
                  <span className="font-bold">To:</span> {pkg.destination}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
          <p className="text-xs text-gray-700 font-medium">
            <span className="font-bold">Note:</span> {
              trolley.status === 'loading' ? 'ULD is being loaded with cargo' :
              trolley.status === 'loaded' ? `Ready for transport to Flight ${trolley.flightNumber}` :
              trolley.status === 'unloading' ? 'Cargo is being transferred to aircraft' :
              'ULD is empty and will be removed'
            }.
          </p>
        </div>
      </div>
    </div>
  )
}
