import { CargoFlight } from '@/lib/stores/useCargoFlightStore'
import { useUnifiedCargoStore } from '@/lib/stores/unifiedCargoStore'
import { TrendingUp, Warehouse, Package } from 'lucide-react'

interface CargoDetailsPanelProps {
  flight: CargoFlight
  onClose: () => void
}

export function CargoDetailsPanel({ flight, onClose }: CargoDetailsPanelProps) {
  const totalPackages = flight.ulds.reduce((sum, uld) => sum + uld.packages.length, 0)
  const totalWeight = flight.ulds.reduce(
    (sum, uld) => sum + uld.packages.reduce((s, pkg) => s + pkg.weight, 0),
    0
  )

  // Check if this flight has ULD trolleys being prepared
  const { trolleys } = useUnifiedCargoStore()
  const linkedTrolleys = trolleys.filter(t => t.flightNumber === flight.flightNumber && t.status !== 'gone')
  
  const isArrival = flight.status === 'INBOUND' || flight.status === 'ARRIVED' || flight.status === 'UNLOADING'
  const isDeparture = flight.status === 'LOADING'

  return (
    <div className="fixed top-20 right-4 w-96 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-[100] max-h-[80vh] overflow-y-auto border border-gray-200">
      <div className="sticky top-0 bg-gradient-to-r from-belli-orange-600 to-belli-red-500 text-white p-5 rounded-t-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{flight.flightNumber}</h2>
            <p className="text-sm text-orange-100 font-medium mt-1">{flight.aircraft}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-orange-200 transition-colors p-1 hover:bg-white/10 rounded-lg"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
            flight.status === 'ARRIVED' ? 'bg-green-400 text-green-900' :
            flight.status === 'UNLOADING' ? 'bg-yellow-400 text-yellow-900' :
            flight.status === 'LOADING' ? 'bg-orange-400 text-orange-900' :
            'bg-blue-300 text-blue-900'
          }`}>
            {flight.status}
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* Cargo Flow - Interconnected Info */}
        {(isArrival || isDeparture) && (
          <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-belli-orange-600 rounded-lg text-white">
                {isArrival ? <Warehouse className="w-5 h-5" /> : <Package className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                {isArrival ? (
                  <>
                    <h3 className="font-bold text-gray-900">Arrival Cargo Flow</h3>
                    <p className="text-sm text-gray-700 mt-2 font-medium">
                      1️⃣ <span className="text-belli-orange-700 font-bold">Aircraft (Current)</span> → 2️⃣ Warehouse Processing → 3️⃣ Outgoing Trucks → 4️⃣ Customer Distribution
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-belli-orange-700">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="font-bold">Cargo will be unloaded, processed at warehouse, and distributed to customers</span>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      Departure Cargo Flow
                      {linkedTrolleys.length > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">
                          {linkedTrolleys.length} ULD{linkedTrolleys.length > 1 ? 's' : ''} Ready
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-700 mt-2 font-medium">
                      1️⃣ Incoming Trucks → 2️⃣ Warehouse Processing → 3️⃣ ULDs (CHS 7) → 4️⃣ <span className="text-belli-orange-700 font-bold">Aircraft Loading (Current)</span>
                    </p>
                    {linkedTrolleys.length > 0 && (
                      <div className="mt-2 p-2 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-green-700">
                          <Package className="w-3.5 h-3.5" />
                          <span className="font-bold">
                            {linkedTrolleys.length} ULD{linkedTrolleys.length > 1 ? 's are' : ' is'} currently loaded and ready at CHS 7 Build-up area for this flight
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Flight Summary */}
        <div className="mb-5 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Flight Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium">ULDs</span>
              <span className="text-xl font-bold text-gray-900">{flight.ulds.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium">Packages</span>
              <span className="text-xl font-bold text-gray-900">{totalPackages}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium">Total Weight</span>
              <span className="text-xl font-bold text-gray-900">{totalWeight.toFixed(0)} kg</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium">Gate Position</span>
              <span className="text-sm font-bold text-gray-900 font-mono">
                {flight.gatePosition[0].toFixed(0)},{flight.gatePosition[2].toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* ULDs List */}
        <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Unit Load Devices</h3>
        <div className="space-y-3">
          {flight.ulds.map((uld) => (
            <div key={uld.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all bg-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-gray-900">{uld.id}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Type: {uld.type}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  uld.status === 'LOADED' ? 'bg-belli-orange-100 text-belli-orange-800' :
                  uld.status === 'UNLOADING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {uld.status}
                </span>
              </div>

              {/* Packages in this ULD */}
              <div className="mt-3 space-y-2">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Packages ({uld.packages.length}):
                </p>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {uld.packages.map((pkg) => (
                    <div key={pkg.id} className="text-xs bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-gray-900">{pkg.awb}</span>
                        <span className="text-gray-600 font-bold">{pkg.weight} kg</span>
                      </div>
                      <div className="flex justify-between mt-2 text-gray-600">
                        <span className="font-medium">→ {pkg.destination}</span>
                        <span className="text-xs font-mono">
                          {pkg.dimensions.length}×{pkg.dimensions.width}×{pkg.dimensions.height}cm
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
