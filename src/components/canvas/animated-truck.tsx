'use client'

import { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useSelection } from './warehouse-scene'
import { useWarehouseInventory, TrackedPackage } from '@/lib/warehouse-inventory'
import type { Truck, CargoItem } from '@/lib/types'

// Colors
const ANA_BLUE = '#00467F'
const TRUCK_WHITE = '#FFFFFF'
const WHEEL_COLOR = '#1F2937'
const HIGHLIGHT_COLOR = '#60A5FA'
const SELECTED_COLOR = '#3B82F6'

// Number of packages per truck
const NUM_PACKAGES = 5

// Destinations and origins for package generation
const destinations = ['Tokyo, Japan', 'Los Angeles, USA', 'Singapore', 'Hong Kong', 'Shanghai, China']
const origins = ['Narita, Japan', 'San Francisco, USA', 'Taipei, Taiwan', 'Manila, Philippines', 'Jakarta, Indonesia']
const descriptions = ['Electronic Components', 'Medical Supplies', 'Automotive Parts', 'Fashion Apparel', 'Fresh Seafood']
const companies = ['ANA Cargo Logistics', 'Nippon Express', 'Yamato Transport', 'Sagawa Express']
const drivers = ['Tanaka Hiroshi', 'Suzuki Kenji', 'Watanabe Yuki', 'Takahashi Ryo']

// Generate a tracked package
function generateTrackedPackage(index: number): TrackedPackage {
  const priorities: ('standard' | 'express' | 'priority')[] = ['standard', 'express', 'priority']
  
  return {
    id: `PKG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    trackingNumber: `AWB${Math.floor(Math.random() * 900000000) + 100000000}`,
    description: descriptions[index % descriptions.length],
    weight: Math.floor(Math.random() * 100) + 20,
    dimensions: {
      w: Math.floor(Math.random() * 50) + 30,
      h: Math.floor(Math.random() * 40) + 20,
      d: Math.floor(Math.random() * 50) + 30,
    },
    origin: origins[Math.floor(Math.random() * origins.length)],
    destination: destinations[Math.floor(Math.random() * destinations.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status: 'on-truck',
    createdAt: new Date(),
  }
}

// Generate truck data with packages
function generateTruckData(): { truck: Omit<Truck, 'packages' | 'totalWeight'>; packages: TrackedPackage[] } {
  const plateChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const plateNumber = `${plateChars[Math.floor(Math.random() * 26)]}${plateChars[Math.floor(Math.random() * 26)]}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90) + 10}`
  
  const packages = Array.from({ length: NUM_PACKAGES }, (_, i) => generateTrackedPackage(i))
  
  return {
    truck: {
      id: `TRK-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      plateNumber,
      driver: drivers[Math.floor(Math.random() * drivers.length)],
      company: companies[Math.floor(Math.random() * companies.length)],
      origin: origins[Math.floor(Math.random() * origins.length)],
      destination: 'NRT Cargo Terminal',
      arrivalTime: new Date(),
      status: 'approaching',
    },
    packages,
  }
}

// Convert TrackedPackage to CargoItem for display
function toCargoItem(pkg: TrackedPackage): CargoItem {
  return {
    id: pkg.id,
    description: pkg.description,
    weight: pkg.weight,
    dimensions: pkg.dimensions,
    destination: pkg.destination,
    origin: pkg.origin,
    priority: pkg.priority,
    handler: pkg.truckId || 'Truck',
    trackingNumber: pkg.trackingNumber,
  }
}

// Wheel component
function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color={WHEEL_COLOR} roughness={0.8} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.16, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
        <meshStandardMaterial color="#9CA3AF" metalness={0.5} />
      </mesh>
    </group>
  )
}

// Cargo boxes being unloaded
function UnloadingCargo({ show, progress, packages }: { 
  show: boolean
  progress: number
  packages: TrackedPackage[]
}) {
  if (!show || packages.length === 0) return null
  
  const colors = ['#C4A574', '#B8956A', '#D4B584', '#CAA070', '#BFA068']
  
  return (
    <group position={[0, 0, -3.5]}>
      {packages.map((pkg, i) => {
        const boxProgress = Math.max(0, Math.min(1, (progress - i * 0.15) / 0.3))
        if (boxProgress <= 0 || boxProgress >= 1) return null
        
        const x = ((i % 3) - 1) * 0.6
        const row = Math.floor(i / 3)
        const z = -0.5 - boxProgress * 2.5 - row * 0.3
        const y = 1 - boxProgress * 0.7
        
        return (
          <mesh key={pkg.id} position={[x, y, z]}>
            <boxGeometry args={[0.5, 0.4, 0.5]} />
            <meshStandardMaterial color={colors[i % colors.length]} />
          </mesh>
        )
      })}
    </group>
  )
}

// Truck body
function TruckBody({ 
  onClick, 
  onPointerOver, 
  onPointerOut 
}: { 
  onClick: (e: ThreeEvent<MouseEvent>) => void
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut: () => void
}) {
  return (
    <group onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      {/* Cab */}
      <mesh position={[0, 1, 1.5]} castShadow>
        <boxGeometry args={[2.2, 1.8, 2]} />
        <meshStandardMaterial color={TRUCK_WHITE} />
      </mesh>
      
      <mesh position={[0, 2, 1.5]}>
        <boxGeometry args={[2.2, 0.2, 2]} />
        <meshStandardMaterial color={ANA_BLUE} />
      </mesh>
      
      <mesh position={[0, 1.2, 2.51]}>
        <planeGeometry args={[1.8, 1]} />
        <meshPhysicalMaterial color="#87CEEB" transparent opacity={0.6} />
      </mesh>
      
      {/* Cargo container */}
      <mesh position={[0, 1.2, -1.2]} castShadow>
        <boxGeometry args={[2.4, 2.2, 4]} />
        <meshStandardMaterial color={TRUCK_WHITE} />
      </mesh>
      
      <mesh position={[1.21, 1.2, -1.2]}>
        <planeGeometry args={[4, 0.4]} />
        <meshStandardMaterial color={ANA_BLUE} />
      </mesh>
      <mesh position={[-1.21, 1.2, -1.2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[4, 0.4]} />
        <meshStandardMaterial color={ANA_BLUE} />
      </mesh>
      
      <mesh position={[0, 1.2, -3.21]}>
        <planeGeometry args={[2.3, 2.1]} />
        <meshStandardMaterial color="#D1D5DB" />
      </mesh>
      
      {/* Chassis */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[2, 0.3, 6]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      
      {/* Wheels */}
      <Wheel position={[-1.1, 0.4, 1.5]} />
      <Wheel position={[1.1, 0.4, 1.5]} />
      <Wheel position={[-1.1, 0.4, -1]} />
      <Wheel position={[1.1, 0.4, -1]} />
      <Wheel position={[-1.1, 0.4, -2.2]} />
      <Wheel position={[1.1, 0.4, -2.2]} />
      
      {/* Lights */}
      <mesh position={[-0.7, 0.8, 2.51]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color="#FEF3C7" emissive="#FEF3C7" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.7, 0.8, 2.51]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color="#FEF3C7" emissive="#FEF3C7" emissiveIntensity={0.3} />
      </mesh>
      
      <mesh position={[-1, 0.6, -3.21]}>
        <boxGeometry args={[0.2, 0.15, 0.02]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[1, 0.6, -3.21]}>
        <boxGeometry args={[0.2, 0.15, 0.02]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.2} />
      </mesh>
      
      {/* Mirrors */}
      <mesh position={[-1.3, 1.3, 2]}>
        <boxGeometry args={[0.3, 0.2, 0.15]} />
        <meshStandardMaterial color="#1F2937" />
      </mesh>
      <mesh position={[1.3, 1.3, 2]}>
        <boxGeometry args={[0.3, 0.2, 0.15]} />
        <meshStandardMaterial color="#1F2937" />
      </mesh>
    </group>
  )
}

type AnimPhase = 'approaching' | 'reversing' | 'unloading' | 'departing' | 'waiting'

export function AnimatedTruck({ 
  xPosition,
  doorZ,
  delay = 0,
  warehouseId = 'warehouse-1',
}: { 
  xPosition: number
  doorZ: number
  delay?: number
  warehouseId?: string
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { setSelected, selected } = useSelection()
  const { unloadPackagesToWarehouse } = useWarehouseInventory()
  
  const [truckInfo, setTruckInfo] = useState(() => generateTruckData())
  const [phase, setPhase] = useState<AnimPhase>('approaching')
  const [progress, setProgress] = useState(0)
  const [unloadedIndices, setUnloadedIndices] = useState<Set<number>>(new Set())
  const [hasUnloadedToWarehouse, setHasUnloadedToWarehouse] = useState(false)
  
  const timeRef = useRef(-delay)
  
  // Animation timing
  const APPROACH_TIME = 8
  const REVERSE_TIME = 6
  const UNLOAD_TIME = 6
  const DEPART_TIME = 7
  const WAIT_TIME = 4
  const TOTAL_TIME = APPROACH_TIME + REVERSE_TIME + UNLOAD_TIME + DEPART_TIME + WAIT_TIME
  
  // Positions
  const startZ = doorZ + 50
  const atDoorZ = doorZ + 15
  const unloadZ = doorZ + 6
  const departEndZ = doorZ + 55
  
  // Get remaining packages
  const remainingPackages = useMemo(() => {
    return truckInfo.packages.filter((_, i) => !unloadedIndices.has(i))
  }, [truckInfo.packages, unloadedIndices])
  
  // Handle unloading complete - add packages to warehouse
  const handleUnloadComplete = useCallback(() => {
    if (!hasUnloadedToWarehouse && truckInfo.packages.length > 0) {
      // Mark packages with warehouse assignment
      const packagesToUnload = truckInfo.packages.map(pkg => ({
        ...pkg,
        status: 'in-warehouse' as const,
        arrivedAt: new Date(),
      }))
      
      unloadPackagesToWarehouse(packagesToUnload, warehouseId)
      setHasUnloadedToWarehouse(true)
    }
  }, [hasUnloadedToWarehouse, truckInfo.packages, unloadPackagesToWarehouse, warehouseId])
  
  useFrame((_, delta) => {
    if (!groupRef.current) return
    
    timeRef.current += delta
    
    if (timeRef.current < 0) {
      groupRef.current.visible = false
      return
    }
    
    groupRef.current.visible = true
    
    const cycleTime = timeRef.current % TOTAL_TIME
    let currentPhase: AnimPhase
    let currentProgress: number
    let z: number
    
    const t1 = APPROACH_TIME
    const t2 = t1 + REVERSE_TIME
    const t3 = t2 + UNLOAD_TIME
    const t4 = t3 + DEPART_TIME
    
    if (cycleTime < t1) {
      currentPhase = 'approaching'
      currentProgress = cycleTime / APPROACH_TIME
      const eased = 1 - Math.pow(1 - currentProgress, 3)
      z = THREE.MathUtils.lerp(startZ, atDoorZ, eased)
      
    } else if (cycleTime < t2) {
      currentPhase = 'reversing'
      currentProgress = (cycleTime - t1) / REVERSE_TIME
      const eased = currentProgress * (2 - currentProgress)
      z = THREE.MathUtils.lerp(atDoorZ, unloadZ, eased)
      
    } else if (cycleTime < t3) {
      currentPhase = 'unloading'
      currentProgress = (cycleTime - t2) / UNLOAD_TIME
      z = unloadZ
      
      // Track which packages have been unloaded based on progress
      const newUnloadedCount = Math.min(
        NUM_PACKAGES,
        Math.floor((currentProgress + 0.15) / 0.15)
      )
      
      if (newUnloadedCount > unloadedIndices.size) {
        const newSet = new Set(unloadedIndices)
        for (let i = unloadedIndices.size; i < newUnloadedCount; i++) {
          newSet.add(i)
        }
        setUnloadedIndices(newSet)
      }
      
    } else if (cycleTime < t4) {
      currentPhase = 'departing'
      currentProgress = (cycleTime - t3) / DEPART_TIME
      const eased = currentProgress * currentProgress
      z = THREE.MathUtils.lerp(unloadZ, departEndZ, eased)
      
      // Trigger warehouse update when departing starts
      if (!hasUnloadedToWarehouse) {
        handleUnloadComplete()
      }
      
    } else {
      currentPhase = 'waiting'
      currentProgress = (cycleTime - t4) / WAIT_TIME
      z = startZ
      
      // Reset for next cycle
      if (phase !== 'waiting') {
        setTruckInfo(generateTruckData())
        setUnloadedIndices(new Set())
        setHasUnloadedToWarehouse(false)
      }
    }
    
    setPhase(currentPhase)
    setProgress(currentProgress)
    
    groupRef.current.position.x = xPosition
    groupRef.current.position.z = z
    groupRef.current.rotation.y = 0
  })
  
  // Real-time update of selected truck info
  useEffect(() => {
    if (selected?.type === 'truck' && selected?.id === truckInfo.truck.id) {
      const statusMap: Record<AnimPhase, 'approaching' | 'unloading' | 'departing'> = {
        approaching: 'approaching',
        reversing: 'approaching',
        unloading: 'unloading',
        departing: 'departing',
        waiting: 'departing',
      }
      
      const totalWeight = remainingPackages.reduce((sum, pkg) => sum + pkg.weight, 0)
      
      const displayData: Truck = {
        ...truckInfo.truck,
        packages: remainingPackages.map(toCargoItem),
        totalWeight,
        status: statusMap[phase],
        unloadedCount: unloadedIndices.size,
        totalToUnload: NUM_PACKAGES,
      }
      
      setSelected({
        type: 'truck',
        id: truckInfo.truck.id,
        position: [xPosition, 0, groupRef.current?.position.z || 0],
        data: displayData,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unloadedIndices.size, phase])
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    
    const statusMap: Record<AnimPhase, 'approaching' | 'unloading' | 'departing'> = {
      approaching: 'approaching',
      reversing: 'approaching',
      unloading: 'unloading',
      departing: 'departing',
      waiting: 'departing',
    }
    
    const totalWeight = remainingPackages.reduce((sum, pkg) => sum + pkg.weight, 0)
    
    const displayData: Truck = {
      ...truckInfo.truck,
      packages: remainingPackages.map(toCargoItem),
      totalWeight,
      status: statusMap[phase],
      unloadedCount: unloadedIndices.size,
      totalToUnload: NUM_PACKAGES,
    }
    
    setSelected({
      type: 'truck',
      id: truckInfo.truck.id,
      position: [xPosition, 0, groupRef.current?.position.z || 0],
      data: displayData,
    })
  }
  
  const isVisible = phase !== 'waiting'
  const [isHovered, setIsHovered] = useState(false)
  const isSelected = selected?.type === 'truck' && selected?.id === truckInfo.truck.id
  
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsHovered(true)
    document.body.style.cursor = 'pointer'
  }
  
  const handlePointerOut = () => {
    setIsHovered(false)
    document.body.style.cursor = 'auto'
  }

  return (
    <group ref={groupRef} visible={isVisible}>
      <TruckBody 
        onClick={handleClick} 
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      <UnloadingCargo 
        show={phase === 'unloading'} 
        progress={progress} 
        packages={remainingPackages}
      />
      
      {/* Truck highlight outline */}
      {(isHovered || isSelected) && (
        <group position={[0, 1, -0.5]}>
          {/* Outline box around truck */}
          <mesh>
            <boxGeometry args={[3, 2.8, 7]} />
            <meshBasicMaterial 
              color={isSelected ? SELECTED_COLOR : HIGHLIGHT_COLOR} 
              transparent 
              opacity={isSelected ? 0.3 : 0.2}
              wireframe
            />
          </mesh>
        </group>
      )}
      
      {/* Hover tooltip */}
      {isHovered && !isSelected && (
        <Html position={[0, 3, 0]} center distanceFactor={40}>
          <div className="bg-gray-800 text-white px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap pointer-events-none shadow-lg flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Click to view manifest
          </div>
        </Html>
      )}
    </group>
  )
}
