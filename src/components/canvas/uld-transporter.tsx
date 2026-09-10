'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useSelection } from './warehouse-scene'
import { useWarehouseInventory, TrackedPackage } from '@/lib/warehouse-inventory'

// Colors
const ANA_BLUE = '#00467F'
const VEHICLE_YELLOW = '#F59E0B'
const HIGHLIGHT_COLOR = '#60A5FA'
const SELECTED_COLOR = '#3B82F6'

// Number of packages per ULD load
const NUM_LOAD_PACKAGES = 5

// Generate mock ULD container data
function generateULDContainer() {
  const destinations = ['NRT', 'HND', 'LAX', 'SFO', 'ORD', 'JFK', 'SIN', 'HKG']
  const flights = ['NH001', 'NH102', 'NH203', 'NH304', 'NH405', 'NH506']
  
  return {
    id: `ULD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    containerId: `AKE${Math.floor(Math.random() * 90000) + 10000}NH`,
    flight: flights[Math.floor(Math.random() * flights.length)],
    destination: destinations[Math.floor(Math.random() * destinations.length)],
    capacity: 1134,
    maxWeight: 1588,
  }
}

// Wheel component for transporter
function TransporterWheel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        <meshStandardMaterial color="#1F2937" roughness={0.8} />
      </mesh>
    </group>
  )
}

// ULD Container
function ULDContainer() {
  return (
    <group position={[0, 0.8, 1.5]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.4, 0.15, 3]} />
        <meshStandardMaterial color="#6B7280" metalness={0.3} />
      </mesh>
      
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#E5E7EB" />
      </mesh>
      
      <mesh position={[0.76, 0.8, 0]}>
        <planeGeometry args={[1.5, 0.5]} />
        <meshStandardMaterial color={ANA_BLUE} />
      </mesh>
      <mesh position={[-0.76, 0.8, 0]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.5, 0.5]} />
        <meshStandardMaterial color={ANA_BLUE} />
      </mesh>
      
      <mesh position={[0, 0.8, 0.76]}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshStandardMaterial color="#D1D5DB" />
      </mesh>
    </group>
  )
}

// Transporter vehicle
function TransporterVehicle() {
  return (
    <group position={[0, 0, -1.5]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.5, 0.8, 1.2]} />
        <meshStandardMaterial color={VEHICLE_YELLOW} />
      </mesh>
      
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[1.5, 0.1, 1.2]} />
        <meshStandardMaterial color={VEHICLE_YELLOW} />
      </mesh>
      
      <mesh position={[0, 0.5, 0.61]}>
        <planeGeometry args={[1.2, 0.6]} />
        <meshPhysicalMaterial color="#87CEEB" transparent opacity={0.5} />
      </mesh>
      
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 8]} />
        <meshStandardMaterial color="#FB923C" emissive="#FB923C" emissiveIntensity={0.5} />
      </mesh>
      
      <mesh position={[0, 0.15, 0.8]}>
        <boxGeometry args={[1.8, 0.2, 4]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      
      <TransporterWheel position={[-0.8, 0.25, 0]} />
      <TransporterWheel position={[0.8, 0.25, 0]} />
      <TransporterWheel position={[-0.8, 0.25, 1.8]} />
      <TransporterWheel position={[0.8, 0.25, 1.8]} />
      <TransporterWheel position={[-0.8, 0.25, 2.6]} />
      <TransporterWheel position={[0.8, 0.25, 2.6]} />
    </group>
  )
}

// Loading animation - packages moving from warehouse to ULD
function LoadingAnimation({ show, progress, packages }: { 
  show: boolean
  progress: number
  packages: TrackedPackage[]
}) {
  if (!show || packages.length === 0) return null
  
  const colors = ['#C4A574', '#B8956A', '#D4B584', '#CAA070', '#BFA068']
  
  return (
    <group position={[0, 0, 1.5]}>
      {packages.map((pkg, i) => {
        const boxProgress = Math.max(0, Math.min(1, (progress - i * 0.15) / 0.3))
        if (boxProgress <= 0 || boxProgress >= 1) return null
        
        const startZ = 4
        const endZ = 0.5
        const z = THREE.MathUtils.lerp(startZ, endZ, boxProgress)
        const y = 0.8 + Math.sin(boxProgress * Math.PI) * 0.5
        const x = (i % 3 - 1) * 0.4
        
        return (
          <mesh key={pkg.id} position={[x, y, z]}>
            <boxGeometry args={[0.4, 0.35, 0.4]} />
            <meshStandardMaterial color={colors[i % colors.length]} />
          </mesh>
        )
      })}
    </group>
  )
}

type AnimPhase = 'parked' | 'arriving' | 'positioning' | 'loading' | 'departing' | 'waiting'

// Minimum packages required in warehouse before ULD comes to pickup
const MIN_PACKAGES_FOR_PICKUP = 10

export function ULDTransporter({
  xPosition,
  doorZ,
  delay = 0,
  warehouseId,
}: {
  xPosition: number
  doorZ: number
  delay?: number
  warehouseId: string
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { setSelected, selected } = useSelection()
  const { loadPackagesToULD, getWarehouseStats } = useWarehouseInventory()
  
  const [uldContainer, setUldContainer] = useState(() => generateULDContainer())
  const [loadedPackages, setLoadedPackages] = useState<TrackedPackage[]>([])
  const [packagesToLoad, setPackagesToLoad] = useState<TrackedPackage[]>([])
  const [phase, setPhase] = useState<AnimPhase>('parked')
  const [progress, setProgress] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)
  const [hasStartedLoading, setHasStartedLoading] = useState(false)
  const [isWaitingForPackages, setIsWaitingForPackages] = useState(true)
  
  const timeRef = useRef(-delay)
  const checkIntervalRef = useRef(0)
  
  // Animation timing
  const ARRIVE_TIME = 6
  const POSITION_TIME = 3
  const LOAD_TIME = 6
  const DEPART_TIME = 6
  const WAIT_TIME = 5
  const TOTAL_TIME = ARRIVE_TIME + POSITION_TIME + LOAD_TIME + DEPART_TIME + WAIT_TIME
  
  // Positions
  const parkingZ = doorZ - 18
  const startZ = doorZ - 30
  const loadZ = doorZ - 5
  const departEndZ = doorZ - 40
  
  // Suppress unused warning
  void startZ
  
  // Start loading - get packages from warehouse
  const startLoading = useCallback(() => {
    if (!hasStartedLoading) {
      const stats = getWarehouseStats(warehouseId)
      const packagesToTake = Math.min(NUM_LOAD_PACKAGES, stats.totalPackages)
      
      if (packagesToTake > 0) {
        const packages = loadPackagesToULD(warehouseId, uldContainer.id, packagesToTake)
        setPackagesToLoad(packages)
      }
      setHasStartedLoading(true)
    }
  }, [hasStartedLoading, warehouseId, uldContainer.id, loadPackagesToULD, getWarehouseStats])
  
  useFrame((_, delta) => {
    if (!groupRef.current) return
    
    groupRef.current.visible = true
    
    // Check if warehouse has enough packages to start pickup (check every ~1 second)
    if (isWaitingForPackages) {
      checkIntervalRef.current += delta
      if (checkIntervalRef.current > 1) {
        checkIntervalRef.current = 0
        const stats = getWarehouseStats(warehouseId)
        if (stats.totalPackages >= MIN_PACKAGES_FOR_PICKUP) {
          setIsWaitingForPackages(false)
          timeRef.current = 0
          setPhase('arriving')
        }
      }
      groupRef.current.position.x = xPosition
      groupRef.current.position.z = parkingZ
      groupRef.current.rotation.y = Math.PI
      setPhase('parked')
      return
    }
    
    timeRef.current += delta
    
    if (timeRef.current < 0) {
      groupRef.current.position.x = xPosition
      groupRef.current.position.z = parkingZ
      groupRef.current.rotation.y = Math.PI
      return
    }
    
    const cycleTime = timeRef.current % TOTAL_TIME
    let currentPhase: AnimPhase
    let currentProgress: number
    let z: number
    
    const t1 = ARRIVE_TIME
    const t2 = t1 + POSITION_TIME
    const t3 = t2 + LOAD_TIME
    const t4 = t3 + DEPART_TIME
    
    if (cycleTime < t1) {
      currentPhase = 'arriving'
      currentProgress = cycleTime / ARRIVE_TIME
      const eased = 1 - Math.pow(1 - currentProgress, 3)
      z = THREE.MathUtils.lerp(parkingZ, loadZ, eased)
      
    } else if (cycleTime < t2) {
      currentPhase = 'positioning'
      currentProgress = (cycleTime - t1) / POSITION_TIME
      z = loadZ
      
      if (currentProgress > 0.9 && !hasStartedLoading) {
        startLoading()
      }
      
    } else if (cycleTime < t3) {
      currentPhase = 'loading'
      currentProgress = (cycleTime - t2) / LOAD_TIME
      z = loadZ
      
      const newLoadedCount = Math.min(
        packagesToLoad.length,
        Math.floor((currentProgress + 0.15) / 0.15)
      )
      
      if (newLoadedCount > loadedCount) {
        const newlyLoaded = packagesToLoad.slice(loadedCount, newLoadedCount)
        setLoadedPackages(prev => [...prev, ...newlyLoaded])
        setLoadedCount(newLoadedCount)
      }
      
    } else if (cycleTime < t4) {
      currentPhase = 'departing'
      currentProgress = (cycleTime - t3) / DEPART_TIME
      const eased = currentProgress * currentProgress
      z = THREE.MathUtils.lerp(loadZ, departEndZ, eased)
      
    } else {
      currentPhase = 'waiting'
      currentProgress = (cycleTime - t4) / WAIT_TIME
      z = parkingZ
      
      if (phase !== 'waiting' && phase !== 'parked') {
        setUldContainer(generateULDContainer())
        setLoadedPackages([])
        setPackagesToLoad([])
        setLoadedCount(0)
        setHasStartedLoading(false)
        setIsWaitingForPackages(true)
      }
    }
    
    setPhase(currentPhase)
    setProgress(currentProgress)
    
    groupRef.current.position.x = xPosition
    groupRef.current.position.z = z
    groupRef.current.rotation.y = Math.PI
  })
  
  const currentStats = getWarehouseStats(warehouseId)
  
  useEffect(() => {
    if (selected?.type === 'uld' && selected?.id === uldContainer.id) {
      const statusMap: Record<AnimPhase, 'parked' | 'waiting' | 'loading' | 'departing'> = {
        parked: 'parked',
        arriving: 'waiting',
        positioning: 'waiting',
        loading: 'loading',
        departing: 'departing',
        waiting: 'waiting',
      }
      
      const totalWeight = loadedPackages.reduce((sum, pkg) => sum + pkg.weight, 0)
      
      setSelected({
        type: 'uld',
        id: uldContainer.id,
        position: [xPosition, 0, groupRef.current?.position.z || 0],
        data: {
          ...uldContainer,
          packages: loadedPackages.map(pkg => ({
            id: pkg.id,
            trackingNumber: pkg.trackingNumber,
            weight: pkg.weight,
            dimensions: { length: pkg.dimensions.w, width: pkg.dimensions.h, height: pkg.dimensions.d },
            destination: pkg.destination,
            handler: pkg.origin,
            status: pkg.status,
            priority: pkg.priority === 'priority' ? 'high' : 'normal',
          })),
          totalWeight,
          loadedCount: loadedPackages.length,
          totalToLoad: packagesToLoad.length || NUM_LOAD_PACKAGES,
          status: statusMap[phase],
          warehouseId,
          packagesInWarehouse: currentStats.totalPackages,
          minPackagesRequired: MIN_PACKAGES_FOR_PICKUP,
        },
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedPackages.length, phase, currentStats.totalPackages])
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    
    const statusMap: Record<AnimPhase, 'parked' | 'waiting' | 'loading' | 'departing'> = {
      parked: 'parked',
      arriving: 'waiting',
      positioning: 'waiting',
      loading: 'loading',
      departing: 'departing',
      waiting: 'waiting',
    }
    
    const totalWeight = loadedPackages.reduce((sum, pkg) => sum + pkg.weight, 0)
    
    setSelected({
      type: 'uld',
      id: uldContainer.id,
      position: [xPosition, 0, groupRef.current?.position.z || 0],
      data: {
        ...uldContainer,
        packages: loadedPackages.map(pkg => ({
          id: pkg.id,
          trackingNumber: pkg.trackingNumber,
          weight: pkg.weight,
          dimensions: { length: pkg.dimensions.w, width: pkg.dimensions.h, height: pkg.dimensions.d },
          destination: pkg.destination,
          handler: pkg.origin,
          status: pkg.status,
          priority: pkg.priority === 'priority' ? 'high' : 'normal',
        })),
        totalWeight,
        loadedCount: loadedPackages.length,
        totalToLoad: packagesToLoad.length || NUM_LOAD_PACKAGES,
        status: statusMap[phase],
        warehouseId,
        packagesInWarehouse: currentStats.totalPackages,
        minPackagesRequired: MIN_PACKAGES_FOR_PICKUP,
      },
    })
  }
  
  const animatingPackages = packagesToLoad.filter((_, i) => i >= loadedCount)
  
  const [isHovered, setIsHovered] = useState(false)
  const isSelected = selected?.type === 'uld' && selected?.id === uldContainer.id
  
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
    <group 
      ref={groupRef} 
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <TransporterVehicle />
      <ULDContainer />
      <LoadingAnimation 
        show={phase === 'loading'} 
        progress={progress}
        packages={animatingPackages}
      />
      
      {phase === 'parked' && (
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial 
            color="#FCD34D" 
            emissive="#FCD34D" 
            emissiveIntensity={0.8}
          />
        </mesh>
      )}
      
      {(isHovered || isSelected) && (
        <group position={[0, 1.2, 0.5]}>
          <mesh>
            <boxGeometry args={[3, 2.5, 6]} />
            <meshBasicMaterial 
              color={isSelected ? SELECTED_COLOR : HIGHLIGHT_COLOR} 
              transparent 
              opacity={isSelected ? 0.3 : 0.2}
              wireframe
            />
          </mesh>
        </group>
      )}
      
      {isHovered && !isSelected && (
        <Html position={[0, 3, 1]} center distanceFactor={40}>
          <div className="bg-gray-800 text-white px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap pointer-events-none shadow-lg flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Click to view ULD
          </div>
        </Html>
      )}
    </group>
  )
}
