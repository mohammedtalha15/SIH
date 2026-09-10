'use client'

import { useMemo } from 'react'

// Mount Fuji - far background, subtle
function MountFuji({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main mountain body */}
      <mesh position={[0, 25, 0]}>
        <coneGeometry args={[60, 50, 32]} />
        <meshStandardMaterial color="#A8B4C0" transparent opacity={0.4} flatShading />
      </mesh>
      {/* Snow cap */}
      <mesh position={[0, 42, 0]}>
        <coneGeometry args={[25, 16, 32]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.5} flatShading />
      </mesh>
      {/* Base foothills */}
      <mesh position={[0, 5, 0]}>
        <coneGeometry args={[80, 10, 32]} />
        <meshStandardMaterial color="#B8C8A0" transparent opacity={0.3} flatShading />
      </mesh>
    </group>
  )
}

// Sakura tree - subtle and transparent
function SakuraTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  // Generate random foliage positions with height info for fade effect
  const foliageData = useMemo(() => {
    const data: { pos: [number, number, number]; size: number; colorIndex: number }[] = []
    const count = 8
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const radius = 1.5 + Math.random() * 1
      const height = 3 + Math.random() * 2
      data.push({
        pos: [Math.cos(angle) * radius, height, Math.sin(angle) * radius],
        size: 0.8 + Math.random() * 0.4,
        colorIndex: i % 3,
      })
    }
    // Top center foliage
    data.push({ pos: [0, 5, 0], size: 1, colorIndex: 0 })
    data.push({ pos: [0.5, 4.5, 0.5], size: 0.9, colorIndex: 1 })
    data.push({ pos: [-0.5, 4.2, -0.3], size: 0.85, colorIndex: 2 })
    return data
  }, [])
  
  // Calculate opacity based on height (fade from bottom to top)
  const getOpacity = (height: number) => {
    // Height ranges from ~3 to ~5, map to opacity 0.15 to 0.35
    const minHeight = 3
    const maxHeight = 5
    const normalizedHeight = (height - minHeight) / (maxHeight - minHeight)
    return 0.15 + normalizedHeight * 0.2
  }
  
  const colors = ['#FFB7C5', '#FFC0CB', '#FFAEC9']
  
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk - very subtle */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 3, 8]} />
        <meshStandardMaterial color="#8B7355" transparent opacity={0.25} roughness={0.9} />
      </mesh>
      
      {/* Branches - very subtle */}
      <mesh position={[0.3, 2.5, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.05, 0.08, 1.5, 6]} />
        <meshStandardMaterial color="#8B7355" transparent opacity={0.2} roughness={0.9} />
      </mesh>
      <mesh position={[-0.3, 2.8, 0.2]} rotation={[0, 0, -Math.PI / 5]}>
        <cylinderGeometry args={[0.05, 0.08, 1.2, 6]} />
        <meshStandardMaterial color="#8B7355" transparent opacity={0.2} roughness={0.9} />
      </mesh>
      
      {/* Pink foliage clusters - fade from bottom to top */}
      {foliageData.map((item, i) => (
        <mesh key={i} position={item.pos}>
          <sphereGeometry args={[item.size, 8, 8]} />
          <meshStandardMaterial 
            color={colors[item.colorIndex]} 
            transparent
            opacity={getOpacity(item.pos[1])}
            roughness={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

// Grid floor component
function GridFloor() {
  return (
    <group>
      {/* Main white floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 200]} />
        <meshStandardMaterial color="#FAFAFA" roughness={0.9} metalness={0.05} />
      </mesh>
      
      {/* Grid lines - horizontal */}
      {Array.from({ length: 41 }).map((_, i) => {
        const z = (i - 20) * 5
        return (
          <mesh key={`h-${i}`} position={[0, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[300, 0.05]} />
            <meshBasicMaterial color="#E5E5E5" />
          </mesh>
        )
      })}
      
      {/* Grid lines - vertical */}
      {Array.from({ length: 61 }).map((_, i) => {
        const x = (i - 30) * 5
        return (
          <mesh key={`v-${i}`} position={[x, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.05, 200]} />
            <meshBasicMaterial color="#E5E5E5" />
          </mesh>
        )
      })}
    </group>
  )
}

// Loading zone marker
function LoadingZone({ position, width = 12, depth = 8 }: { 
  position: [number, number, number]
  width?: number
  depth?: number
}) {
  return (
    <group position={position}>
      {/* Zone area - subtle */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#F0F7FF" transparent opacity={0.8} />
      </mesh>
      {/* Zone border */}
      <mesh position={[0, 0.025, -depth/2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, 0.2]} />
        <meshStandardMaterial color="#0072CE" />
      </mesh>
      <mesh position={[0, 0.025, depth/2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, 0.2]} />
        <meshStandardMaterial color="#0072CE" />
      </mesh>
      <mesh position={[-width/2, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, depth]} />
        <meshStandardMaterial color="#0072CE" />
      </mesh>
      <mesh position={[width/2, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, depth]} />
        <meshStandardMaterial color="#0072CE" />
      </mesh>
    </group>
  )
}

// Road
function Road({ position, width, length, rotation = 0 }: {
  position: [number, number, number]
  width: number
  length: number
  rotation?: number
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#9CA3AF" roughness={0.9} />
      </mesh>
      {/* Center dashed line */}
      {Array.from({ length: Math.floor(length / 4) }).map((_, i) => (
        <mesh key={i} position={[0, 0.02, (i - Math.floor(length / 8)) * 4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.15, 2]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      ))}
    </group>
  )
}

export function Ground() {
  return (
    <group>
      {/* Clean white grid floor */}
      <GridFloor />
      
      {/* Front roads (incoming trucks) */}
      <Road position={[0, 0, 45]} width={10} length={120} />
      <Road position={[-22, 0, 30]} width={8} length={30} rotation={0} />
      <Road position={[22, 0, 30]} width={8} length={30} rotation={0} />
      
      {/* Back roads (outgoing ULDs to aircraft) */}
      <Road position={[0, 0, -45]} width={10} length={120} />
      <Road position={[-22, 0, -30]} width={8} length={30} rotation={0} />
      <Road position={[22, 0, -30]} width={8} length={30} rotation={0} />
      
      {/* Front loading zones (trucks) */}
      <LoadingZone position={[-22, 0, 22]} width={14} depth={6} />
      <LoadingZone position={[22, 0, 22]} width={14} depth={6} />
      
      {/* Back loading zones (ULDs) */}
      <LoadingZone position={[-22, 0, -22]} width={14} depth={6} />
      <LoadingZone position={[22, 0, -22]} width={14} depth={6} />
      
      {/* Warehouse area markers - front (INCOMING) */}
      <mesh position={[-22, 0.02, 16]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 0.8]} />
        <meshStandardMaterial color="#00467F" />
      </mesh>
      <mesh position={[22, 0.02, 16]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 0.8]} />
        <meshStandardMaterial color="#00467F" />
      </mesh>
      
      {/* Warehouse area markers - back (OUTGOING TO AIRCRAFT) */}
      <mesh position={[-22, 0.02, -16]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 0.8]} />
        <meshStandardMaterial color="#F59E0B" />
      </mesh>
      <mesh position={[22, 0.02, -16]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 0.8]} />
        <meshStandardMaterial color="#F59E0B" />
      </mesh>
      
      {/* === BACKGROUND SCENERY === */}
      
      {/* Mount Fuji - far background */}
      <MountFuji position={[0, 0, -180]} />
      
      {/* Sakura trees - scattered in background */}
      {/* Left side */}
      <SakuraTree position={[-80, 0, -60]} scale={2.5} />
      <SakuraTree position={[-95, 0, -40]} scale={2} />
      <SakuraTree position={[-85, 0, -20]} scale={2.2} />
      <SakuraTree position={[-90, 0, 10]} scale={1.8} />
      <SakuraTree position={[-75, 0, 40]} scale={2.3} />
      
      {/* Right side */}
      <SakuraTree position={[80, 0, -50]} scale={2.4} />
      <SakuraTree position={[90, 0, -25]} scale={2.1} />
      <SakuraTree position={[85, 0, 5]} scale={1.9} />
      <SakuraTree position={[95, 0, 35]} scale={2.2} />
      <SakuraTree position={[78, 0, 55]} scale={2} />
      
      {/* Far back corners */}
      <SakuraTree position={[-60, 0, -90]} scale={2.8} />
      <SakuraTree position={[60, 0, -90]} scale={2.6} />
      <SakuraTree position={[-40, 0, -95]} scale={2.3} />
      <SakuraTree position={[40, 0, -95]} scale={2.5} />
      
      {/* Distant background floor - grass hill effect */}
      <mesh position={[0, -0.5, -120]} rotation={[-Math.PI / 2.5, 0, 0]}>
        <planeGeometry args={[400, 150]} />
        <meshStandardMaterial color="#9CB071" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}
