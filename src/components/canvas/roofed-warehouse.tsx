'use client'

import { useMemo } from 'react'
import { MeshStandardMaterial, DoubleSide, Shape, ExtrudeGeometry } from 'three'
import * as THREE from 'three'
import { cargoBuilding8, cargoBuilding7 } from '@/lib/warehouse-data'
import { useLayoutStore } from '@/lib/stores/layoutStore'

// Inclined roof component
function InclinedRoof({ 
  position, 
  width, 
  depth, 
  height = 5, 
  color = '#6B7280' 
}: { 
  position: [number, number, number]
  width: number
  depth: number
  height?: number
  color?: string
}) {
  const roofMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0.3,
      side: DoubleSide,
    })
  }, [color])

  // Create a gable roof shape
  const roofShape = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-width / 2, 0)
    shape.lineTo(0, height)
    shape.lineTo(width / 2, 0)
    shape.lineTo(-width / 2, 0)
    return shape
  }, [width, height])

  const extrudeSettings = useMemo(() => ({
    steps: 1,
    depth: depth,
    bevelEnabled: false,
  }), [depth])

  return (
    <group position={position}>
      <mesh 
        rotation={[Math.PI / 2, 0, 0]} 
        position={[0, 0, depth / 2]}
        material={roofMaterial}
        castShadow
        receiveShadow
      >
        <extrudeGeometry args={[roofShape, extrudeSettings]} />
      </mesh>
    </group>
  )
}

// Full warehouse with walls and roof
interface RoofedWarehouseProps {
  building: typeof cargoBuilding8 | typeof cargoBuilding7
  isLShaped?: boolean
}

function RoofedWarehouse({ building, isLShaped = false }: RoofedWarehouseProps) {
  const [posX, posY, posZ] = building.position
  const [width, height, depth] = building.size
  
  const wallMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: '#9CA3AF',
      roughness: 0.7,
      metalness: 0.1,
      side: DoubleSide,
    })
  }, [])
  
  const windowMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: '#60A5FA',
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.7,
    })
  }, [])
  
  const floorMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: '#D1D5DB',
      roughness: 0.8,
      metalness: 0,
    })
  }, [])

  const roofColor = '#5C636E'
  const wallHeight = height
  const roofHeight = 6
  const wallThickness = 1.5

  if (isLShaped) {
    // L-shaped building (Building 8)
    // Import Area: left bottom (x=-100~0, z=0~90)
    // Export Area: right side (x=0~100, z=-90~90)
    
    return (
      <group>
        {/* ===== FLOORS ===== */}
        {/* Import Area floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-50, 0.1, 45]} receiveShadow>
          <planeGeometry args={[100, 90]} />
          <primitive object={floorMaterial} attach="material" />
        </mesh>
        
        {/* Export Area floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[50, 0.1, 0]} receiveShadow>
          <planeGeometry args={[100, 180]} />
          <primitive object={floorMaterial} attach="material" />
        </mesh>

        {/* ===== WALLS ===== */}
        {/* Left wall (West side full) */}
        <mesh position={[-100, wallHeight / 2, 45]} material={wallMaterial} castShadow>
          <boxGeometry args={[wallThickness, wallHeight, 90]} />
        </mesh>
        
        {/* Bottom wall left part (South Import) */}
        <mesh position={[-50, wallHeight / 2, 90]} material={wallMaterial} castShadow>
          <boxGeometry args={[100, wallHeight, wallThickness]} />
        </mesh>
        
        {/* Bottom wall right part (South Export) */}
        <mesh position={[50, wallHeight / 2, 90]} material={wallMaterial} castShadow>
          <boxGeometry args={[100, wallHeight, wallThickness]} />
        </mesh>
        
        {/* Right wall (East side full) */}
        <mesh position={[100, wallHeight / 2, 0]} material={wallMaterial} castShadow>
          <boxGeometry args={[wallThickness, wallHeight, 180]} />
        </mesh>
        
        {/* Top wall (North side) */}
        <mesh position={[50, wallHeight / 2, -90]} material={wallMaterial} castShadow>
          <boxGeometry args={[100, wallHeight, wallThickness]} />
        </mesh>
        
        {/* L-shape inner corner - vertical wall */}
        <mesh position={[0, wallHeight / 2, -45]} material={wallMaterial} castShadow>
          <boxGeometry args={[wallThickness, wallHeight, 90]} />
        </mesh>
        
        {/* L-shape inner corner - horizontal wall */}
        <mesh position={[-50, wallHeight / 2, 0]} material={wallMaterial} castShadow>
          <boxGeometry args={[100, wallHeight, wallThickness]} />
        </mesh>

        {/* ===== WINDOWS ===== */}
        {/* Left wall windows */}
        {[20, 45, 70].map((zOffset, i) => (
          <mesh key={`window-left-${i}`} position={[-100 + 0.2, wallHeight - 3, zOffset]} material={windowMaterial}>
            <boxGeometry args={[0.4, 2.5, 10]} />
          </mesh>
        ))}
        
        {/* Top wall windows */}
        {[20, 50, 80].map((xOffset, i) => (
          <mesh key={`window-top-${i}`} position={[xOffset, wallHeight - 3, -90 + 0.2]} material={windowMaterial}>
            <boxGeometry args={[12, 2.5, 0.4]} />
          </mesh>
        ))}
        
        {/* Right wall windows */}
        {[-60, -20, 20, 60].map((zOffset, i) => (
          <mesh key={`window-right-${i}`} position={[100 - 0.2, wallHeight - 3, zOffset]} material={windowMaterial}>
            <boxGeometry args={[0.4, 2.5, 10]} />
          </mesh>
        ))}

        {/* ===== ROOFS ===== */}
        {/* Import Area roof */}
        <InclinedRoof 
          position={[-50, wallHeight, 45]} 
          width={100} 
          depth={90} 
          height={roofHeight}
          color={roofColor}
        />
        
        {/* Export Area roof */}
        <InclinedRoof 
          position={[50, wallHeight, 0]} 
          width={100} 
          depth={180} 
          height={roofHeight}
          color={roofColor}
        />

        {/* Building label */}
        <mesh position={[50, wallHeight - 2, -90 - 0.6]}>
          <boxGeometry args={[70, 5, 0.3]} />
          <meshStandardMaterial color="#1E3A5F" />
        </mesh>
      </group>
    )
  }

  // Regular rectangular building (Building 7)
  return (
    <group position={[posX, 0, posZ]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} receiveShadow>
        <planeGeometry args={[width - 2, depth - 2]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>

      {/* Walls */}
      {/* Front wall */}
      <mesh position={[0, wallHeight / 2, depth / 2]} material={wallMaterial} castShadow>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
      </mesh>
      
      {/* Back wall */}
      <mesh position={[0, wallHeight / 2, -depth / 2]} material={wallMaterial} castShadow>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
      </mesh>
      
      {/* Left wall */}
      <mesh position={[-width / 2, wallHeight / 2, 0]} material={wallMaterial} castShadow>
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
      </mesh>
      
      {/* Right wall */}
      <mesh position={[width / 2, wallHeight / 2, 0]} material={wallMaterial} castShadow>
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
      </mesh>

      {/* Windows */}
      {/* Back wall windows */}
      {[-30, 0, 30].map((xOffset, i) => (
        <mesh key={`window-back-${i}`} position={[xOffset, wallHeight - 3, -depth / 2 + 0.2]} material={windowMaterial}>
          <boxGeometry args={[12, 2.5, 0.4]} />
        </mesh>
      ))}
      
      {/* Left wall windows */}
      {[-20, 10, 40].map((zOffset, i) => (
        <mesh key={`window-left-${i}`} position={[-width / 2 + 0.2, wallHeight - 3, zOffset]} material={windowMaterial}>
          <boxGeometry args={[0.4, 2.5, 8]} />
        </mesh>
      ))}

      {/* Inclined Roof */}
      <InclinedRoof 
        position={[0, wallHeight, 0]} 
        width={width} 
        depth={depth} 
        height={roofHeight}
        color={roofColor}
      />

      {/* Building label */}
      <mesh position={[0, wallHeight - 2, -depth / 2 - 0.6]}>
        <boxGeometry args={[50, 4, 0.3]} />
        <meshStandardMaterial color="#1E3A5F" />
      </mesh>
    </group>
  )
}

// Export both buildings together
export function RoofedWarehouses() {
  return (
    <group>
      <RoofedWarehouse building={cargoBuilding8} isLShaped={true} />
      <RoofedWarehouse building={cargoBuilding7} isLShaped={false} />
    </group>
  )
}
