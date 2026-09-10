'use client'

/**
 * Controls Hint Component - Rachata Design Theme
 * Bottom-left controls information panel
 */

export function ControlsHint() {
  return (
    <div className="fixed bottom-6 left-6 glass rounded-xl shadow-medium px-5 py-3 pointer-events-none z-40 max-w-md">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-bold text-gray-900">Controls:</span>
        <span className="text-gray-600">
          Drag to rotate • Scroll to zoom • Click warehouse for layout
        </span>
      </div>
    </div>
  )
}
