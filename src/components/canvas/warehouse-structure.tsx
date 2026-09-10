'use client'

import { useMemo } from 'react'
import { MeshStandardMaterial, DoubleSide } from 'three'
import {
  createCeilingMaterial,
  createSteelBeamMaterial,
} from '@/lib/materials'
import type { ViewMode } from '@/lib/types'

type WarehouseStructureProps = {
  viewMode: ViewMode
  buildingPosition: [number, number, number]
  buildingSize: [number, number, number]
}

export function WarehouseStructure({
  viewMode,
  buildingPosition,
  buildingSize,
}: WarehouseStructureProps) {
  // Only show in interior view
  if (viewMode !== 'interior') return null

  const [bx, by, bz] = buildingPosition
  const [width, height, depth] = buildingSize

  const ceilingMaterial = useMemo(() => createCeilingMaterial(), [])
  const beamMaterial = useMemo(() => createSteelBeamMaterial(), [])

  const ceilingHeight = height - 2
  const numBeamsX = Math.floor(width / 30) + 1
  const numBeamsZ = Math.floor(depth / 30) + 1

  return (
    <group position={buildingPosition}>
      {/* Polished concrete floor - Removed to prevent overlap, using main ground plane instead */}

      {/* Ceiling */}
      <mesh position={[0, ceilingHeight, 0]} material={ceilingMaterial}>
        <boxGeometry args={[width - 1, 0.5, depth - 1]} />
      </mesh>

      {/* Main longitudinal beams (I-beams along X axis) */}
      {Array.from({ length: numBeamsZ }).map((_, i) => {
        const zPos = -depth / 2 + 10 + i * (depth / numBeamsZ)
        return (
          <group key={`main-beam-${i}`}>
            {/* Top flange */}
            <mesh position={[0, ceilingHeight - 0.5, zPos]} material={beamMaterial}>
              <boxGeometry args={[width - 2, 0.15, 0.4]} />
            </mesh>
            {/* Web */}
            <mesh position={[0, ceilingHeight - 1.0, zPos]} material={beamMaterial}>
              <boxGeometry args={[width - 2, 0.8, 0.1]} />
            </mesh>
            {/* Bottom flange */}
            <mesh position={[0, ceilingHeight - 1.5, zPos]} material={beamMaterial}>
              <boxGeometry args={[width - 2, 0.15, 0.4]} />
            </mesh>
          </group>
        )
      })}

      {/* Cross beams (I-beams along Z axis) */}
      {Array.from({ length: numBeamsX }).map((_, i) => {
        const xPos = -width / 2 + 10 + i * (width / numBeamsX)
        return (
          <group key={`cross-beam-${i}`}>
            {/* Top flange */}
            <mesh position={[xPos, ceilingHeight - 0.3, 0]} material={beamMaterial}>
              <boxGeometry args={[0.35, 0.12, depth - 2]} />
            </mesh>
            {/* Web */}
            <mesh position={[xPos, ceilingHeight - 0.8, 0]} material={beamMaterial}>
              <boxGeometry args={[0.08, 0.7, depth - 2]} />
            </mesh>
            {/* Bottom flange */}
            <mesh position={[xPos, ceilingHeight - 1.3, 0]} material={beamMaterial}>
              <boxGeometry args={[0.35, 0.12, depth - 2]} />
            </mesh>
          </group>
        )
      })}

      {/* Industrial ceiling lights */}
      {generateCeilingLights(width, depth, ceilingHeight)}

      {/* Large warehouse doors (open) */}
      {generateWarehouseDoors(width, depth, height)}

      {/* Interior walls (subtle in interior view) */}
      <InteriorWalls
        width={width}
        height={height}
        depth={depth}
      />
    </group>
  )
}

function generateCeilingLights(
  width: number,
  depth: number,
  ceilingHeight: number
) {
  const lights = []
  const lightSpacingX = 25
  const lightSpacingZ = 25
  const numLightsX = Math.floor(width / lightSpacingX)
  const numLightsZ = Math.floor(depth / lightSpacingZ)

  for (let i = 0; i < numLightsX; i++) {
    for (let j = 0; j < numLightsZ; j++) {
      const xPos = -width / 2 + lightSpacingX / 2 + i * lightSpacingX
      const zPos = -depth / 2 + lightSpacingZ / 2 + j * lightSpacingZ

      lights.push(
        <group key={`light-${i}-${j}`} position={[xPos, ceilingHeight - 2, zPos]}>
          {/* Light housing */}
          <mesh castShadow>
            <boxGeometry args={[2, 0.3, 0.8]} />
            <meshStandardMaterial color="#9CA3AF" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Light panel (emissive) */}
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[1.8, 0.05, 0.6]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive="#FFFFFF"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      )
    }
  }

  return <>{lights}</>
}

function generateWarehouseDoors(
  width: number,
  depth: number,
  height: number
) {
  const doorWidth = 15
  const doorHeight = 12
  const doorPositions = [
    // Front doors
    { x: -width / 4, z: depth / 2, rotY: 0 },
    { x: width / 4, z: depth / 2, rotY: 0 },
    // Back doors
    { x: 0, z: -depth / 2, rotY: Math.PI },
  ]

  return (
    <>
      {doorPositions.map((door, i) => (
        <group
          key={`door-${i}`}
          position={[door.x, doorHeight / 2, door.z]}
          rotation={[0, door.rotY, 0]}
        >
          {/* Door frame */}
          <mesh>
            <boxGeometry args={[doorWidth + 1, doorHeight + 1, 0.5]} />
            <meshStandardMaterial color="#4B5563" />
          </mesh>
          {/* Door opening (showing sky/exterior) */}
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[doorWidth - 1, doorHeight - 1, 0.1]} />
            <meshStandardMaterial 
              color="#87CEEB" 
              emissive="#87CEEB"
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      ))}
    </>
  )
}

function InteriorWalls({
  width,
  height,
  depth,
}: {
  width: number
  height: number
  depth: number
}) {
  const wallMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#D1D5DB',
        roughness: 0.7,
        side: DoubleSide,
        transparent: true,
        opacity: 0.3,
      }),
    []
  )

  return (
    <>
      {/* Front wall */}
      <mesh position={[0, height / 2, depth / 2 - 0.5]} material={wallMaterial}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {/* Back wall */}
      <mesh
        position={[0, height / 2, -depth / 2 + 0.5]}
        rotation={[0, Math.PI, 0]}
        material={wallMaterial}
      >
        <planeGeometry args={[width, height]} />
      </mesh>
      {/* Left wall */}
      <mesh
        position={[-width / 2 + 0.5, height / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={wallMaterial}
      >
        <planeGeometry args={[depth, height]} />
      </mesh>
      {/* Right wall */}
      <mesh
        position={[width / 2 - 0.5, height / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        material={wallMaterial}
      >
        <planeGeometry args={[depth, height]} />
      </mesh>
    </>
  )
}
