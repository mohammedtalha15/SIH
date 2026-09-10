'use client'

import { useMemo } from 'react'
import { createAsphaltMaterial, createConcreteMaterial } from '@/lib/materials'

type CargoGateProps = {
  position: [number, number, number]
  lanes: number
  width: number
  label?: string
}

export function CargoGate({ position, lanes, width, label }: CargoGateProps) {
  const asphaltMaterial = useMemo(() => createAsphaltMaterial(), [])
  const concreteMaterial = useMemo(() => createConcreteMaterial(), [])

  const laneWidth = width / lanes

  return (
    <group position={position}>
      {/* Gate structure */}
      <mesh position={[0, 5, 0]} material={concreteMaterial} castShadow>
        <boxGeometry args={[width + 10, 10, 2]} />
      </mesh>
      
      {/* Road surface */}
      <mesh position={[0, 0.1, 0]} material={asphaltMaterial} receiveShadow>
        <boxGeometry args={[width, 0.2, 20]} />
      </mesh>
      
      {/* Lane dividers */}
      {Array.from({ length: lanes - 1 }).map((_, idx) => (
        <mesh
          key={`divider-${idx}`}
          position={[-width / 2 + (idx + 1) * laneWidth, 0.2, 0]}
          material={concreteMaterial}
        >
          <boxGeometry args={[0.2, 0.3, 20]} />
        </mesh>
      ))}
    </group>
  )
}
