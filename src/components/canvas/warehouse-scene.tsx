'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Suspense, useState, createContext, useContext } from 'react'
import { Ground } from './ground'
import { Warehouse } from './warehouse'
import { AnimatedTruck } from './animated-truck'
import { ULDTransporter } from './uld-transporter'
import { InfoPanel } from '@/components/ui/info-panel'
import type { SelectedObject } from '@/lib/types'

// Context for selected object state
type SelectionContextType = {
  selected: SelectedObject | null
  setSelected: (obj: SelectedObject | null) => void
}

export const SelectionContext = createContext<SelectionContextType>({
  selected: null,
  setSelected: () => {},
})

export function useSelection() {
  return useContext(SelectionContext)
}

// Context for opening warehouse layout directly
type WarehouseLayoutContextType = {
  openWarehouseLayout: (warehouseId: string) => void
}

export const WarehouseLayoutContext = createContext<WarehouseLayoutContextType>({
  openWarehouseLayout: () => {},
})

export function useWarehouseLayout() {
  return useContext(WarehouseLayoutContext)
}

function Scene() {
  // Warehouse dimensions
  const warehouseDepth = 35
  
  // Door positions
  const frontDoorZ = warehouseDepth / 2      // Front doors at z = 17.5 (incoming trucks)
  const backDoorZ = -warehouseDepth / 2      // Back doors at z = -17.5 (outgoing ULDs)
  
  return (
    <>
      {/* Clean bright lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[50, 80, 50]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <directionalLight position={[-30, 40, -30]} intensity={0.4} />
      <hemisphereLight args={['#FFFFFF', '#F0F0F0', 0.5]} />

      {/* Ground with grid */}
      <Ground />

      {/* Warehouses */}
      <Warehouse position={[-22, 0, 0]} warehouseId="warehouse-1" />
      <Warehouse position={[22, 0, 0]} warehouseId="warehouse-2" />

      {/* Incoming trucks - front doors */}
      <AnimatedTruck xPosition={-22} doorZ={frontDoorZ} delay={0} warehouseId="warehouse-1" />
      <AnimatedTruck xPosition={22} doorZ={frontDoorZ} delay={12} warehouseId="warehouse-2" />

      {/* Outgoing ULD transporters - back doors (to aircraft) */}
      <ULDTransporter xPosition={-22} doorZ={backDoorZ} delay={8} warehouseId="warehouse-1" />
      <ULDTransporter xPosition={22} doorZ={backDoorZ} delay={20} warehouseId="warehouse-2" />

      {/* Soft contact shadows */}
      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.25}
        scale={200}
        blur={3}
        far={100}
      />

      {/* Environment for subtle reflections */}
      <Environment preset="city" environmentIntensity={0.3} />
    </>
  )
}

export function WarehouseScene({ onOpenWarehouseLayout }: { onOpenWarehouseLayout?: (warehouseId: string) => void }) {
  const [selected, setSelected] = useState<SelectedObject | null>(null)

  const handlePointerMissed = () => {
    setSelected(null)
  }
  
  const openWarehouseLayout = (warehouseId: string) => {
    if (onOpenWarehouseLayout) {
      onOpenWarehouseLayout(warehouseId)
    }
  }

  return (
    <WarehouseLayoutContext.Provider value={{ openWarehouseLayout }}>
      <SelectionContext.Provider value={{ selected, setSelected }}>
        <Canvas
          shadows
          camera={{ position: [60, 40, 70], fov: 50 }}
          onPointerMissed={handlePointerMissed}
          style={{ background: 'linear-gradient(to bottom, #E8F4FC 0%, #FFFFFF 40%)' }}
        >
          <fog attach="fog" args={['#F0F8FF', 120, 300]} />
          
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={20}
            maxDistance={150}
            maxPolarAngle={Math.PI / 2.2}
          />
        </Canvas>
        
        {/* Info Panel Overlay - only for non-warehouse items */}
        {selected && selected.type !== 'warehouse' && (
          <InfoPanel selected={selected} onClose={() => setSelected(null)} />
        )}
      </SelectionContext.Provider>
    </WarehouseLayoutContext.Provider>
  )
}
