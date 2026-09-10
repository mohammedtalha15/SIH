'use client'

import { useMemo } from 'react'
import { MeshStandardMaterial, DoubleSide } from 'three'
import { LoadingDock } from './loading-dock'
import { cargoBuilding8 } from '@/lib/warehouse-data'
import type { ViewMode } from '@/lib/types'

type CargoBuilding8Props = {
  viewMode: ViewMode
  onClick?: (buildingId: string) => void
}

export function CargoBuilding8({ viewMode, onClick }: CargoBuilding8Props) {
  const isExteriorView = viewMode === 'exterior'
  const building = cargoBuilding8
  
  // L字型の建物レイアウト（マップ画像に基づく）
  // Import Area: 左下の横長部分
  // Export Area: 右側の縦長部分
  
  const height = 15
  const cutawayHeight = isExteriorView ? height * 0.4 : height
  const wallThickness = 1.5
  
  const wallMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: '#9CA3AF',
      roughness: 0.7,
      metalness: 0.1,
      side: DoubleSide,
    })
  }, [])
  
  const windowMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: '#3B82F6',
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.8,
    })
  }, [])

  const handleClick = () => {
    if (onClick && isExteriorView) onClick(building.id)
  }

  // L字の寸法
  // 全体の外形: 左端 x=-100, 右端 x=100, 上端 z=-90, 下端 z=90
  // Import部分（左下）: x=-100〜0, z=0〜90
  // Export部分（右側）: x=0〜100, z=-90〜90

  return (
    <group>
      {/* ===== 床 ===== */}
      {/* Only show building floors in exterior view to prevent overlap */}
      {isExteriorView && (
        <>
          {/* Import Area床 (左下) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-50, 0.05, 45]} receiveShadow>
            <planeGeometry args={[100, 90]} />
            <meshStandardMaterial color="#D1D5DB" roughness={0.8} />
          </mesh>
          
          {/* Export Area床 (右側) - Lowered by 1 unit to prevent overlap */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[50, -0.95, 0]} receiveShadow>
            <planeGeometry args={[100, 180]} />
            <meshStandardMaterial color="#D1D5DB" roughness={0.8} />
          </mesh>
        </>
      )}

      {/* ===== 外壁 ===== */}
      
      {/* 左壁（西側全体）- フル高さ */}
      <mesh position={[-100, height / 2, 45]} material={wallMaterial} castShadow>
        <boxGeometry args={[wallThickness, height, 90]} />
      </mesh>
      
      {/* 下壁 左部分（南側Import）- 低い壁 */}
      <mesh
        position={[-50, cutawayHeight / 2, 90]}
        material={wallMaterial}
        castShadow
        onClick={handleClick}
        onPointerEnter={() => { if (isExteriorView && onClick) document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = 'default' }}
      >
        <boxGeometry args={[100, cutawayHeight, wallThickness]} />
      </mesh>
      
      {/* 下壁 右部分（南側Export）- 低い壁 */}
      <mesh
        position={[50, cutawayHeight / 2, 90]}
        material={wallMaterial}
        castShadow
        onClick={handleClick}
        onPointerEnter={() => { if (isExteriorView && onClick) document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = 'default' }}
      >
        <boxGeometry args={[100, cutawayHeight, wallThickness]} />
      </mesh>
      
      {/* 右壁（東側全体）- 低い壁 */}
      <mesh position={[100, cutawayHeight / 2, 0]} material={wallMaterial} castShadow>
        <boxGeometry args={[wallThickness, cutawayHeight, 180]} />
      </mesh>
      
      {/* 上壁（北側）- フル高さ */}
      <mesh position={[50, height / 2, -90]} material={wallMaterial} castShadow>
        <boxGeometry args={[100, height, wallThickness]} />
      </mesh>
      
      {/* L字の内側コーナー - 縦壁（Import上部からExport左端へ）*/}
      <mesh position={[0, height / 2, -45]} material={wallMaterial} castShadow>
        <boxGeometry args={[wallThickness, height, 90]} />
      </mesh>
      
      {/* L字の内側コーナー - 横壁（Import上端）*/}
      <mesh position={[-50, height / 2, 0]} material={wallMaterial} castShadow>
        <boxGeometry args={[100, height, wallThickness]} />
      </mesh>

      {/* ===== 窓 ===== */}
      {/* 左壁の窓 */}
      {[20, 45, 70].map((zOffset, i) => (
        <mesh key={`window-left-${i}`} position={[-100 + 0.1, height - 3, zOffset]} material={windowMaterial}>
          <boxGeometry args={[0.3, 2.5, 10]} />
        </mesh>
      ))}
      
      {/* 上壁の窓 */}
      {[20, 50, 80].map((xOffset, i) => (
        <mesh key={`window-top-${i}`} position={[xOffset, height - 3, -90 + 0.1]} material={windowMaterial}>
          <boxGeometry args={[12, 2.5, 0.3]} />
        </mesh>
      ))}

      {/* ===== 建物ラベル ===== */}
      <mesh position={[50, height - 3, -90 - 0.5]}>
        <boxGeometry args={[70, 5, 0.3]} />
        <meshStandardMaterial color="#1E3A5F" />
      </mesh>
      
      {/* ===== ローディングドック ===== */}
      {building.exterior.loadingDocks.map((dock) => (
        <LoadingDock key={dock.id} dock={dock} />
      ))}
    </group>
  )
}
