'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ULDTrolleyProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  onClick?: () => void
  status?: 'loading' | 'loaded' | 'unloading' | 'empty' | 'gone'
  uldType?: 'AKE' | 'AKH' | 'LD3' | 'LD7' | 'PMC'
}

export function ULDTrolleyModel({ 
  position, 
  rotation = [0, 0, 0], 
  onClick,
  status = 'loaded',
  uldType = 'LD3'
}: ULDTrolleyProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  // Subtle bounce animation when hovered
  useFrame((state) => {
    if (groupRef.current && hovered) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.05
    } else if (groupRef.current) {
      groupRef.current.position.y = position[1]
    }
  })

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return '#fbbf24' // yellow
      case 'loaded':
        return '#4ade80' // green
      case 'unloading':
        return '#fb923c' // orange
      case 'empty':
        return '#94a3b8' // gray
      default:
        return '#60a5fa' // blue
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
      {/* Trolley base with wheels - larger */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[4, 0.15, 5]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Wheels - larger */}
      {[
        [-1.6, 0.2, 2.2],
        [1.6, 0.2, 2.2],
        [-1.6, 0.2, -2.2],
        [1.6, 0.2, -2.2],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      ))}

      {/* ULD Container - bigger */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[3.5, 3, 4.5]} />
        <meshStandardMaterial 
          color="#2563EB" 
          metalness={0.4} 
          roughness={0.5}
          emissive="#2563EB"
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </mesh>

      {/* ULD Type Label */}
      <mesh position={[0, 4.2, 0]}>
        <boxGeometry args={[1.5, 0.4, 0.1]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Status indicator light on top */}
      <mesh position={[0, 4.8, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color={getStatusColor()}
          emissive={getStatusColor()}
          emissiveIntensity={hovered ? 1.5 : 1}
        />
      </mesh>

      {/* Handle bars - larger */}
      <mesh position={[0, 2, -2.5]}>
        <boxGeometry args={[3, 0.15, 0.15]} />
        <meshStandardMaterial color="#555555" metalness={0.5} />
      </mesh>
      <mesh position={[-1.5, 3, -2.5]}>
        <boxGeometry args={[0.15, 2, 0.15]} />
        <meshStandardMaterial color="#555555" metalness={0.5} />
      </mesh>
      <mesh position={[1.5, 3, -2.5]}>
        <boxGeometry args={[0.15, 2, 0.15]} />
        <meshStandardMaterial color="#555555" metalness={0.5} />
      </mesh>

      {/* Hover highlight - ground circle */}
      {hovered && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3.5, 32]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Invisible collision box for better clicking */}
      {onClick && (
        <mesh visible={false} position={[0, 2.5, 0]}>
          <boxGeometry args={[4.5, 5, 6]} />
        </mesh>
      )}
    </group>
  )
}
