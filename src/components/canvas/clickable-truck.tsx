'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshStandardMaterial } from 'three'
import * as THREE from 'three'

type ClickableTruckProps = {
  position: [number, number, number]
  rotation?: [number, number, number]
  color?: string
  onClick?: () => void
  status?: 'arriving' | 'unloading' | 'departing' | 'gone'
}

export function ClickableTruck({ 
  position, 
  rotation = [0, 0, 0], 
  color = '#1E3A5F',
  onClick,
  status = 'unloading'
}: ClickableTruckProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

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
    [color]
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

  // Subtle bounce animation when hovered
  useFrame((state) => {
    if (groupRef.current && hovered) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1
    } else if (groupRef.current) {
      groupRef.current.position.y = position[1]
    }
  })

  const getStatusColor = () => {
    switch (status) {
      case 'arriving':
        return '#fbbf24' // yellow
      case 'unloading':
        return '#4ade80' // green
      case 'departing':
        return '#fb923c' // orange
      default:
        return '#94a3b8' // gray
    }
  }

  return (
    <group 
      ref={groupRef}
      position={position} 
      rotation={rotation}
      onClick={onClick}
      onPointerEnter={(e) => {
        setHovered(true)
        if (e.stopPropagation) e.stopPropagation()
        if (onClick) document.body.style.cursor = 'pointer'
      }}
      onPointerLeave={() => {
        setHovered(false)
        if (onClick) document.body.style.cursor = 'default'
      }}
    >
      {/* Cab - larger */}
      <mesh position={[0, 1.6, 3.5]} material={cabMaterial} castShadow>
        <boxGeometry args={[3.2, 3.2, 2.8]} />
      </mesh>
      
      {/* Cab windshield */}
      <mesh position={[0, 2, 4.9]} material={windowMaterial}>
        <boxGeometry args={[3, 2, 0.15]} />
      </mesh>
      
      {/* Side windows */}
      <mesh position={[1.7, 2, 3.5]} material={windowMaterial}>
        <boxGeometry args={[0.15, 1.6, 2]} />
      </mesh>
      <mesh position={[-1.7, 2, 3.5]} material={windowMaterial}>
        <boxGeometry args={[0.15, 1.6, 2]} />
      </mesh>

      {/* Trailer - larger */}
      <mesh position={[0, 2.4, -4]} material={trailerMaterial} castShadow>
        <boxGeometry args={[3.5, 4, 11]} />
      </mesh>

      {/* Status indicator light on top of trailer */}
      <mesh position={[0, 4.8, -4]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial 
          color={getStatusColor()}
          emissive={getStatusColor()}
          emissiveIntensity={hovered ? 1.5 : 1}
        />
      </mesh>

      {/* Wheels - larger */}
      {[
        [1.4, 0.5, 2.8],
        [-1.4, 0.5, 2.8],
        [1.4, 0.5, -1.4],
        [-1.4, 0.5, -1.4],
        [1.4, 0.5, -7],
        [-1.4, 0.5, -7],
      ].map(([x, y, z], i) => (
        <mesh
          key={`wheel-${i}`}
          position={[x, y, z]}
          rotation={[0, 0, Math.PI / 2]}
          material={wheelMaterial}
          castShadow
        >
          <cylinderGeometry args={[0.55, 0.55, 0.4, 16]} />
        </mesh>
      ))}

      {/* Hover highlight - ground circle */}
      {hovered && (
        <mesh position={[0, 0.02, -1]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[5.5, 32]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Invisible collision box for better clicking */}
      {onClick && (
        <mesh visible={false} position={[0, 2.5, -1]}>
          <boxGeometry args={[5, 5, 14]} />
        </mesh>
      )}
    </group>
  )
}
