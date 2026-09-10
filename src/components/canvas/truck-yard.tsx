'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import { MeshStandardMaterial } from 'three'
import type { TruckYard as TruckYardType } from '@/lib/types'

type TruckYardProps = {
  yard: TruckYardType
}

export function TruckYardArea({ yard }: TruckYardProps) {
  const yardMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: '#D1D5DB',
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

  const [width, height, depth] = yard.size

  return (
    <group position={yard.position}>
      {/* Yard surface */}
      <mesh material={yardMaterial} receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>
      
      {/* Parking lines */}
      {Array.from({ length: Math.floor(width / 15) }).map((_, i) => (
        <mesh 
          key={`line-${i}`} 
          position={[-width / 2 + 10 + i * 15, height + 0.05, 0]}
          material={lineMaterial}
        >
          <boxGeometry args={[0.3, 0.1, depth - 4]} />
        </mesh>
      ))}

      {/* Flow arrows */}
      {yard.entryPoints.map((point, idx) => (
        <group key={`entry-arrow-${idx}`} position={[0, 0.5, depth / 2 - 5]}>
          {/* Arrow body */}
          <mesh material={lineMaterial}>
            <boxGeometry args={[2, 0.1, 8]} />
          </mesh>
          {/* Arrow head */}
          <mesh position={[0, 0, -5]} rotation={[0, 0, 0]}>
            <coneGeometry args={[1.5, 3, 3]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        </group>
      ))}

      {/* Label */}
      {yard.label && (
        <Text
          position={[0, 2, -depth / 2 + 5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={4}
          color="#6B7280"
          anchorX="center"
          anchorY="middle"
        >
          {yard.label}
        </Text>
      )}
    </group>
  )
}

// Alias for backwards compatibility
export const TruckYard = TruckYardArea
