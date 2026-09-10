import { ULDTrolley, useUnifiedCargoStore } from '@/lib/stores/unifiedCargoStore'
import { X, Package, Plane } from 'lucide-react'

interface ULDTrolleyListPanelProps {
  trolleys: ULDTrolley[]
  onClose: () => void
}

export function ULDTrolleyListPanel({ trolleys, onClose }: ULDTrolleyListPanelProps) {
  const { selectTrolley } = useUnifiedCargoStore()

  const handleTrolleyClick = (trolleyId: string) => {
    selectTrolley(trolleyId)
    onClose() // Close the list panel when selecting a ULD
  }
  const getStatusColor = (status: ULDTrolley['status']) => {
    switch (status) {
      case 'loading': return 'bg-yellow-500'
      case 'loaded': return 'bg-green-500'
      case 'unloading': return 'bg-orange-500'
      case 'empty': return 'bg-gray-500'
      default: return 'bg-belli-orange-500'
    }
  }

  return (
    <div className="fixed top-20 right-4 w-96 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl z-[100] max-h-[80vh] overflow-y-auto border border-gray-700">
      <div className="sticky top-0 bg-gradient-to-r from-belli-orange-600 to-belli-red-500 text-white p-5 rounded-t-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6" /> ULDs
            </h2>
            <p className="text-sm text-orange-100 font-medium mt-1">{trolleys.length} ULDs at build-up area</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-orange-200 transition-colors p-1 hover:bg-white/10 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {trolleys.map((trolley) => {
          const totalWeight = trolley.packages.reduce((sum, item) => sum + item.weight, 0)
          const totalPieces = trolley.packages.reduce((sum, item) => sum + item.pieces, 0)

          return (
            <div
              key={trolley.id}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-belli-orange-400 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleTrolleyClick(trolley.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-100">ULD {trolley.id.split('-')[1]}</h3>
                  <p className="text-sm text-gray-400 mt-1">{trolley.type} Container</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(trolley.status)}`}>
                  {trolley.status.toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Cargo Items</p>
                  <p className="font-semibold text-gray-200">{trolley.packages.length} items</p>
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
                  <p className="text-gray-500 text-xs mb-1">Location</p>
                  <p className="font-semibold text-gray-200">CHS 7</p>
                </div>
              </div>

              {trolley.flightNumber && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">Assigned Flight</p>
                  <p className="text-sm font-bold text-belli-orange-400 flex items-center gap-1">
                    <Plane className="w-3 h-3" /> {trolley.flightNumber}
                  </p>
                </div>
              )}
              
              <p className="text-xs text-belli-orange-400 font-semibold mt-2">Click to view details →</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
