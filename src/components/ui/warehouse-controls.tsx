'use client'

import { useWarehouseContext } from '@/lib/contexts/warehouse-context'

export function WarehouseControls() {
  const { viewMode, alerts } = useWarehouseContext()
  const { viewMode: mode } = viewMode

  return (
    <div className="flex items-center gap-2 bg-gray-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-xl border border-gray-700">
      {/* Alert Toggle - Only show in exterior mode */}
      {mode === 'exterior' && (
        <button
          onClick={alerts.toggleAlerts}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
            alerts.showAlerts
              ? 'bg-red-500 text-white shadow-lg'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
            <path d="M8.46 14.46a6 6 0 0 1 8.48 0" />
            <path d="M5.64 11.64a10 10 0 0 1 14.14 0" />
          </svg>
          {alerts.showAlerts ? 'Hide' : 'Alerts'}
        </button>
      )}
    </div>
  )
}
