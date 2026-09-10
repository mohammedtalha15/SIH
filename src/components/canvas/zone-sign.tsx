'use client'

import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'

type ZoneSignProps = {
  position: [number, number, number]
  text: string
  width?: number
  height?: number
}

export function ZoneSign({ position, text, width = 20, height = 4 }: ZoneSignProps) {
  const signMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#F97316',
        roughness: 0.3,
        metalness: 0.1,
      }),
    []
  )

  return (
    <group position={position}>
      {/* Sign background */}
      <mesh material={signMaterial} castShadow>
        <boxGeometry args={[width, height, 0.3]} />
      </mesh>
      
      {/* Text */}
      <Text
        position={[0, 0, 0.2]}
        fontSize={height * 0.5}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {text}
      </Text>
    </group>
  )
}
