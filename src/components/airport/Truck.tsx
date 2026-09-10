'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { MATERIAL_COLORS } from '@/lib/constants'

type TruckPath = {
  waypoints: [number, number, number][]
  speed?: number
  color?: string
}

type TruckProps = {
  path: TruckPath
}

export function Truck({ path }: TruckProps) {
  const groupRef = useRef<THREE.Group>(null)
  const progressRef = useRef(0)

  // Create a smooth curve from waypoints
  const curve = useMemo(() => {
    const points = path.waypoints.map(
      ([x, y, z]) => new THREE.Vector3(x, y, z)
    )
    return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5)
  }, [path.waypoints])

  // Animate along the path
  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Update progress
    const speed = path.speed || 1
    progressRef.current += delta * speed * 0.1
    if (progressRef.current > 1) progressRef.current = 0

    // Get position and direction on curve
    const point = curve.getPoint(progressRef.current)
    const tangent = curve.getTangent(progressRef.current)

    // Update position
    groupRef.current.position.copy(point)

    // Update rotation to face movement direction
    const lookAt = point.clone().add(tangent)
    groupRef.current.lookAt(lookAt)
  })

  return (
    <group ref={groupRef}>
      <TruckMesh color={path.color || '#FF6B6B'} />
      
      {/* Headlights */}
      <pointLight
        position={[0, 0.8, 2]}
        color="#fffbe6"
        intensity={0.8}
        distance={15}
      />
    </group>
  )
}

function TruckMesh({ color }: { color: string }) {
  return (
    <group>
      {/* Truck cab */}
      <mesh position={[0, 1, 1.5]} castShadow>
        <boxGeometry args={[2, 1.8, 2]} />
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>

      {/* Cab roof */}
      <mesh position={[0, 2.1, 1.2]} castShadow>
        <boxGeometry args={[1.8, 0.4, 1.5]} />
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 1.2, 2.51]}>
        <planeGeometry args={[1.6, 1]} />
        <meshStandardMaterial
          color="#1e3a5f"
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Cargo container */}
      <mesh position={[0, 1.2, -1.5]} castShadow>
        <boxGeometry args={[2.2, 2.2, 5]} />
        <meshStandardMaterial
          color={MATERIAL_COLORS.truckCargo}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Container door lines */}
      <mesh position={[0, 1.2, -4.01]}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial
          color="#5d4524"
          roughness={0.9}
        />
      </mesh>

      {/* Wheels */}
      <Wheel position={[-1.1, 0.4, 1.5]} />
      <Wheel position={[1.1, 0.4, 1.5]} />
      <Wheel position={[-1.1, 0.4, -1]} />
      <Wheel position={[1.1, 0.4, -1]} />
      <Wheel position={[-1.1, 0.4, -3]} />
      <Wheel position={[1.1, 0.4, -3]} />
    </group>
  )
}

function Wheel({ position }: { position: [number, number, number] }) {
  const wheelRef = useRef<THREE.Mesh>(null)

  // Rotate wheels
  useFrame((_, delta) => {
    if (wheelRef.current) {
      wheelRef.current.rotation.x += delta * 5
    }
  })

  return (
    <mesh ref={wheelRef} position={position} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
      <meshStandardMaterial color="#1f2937" roughness={0.9} metalness={0.1} />
    </mesh>
  )
}

// Debug: visualize the truck path
export function TruckPathVisualization({ path }: { path: TruckPath }) {
  const points = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      path.waypoints.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      true
    )
    return curve.getPoints(50)
  }, [path.waypoints])

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    return geometry
  }, [points])

  return (
    <line>
      <primitive object={lineGeometry} attach="geometry" />
      <lineBasicMaterial color={path.color} opacity={0.3} transparent />
    </line>
  )
}

