import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface SimplePlaneProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  onClick?: () => void
  status?: string
  scale?: number
}

export function SimplePlane({ position, rotation = [0, Math.PI, 0], onClick, status, scale = 0.35 }: SimplePlaneProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  
  // Load the Boeing 767 model
  const { scene } = useGLTF('/blank_boeing-767.glb')
  const clonedScene = useMemo(() => scene.clone(), [scene])

  // Subtle hover animation
  useFrame((state) => {
    if (groupRef.current && hovered) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05
    } else if (groupRef.current) {
      groupRef.current.position.y = position[1]
    }
  })

  const getStatusColor = () => {
    switch (status) {
      case 'ARRIVED':
        return '#4ade80' // green
      case 'UNLOADING':
        return '#fbbf24' // yellow
      case 'LOADING':
        return '#fb923c' // orange
      case 'DEPARTED':
        return '#94a3b8' // gray
      default:
        return '#60a5fa' // blue (inbound)
    }
  }

  return (
    <group 
      ref={groupRef}
      position={position} 
      rotation={rotation}
      scale={[scale, scale, scale]}
      onClick={onClick}
      onPointerEnter={(e) => {
        setHovered(true)
        if (e.stopPropagation) e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerLeave={() => {
        setHovered(false)
        document.body.style.cursor = 'default'
      }}
    >
      {/* Boeing 767 Model */}
      <primitive 
        object={clonedScene} 
        castShadow 
        receiveShadow
      />

      {/* Status indicator light - positioned above the plane */}
      <mesh position={[0, 8, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial 
          color={getStatusColor()}
          emissive={getStatusColor()}
          emissiveIntensity={hovered ? 1.5 : 1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Hover effect - invisible collision box */}
      {onClick && (
        <mesh visible={false} position={[0, 2, 0]}>
          <boxGeometry args={[40, 12, 50]} />
        </mesh>
      )}
    </group>
  )
}

// Preload the model for better performance
useGLTF.preload('/blank_boeing-767.glb')
