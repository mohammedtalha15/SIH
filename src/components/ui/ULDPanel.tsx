'use client'

/**
 * ULD Container Panel - Rachata Design Theme
 * Side panel showing cargo container details
 */

import { X, Package } from 'lucide-react'

interface ULDPanelProps {
  isOpen?: boolean
  onClose?: () => void
}

export function ULDPanel({ isOpen = true, onClose }: ULDPanelProps) {
  if (!isOpen) return null
  
  return (
    <div className="fixed right-6 top-24 w-80 glass-panel rounded-xl shadow-large overflow-hidden z-40">
      {/* Navy Header */}
      <div className="navy-header px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-orange-200 font-medium mb-1">ULD CONTAINER</div>
          <div className="text-xl font-bold text-white">AKE68912NH</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Panel Content */}
      <div className="p-6 space-y-4">
        {/* Container ID & Status */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 mb-1">Container ID</div>
            <div className="text-sm font-bold text-gray-900">AKE68912NH</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Status</div>
            <div className="text-sm font-bold text-green-600">Departing</div>
          </div>
        </div>
        
        {/* Flight & Destination */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 mb-1">Flight</div>
            <div className="text-sm font-bold text-gray-900">NH506</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Destination</div>
            <div className="text-sm font-bold text-gray-900">SIN</div>
          </div>
        </div>
        
        {/* Loading Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-500">Loading Progress</div>
            <div className="text-xs font-bold text-gray-900">7 / 10 packages</div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '70%' }}></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">70% complete</div>
        </div>
        
        {/* Loaded Packages */}
        <div>
          <div className="text-xs text-gray-500 mb-3">Loaded Packages (7)</div>
          <div className="space-y-2">
            {[
              { awb: 'ANA986450537', origin: 'Hong Kong', weight: '89 kg' },
              { awb: 'ANA556629224', origin: 'Hong Kong', weight: '85 kg' },
              { awb: 'ANA772507460', origin: 'Shanghai, China', weight: '62 kg' },
            ].map((pkg, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-3 h-3 text-gray-400" />
                    <div className="text-xs font-semibold text-gray-900">AWB: {pkg.awb}</div>
                  </div>
                  <div className="text-xs text-green-600">{pkg.origin}</div>
                </div>
                <div className="text-xs font-bold text-gray-900">{pkg.weight}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* ULD Capacity */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">ULD Capacity</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Max Volume:</div>
              <div className="text-sm font-bold text-gray-900">1134 L</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Max Weight:</div>
              <div className="text-sm font-bold text-gray-900">1588 kg</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="text-xs text-center text-gray-500">
          Click elsewhere to close • ESC to dismiss
        </div>
      </div>
    </div>
  )
}
