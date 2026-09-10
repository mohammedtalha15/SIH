'use client'

import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'
import { roads } from '@/lib/warehouse-data'

export function RoadNetwork() {
  const roadMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: '#4B5563',
      roughness: 0.9,
      metalness: 0.0,
    })
  }, [])

  const lineMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 0.5,
    })
  }, [])

  return (
    <group>
      {roads.map((road) => (
        <RoadSegment key={road.id} road={road} material={roadMaterial} lineMaterial={lineMaterial} />
      ))}
    </group>
  )
}

type RoadSegmentProps = {
  road: typeof roads[0]
  material: MeshStandardMaterial
  lineMaterial: MeshStandardMaterial
}

function RoadSegment({ road, material, lineMaterial }: RoadSegmentProps) {
  const [x1, z1] = road.path[0]
  const [x2, z2] = road.path[road.path.length - 1]
  
  const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2)
  const angle = Math.atan2(z2 - z1, x2 - x1)
  const midX = (x1 + x2) / 2
  const midZ = (z1 + z2) / 2

  return (
    <group>
      {/* 道路面 */}
      <mesh
        position={[midX, 0.08, midZ]}
        rotation={[0, -angle + Math.PI / 2, 0]}
        material={material}
        receiveShadow
      >
        <boxGeometry args={[road.width, 0.15, length]} />
      </mesh>
      
      {/* 中央線 */}
      <mesh
        position={[midX, 0.15, midZ]}
        rotation={[0, -angle + Math.PI / 2, 0]}
        material={lineMaterial}
      >
        <boxGeometry args={[0.4, 0.05, length - 5]} />
      </mesh>
    </group>
  )
}
