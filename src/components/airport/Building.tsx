'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

import type { BuildingData } from './Buildings'
import { MATERIAL_COLORS } from '@/lib/constants'

type BuildingProps = {
  data: BuildingData
  onClick: (building: BuildingData) => void
}

export function Building({ data, onClick }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [pulsePhase, setPulsePhase] = useState(0)

  // Animate on hover
  useFrame((_, delta) => {
    if (!meshRef.current) return

    // Subtle floating animation when hovered
    if (isHovered) {
      setPulsePhase((prev) => (prev + delta * 2) % (Math.PI * 2))
      meshRef.current.position.y = data.height / 2 + Math.sin(pulsePhase) * 0.3
    } else {
      meshRef.current.position.y = data.height / 2
    }
  })

  // Material with emissive glow based on status
  const material = useMemo(() => {
    const baseColor = data.type === 'terminal' ? '#FFE66D' : '#FF6B6B'
    const emissiveColor = data.type === 'terminal' 
      ? MATERIAL_COLORS.buildingYellowEmissive 
      : MATERIAL_COLORS.buildingRedEmissive

    const status = data.status || 'idle'
    const statusIntensity = {
      active: 0.15,
      maintenance: 0.3,
      idle: 0.05,
    }

    return new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: emissiveColor,
      emissiveIntensity: isHovered ? 0.4 : statusIntensity[status],
      roughness: 0.6,
      metalness: 0.2,
    })
  }, [data.type, data.status, isHovered])

  // Roof material (slightly different shade)
  const roofMaterial = useMemo(() => {
    const baseColor = data.type === 'terminal' ? '#FFE66D' : '#FF6B6B'
    const color = new THREE.Color(baseColor).multiplyScalar(0.8)
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.3,
    })
  }, [data.type])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onClick(data)
  }

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsHovered(true)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    setIsHovered(false)
    document.body.style.cursor = 'auto'
  }

  // Calculate dimensions from position array or use defaults
  const [x, , z] = data.position
  const width = 20 // Default width
  const depth = 15 // Default depth
  const capacity = data.capacity || 100
  const occupancy = data.occupancy || 0
  const loadPercentage = Math.round((occupancy / capacity) * 100)

  return (
    <group position={[x, 0, z]}>
      {/* Main building body */}
      <mesh
        ref={meshRef}
        position={[0, data.height / 2, 0]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[width, data.height, depth]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Roof detail */}
      <mesh
        position={[0, data.height + 0.5, 0]}
        castShadow
      >
        <boxGeometry args={[width * 0.9, 1, depth * 0.9]} />
        <primitive object={roofMaterial} attach="material" />
      </mesh>

      {/* Loading bay indicators */}
      <LoadingBays 
        width={width} 
        depth={depth} 
        status={data.status || 'idle'}
      />

      {/* Hover label */}
      {isHovered && (
        <Html
          position={[0, data.height + 8, 0]}
          center
          distanceFactor={100}
          style={{ pointerEvents: 'none' }}
        >
          <div className="whitespace-nowrap rounded-lg bg-slate-900/95 px-3 py-2 text-center shadow-xl backdrop-blur-sm">
            <p className="font-mono text-sm font-bold text-white">{data.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${
                data.status === 'active' ? 'bg-emerald-500' :
                data.status === 'maintenance' ? 'bg-amber-500 animate-pulse' :
                'bg-slate-500'
              }`} />
              <span className="font-mono text-xs text-slate-300">
                {loadPercentage}% Full
              </span>
            </div>
          </div>
        </Html>
      )}

      {/* Status light on top */}
      <StatusLight 
        position={[0, data.height + 2, 0]} 
        status={data.status || 'idle'}
      />
    </group>
  )
}

// Loading bay doors on the side of the building
function LoadingBays({ width, depth, status }: { width: number; depth: number; status: 'active' | 'maintenance' | 'idle' }) {
  const bayCount = Math.max(2, Math.floor(width / 8))
  const bayWidth = 3
  const bayHeight = 4
  const spacing = width / (bayCount + 1)

  return (
    <group position={[0, bayHeight / 2, depth / 2 + 0.1]}>
      {Array.from({ length: bayCount }).map((_, i) => (
        <mesh key={i} position={[spacing * (i + 1) - width / 2, 0, 0]}>
          <boxGeometry args={[bayWidth, bayHeight, 0.2]} />
          <meshStandardMaterial
            color={status === 'maintenance' ? '#fbbf24' : '#374151'}
            emissive={status === 'maintenance' ? '#fbbf24' : '#000000'}
            emissiveIntensity={status === 'maintenance' ? 0.5 : 0}
          />
        </mesh>
      ))}
    </group>
  )
}

// Blinking status light on building roof
function StatusLight({ position, status }: { position: [number, number, number]; status: 'active' | 'maintenance' | 'idle' }) {
  const lightRef = useRef<THREE.PointLight>(null)
  const [intensity, setIntensity] = useState(1)

  useFrame((_, delta) => {
    if (status === 'maintenance') {
      setIntensity((prev) => {
        const newVal = prev + delta * 4
        return newVal > Math.PI * 2 ? 0 : newVal
      })
    }
  })

  const color = status === 'active' ? '#22c55e' : status === 'maintenance' ? '#fbbf24' : '#6b7280'
  const pulseIntensity = status === 'maintenance' ? Math.abs(Math.sin(intensity)) * 2 : 1

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={pulseIntensity}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        color={color}
        intensity={pulseIntensity * 0.5}
        distance={15}
      />
    </group>
  )
}

