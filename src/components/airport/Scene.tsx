'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Suspense, createContext, useState, useContext, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { Ground } from './Ground'
import { Buildings, type BuildingData } from './Buildings'
import { Roads } from './Roads'
import { Runways } from './Runways'
import { Concrete } from './Concrete'
import { CargoTerminalMarkers } from './CargoMarkers'
import { CargoFlightPlanes } from './CargoFlightPlanes'
import { FlightLabels } from './FlightLabels'
import { usePanelStore } from '@/lib/stores/panelStore'

// Context for selected building state
type SelectedBuildingContextType = {
  selectedBuilding: BuildingData | null
  setSelectedBuilding: (building: BuildingData | null) => void
  hoveredBuilding: BuildingData | null
  setHoveredBuilding: (building: BuildingData | null) => void
}

export const SelectedBuildingContext = createContext<SelectedBuildingContextType>({
  selectedBuilding: null,
  setSelectedBuilding: () => {},
  hoveredBuilding: null,
  setHoveredBuilding: () => {},
})

export function useSelectedBuilding() {
  return useContext(SelectedBuildingContext)
}

// Context for camera state (for compass)
type CameraContextType = {
  cameraRotation: number // Rotation in radians (0 = North, PI/2 = East, etc.)
  setCameraRotation: (rotation: number) => void
}

export const CameraContext = createContext<CameraContextType>({
  cameraRotation: 0,
  setCameraRotation: () => {},
})

export function useCamera() {
  return useContext(CameraContext)
}





// Animated plane component that moves between two points
function AnimatedPlane() {
  const groupRef = useRef<THREE.Group>(null)
  const startPoint = useMemo(() => new THREE.Vector3(-33.53, 0.04, 31.00), [])
  const endPoint = useMemo(() => new THREE.Vector3(54.85, 0.04, 31.00), [])
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
    <group ref={groupRef} position={startPoint} scale={[0.35, 0.35, 0.35]}>
      {/* Main body - fuselage along Z axis (nose at +Z, tail at -Z) */}
      <mesh castShadow position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 10, 16]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Nose - cone at front (+Z) */}
      <mesh castShadow position={[0, 1.2, 5.6]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.4, 1.2, 16]} />
        <meshStandardMaterial color="#f0f0f0" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Main wings - extend along X axis */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[10, 0.12, 1.5]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Vertical tail fin */}
      <mesh castShadow position={[0, 2.0, -4.5]}>
        <boxGeometry args={[0.08, 1.2, 0.8]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Horizontal tail stabilizers */}
      <mesh castShadow position={[0, 1.3, -4.5]}>
        <boxGeometry args={[3.5, 0.08, 0.6]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Landing gear - front */}
      {/* Front strut */}
      <mesh castShadow position={[0, 0.6, 2.5]}>
        <boxGeometry args={[0.08, 0.9, 0.08]} />
        <meshStandardMaterial color="#555555" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Front wheel */}
      <mesh castShadow position={[0, 0.15, 2.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.12, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Landing gear - rear left */}
      {/* Left strut */}
      <mesh castShadow position={[-0.8, 0.6, -0.5]}>
        <boxGeometry args={[0.08, 0.9, 0.08]} />
        <meshStandardMaterial color="#555555" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Left wheel */}
      <mesh castShadow position={[-0.8, 0.15, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Landing gear - rear right */}
      {/* Right strut */}
      <mesh castShadow position={[0.8, 0.6, -0.5]}>
        <boxGeometry args={[0.08, 0.9, 0.08]} />
        <meshStandardMaterial color="#555555" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Right wheel */}
      <mesh castShadow position={[0.8, 0.15, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  )
}

interface SceneContentProps {
  onShowArrivals: () => void
  onShowDepartures: () => void
}

function SceneContent({ onShowArrivals, onShowDepartures }: SceneContentProps) {
  return (
    <>
      {/* Camera positioned for a nice isometric-ish view */}
      <PerspectiveCamera makeDefault position={[80, 60, 100]} fov={45} />
      
      {/* Orbit controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={40}
        maxDistance={200}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />

      {/* Warm ambient light */}
      <ambientLight intensity={0.6} color="#ffeedd" />

      {/* Main sun light - warm and bright (optimized shadows) */}
      <directionalLight
        position={[80, 100, 60]}
        intensity={1.8}
        color="#fff4e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={300}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.0001}
      />

      {/* Fill light from opposite side (sky bounce) */}
      <directionalLight
        position={[-50, 30, -40]}
        intensity={0.4}
        color="#87ceeb"
      />

      {/* Hemisphere light for natural outdoor feel */}
      <hemisphereLight
        color="#87ceeb"
        groundColor="#8b7355"
        intensity={0.5}
      />

      {/* Ground with stylized terrain */}
      <Ground />

      {/* Concrete areas (detected from layout image) */}
      <Concrete />

      {/* Runways (detected from layout image) */}
      <Runways />

      {/* Roads */}
      <Roads />

      {/* Buildings */}
      <Buildings />

      {/* Cargo Terminal Markers - matching Narita map */}
      <CargoTerminalMarkers />

      {/* Dynamic Cargo Flight Planes */}
      <CargoFlightPlanes />

      {/* Flight Count Labels - Arrivals & Departures */}
      <FlightLabels onShowArrivals={onShowArrivals} onShowDepartures={onShowDepartures} />

      {/* Soft fog for depth - very light for clean look */}
      <fog attach="fog" args={['#E8F4F8', 150, 300]} />
    </>
  )
}

export function Scene() {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null)
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingData | null>(null)
  const [cameraRotation, setCameraRotation] = useState(0)
  const { setPanel, closePanel, isOpen } = usePanelStore()

  const handleShowArrivals = () => {
    if (isOpen('flight-list-arrivals')) {
      closePanel()
    } else {
      setPanel('flight-list-arrivals')
    }
  }

  const handleShowDepartures = () => {
    if (isOpen('flight-list-departures')) {
      closePanel()
    } else {
      setPanel('flight-list-departures')
    }
  }

  return (
    <SelectedBuildingContext.Provider
      value={{
        selectedBuilding,
        setSelectedBuilding,
        hoveredBuilding,
        setHoveredBuilding,
      }}
    >
      <CameraContext.Provider
        value={{
          cameraRotation,
          setCameraRotation,
        }}
      >
      <Canvas
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ background: '#0A0A0A' }}
      >
        <Suspense fallback={null}>
          <SceneContent 
            onShowArrivals={handleShowArrivals}
            onShowDepartures={handleShowDepartures}
          />
        </Suspense>
      </Canvas>
      
      {/* Panels are now rendered globally at app level - no duplicates needed here */}
      </CameraContext.Provider>
    </SelectedBuildingContext.Provider>
  )
}
