import { SimulatedTruck } from '@/lib/stores/truckStore'
import { TrendingUp, Warehouse, Plane } from 'lucide-react'

interface TruckDetailsPanelProps {
  truck: SimulatedTruck
  onClose: () => void
}

export function TruckDetailsPanel({ truck, onClose }: TruckDetailsPanelProps) {
  const totalWeight = truck.cargo.reduce((sum, item) => sum + item.weight, 0)
  const totalPieces = truck.cargo.reduce((sum, item) => sum + item.pieces, 0)
  
  const timeSinceArrival = Math.floor((Date.now() - truck.arrivalTime.getTime()) / 1000)
  const minutes = Math.floor(timeSinceArrival / 60)
  const seconds = timeSinceArrival % 60

  const getTruckTypeLabel = () => {
    if (truck.type === 'incoming') {
      return {
        label: 'Incoming',
        description: 'Freight Forwarder → Warehouse → Loading to Aircraft',
        icon: '📦➡️🏢',
        color: 'bg-belli-orange-100 text-belli-orange-800',
      }
    } else {
      return {
        label: 'Outgoing',
        description: 'Aircraft → Warehouse → Distribution to Customers',
        icon: '✈️➡️🚚',
        color: 'bg-purple-100 text-purple-800',
      }
    }
  }

  const typeInfo = getTruckTypeLabel()

  return (
    <div className="fixed top-20 right-4 w-96 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-[100] max-h-[80vh] overflow-y-auto border border-gray-200">
      <div className="sticky top-0 bg-gradient-to-r from-gray-700 to-gray-800 text-white p-5 rounded-t-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">🚛 Truck {truck.id.split('-')[1]}</h2>
            <p className="text-sm text-gray-200 font-medium mt-1">Cargo Transport Vehicle</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors p-1 hover:bg-white/10 rounded-lg"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${typeInfo.color}`}>
            {typeInfo.icon} {typeInfo.label}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
            truck.status === 'arriving' ? 'bg-yellow-400 text-yellow-900' :
            truck.status === 'unloading' ? 'bg-green-400 text-green-900' :
            truck.status === 'departing' ? 'bg-orange-400 text-orange-900' :
            'bg-gray-400 text-gray-900'
          }`}>
            {truck.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* Cargo Flow - Interconnected Info */}
        <div className="mb-5 p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg text-white ${truck.type === 'incoming' ? 'bg-belli-orange-600' : 'bg-purple-600'}`}>
              {truck.type === 'incoming' ? <Warehouse className="w-5 h-5" /> : <Plane className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                {truck.type === 'incoming' ? 'Incoming Cargo Flow' : 'Outgoing Cargo Flow'}
              </h3>
              {truck.type === 'incoming' ? (
                <>
                  <p className="text-sm text-gray-700 mt-2 font-medium">
                    1️⃣ Freight Forwarder/Agent → 2️⃣ <span className="text-belli-orange-700 font-bold">Warehouse (Current)</span> → 3️⃣ ULD → 4️⃣ Aircraft Departure
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-belli-orange-700">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="font-bold">After unloading, cargo will be processed at CHS 7 Build-up area and loaded onto ULDs for departure flights</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-700 mt-2 font-medium">
                    1️⃣ Aircraft Arrival → 2️⃣ ULD → 3️⃣ <span className="text-purple-700 font-bold">Warehouse (Current)</span> → 4️⃣ Distribution to Customers
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-purple-700">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="font-bold">Cargo arrived from incoming flights, processed at warehouse, now ready for distribution</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Truck Type Description */}
        <div className="mb-5 p-4 bg-gray-50 border-l-4 border-gray-400 rounded-r-lg">
          <p className="text-sm text-gray-700 font-medium">
            <span className="font-bold">📍 Current Status: </span>
            {typeInfo.description}
          </p>
        </div>

        {/* Truck Summary */}
        <div className="mb-5 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Truck Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium">Cargo Items</span>
              <span className="text-xl font-bold text-gray-900">{truck.cargo.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium">Total Pieces</span>
              <span className="text-xl font-bold text-gray-900">{totalPieces}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium">Total Weight</span>
              <span className="text-xl font-bold text-gray-900">{totalWeight.toFixed(0)} kg</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium">Time at Bay</span>
              <span className="text-sm font-bold text-gray-900 font-mono">{minutes}m {seconds}s</span>
            </div>
          </div>
        </div>

        {/* Cargo List */}
        <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Cargo Manifest</h3>
        <div className="space-y-2">
          {truck.cargo.map((item) => (
            <div 
              key={item.id} 
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all bg-white"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{item.description}</p>
                  <p className="text-xs text-gray-500 font-mono font-bold mt-1">AWB: {item.awb}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{item.weight} kg</p>
                  <p className="text-xs text-gray-600 font-bold">{item.pieces} pcs</p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-2 pt-2 border-t border-gray-100">
                <span>
                  <span className="font-bold">From:</span> {item.shipper}
                </span>
                <span>
                  <span className="font-bold">To:</span> {item.destination}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
          <p className="text-xs text-gray-700 font-medium">
            <span className="font-bold">Note:</span> This truck will {
              truck.status === 'arriving' ? 'begin unloading soon' :
              truck.status === 'unloading' ? 'complete unloading and depart' :
              'depart the loading bay'
            }.
          </p>
        </div>
      </div>
    </div>
  )
}
