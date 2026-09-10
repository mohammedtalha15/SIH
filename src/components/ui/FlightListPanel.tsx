import { CargoFlight, useCargoFlightStore } from '@/lib/stores/useCargoFlightStore'
import { X } from 'lucide-react'

interface FlightListPanelProps {
  title: string
  flights: CargoFlight[]
  onClose: () => void
}

export function FlightListPanel({ title, flights, onClose }: FlightListPanelProps) {
  const { selectFlight } = useCargoFlightStore()

  const handleFlightClick = (flightNumber: string) => {
    selectFlight(flightNumber)
    onClose() // Close the list panel when selecting a flight
  }
  const getStatusColor = (status: CargoFlight['status']) => {
    switch (status) {
      case 'INBOUND': return 'bg-belli-orange-500'
      case 'ARRIVED': return 'bg-belli-orange-600'
      case 'UNLOADING': return 'bg-belli-orange-400'
      case 'LOADING': return 'bg-belli-orange-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="fixed top-20 right-4 w-96 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl z-[100] max-h-[80vh] overflow-y-auto border border-gray-700">
      <div className="sticky top-0 bg-gradient-to-r from-belli-orange-600 to-belli-red-500 text-white p-5 rounded-t-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-orange-100 font-medium mt-1">{flights.length} flights</p>
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
        {flights.map((flight) => (
          <div
            key={flight.flightNumber}
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-belli-orange-400 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleFlightClick(flight.flightNumber)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-100">{flight.flightNumber}</h3>
                <p className="text-sm text-gray-400">{flight.aircraft}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(flight.status)}`}>
                {flight.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-1">Arrival</p>
                <p className="font-semibold text-gray-200">{flight.arrivalTime}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Departure</p>
                <p className="font-semibold text-gray-200">{flight.departureTime}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-1">ULDs</p>
              <p className="text-sm font-semibold text-gray-200">{flight.ulds.length} containers</p>
            </div>

            <p className="text-xs text-belli-orange-400 font-semibold mt-2">Click to view details →</p>
          </div>
        ))}
      </div>
    </div>
  )
}
