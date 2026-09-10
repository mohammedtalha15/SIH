'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface FloatingLabelProps {
  position: [number, number, number]
  text: string
  subtext?: string
  color?: string
  backgroundColor?: string
}

export function FloatingLabel({ 
  position, 
  text, 
  subtext,
  color = '#1F2937',
  backgroundColor = '#FFFFFF'
}: FloatingLabelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  // Gentle floating animation + billboard rotation (always face camera)
  useFrame((state) => {
    if (groupRef.current) {
      // Floating animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.3
      
      // Billboard effect - always face the camera
      groupRef.current.quaternion.copy(camera.quaternion)
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Background panel - more compact and less obstructive */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[subtext ? 20 : 16, subtext ? 6 : 4.5]} />
        <meshBasicMaterial 
          color={backgroundColor}
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </mesh>

      {/* Border - thinner border */}
      <mesh position={[0, 0, -0.09]}>
        <planeGeometry args={[subtext ? 20.4 : 16.4, subtext ? 6.4 : 4.9]} />
        <meshBasicMaterial 
          color="#1F2937"
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>

      {/* Main text - large but not too large */}
      <Text
        position={[0, subtext ? 1.2 : 0, 0]}
        fontSize={2.5}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.12}
        outlineColor="#FFFFFF"
        fontWeight={700}
      >
        {text}
      </Text>

      {/* Subtext - readable but compact */}
      {subtext && (
        <Text
          position={[0, -1, 0]}
          fontSize={1.6}
          color="#4B5563"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.08}
          outlineColor="#FFFFFF"
          fontWeight={600}
        >
          {subtext}
        </Text>
      )}
    </group>
  )
}
