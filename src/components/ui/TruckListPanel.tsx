import { SimulatedTruck, useTruckStore } from '@/lib/stores/truckStore'
import { X, Truck } from 'lucide-react'

interface TruckListPanelProps {
  trucks: SimulatedTruck[]
  onClose: () => void
}

export function TruckListPanel({ trucks, onClose }: TruckListPanelProps) {
  const { selectTruck } = useTruckStore()

  const handleTruckClick = (truckId: string) => {
    selectTruck(truckId)
    onClose() // Close the list panel when selecting a truck
  }
  const getStatusColor = (status: SimulatedTruck['status']) => {
    switch (status) {
      case 'arriving': return 'bg-belli-orange-500'
      case 'unloading': return 'bg-belli-orange-400'
      case 'departing': return 'bg-belli-orange-600'
      case 'gone': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeColor = (type: SimulatedTruck['type']) => {
    return type === 'incoming' ? 'bg-belli-orange-100 text-belli-orange-800' : 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="fixed top-20 right-4 w-96 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl z-[100] max-h-[80vh] overflow-y-auto border border-gray-700">
      <div className="sticky top-0 bg-gradient-to-r from-gray-700 to-gray-800 text-white p-5 rounded-t-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Truck className="w-6 h-6" /> Active Trucks
            </h2>
            <p className="text-sm text-gray-200 font-medium mt-1">{trucks.length} trucks at loading bay</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors p-1 hover:bg-white/10 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {trucks.map((truck) => {
          const totalWeight = truck.cargo.reduce((sum, item) => sum + item.weight, 0)
          const totalPieces = truck.cargo.reduce((sum, item) => sum + item.pieces, 0)

          return (
            <div
              key={truck.id}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-500 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleTruckClick(truck.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-100">Truck {truck.id.split('-')[1]}</h3>
                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${getTypeColor(truck.type)}`}>
                    {truck.type === 'incoming' ? 'Incoming' : 'Outgoing'}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(truck.status)}`}>
                  {truck.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Cargo Items</p>
                  <p className="font-semibold text-gray-200">{truck.cargo.length} items</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Total Pieces</p>
                  <p className="font-semibold text-gray-200">{totalPieces} pcs</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Total Weight</p>
                  <p className="font-semibold text-gray-200">{totalWeight.toFixed(1)} kg</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Arrival Time</p>
                  <p className="font-semibold text-gray-200">{truck.arrivalTime.toLocaleTimeString()}</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 font-semibold mt-2">Click to view details →</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
