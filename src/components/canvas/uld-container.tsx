'use client'

import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'

type ULDContainerProps = {
  position: [number, number, number]
  rotation?: [number, number, number]
  type?: 'LD3' | 'LD7' | 'PMC'
}

export function ULDContainer({
  position,
  rotation = [0, 0, 0],
  type = 'LD3',
}: ULDContainerProps) {
  const containerMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#E5E7EB', // 明るいシルバー
        roughness: 0.3,
        metalness: 0.7,
      }),
    []
  )

  const edgeMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#3B82F6', // 青いエッジ
        roughness: 0.3,
        metalness: 0.6,
      }),
    []
  )

  const labelMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#1E40AF', // ダークブルー
        roughness: 0.6,
      }),
    []
  )

  // ULD dimensions based on type
  const dimensions = {
    LD3: { width: 1.5, height: 1.6, depth: 1.5 },
    LD7: { width: 2.4, height: 1.6, depth: 1.5 },
    PMC: { width: 3.2, height: 2.4, depth: 2.4 },
  }

  const { width, height, depth } = dimensions[type]

  return (
    <group position={position} rotation={rotation}>
      {/* Main container body */}
      <mesh position={[0, height / 2, 0]} material={containerMaterial} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
      </mesh>

      {/* Edge trim */}
      {/* Vertical edges */}
      {[
        [-width / 2, -depth / 2],
        [width / 2, -depth / 2],
        [-width / 2, depth / 2],
        [width / 2, depth / 2],
      ].map(([x, z], i) => (
        <mesh key={`edge-v-${i}`} position={[x, height / 2, z]} material={edgeMaterial}>
          <boxGeometry args={[0.05, height, 0.05]} />
        </mesh>
      ))}

      {/* Horizontal edges */}
      {[0, height].map((y, yi) => (
        <group key={`h-edges-${yi}`}>
          <mesh position={[0, y, -depth / 2]} material={edgeMaterial}>
            <boxGeometry args={[width, 0.05, 0.05]} />
          </mesh>
          <mesh position={[0, y, depth / 2]} material={edgeMaterial}>
            <boxGeometry args={[width, 0.05, 0.05]} />
          </mesh>
          <mesh position={[-width / 2, y, 0]} material={edgeMaterial}>
            <boxGeometry args={[0.05, 0.05, depth]} />
          </mesh>
          <mesh position={[width / 2, y, 0]} material={edgeMaterial}>
            <boxGeometry args={[0.05, 0.05, depth]} />
          </mesh>
        </group>
      ))}

      {/* Label plate */}
      <mesh position={[0, height * 0.7, depth / 2 + 0.03]} material={labelMaterial}>
        <boxGeometry args={[width * 0.6, height * 0.15, 0.02]} />
      </mesh>

      {/* Base rollers (for PMC) */}
      {type === 'PMC' && (
        <group>
          {[-width / 3, 0, width / 3].map((x, i) => (
            <mesh
              key={`roller-${i}`}
              position={[x, 0.05, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={edgeMaterial}
            >
              <cylinderGeometry args={[0.05, 0.05, depth * 0.8, 8]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}
