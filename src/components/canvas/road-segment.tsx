'use client'

import { useMemo } from 'react'
import { createAsphaltMaterial } from '@/lib/materials'
import { ROAD_COLORS } from '@/lib/constants'
import type { Road } from '@/lib/types'

type RoadSegmentProps = {
  road: Road
}

export function RoadSegment({ road }: RoadSegmentProps) {
  const asphaltMaterial = useMemo(() => createAsphaltMaterial(), [])
  const markingMaterial = useMemo(() => {
    const mat = createAsphaltMaterial()
    mat.color.set(ROAD_COLORS.marking)
    return mat
  }, [])

  if (road.path.length < 2) return null

  // Create road segments between path points
  const segments = []
  for (let i = 0; i < road.path.length - 1; i++) {
    const [x1, z1] = road.path[i]
    const [x2, z2] = road.path[i + 1]
    
    const dx = x2 - x1
    const dz = z2 - z1
    const length = Math.sqrt(dx * dx + dz * dz)
    const angle = Math.atan2(dz, dx)
    const centerX = (x1 + x2) / 2
    const centerZ = (z1 + z2) / 2

    segments.push(
      <group key={`segment-${i}`} position={[centerX, 0.1, centerZ]} rotation={[0, angle, 0]}>
        {/* Road surface */}
        <mesh material={asphaltMaterial} receiveShadow>
          <boxGeometry args={[length, 0.2, road.width]} />
        </mesh>
        
        {/* Lane markings */}
        <mesh position={[0, 0.11, 0]} material={markingMaterial}>
          <boxGeometry args={[length, 0.02, 0.3]} />
        </mesh>
        
        {/* Blue outline (from map) */}
        <mesh position={[0, 0.12, -road.width / 2]} material={markingMaterial}>
          <boxGeometry args={[length, 0.01, 0.2]} />
        </mesh>
        <mesh position={[0, 0.12, road.width / 2]} material={markingMaterial}>
          <boxGeometry args={[length, 0.01, 0.2]} />
        </mesh>
      </group>
    )
  }

  return <>{segments}</>
}
