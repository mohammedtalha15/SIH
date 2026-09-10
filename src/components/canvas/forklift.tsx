'use client'

import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'

type ForkliftProps = {
  position: [number, number, number]
  rotation?: [number, number, number]
  color?: string
}

export function Forklift({ position, rotation = [0, 0, 0], color = '#FBBF24' }: ForkliftProps) {
  const bodyMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color, // 明るい黄色
        roughness: 0.3,
        metalness: 0.4,
      }),
    [color]
  )

  const metalMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#6B7280', // 明るいグレー
        roughness: 0.3,
        metalness: 0.7,
      }),
    []
  )

  const wheelMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#374151',
        roughness: 0.7,
      }),
    []
  )

  return (
    <group position={position} rotation={rotation} scale={0.5}>
      {/* Main body */}
      <mesh position={[0, 0.6, 0]} material={bodyMaterial} castShadow>
        <boxGeometry args={[1.2, 0.8, 2]} />
      </mesh>

      {/* Driver cabin frame */}
      <mesh position={[0, 1.4, -0.2]} material={metalMaterial} castShadow>
        <boxGeometry args={[1.0, 1.2, 0.1]} />
      </mesh>
      <mesh position={[0.5, 1.4, 0.3]} material={metalMaterial}>
        <boxGeometry args={[0.08, 1.2, 1]} />
      </mesh>
      <mesh position={[-0.5, 1.4, 0.3]} material={metalMaterial}>
        <boxGeometry args={[0.08, 1.2, 1]} />
      </mesh>
      <mesh position={[0, 2.0, 0.3]} material={metalMaterial}>
        <boxGeometry args={[1.1, 0.08, 1]} />
      </mesh>

      {/* Mast */}
      <mesh position={[0, 1.2, 1.2]} material={metalMaterial} castShadow>
        <boxGeometry args={[0.8, 2.4, 0.15]} />
      </mesh>
      <mesh position={[-0.35, 1.2, 1.2]} material={metalMaterial}>
        <boxGeometry args={[0.1, 2.4, 0.1]} />
      </mesh>
      <mesh position={[0.35, 1.2, 1.2]} material={metalMaterial}>
        <boxGeometry args={[0.1, 2.4, 0.1]} />
      </mesh>

      {/* Forks */}
      <mesh position={[-0.25, 0.15, 1.8]} material={metalMaterial} castShadow>
        <boxGeometry args={[0.1, 0.05, 1.2]} />
      </mesh>
      <mesh position={[0.25, 0.15, 1.8]} material={metalMaterial} castShadow>
        <boxGeometry args={[0.1, 0.05, 1.2]} />
      </mesh>

      {/* Fork backrest */}
      <mesh position={[0, 0.5, 1.25]} material={metalMaterial}>
        <boxGeometry args={[0.8, 0.6, 0.05]} />
      </mesh>

      {/* Wheels */}
      {[
        [0.5, 0.2, 0.6],
        [-0.5, 0.2, 0.6],
        [0.4, 0.15, -0.8],
        [-0.4, 0.15, -0.8],
      ].map(([x, y, z], i) => (
        <mesh
          key={`wheel-${i}`}
          position={[x, y, z]}
          rotation={[0, 0, Math.PI / 2]}
          material={wheelMaterial}
          castShadow
        >
          <cylinderGeometry args={[i < 2 ? 0.2 : 0.15, i < 2 ? 0.2 : 0.15, 0.15, 16]} />
        </mesh>
      ))}

      {/* Counterweight */}
      <mesh position={[0, 0.5, -1.1]} material={bodyMaterial} castShadow>
        <boxGeometry args={[1.0, 0.6, 0.4]} />
      </mesh>
    </group>
  )
}
