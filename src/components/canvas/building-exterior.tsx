'use client'

import { LoadingDock } from './loading-dock'
import { useMemo } from 'react'
import { MeshStandardMaterial, DoubleSide } from 'three'
import type { Building, ViewMode } from '@/lib/types'

type BuildingExteriorProps = {
  building: Building
  viewMode: ViewMode
  onClick?: (buildingId: string) => void
}

export function BuildingExterior({ building, viewMode, onClick }: BuildingExteriorProps) {
  const [width, height, depth] = building.size
  
  const isExteriorView = viewMode === 'exterior'
  
  // Wall material - gray concrete style
  const wallMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: '#9CA3AF',
      roughness: 0.7,
      metalness: 0.1,
      side: DoubleSide,
    })
  }, [])
  
  // Window material - blue tinted
  const windowMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: '#3B82F6',
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.8,
    })
  }, [])
  
  const wallThickness = 1.0
  // カットアウェイ用に壁の高さを低くする（参照画像のように）
  const cutawayWallHeight = isExteriorView ? height * 0.5 : height
  const fullWallHeight = height
  
  const windowHeight = 2.5
  const windowSpacing = 20

  // Calculate number of windows
  const numWindowsFront = Math.max(1, Math.floor(width / windowSpacing) - 1)
  const numWindowsSide = Math.max(1, Math.floor(depth / windowSpacing) - 1)

  return (
    <group position={building.position}>
      {/* 床 - Only show in exterior view to prevent overlap */}
      {isExteriorView && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.2, 0]}
          receiveShadow
        >
          <planeGeometry args={[width - 3, depth - 3]} />
          <meshStandardMaterial color="#D1D5DB" roughness={0.8} />
        </mesh>
      )}

      {/* 屋根は完全になし - カットアウェイスタイル */}
      
      {/* 前壁 (positive Z) - ローディングドック側 - 低い壁 */}
      <mesh
        position={[0, cutawayWallHeight / 2, depth / 2 - wallThickness / 2]}
        material={wallMaterial}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation()
          if (onClick && isExteriorView) onClick(building.id)
        }}
        onPointerEnter={() => {
          if (isExteriorView && onClick) document.body.style.cursor = 'pointer'
        }}
        onPointerLeave={() => { document.body.style.cursor = 'default' }}
      >
        <boxGeometry args={[width, cutawayWallHeight, wallThickness]} />
      </mesh>

      {/* 後壁 (negative Z) - フル高さ */}
      <mesh
        position={[0, fullWallHeight / 2, -depth / 2 + wallThickness / 2]}
        material={wallMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, fullWallHeight, wallThickness]} />
      </mesh>

      {/* 左壁 (negative X) - フル高さ */}
      <mesh
        position={[-width / 2 + wallThickness / 2, fullWallHeight / 2, 0]}
        material={wallMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[wallThickness, fullWallHeight, depth]} />
      </mesh>

      {/* 右壁 (positive X) - 低い壁 */}
      <mesh
        position={[width / 2 - wallThickness / 2, cutawayWallHeight / 2, 0]}
        material={wallMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[wallThickness, cutawayWallHeight, depth]} />
      </mesh>

      {/* 後壁の窓 */}
      {Array.from({ length: numWindowsFront }).map((_, i) => {
        const xPos = -width / 2 + windowSpacing + i * windowSpacing
        if (xPos > width / 2 - windowSpacing) return null
        return (
          <mesh
            key={`window-back-${i}`}
            position={[xPos, fullWallHeight - windowHeight / 2 - 2, -depth / 2 + 0.1]}
            material={windowMaterial}
          >
            <boxGeometry args={[10, windowHeight, 0.3]} />
          </mesh>
        )
      })}

      {/* 左壁の窓 */}
      {Array.from({ length: numWindowsSide }).map((_, i) => {
        const zPos = -depth / 2 + windowSpacing + i * windowSpacing
        if (zPos > depth / 2 - windowSpacing) return null
        return (
          <mesh
            key={`window-left-${i}`}
            position={[-width / 2 + 0.1, fullWallHeight - windowHeight / 2 - 2, zPos]}
            material={windowMaterial}
          >
            <boxGeometry args={[0.3, windowHeight, 8]} />
          </mesh>
        )
      })}

      {/* ローディングドック */}
      {building.exterior.loadingDocks.map((dock) => (
        <LoadingDock key={dock.id} dock={dock} />
      ))}

      {/* 建物ラベル（後壁に） */}
      <mesh position={[0, fullWallHeight - 3, -depth / 2 - 0.3]}>
        <boxGeometry args={[50, 4, 0.3]} />
        <meshStandardMaterial color="#1E3A5F" />
      </mesh>
    </group>
  )
}
