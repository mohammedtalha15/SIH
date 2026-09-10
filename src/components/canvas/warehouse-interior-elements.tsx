'use client'

import { MetalShelving } from './metal-shelving'
import { CargoPallet } from './cargo-pallet'
import { ULDContainer } from './uld-container'
import { Forklift } from './forklift'
import { ConveyorBelt } from './conveyor-belt'
import type { ViewMode } from '@/lib/types'

type WarehouseInteriorElementsProps = {
  viewMode: ViewMode
  buildingPosition: [number, number, number]
  buildingSize: [number, number, number]
}

export function WarehouseInteriorElements({
  viewMode,
  buildingPosition,
  buildingSize,
}: WarehouseInteriorElementsProps) {
  if (viewMode !== 'interior') return null

  const [bx] = buildingPosition
  const isBuilding8 = bx < 100

  return (
    <group>
      {isBuilding8 ? (
        <Building8InteriorElements buildingPosition={buildingPosition} />
      ) : (
        <Building7InteriorElements buildingPosition={buildingPosition} />
      )}
    </group>
  )
}

// Building 8のインテリア - 現実的なレイアウト
function Building8InteriorElements({ buildingPosition }: { buildingPosition: [number, number, number] }) {
  const [bx, , bz] = buildingPosition

  return (
    <group>
      {/* ========== Import Area (左側・緑エリア) ========== */}
      <group position={[bx - 50, 0, bz + 45]}>
        
        {/* メイン通路のフロアマーキング */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 80]} />
          <meshStandardMaterial color="#9CA3AF" />
        </mesh>
        
        {/* === 左側の棚列（通路の左） === */}
        {Array.from({ length: 8 }).map((_, row) => (
          <MetalShelving
            key={`import-shelf-left-${row}`}
            position={[-25, 0, -30 + row * 9]}
            levels={5}
            width={5}
            depth={1.5}
            withCargo={true}
          />
        ))}
        
        {/* === 右側の棚列（通路の右） === */}
        {Array.from({ length: 8 }).map((_, row) => (
          <MetalShelving
            key={`import-shelf-right-${row}`}
            position={[25, 0, -30 + row * 9]}
            levels={5}
            width={5}
            depth={1.5}
            withCargo={true}
          />
        ))}

        {/* === 中央付近のパレット置き場（通路両脇） === */}
        {/* 左側パレット列 */}
        {Array.from({ length: 4 }).map((_, i) => (
          <group key={`import-pallet-left-${i}`}>
            <CargoPallet position={[-12, 0.1, -25 + i * 12]} scale={1.2} wrapped={true} />
            <CargoPallet position={[-12, 0.1, -20 + i * 12]} scale={1.2} wrapped={true} />
          </group>
        ))}
        
        {/* 右側パレット列 */}
        {Array.from({ length: 4 }).map((_, i) => (
          <group key={`import-pallet-right-${i}`}>
            <CargoPallet position={[12, 0.1, -25 + i * 12]} scale={1.2} wrapped={true} />
            <CargoPallet position={[12, 0.1, -20 + i * 12]} scale={1.2} wrapped={Math.random() > 0.3} />
          </group>
        ))}

        {/* フォークリフト（通路内） */}
        <Forklift position={[0, 0.1, -10]} rotation={[0, 0, 0]} />
        <Forklift position={[0, 0.1, 25]} rotation={[0, Math.PI, 0]} />
      </group>

      {/* ========== Export Area (右側・青エリア) ========== */}
      <group position={[bx + 50, 0, bz]}>
        
        {/* メイン通路 */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 160]} />
          <meshStandardMaterial color="#9CA3AF" />
        </mesh>
        
        {/* 横通路 */}
        <mesh position={[0, 0.02, -40]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[6, 80]} />
          <meshStandardMaterial color="#9CA3AF" />
        </mesh>
        <mesh position={[0, 0.02, 30]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[6, 80]} />
          <meshStandardMaterial color="#9CA3AF" />
        </mesh>

        {/* === ULDビルドアップエリア（整列配置） === */}
        {/* 左側ULD列 */}
        {Array.from({ length: 6 }).map((_, i) => (
          <ULDContainer
            key={`uld-left-${i}`}
            position={[-30, 0.1, -60 + i * 18]}
            type={i % 2 === 0 ? 'LD3' : 'LD7'}
          />
        ))}
        
        {/* 右側ULD列 */}
        {Array.from({ length: 6 }).map((_, i) => (
          <ULDContainer
            key={`uld-right-${i}`}
            position={[30, 0.1, -60 + i * 18]}
            type={i % 3 === 0 ? 'PMC' : 'LD3'}
          />
        ))}

        {/* === コンベアベルトライン === */}
        <ConveyorBelt position={[-15, 0.1, 60]} length={50} width={1.5} rotation={[0, 0, 0]} />
        <ConveyorBelt position={[15, 0.1, 60]} length={50} width={1.5} rotation={[0, 0, 0]} />
        
        {/* === 出荷待ちパレット（整列） === */}
        {Array.from({ length: 3 }).map((_, row) => (
          Array.from({ length: 4 }).map((_, col) => (
            <CargoPallet
              key={`export-pallet-${row}-${col}`}
              position={[-25 + col * 10, 0.1, -75 + row * 6]}
              scale={1}
              wrapped={true}
            />
          ))
        ))}

        {/* フォークリフト */}
        <Forklift position={[0, 0.1, -20]} rotation={[0, Math.PI / 2, 0]} />
        <Forklift position={[0, 0.1, 45]} rotation={[0, -Math.PI / 2, 0]} />
      </group>

      {/* ========== 温度管理施設エリア ========== */}
      <group position={[bx + 20, 0, bz - 10]}>
        {/* 冷蔵ユニット（整列） */}
        {Array.from({ length: 3 }).map((_, i) => (
          <group key={`temp-unit-${i}`} position={[-12 + i * 14, 0, 0]}>
            <mesh position={[0, 2, 0]}>
              <boxGeometry args={[10, 4, 8]} />
              <meshStandardMaterial color="#60A5FA" metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 2, 4.05]}>
              <boxGeometry args={[6, 3.5, 0.1]} />
              <meshStandardMaterial color="#93C5FD" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 4.3, 0]}>
              <boxGeometry args={[8, 0.5, 6]} />
              <meshStandardMaterial color="#4B5563" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[4, 3, 4.05]}>
              <boxGeometry args={[1.2, 0.6, 0.05]} />
              <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.5} />
            </mesh>
          </group>
        ))}
        
        {/* 冷蔵庫前のパレット */}
        {Array.from({ length: 4 }).map((_, i) => (
          <CargoPallet
            key={`cold-pallet-${i}`}
            position={[-18 + i * 12, 0.1, 8]}
            scale={1}
            wrapped={true}
          />
        ))}
      </group>

      {/* ========== AGVエリア（自動搬送レーン） ========== */}
      <group position={[bx + 60, 0, bz + 55]}>
        {/* AGV走行レーン */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[50, 35]} />
          <meshStandardMaterial color="#DBEAFE" transparent opacity={0.6} />
        </mesh>
        
        {/* レーンマーキング */}
        <mesh position={[0, 0.02, -12]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[48, 0.3]} />
          <meshStandardMaterial color="#3B82F6" />
        </mesh>
        <mesh position={[0, 0.02, 12]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[48, 0.3]} />
          <meshStandardMaterial color="#3B82F6" />
        </mesh>
        
        {/* AGV（整列待機） */}
        {Array.from({ length: 4 }).map((_, i) => (
          <group key={`agv-${i}`} position={[-18 + i * 12, 0, 0]}>
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[3, 0.4, 4]} />
              <meshStandardMaterial color="#3B82F6" metalness={0.6} roughness={0.3} />
            </mesh>
            {[[-1.2, -1.8], [1.2, -1.8], [-1.2, 1.8], [1.2, 1.8]].map(([x, z], wi) => (
              <mesh key={`wheel-${wi}`} position={[x, 0.12, z]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 0.15, 12]} />
                <meshStandardMaterial color="#1F2937" />
              </mesh>
            ))}
            <mesh position={[0, 0.55, 0]}>
              <boxGeometry args={[0.6, 0.2, 0.6]} />
              <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.3} />
            </mesh>
            {i % 2 === 0 && (
              <CargoPallet position={[0, 0.6, 0]} scale={0.6} wrapped={true} />
            )}
          </group>
        ))}
      </group>

      {/* ========== 危険物保管エリア ========== */}
      <group position={[bx + 65, 0, bz - 35]}>
        {/* 区画フェンス */}
        <mesh position={[0, 1.5, -8]}>
          <boxGeometry args={[30, 3, 0.1]} />
          <meshStandardMaterial color="#FDE047" transparent opacity={0.3} />
        </mesh>
        
        {/* 危険物コンテナ（整列） */}
        {Array.from({ length: 2 }).map((_, row) => (
          Array.from({ length: 3 }).map((_, col) => (
            <group key={`hazard-${row}-${col}`} position={[-10 + col * 10, 0, -3 + row * 6]}>
              <mesh position={[0, 1, 0]}>
                <boxGeometry args={[5, 2, 4]} />
                <meshStandardMaterial color="#FDE047" />
              </mesh>
              <mesh position={[0, 1, 2.02]}>
                <boxGeometry args={[2, 1.8, 0.05]} />
                <meshStandardMaterial color="#DC2626" />
              </mesh>
            </group>
          ))
        ))}
        
        {/* 警告看板 */}
        <group position={[0, 0, -10]}>
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 2.5, 8]} />
            <meshStandardMaterial color="#4B5563" />
          </mesh>
          <mesh position={[0, 4, 0]}>
            <boxGeometry args={[8, 1.5, 0.15]} />
            <meshStandardMaterial color="#DC2626" />
          </mesh>
        </group>
      </group>

      {/* ========== 通路のフロアライン（黄色セーフティライン） ========== */}
      <group position={[bx, 0.03, bz]}>
        {/* メイン縦通路 */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 170]} />
          <meshStandardMaterial color="#FDE047" />
        </mesh>
        <mesh position={[5, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 170]} />
          <meshStandardMaterial color="#FDE047" />
        </mesh>
        <mesh position={[-5, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 170]} />
          <meshStandardMaterial color="#FDE047" />
        </mesh>
      </group>
    </group>
  )
}

// Building 7のインテリア
function Building7InteriorElements({ buildingPosition }: { buildingPosition: [number, number, number] }) {
  const [bx, , bz] = buildingPosition

  return (
    <group>
      {/* メイン通路 */}
      <mesh position={[bx, 0.02, bz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 120]} />
        <meshStandardMaterial color="#9CA3AF" />
      </mesh>

      {/* ========== 冷蔵庫エリア ========== */}
      <group position={[bx - 35, 0, bz - 45]}>
        {Array.from({ length: 2 }).map((_, i) => (
          <group key={`fridge-${i}`} position={[-6 + i * 14, 0, 0]}>
            <mesh position={[0, 2.5, 0]}>
              <boxGeometry args={[12, 5, 10]} />
              <meshStandardMaterial color="#3B82F6" metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 2.5, 5.05]}>
              <boxGeometry args={[8, 4, 0.1]} />
              <meshStandardMaterial color="#60A5FA" />
            </mesh>
          </group>
        ))}
      </group>

      {/* ========== 多機能エリア（棚） ========== */}
      <group position={[bx, 0, bz - 45]}>
        {Array.from({ length: 2 }).map((_, row) => (
          Array.from({ length: 3 }).map((_, col) => (
            <MetalShelving
              key={`multi-shelf-${row}-${col}`}
              position={[-15 + col * 12, 0, -8 + row * 12]}
              levels={4}
              width={5}
              depth={1.5}
              withCargo={true}
            />
          ))
        ))}
      </group>

      {/* ========== 外航便エリア（ULD） ========== */}
      <group position={[bx + 10, 0, bz + 20]}>
        {/* ULD整列 */}
        {Array.from({ length: 3 }).map((_, row) => (
          Array.from({ length: 3 }).map((_, col) => (
            <ULDContainer
              key={`foreign-uld-${row}-${col}`}
              position={[-25 + col * 20, 0.1, -20 + row * 18]}
              type={row === 0 ? 'PMC' : col % 2 === 0 ? 'LD7' : 'LD3'}
            />
          ))
        ))}
        
        {/* コンベア */}
        <ConveyorBelt position={[0, 0.1, 30]} length={45} width={1.5} rotation={[0, Math.PI / 2, 0]} />
        
        {/* フォークリフト */}
        <Forklift position={[25, 0.1, 0]} rotation={[0, -Math.PI / 2, 0]} />
        <Forklift position={[-30, 0.1, 15]} rotation={[0, Math.PI / 4, 0]} />
      </group>

      {/* ========== CHSエリア ========== */}
      <group position={[bx + 38, 0, bz - 45]}>
        {Array.from({ length: 2 }).map((_, row) => (
          Array.from({ length: 2 }).map((_, col) => (
            <CargoPallet
              key={`chs-pallet-${row}-${col}`}
              position={[-6 + col * 12, 0.1, -6 + row * 10]}
              scale={1.2}
              wrapped={true}
            />
          ))
        ))}
      </group>

      {/* 通路ライン */}
      <group position={[bx, 0.03, bz]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 110]} />
          <meshStandardMaterial color="#FDE047" />
        </mesh>
        <mesh position={[4, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 110]} />
          <meshStandardMaterial color="#FDE047" />
        </mesh>
        <mesh position={[-4, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 110]} />
          <meshStandardMaterial color="#FDE047" />
        </mesh>
      </group>
    </group>
  )
}
