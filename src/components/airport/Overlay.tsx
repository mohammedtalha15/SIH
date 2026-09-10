'use client'

function ControlsHelp() {
  return (
    <div className="text-xs text-gray-600 space-y-1.5">
      <div className="flex items-center gap-2">
        <kbd className="px-2 py-1 bg-gray-100 rounded-md text-gray-700 font-mono text-[10px] border border-gray-200">
          LMB
        </kbd>
        <span>Rotate view</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="px-2 py-1 bg-gray-100 rounded-md text-gray-700 font-mono text-[10px] border border-gray-200">
          RMB
        </kbd>
        <span>Pan view</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="px-2 py-1 bg-gray-100 rounded-md text-gray-700 font-mono text-[10px] border border-gray-200">
          Scroll
        </kbd>
        <span>Zoom in/out</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="px-2 py-1 bg-gray-100 rounded-md text-gray-700 font-mono text-[10px] border border-gray-200">
          Click
        </kbd>
        <span>Select building</span>
      </div>
    </div>
  )
}

export function Overlay() {
  return (
    <>
      {/* Bottom left - Controls */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-2 border-blue-200 pointer-events-auto">
        <h3 className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          Controls
        </h3>
        <ControlsHelp />
      </div>
    </>
  )
}
