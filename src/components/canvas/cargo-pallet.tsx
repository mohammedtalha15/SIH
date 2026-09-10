'use client'

import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'

type CargoPalletProps = {
  position: [number, number, number]
  scale?: number
  wrapped?: boolean
}

export function CargoPallet({ position, scale = 1, wrapped = true }: CargoPalletProps) {
  const palletMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#A16207', // 明るい木目色
        roughness: 0.7,
      }),
    []
  )

  const wrapMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#FFFFFF', // 白い梱包材
        roughness: 0.3,
        metalness: 0.1,
      }),
    []
  )

  const strapMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#2563EB', // 青いストラップ
        roughness: 0.3,
        metalness: 0.2,
      }),
    []
  )

  return (
    <group position={position} scale={scale}>
      {/* Wooden pallet base */}
      <mesh position={[0, 0.075, 0]} material={palletMaterial} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.15, 1.0]} />
      </mesh>
      
      {/* Pallet slats */}
      {[-0.4, 0, 0.4].map((z, i) => (
        <mesh key={`slat-${i}`} position={[0, 0, z]} material={palletMaterial}>
          <boxGeometry args={[1.2, 0.03, 0.1]} />
        </mesh>
      ))}

      {wrapped && (
        <>
          {/* Wrapped cargo - main block */}
          <mesh position={[0, 0.75, 0]} material={wrapMaterial} castShadow receiveShadow>
            <boxGeometry args={[1.0, 1.2, 0.9]} />
          </mesh>
          
          {/* Diamond pattern net effect */}
          {[-0.3, 0, 0.3].map((xOffset, i) => (
            <mesh
              key={`strap-v-${i}`}
              position={[xOffset, 0.75, 0.46]}
              material={strapMaterial}
            >
              <boxGeometry args={[0.02, 1.2, 0.02]} />
            </mesh>
          ))}
          {[-0.3, 0, 0.3].map((xOffset, i) => (
            <mesh
              key={`strap-v-back-${i}`}
              position={[xOffset, 0.75, -0.46]}
              material={strapMaterial}
            >
              <boxGeometry args={[0.02, 1.2, 0.02]} />
            </mesh>
          ))}
          
          {/* Horizontal straps */}
          <mesh position={[0, 0.4, 0]} material={strapMaterial}>
            <boxGeometry args={[1.02, 0.03, 0.92]} />
          </mesh>
          <mesh position={[0, 1.0, 0]} material={strapMaterial}>
            <boxGeometry args={[1.02, 0.03, 0.92]} />
          </mesh>
        </>
      )}
    </group>
  )
}
