'use client'

import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'

type ConveyorBeltProps = {
  position: [number, number, number]
  rotation?: [number, number, number]
  length?: number
  width?: number
}

export function ConveyorBelt({
  position,
  rotation = [0, 0, 0],
  length = 10,
  width = 1,
}: ConveyorBeltProps) {
  const frameMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#22C55E', // 緑のフレーム
        roughness: 0.4,
        metalness: 0.5,
      }),
    []
  )

  const beltMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#374151', // ダークグレーのベルト
        roughness: 0.7,
      }),
    []
  )

  const rollerMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#9CA3AF', // シルバーのローラー
        roughness: 0.3,
        metalness: 0.6,
      }),
    []
  )

  const numRollers = Math.floor(length / 0.5)

  return (
    <group position={position} rotation={rotation}>
      {/* Frame sides */}
      <mesh position={[-width / 2 - 0.05, 0.4, 0]} material={frameMaterial}>
        <boxGeometry args={[0.1, 0.3, length]} />
      </mesh>
      <mesh position={[width / 2 + 0.05, 0.4, 0]} material={frameMaterial}>
        <boxGeometry args={[0.1, 0.3, length]} />
      </mesh>

      {/* Legs */}
      {[-length / 2 + 0.5, 0, length / 2 - 0.5].map((z, i) => (
        <group key={`legs-${i}`}>
          <mesh position={[-width / 2 - 0.05, 0.2, z]} material={frameMaterial}>
            <boxGeometry args={[0.08, 0.4, 0.08]} />
          </mesh>
          <mesh position={[width / 2 + 0.05, 0.2, z]} material={frameMaterial}>
            <boxGeometry args={[0.08, 0.4, 0.08]} />
          </mesh>
        </group>
      ))}

      {/* Belt surface */}
      <mesh position={[0, 0.45, 0]} material={beltMaterial}>
        <boxGeometry args={[width, 0.05, length]} />
      </mesh>

      {/* Rollers */}
      {Array.from({ length: numRollers }).map((_, i) => {
        const z = -length / 2 + 0.25 + i * (length / numRollers)
        return (
          <mesh
            key={`roller-${i}`}
            position={[0, 0.35, z]}
            rotation={[0, 0, Math.PI / 2]}
            material={rollerMaterial}
          >
            <cylinderGeometry args={[0.08, 0.08, width, 12]} />
          </mesh>
        )
      })}
    </group>
  )
}
