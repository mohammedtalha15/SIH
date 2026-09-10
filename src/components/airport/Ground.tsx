'use client'

import { Grid } from '@react-three/drei'

// Ground dimensions - MUST MATCH Buildings.tsx exactly
const WORLD_WIDTH = 200
const WORLD_HEIGHT = 130

export function Ground() {
  return (
    <group>
      {/* Grid - same as warehouse view */}
      <Grid
        renderOrder={-1}
        position={[6, 0, -11]}
        infiniteGrid
        cellSize={10}
        cellThickness={0.3}
        cellColor="#404040"
        sectionSize={50}
        sectionThickness={0.8}
        sectionColor="#606060"
        fadeDistance={500}
        fadeStrength={1.5}
      />

      {/* Clean dark gray base ground plane */}
      <mesh position={[6, -0.1, -11]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD_WIDTH, WORLD_HEIGHT]} />
        <meshStandardMaterial 
          color="#1A1A1A" 
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>
    </group>
  )
}

export const LAYOUT_DIMENSIONS = { width: WORLD_WIDTH, height: WORLD_HEIGHT }
