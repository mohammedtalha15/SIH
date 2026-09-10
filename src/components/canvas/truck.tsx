'use client'

import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'

type TruckProps = {
  position: [number, number, number]
  rotation?: [number, number, number]
  color?: string
}

export function Truck({ position, rotation = [0, 0, 0], color = '#1E3A5F' }: TruckProps) {
  const cabMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.3,
        metalness: 0.2,
      }),
    []
  )

  const trailerMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color,
        roughness: 0.4,
        metalness: 0.1,
      }),
    []
  )

  const wheelMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#1a1a1a',
        roughness: 0.8,
      }),
    []
  )

  const windowMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#87CEEB',
        roughness: 0.1,
        metalness: 0.5,
      }),
    []
  )

  return (
    <group position={position} rotation={rotation}>
      {/* Cab */}
      <mesh position={[0, 1.2, 2.5]} material={cabMaterial} castShadow>
        <boxGeometry args={[2.4, 2.4, 2]} />
      </mesh>
      
      {/* Cab windshield */}
      <mesh position={[0, 1.5, 3.55]} material={windowMaterial}>
        <boxGeometry args={[2.2, 1.5, 0.1]} />
      </mesh>
      
      {/* Side windows */}
      <mesh position={[1.25, 1.5, 2.5]} material={windowMaterial}>
        <boxGeometry args={[0.1, 1.2, 1.5]} />
      </mesh>
      <mesh position={[-1.25, 1.5, 2.5]} material={windowMaterial}>
        <boxGeometry args={[0.1, 1.2, 1.5]} />
      </mesh>

      {/* Trailer */}
      <mesh position={[0, 1.8, -3]} material={trailerMaterial} castShadow>
        <boxGeometry args={[2.5, 3, 8]} />
      </mesh>

      {/* Wheels */}
      {[
        [1, 0.4, 2],
        [-1, 0.4, 2],
        [1, 0.4, -1],
        [-1, 0.4, -1],
        [1, 0.4, -5],
        [-1, 0.4, -5],
      ].map(([x, y, z], i) => (
        <mesh
          key={`wheel-${i}`}
          position={[x, y, z]}
          rotation={[0, 0, Math.PI / 2]}
          material={wheelMaterial}
          castShadow
        >
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        </mesh>
      ))}
    </group>
  )
}
