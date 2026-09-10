'use client'

import { useMemo } from 'react'
import { createDockDoorMaterial, createCanopyMaterial, createConcreteMaterial } from '@/lib/materials'
import type { LoadingDock as LoadingDockType } from '@/lib/types'

type LoadingDockProps = {
  dock: LoadingDockType
}

export function LoadingDock({ dock }: LoadingDockProps) {
  const concreteMaterial = useMemo(() => createConcreteMaterial(), [])
  const doorMaterial = useMemo(() => createDockDoorMaterial(), [])
  const canopyMaterial = useMemo(() => createCanopyMaterial(), [])

  return (
    <group position={dock.position}>
      {/* Dock platform/apron */}
      <mesh position={[0, -0.1, 2]} material={concreteMaterial} receiveShadow>
        <boxGeometry args={[dock.width + 2, 0.3, 6]} />
      </mesh>

      {/* Roll-up door frame */}
      <mesh position={[0, dock.height / 2, 0.3]} material={doorMaterial} castShadow>
        <boxGeometry args={[dock.width - 0.5, dock.height, 0.3]} />
      </mesh>

      {/* Door opening (darker) */}
      <mesh position={[0, dock.height / 2, 0.35]}>
        <boxGeometry args={[dock.width - 1.5, dock.height - 1, 0.1]} />
        <meshStandardMaterial color="#1F2937" />
      </mesh>

      {dock.hasCanopy && (
        <group>
          {/* Canopy roof */}
          <mesh position={[0, dock.height + 1.5, 3]} material={canopyMaterial} castShadow receiveShadow>
            <boxGeometry args={[dock.width + 4, 0.4, 7]} />
          </mesh>

          {/* Canopy support beams */}
          <mesh position={[-dock.width / 2 - 1, dock.height / 2 + 0.75, 3]} material={canopyMaterial}>
            <boxGeometry args={[0.2, dock.height + 1.5, 0.2]} />
          </mesh>
          <mesh position={[dock.width / 2 + 1, dock.height / 2 + 0.75, 3]} material={canopyMaterial}>
            <boxGeometry args={[0.2, dock.height + 1.5, 0.2]} />
          </mesh>

          {/* Side panels */}
          <mesh position={[-dock.width / 2 - 1, dock.height / 2 + 0.75, 3]} material={canopyMaterial}>
            <boxGeometry args={[0.15, dock.height + 1.5, 6]} />
          </mesh>
          <mesh position={[dock.width / 2 + 1, dock.height / 2 + 0.75, 3]} material={canopyMaterial}>
            <boxGeometry args={[0.15, dock.height + 1.5, 6]} />
          </mesh>
        </group>
      )}

      {/* Dock bumpers */}
      <mesh position={[-dock.width / 3, 1, 0.4]}>
        <boxGeometry args={[0.5, 1.5, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[dock.width / 3, 1, 0.4]}>
        <boxGeometry args={[0.5, 1.5, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )
}
