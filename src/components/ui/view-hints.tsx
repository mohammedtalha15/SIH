'use client'

import { useWarehouseContext } from '@/lib/contexts/warehouse-context'

export function ViewHints() {
  const { viewMode } = useWarehouseContext()
  const isInterior = viewMode.viewMode === 'interior'

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
      {isInterior ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-800">🚶 Interior Navigation</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">↓</kbd>
              Move
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">←</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">→</kbd>
              Turn
            </span>
            <span className="flex items-center gap-1">
              🖱️ Drag: Look around
            </span>
            <span className="flex items-center gap-1">
              ⚙️ Scroll: Rotate view
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          Drag to rotate • Scroll to zoom • Click building to enter
        </p>
      )}
    </div>
  )
}
