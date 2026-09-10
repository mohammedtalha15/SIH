'use client'

import { useWarehouseContext } from '@/lib/contexts/warehouse-context'

export function ZoneInfoPanel() {
  const { zoneSelection } = useWarehouseContext()
  const { selectedZone, clearSelection } = zoneSelection

  if (!selectedZone) {
    return null
  }

  // Category colors matching the map
  const categoryColors = {
    import: '#4A9B8A',
    export: '#5B9BD5',
    storage: '#808080',
    special: '#A0A0A0',
  }

  const categoryColor = categoryColors[selectedZone.category as keyof typeof categoryColors] || '#6B7280'

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
      {/* Header with zone color */}
      <div 
        className="px-4 py-3"
        style={{ backgroundColor: categoryColor }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-white">{selectedZone.name}</h3>
            {selectedZone.nameJa && (
              <div className="text-sm text-white/80">{selectedZone.nameJa}</div>
            )}
          </div>
          <button
            onClick={clearSelection}
            className="text-white/80 hover:text-white text-xl transition-colors duration-200 leading-none"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: categoryColor }}
          />
          <span className="text-sm font-medium text-gray-700 capitalize">
            {selectedZone.category} Area
          </span>
        </div>
        
        {selectedZone.description && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
            {selectedZone.description}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          {selectedZone.area && (
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="text-xs text-gray-500">Area</div>
              <div className="font-semibold text-gray-800">{selectedZone.area.toLocaleString()} m²</div>
            </div>
          )}
          
          <div className="bg-gray-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Floor</div>
            <div className="font-semibold text-gray-800">Floor {selectedZone.floor}</div>
          </div>
        </div>
        
        {selectedZone.handlingCompany && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Operator:</span>
            <span className="font-medium text-gray-800">{selectedZone.handlingCompany}</span>
          </div>
        )}
      </div>
    </div>
  )
}
