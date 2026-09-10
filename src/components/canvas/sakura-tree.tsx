'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SakuraTreeProps {
  position: [number, number, number]
  scale?: number
}

export function SakuraTree({ position, scale = 1 }: SakuraTreeProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  // Trunk material - dark brown bark
  const trunkMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#3D2817',
      roughness: 0.9,
      metalness: 0,
    })
  }, [])
  
  // Branch material - slightly lighter brown
  const branchMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#4A3525',
      roughness: 0.85,
      metalness: 0,
    })
  }, [])
  
  // Sakura pink foliage - main blossoms
  const blossomMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#FFB7C5',
      roughness: 0.6,
      metalness: 0,
      transparent: true,
      opacity: 0.85,
    })
  }, [])
  
  // Deeper pink blossoms
  const blossomMaterial2 = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#FF91A4',
      roughness: 0.6,
      metalness: 0,
      transparent: true,
      opacity: 0.8,
    })
  }, [])
  
  // Light pink / white blossoms
  const blossomMaterial3 = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#FFDCE5',
      roughness: 0.6,
      metalness: 0,
      transparent: true,
      opacity: 0.75,
    })
  }, [])
  
  // Gentle sway animation
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime
      groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.015
    }
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Main trunk - thicker at base, curved */}
      <mesh position={[0, 2.5, 0]} material={trunkMaterial} castShadow>
        <cylinderGeometry args={[0.4, 0.7, 5, 8]} />
      </mesh>
      
      {/* Upper trunk section */}
      <mesh position={[0.1, 5.5, 0]} rotation={[0, 0, 0.1]} material={trunkMaterial} castShadow>
        <cylinderGeometry args={[0.25, 0.4, 3, 8]} />
      </mesh>
      
      {/* Main branch - left sweeping */}
      <mesh position={[-1.5, 5.5, 0]} rotation={[0, 0, -0.6]} material={branchMaterial} castShadow>
        <cylinderGeometry args={[0.12, 0.22, 4, 6]} />
      </mesh>
      
      {/* Main branch - right sweeping */}
      <mesh position={[1.3, 6, 0.2]} rotation={[0.1, 0, 0.5]} material={branchMaterial} castShadow>
        <cylinderGeometry args={[0.1, 0.2, 3.5, 6]} />
      </mesh>
      
      {/* Secondary branch - front */}
      <mesh position={[0.3, 5, 1.2]} rotation={[0.5, 0, 0.2]} material={branchMaterial} castShadow>
        <cylinderGeometry args={[0.08, 0.15, 3, 6]} />
      </mesh>
      
      {/* Secondary branch - back */}
      <mesh position={[-0.5, 5.5, -1]} rotation={[-0.4, 0, -0.3]} material={branchMaterial} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 2.8, 6]} />
      </mesh>
      
      {/* Smaller branches */}
      <mesh position={[-2.5, 6.5, 0.5]} rotation={[0.2, 0.3, -0.8]} material={branchMaterial} castShadow>
        <cylinderGeometry args={[0.05, 0.1, 2, 6]} />
      </mesh>
      <mesh position={[2, 7, -0.3]} rotation={[-0.1, 0, 0.7]} material={branchMaterial} castShadow>
        <cylinderGeometry args={[0.05, 0.1, 2.2, 6]} />
      </mesh>
      
      {/* ====== BLOSSOM CLUSTERS - Umbrella-like canopy ====== */}
      
      {/* Central top cluster */}
      <mesh position={[0, 8, 0]} material={blossomMaterial} castShadow receiveShadow>
        <sphereGeometry args={[2.5, 16, 12]} />
      </mesh>
      
      {/* Left spreading blossoms */}
      <mesh position={[-2.8, 7, 0]} material={blossomMaterial2} castShadow receiveShadow>
        <sphereGeometry args={[2.2, 14, 10]} />
      </mesh>
      <mesh position={[-3.5, 6.5, 1]} material={blossomMaterial3} castShadow receiveShadow>
        <sphereGeometry args={[1.5, 12, 10]} />
      </mesh>
      <mesh position={[-2.2, 7.5, -1]} material={blossomMaterial} castShadow receiveShadow>
        <sphereGeometry args={[1.3, 12, 10]} />
      </mesh>
      
      {/* Right spreading blossoms */}
      <mesh position={[2.5, 7.2, 0.2]} material={blossomMaterial} castShadow receiveShadow>
        <sphereGeometry args={[2, 14, 10]} />
      </mesh>
      <mesh position={[3.2, 6.8, -0.8]} material={blossomMaterial2} castShadow receiveShadow>
        <sphereGeometry args={[1.4, 12, 10]} />
      </mesh>
      <mesh position={[2, 7.8, 1]} material={blossomMaterial3} castShadow receiveShadow>
        <sphereGeometry args={[1.2, 12, 10]} />
      </mesh>
      
      {/* Front blossoms */}
      <mesh position={[0.5, 6.5, 2.5]} material={blossomMaterial2} castShadow receiveShadow>
        <sphereGeometry args={[1.8, 14, 10]} />
      </mesh>
      <mesh position={[-1, 7, 2]} material={blossomMaterial3} castShadow receiveShadow>
        <sphereGeometry args={[1.3, 12, 10]} />
      </mesh>
      <mesh position={[1.5, 7.2, 1.8]} material={blossomMaterial} castShadow receiveShadow>
        <sphereGeometry args={[1.1, 12, 10]} />
      </mesh>
      
      {/* Back blossoms */}
      <mesh position={[-0.3, 7, -2]} material={blossomMaterial} castShadow receiveShadow>
        <sphereGeometry args={[1.6, 14, 10]} />
      </mesh>
      <mesh position={[1, 6.8, -1.8]} material={blossomMaterial2} castShadow receiveShadow>
        <sphereGeometry args={[1.2, 12, 10]} />
      </mesh>
      
      {/* Upper canopy clusters */}
      <mesh position={[0, 9, 0]} material={blossomMaterial3} castShadow receiveShadow>
        <sphereGeometry args={[1.8, 14, 10]} />
      </mesh>
      <mesh position={[-1.2, 8.5, 0.5]} material={blossomMaterial} castShadow receiveShadow>
        <sphereGeometry args={[1.4, 12, 10]} />
      </mesh>
      <mesh position={[1, 8.8, -0.3]} material={blossomMaterial2} castShadow receiveShadow>
        <sphereGeometry args={[1.3, 12, 10]} />
      </mesh>
      
      {/* Drooping edge blossoms - characteristic of sakura */}
      <mesh position={[-3.8, 5.8, 0.5]} material={blossomMaterial3} castShadow receiveShadow>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
      <mesh position={[3.5, 6, 0]} material={blossomMaterial3} castShadow receiveShadow>
        <sphereGeometry args={[0.9, 10, 8]} />
      </mesh>
      <mesh position={[0, 5.5, 3]} material={blossomMaterial3} castShadow receiveShadow>
        <sphereGeometry args={[0.8, 10, 8]} />
      </mesh>
      <mesh position={[-1.5, 5.8, -2.2]} material={blossomMaterial3} castShadow receiveShadow>
        <sphereGeometry args={[0.85, 10, 8]} />
      </mesh>
    </group>
  )
}

// Group of sakura trees for easier placement
interface SakuraGroveProps {
  centerPosition: [number, number, number]
  count?: number
  radius?: number
}

export function SakuraGrove({ centerPosition, count = 5, radius = 15 }: SakuraGroveProps) {
  const trees = useMemo(() => {
    const result: { position: [number, number, number]; scale: number }[] = []
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const r = radius * (0.6 + Math.random() * 0.4)
      const x = centerPosition[0] + Math.cos(angle) * r
      const z = centerPosition[2] + Math.sin(angle) * r
      const scale = 0.8 + Math.random() * 0.4
      
      result.push({
        position: [x, centerPosition[1], z],
        scale,
      })
    }
    
    return result
  }, [centerPosition, count, radius])

  return (
    <group>
      {trees.map((tree, i) => (
        <SakuraTree
          key={`sakura-${i}`}
          position={tree.position}
          scale={tree.scale}
        />
      ))}
    </group>
  )
}
