'use client'

import { Truck } from './truck'
import { Forklift } from './forklift'
import { CargoPallet } from './cargo-pallet'
import { MetalShelving } from './metal-shelving'
import { ConveyorBelt } from './conveyor-belt'
import { SimulatedTrucks } from './simulated-trucks'
import { SimulatedULDTrolleys } from './simulated-uld-trolleys'
import { VehicleCountLabels } from './vehicle-count-labels'
import { cargoBuilding7 } from '@/lib/warehouse-data'
import type { ViewMode } from '@/lib/types'

type ExteriorElementsProps = {
  viewMode: ViewMode
  onShowTrucks?: () => void
  onShowTrolleys?: () => void
}

export function ExteriorElements({ viewMode, onShowTrucks, onShowTrolleys }: ExteriorElementsProps) {
  if (viewMode !== 'exterior') return null

  const b7x = cargoBuilding7.position[0]
  const b7z = cargoBuilding7.position[2]

  return (
    <group>
      {/* ===== Simulated Trucks (Dynamic - appearing/disappearing with cargo) ===== */}
      <SimulatedTrucks />

      {/* ===== ULD Trolleys near CHS 7 Build-up Area (Dynamic - appearing/disappearing) ===== */}
      <SimulatedULDTrolleys />

      {/* ===== Floating Labels for Vehicle Counts ===== */}
      {onShowTrucks && onShowTrolleys && (
        <VehicleCountLabels onShowTrucks={onShowTrucks} onShowTrolleys={onShowTrolleys} />
      )}

      {/* ========================================== */}
      {/* IMPORT AREA - 棚メイン（自動ラック） */}
      {/* ========================================== */}
      
      {/* Import Counter - カウンターデスク風 */}
      {renderCounterDesks(-40, 8, 4)}
      {generatePalletCluster(-55, 2, 2, 2)}
      <Forklift position={[-30, 0.3, 15]} rotation={[0, Math.PI / 2, 0]} color="#F59E0B" />
      
      {/* Automatic Rack - 大量の棚！ */}
      {generateShelvingGrid(-90, 18, 5, 6)}
      {generateShelvingGrid(-90, 50, 4, 5)}
      {generatePalletCluster(-55, 25, 2, 2)}
      {generatePalletCluster(-55, 45, 2, 2)}
      <Forklift position={[-70, 0.3, 35]} rotation={[0, Math.PI / 4, 0]} color="#F59E0B" />
      <Forklift position={[-50, 0.3, 55]} rotation={[0, -Math.PI / 3, 0]} color="#F59E0B" />
      
      {/* AGF Area - パレットと自動フォークリフト */}
      {generatePalletGrid(-90, 65, 5, 6)}
      {generatePalletGrid(-60, 75, 4, 4)}
      <Forklift position={[-85, 0.3, 72]} rotation={[0, 0, 0]} color="#10B981" />
      <Forklift position={[-70, 0.3, 82]} rotation={[0, Math.PI / 6, 0]} color="#10B981" />
      <Forklift position={[-55, 0.3, 68]} rotation={[0, -Math.PI / 4, 0]} color="#10B981" />
      <AGVVehicle position={[-80, 0.2, 78]} rotation={Math.PI / 8} />
      <AGVVehicle position={[-65, 0.2, 85]} rotation={-Math.PI / 6} />

      {/* ========================================== */}
      {/* EXPORT AREA */}
      {/* ========================================== */}
      
      {/* Export Counter - カウンターデスク */}
      {renderCounterDesks(15, -70, 5)}
      {generatePalletCluster(35, -75, 2, 2)}
      <Forklift position={[40, 0.3, -65]} rotation={[0, -Math.PI / 2, 0]} color="#F59E0B" />
      
      {/* Valuables/Animal Storage - 特殊コンテナ（セキュア） */}
      {renderSecureContainers(8, -50, 3, 4)}
      {renderSecureContainers(25, -42, 2, 3)}
      
      {/* Temperature Control - 冷蔵ユニット大量 */}
      {renderColdStorageUnits(5, -25, 4, 5)}
      {renderColdStorageUnits(-5, -8, 3, 4)}
      {renderColdStorageUnits(25, -15, 3, 3)}
      
      {/* ANA Flights Acceptance - パレットとコンベア */}
      <ConveyorBelt position={[55, 0.3, -75]} length={35} width={1.5} rotation={[0, Math.PI / 2, 0]} />
      <ConveyorBelt position={[75, 0.3, -68]} length={30} width={1.5} />
      {generatePalletGrid(50, -80, 4, 5)}
      {generatePalletGrid(75, -78, 3, 4)}
      {renderStackedCargo(60, -60, 3, 3)}
      <Forklift position={[55, 0.3, -70]} rotation={[0, Math.PI / 4, 0]} color="#F59E0B" />
      <Forklift position={[80, 0.3, -65]} rotation={[0, -Math.PI / 3, 0]} color="#F59E0B" />
      
      {/* Dangerous Goods - 危険物マーク付きコンテナ */}
      {renderHazardContainers(50, -45, 3, 5)}
      {renderHazardContainers(70, -38, 2, 3)}
      
      {/* CHS 7 Build-up Areas - コンベアメイン + パレット */}
      <ConveyorBelt position={[60, 0.3, -5]} length={50} width={2} />
      <ConveyorBelt position={[85, 0.3, 10]} length={45} width={2} rotation={[0, Math.PI / 2, 0]} />
      <ConveyorBelt position={[70, 0.3, 25]} length={40} width={1.5} />
      <ConveyorBelt position={[90, 0.3, -15]} length={35} width={1.5} rotation={[0, Math.PI / 2, 0]} />
      {generatePalletGrid(55, -20, 4, 4)}
      {generatePalletGrid(80, -10, 3, 5)}
      {generatePalletGrid(65, 15, 3, 4)}
      {renderStackedCargo(75, 5, 2, 3)}
      <Forklift position={[65, 0.3, -8]} rotation={[0, Math.PI / 3, 0]} color="#F59E0B" />
      <Forklift position={[88, 0.3, 0]} rotation={[0, -Math.PI / 2, 0]} color="#F59E0B" />
      <Forklift position={[72, 0.3, 20]} rotation={[0, Math.PI / 6, 0]} color="#F59E0B" />
      
      {/* AGV Area - AGVとパレット */}
      {generatePalletGrid(45, 40, 5, 5)}
      {generatePalletGrid(70, 50, 4, 4)}
      {generatePalletGrid(55, 65, 4, 5)}
      <AGVVehicle position={[50, 0.2, 45]} />
      <AGVVehicle position={[65, 0.2, 55]} rotation={Math.PI / 4} />
      <AGVVehicle position={[55, 0.2, 62]} rotation={-Math.PI / 6} />
      <AGVVehicle position={[75, 0.2, 48]} rotation={Math.PI / 3} />
      <AGVVehicle position={[60, 0.2, 72]} rotation={-Math.PI / 8} />
      
      {/* Export General - 棚と貨物 */}
      {generateShelvingGrid(30, 72, 3, 5)}
      {generateShelvingGrid(65, 78, 3, 4)}
      {renderStackedCargo(45, 82, 3, 4)}
      {renderStackedCargo(85, 75, 2, 3)}
      <ConveyorBelt position={[50, 0.3, 88]} length={55} width={1.5} rotation={[0, Math.PI / 2, 0]} />
      <Forklift position={[38, 0.3, 80]} rotation={[0, Math.PI / 5, 0]} color="#F59E0B" />
      <Forklift position={[75, 0.3, 85]} rotation={[0, -Math.PI / 4, 0]} color="#F59E0B" />

      {/* ========================================== */}
      {/* BUILDING 7 */}
      {/* ========================================== */}
      
      {/* Refrigerator - 冷蔵ユニット */}
      {renderColdStorageUnits(b7x - 45, b7z - 55, 3, 4)}
      {renderColdStorageUnits(b7x - 35, b7z - 40, 2, 3)}
      
      {/* Multi-function - 棚とパレット混合 */}
      {generateShelvingGrid(b7x - 15, b7z - 55, 3, 4)}
      {generatePalletGrid(b7x + 5, b7z - 45, 3, 3)}
      <Forklift position={[b7x - 5, 0.3, b7z - 50]} rotation={[0, Math.PI / 4, 0]} color="#F59E0B" />
      
      {/* Foreign Carrier - 棚と貨物大量 */}
      {generateShelvingGrid(b7x - 10, b7z + 5, 4, 5)}
      {generateShelvingGrid(b7x + 20, b7z + 30, 3, 4)}
      {generateShelvingGrid(b7x - 5, b7z + 45, 3, 4)}
      {generatePalletGrid(b7x + 35, b7z + 10, 3, 3)}
      {generatePalletGrid(b7x + 40, b7z + 40, 3, 3)}
      {renderStackedCargo(b7x - 15, b7z + 55, 3, 4)}
      {renderStackedCargo(b7x + 25, b7z + 55, 2, 3)}
      <ConveyorBelt position={[b7x + 10, 0.3, b7z + 48]} length={40} width={1.5} rotation={[0, Math.PI / 2, 0]} />
      <Forklift position={[b7x, 0.3, b7z + 20]} rotation={[0, Math.PI / 6, 0]} color="#F59E0B" />
      <Forklift position={[b7x + 30, 0.3, b7z + 35]} rotation={[0, -Math.PI / 3, 0]} color="#F59E0B" />
      <Forklift position={[b7x + 15, 0.3, b7z + 55]} rotation={[0, 0, 0]} color="#F59E0B" />
      
      {/* CHS Building 7 - コンベアとパレット */}
      <ConveyorBelt position={[b7x + 40, 0.3, b7z - 50]} length={25} width={1.2} />
      <ConveyorBelt position={[b7x + 45, 0.3, b7z - 38]} length={20} width={1.2} rotation={[0, Math.PI / 2, 0]} />
      {generatePalletGrid(b7x + 32, b7z - 55, 3, 3)}
      {renderStackedCargo(b7x + 38, b7z - 42, 2, 2)}
    </group>
  )
}

// AGV（無人搬送車）
function AGVVehicle({ position, rotation = 0 }: { position: [number, number, number], rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.8, 0.5, 2.5]} />
        <meshStandardMaterial color="#2563EB" />
      </mesh>
      <mesh position={[-0.7, 0.15, 0.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.25, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.7, 0.15, 0.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.25, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.7, 0.15, -0.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.25, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.7, 0.15, -0.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.25, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.4, 8]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.5} />
      </mesh>
      {/* Cargo on AGV */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[1.4, 0.6, 1.8]} />
        <meshStandardMaterial color="#F5D77E" />
      </mesh>
    </group>
  )
}

// カウンターデスク
function renderCounterDesks(baseX: number, baseZ: number, count: number) {
  const desks = []
  for (let i = 0; i < count; i++) {
    desks.push(
      <group key={`desk-${baseX}-${baseZ}-${i}`} position={[baseX + i * 6, 0, baseZ]}>
        {/* デスク天板 */}
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[4, 0.15, 2]} />
          <meshStandardMaterial color="#8B7355" />
        </mesh>
        {/* 脚 */}
        <mesh position={[-1.5, 0.5, 0.7]}>
          <boxGeometry args={[0.1, 1, 0.1]} />
          <meshStandardMaterial color="#5C4033" />
        </mesh>
        <mesh position={[1.5, 0.5, 0.7]}>
          <boxGeometry args={[0.1, 1, 0.1]} />
          <meshStandardMaterial color="#5C4033" />
        </mesh>
        <mesh position={[-1.5, 0.5, -0.7]}>
          <boxGeometry args={[0.1, 1, 0.1]} />
          <meshStandardMaterial color="#5C4033" />
        </mesh>
        <mesh position={[1.5, 0.5, -0.7]}>
          <boxGeometry args={[0.1, 1, 0.1]} />
          <meshStandardMaterial color="#5C4033" />
        </mesh>
        {/* パソコン */}
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[0.8, 0.5, 0.1]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </group>
    )
  }
  return <>{desks}</>
}

// セキュアコンテナ（貴重品用）
function renderSecureContainers(baseX: number, baseZ: number, rows: number, cols: number) {
  const containers = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      containers.push(
        <group key={`secure-${baseX}-${baseZ}-${r}-${c}`} position={[baseX + c * 4, 0, baseZ + r * 3]}>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[3, 2, 2.5]} />
            <meshStandardMaterial color="#4A5568" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* ロック */}
          <mesh position={[1.51, 1, 0]}>
            <boxGeometry args={[0.1, 0.3, 0.2]} />
            <meshStandardMaterial color="#FFD700" metalness={0.8} />
          </mesh>
        </group>
      )
    }
  }
  return <>{containers}</>
}

// 危険物コンテナ
function renderHazardContainers(baseX: number, baseZ: number, rows: number, cols: number) {
  const containers = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      containers.push(
        <group key={`hazard-${baseX}-${baseZ}-${r}-${c}`} position={[baseX + c * 3.5, 0, baseZ + r * 2.8]}>
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[2.8, 1.8, 2.2]} />
            <meshStandardMaterial color="#EF4444" />
          </mesh>
          {/* 警告マーク（黄色ストライプ） */}
          <mesh position={[0, 0.9, 1.11]}>
            <boxGeometry args={[2.6, 0.4, 0.02]} />
            <meshStandardMaterial color="#FCD34D" />
          </mesh>
          <mesh position={[0, 1.4, 1.11]}>
            <boxGeometry args={[2.6, 0.4, 0.02]} />
            <meshStandardMaterial color="#FCD34D" />
          </mesh>
        </group>
      )
    }
  }
  return <>{containers}</>
}

// 冷蔵ユニット
function renderColdStorageUnits(baseX: number, baseZ: number, rows: number, cols: number) {
  const units = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      units.push(
        <group key={`cold-${baseX}-${baseZ}-${r}-${c}`} position={[baseX + c * 4.5, 0, baseZ + r * 3.5]}>
          <mesh position={[0, 1.3, 0]}>
            <boxGeometry args={[3.5, 2.6, 3]} />
            <meshStandardMaterial color="#E0E7EE" roughness={0.2} metalness={0.6} />
          </mesh>
          {/* 冷却ユニット上部 */}
          <mesh position={[0, 2.8, 0]}>
            <boxGeometry args={[2, 0.4, 1.5]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.7} />
          </mesh>
          {/* ドア */}
          <mesh position={[0, 1.3, 1.51]}>
            <boxGeometry args={[2.5, 2.2, 0.05]} />
            <meshStandardMaterial color="#CBD5E1" />
          </mesh>
        </group>
      )
    }
  }
  return <>{units}</>
}

// 棚グリッド
function generateShelvingGrid(startX: number, startZ: number, rows: number, cols: number) {
  const shelves = []
  const spacingX = 5
  const spacingZ = 5
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      shelves.push(
        <MetalShelving
          key={`shelf-${startX}-${startZ}-${r}-${c}`}
          position={[startX + c * spacingX, 0, startZ + r * spacingZ]}
          levels={3}
          width={2.5}
          depth={1}
          withCargo={true}
        />
      )
    }
  }
  return <>{shelves}</>
}

// パレットグリッド（密集配置）
function generatePalletGrid(baseX: number, baseZ: number, rows: number, cols: number) {
  const pallets = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pallets.push(
        <CargoPallet
          key={`pallet-grid-${baseX}-${baseZ}-${r}-${c}`}
          position={[baseX + c * 2, 0.2, baseZ + r * 1.6]}
          scale={0.55}
          wrapped={Math.random() > 0.4}
        />
      )
    }
  }
  return <>{pallets}</>
}

// パレットクラスター（散在配置）
function generatePalletCluster(baseX: number, baseZ: number, rows: number, cols: number) {
  const pallets = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pallets.push(
        <CargoPallet
          key={`pallet-${baseX}-${baseZ}-${r}-${c}`}
          position={[baseX + c * 2.5 + Math.random() * 0.5, 0.2, baseZ + r * 2 + Math.random() * 0.5]}
          scale={0.6}
          wrapped={Math.random() > 0.3}
        />
      )
    }
  }
  return <>{pallets}</>
}

// スタック貨物（黄色ボックス）
function renderStackedCargo(baseX: number, baseZ: number, rows: number, cols: number) {
  const boxes = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const stackHeight = Math.floor(Math.random() * 2) + 2
      for (let level = 0; level < stackHeight; level++) {
        boxes.push(
          <mesh
            key={`cargo-${baseX}-${baseZ}-${r}-${c}-${level}`}
            position={[baseX + c * 2.2, 0.55 + level * 1.1, baseZ + r * 2.2]}
            castShadow
          >
            <boxGeometry args={[1.8, 1, 1.8]} />
            <meshStandardMaterial color="#F5D77E" roughness={0.5} />
          </mesh>
        )
      }
    }
  }
  return <>{boxes}</>
}
