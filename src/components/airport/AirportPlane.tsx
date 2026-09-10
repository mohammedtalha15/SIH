'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Realistic 3D Airplane Model - ANA Cargo Style
 * White body with green accents, animated flight path
 */

export function AirportPlane() {
  const groupRef = useRef<THREE.Group>(null)
  const startPoint = new THREE.Vector3(-33.53, 5, 31.00)
  const endPoint = new THREE.Vector3(54.85, 5, 31.00)
  const progressRef = useRef(0)
  const speed = 0.45 // units per second
  
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    // Calculate distance
    const distance = startPoint.distanceTo(endPoint)
    
    // Update progress (0 to 1)
    progressRef.current += (speed * delta) / distance
    if (progressRef.current > 1) {
      progressRef.current = 0 // Loop back to start
    }
    
    // Interpolate position
    const currentPos = new THREE.Vector3().lerpVectors(startPoint, endPoint, progressRef.current)
    groupRef.current.position.copy(currentPos)
    
    // Make plane look towards destination
    const direction = new THREE.Vector3().subVectors(endPoint, currentPos).normalize()
    if (direction.length() > 0) {
      groupRef.current.lookAt(currentPos.clone().add(direction))
    }
  })
  
  return (
    <group ref={groupRef} position={startPoint} scale={[0.5, 0.5, 0.5]}>
      {/* Main fuselage - white */}
      <mesh castShadow position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.2, 1.2, 12]} />
        <meshStandardMaterial color="#FFFFFF" metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Nose cone - white */}
      <mesh castShadow position={[0, 0, 6.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.6, 1.5, 8]} />
        <meshStandardMaterial color="#F5F5F5" metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* Main wings - white */}
      <mesh castShadow position={[0, -0.3, 1]}>
        <boxGeometry args={[18, 0.3, 2.5]} />
        <meshStandardMaterial color="#FFFFFF" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Wing engines - green accents */}
      <mesh castShadow position={[-6, -0.8, 1]}>
        <cylinderGeometry args={[0.6, 0.6, 1.5, 8]} />
        <meshStandardMaterial color="#2E7D32" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[6, -0.8, 1]}>
        <cylinderGeometry args={[0.6, 0.6, 1.5, 8]} />
        <meshStandardMaterial color="#2E7D32" metalness={0.4} roughness={0.5} />
      </mesh>
      
      {/* Green stripe on fuselage */}
      <mesh position={[0, -0.65, 0]}>
        <boxGeometry args={[1.25, 0.4, 10]} />
        <meshStandardMaterial color="#2E7D32" metalness={0.3} roughness={0.6} />
      </mesh>
      
      {/* Vertical tail fin - white with green */}
      <mesh castShadow position={[0, 1.2, -5]}>
        <boxGeometry args={[0.2, 2.2, 1.5]} />
        <meshStandardMaterial color="#FFFFFF" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.8, -5]}>
        <boxGeometry args={[0.25, 1.2, 1.2]} />
        <meshStandardMaterial color="#2E7D32" metalness={0.4} roughness={0.5} />
      </mesh>
      
      {/* Horizontal tail stabilizers - white */}
      <mesh castShadow position={[0, 1, -5.5]}>
        <boxGeometry args={[5, 0.2, 1.2]} />
        <meshStandardMaterial color="#FFFFFF" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Windows - dark tinted */}
      <mesh position={[0.61, 0.2, 3]}>
        <boxGeometry args={[0.02, 0.4, 2]} />
        <meshStandardMaterial color="#1A237E" metalness={0.8} roughness={0.1} />
      </mesh>
      <mesh position={[-0.61, 0.2, 3]}>
        <boxGeometry args={[0.02, 0.4, 2]} />
        <meshStandardMaterial color="#1A237E" metalness={0.8} roughness={0.1} />
      </mesh>
      
      {/* Landing gear - simplified */}
      {/* Front gear */}
      <mesh castShadow position={[0, -0.8, 2.5]}>
        <cylinderGeometry args={[0.15, 0.15, 0.5, 6]} />
        <meshStandardMaterial color="#424242" metalness={0.6} roughness={0.7} />
      </mesh>
      
      {/* Rear gear - left */}
      <mesh castShadow position={[-0.8, -0.9, -1]}>
        <cylinderGeometry args={[0.2, 0.2, 0.6, 6]} />
        <meshStandardMaterial color="#424242" metalness={0.6} roughness={0.7} />
      </mesh>
      
      {/* Rear gear - right */}
      <mesh castShadow position={[0.8, -0.9, -1]}>
        <cylinderGeometry args={[0.2, 0.2, 0.6, 6]} />
        <meshStandardMaterial color="#424242" metalness={0.6} roughness={0.7} />
      </mesh>
    </group>
  )
}
