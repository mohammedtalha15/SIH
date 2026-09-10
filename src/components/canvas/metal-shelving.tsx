'use client'

import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'
import { CargoPallet } from './cargo-pallet'

type MetalShelvingProps = {
  position: [number, number, number]
  levels?: number
  width?: number
  depth?: number
  withCargo?: boolean
}

export function MetalShelving({
  position,
  levels = 4,
  width = 3,
  depth = 1.2,
  withCargo = true,
}: MetalShelvingProps) {
  const postMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#EA580C', // 明るいオレンジ
        roughness: 0.4,
        metalness: 0.5,
      }),
    []
  )

  const beamMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#F97316', // 明るいオレンジ
        roughness: 0.4,
        metalness: 0.4,
      }),
    []
  )

  const levelHeight = 2.0
  const totalHeight = levels * levelHeight

  return (
    <group position={position}>
      {/* Vertical posts - 4 corners */}
      {[
        [-width / 2, -depth / 2],
        [width / 2, -depth / 2],
        [-width / 2, depth / 2],
        [width / 2, depth / 2],
      ].map(([x, z], i) => (
        <mesh
          key={`post-${i}`}
          position={[x, totalHeight / 2, z]}
          material={postMaterial}
          castShadow
        >
          <boxGeometry args={[0.08, totalHeight, 0.08]} />
        </mesh>
      ))}

      {/* Horizontal beams at each level */}
      {Array.from({ length: levels + 1 }).map((_, level) => {
        const y = level * levelHeight
        return (
          <group key={`level-${level}`}>
            {/* Front and back beams */}
            <mesh position={[0, y, -depth / 2]} material={beamMaterial}>
              <boxGeometry args={[width, 0.1, 0.05]} />
            </mesh>
            <mesh position={[0, y, depth / 2]} material={beamMaterial}>
              <boxGeometry args={[width, 0.1, 0.05]} />
            </mesh>
            {/* Side beams */}
            <mesh position={[-width / 2, y, 0]} material={beamMaterial}>
              <boxGeometry args={[0.05, 0.1, depth]} />
            </mesh>
            <mesh position={[width / 2, y, 0]} material={beamMaterial}>
              <boxGeometry args={[0.05, 0.1, depth]} />
            </mesh>
          </group>
        )
      })}

      {/* Cargo on shelves */}
      {withCargo &&
        Array.from({ length: levels }).map((_, level) => {
          const y = level * levelHeight + 0.15
          // Randomly place 1-2 pallets per level
          return (
            <group key={`cargo-level-${level}`}>
              <CargoPallet position={[-width / 4, y, 0]} scale={0.8} />
              {level % 2 === 0 && (
                <CargoPallet position={[width / 4, y, 0]} scale={0.8} />
              )}
            </group>
          )
        })}
    </group>
  )
}
