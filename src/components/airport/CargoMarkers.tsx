'use client'

import { Html } from '@react-three/drei'

/**
 * Cargo Terminal Label - Simple text box for the cargo terminal
 * Positioned directly above the red cargo building complex
 */

export function CargoTerminalMarkers() {
  return (
    <group position={[-20, 6, 5]}>
      {/* Simple Text Label */}
      <Html
        position={[0, 0, 0]}
        center
        distanceFactor={60}
        style={{ pointerEvents: 'none' }}
      >
        <div className="bg-[#E91E63]/95 backdrop-blur-sm rounded-lg px-5 py-3 shadow-xl border-2 border-white">
          <div className="text-center">
            <div className="text-base font-bold text-white leading-tight">
              Cargo Terminal
            </div>
            <div className="text-sm text-white/90 mt-1">
              貨物ターミナル
            </div>
          </div>
        </div>
      </Html>
    </group>
  )
}
