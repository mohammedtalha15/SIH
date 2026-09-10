'use client'

import { useMemo, useState } from 'react'
import { MeshStandardMaterial } from 'three'
import type { Zone, ViewMode } from '@/lib/types'

type ZoneBlockProps = {
  zone: Zone
  buildingPosition: [number, number, number]
  viewMode: ViewMode
  isSelected: boolean
  onHover: (zone: Zone | null) => void
  onClick: (zone: Zone) => void
}

// インテリアモード用のシンプルな色
const INTERIOR_ZONE_COLORS = {
  import: '#2D7A6B', // 緑（Import Area）
  export: '#3B7BBF', // 青（Export Area）
}

export function ZoneBlock({
  zone,
  buildingPosition,
  viewMode,
  isSelected,
  onHover,
  onClick,
}: ZoneBlockProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const isExterior = viewMode === 'exterior'
  const isInterior = viewMode === 'interior'

  // インテリアモードでは import/export の主要エリアのみ表示
  const isMainZone = zone.category === 'import' || zone.category === 'export'

  // Create material for zone rendering
  const material = useMemo(() => {
    if (isExterior) {
      const opacity = isSelected ? 1.0 : isHovered ? 0.95 : 0.9
      return new MeshStandardMaterial({
        color: zone.color,
        transparent: false,
        opacity,
        roughness: 0.5,
        metalness: 0.0,
      })
    } else {
      // インテリアモードでは import/export の2色のみ
      // INVISIBLE but still clickable to prevent z-fighting with warehouse floor
      const color = zone.category === 'import' 
        ? INTERIOR_ZONE_COLORS.import 
        : INTERIOR_ZONE_COLORS.export
      
      return new MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0, // Invisible to prevent clipping
        roughness: 0.6,
        metalness: 0.0,
        colorWrite: false, // Don't write color but still process raycasts
      })
    }
  }, [zone.color, zone.category, isSelected, isHovered, isExterior])

  // Position relative to building
  const [x, y, z] = zone.position
  const [bx, by, bz] = buildingPosition
  const [zoneWidth, , zoneDepth] = zone.size

  // 床エリアとして表示
  // In interior mode, make zones very thin and position higher to avoid overlap
  const displayHeight = isExterior ? 0.3 : 0.01

  const absolutePosition: [number, number, number] = [
    bx + x,
    by + (isExterior ? 0.35 : 1.5), // Much higher position in interior to avoid overlap
    bz + z,
  ]

  // インテリアモードでは全てのゾーンをレンダリングするが、見た目を調整
  // Main zones (import/export) are invisible, sub-areas are visible for clicking
  
  return (
    <mesh
      position={absolutePosition}
      material={material}
      receiveShadow
      onPointerEnter={() => {
        setIsHovered(true)
        onHover(zone)
        document.body.style.cursor = 'pointer'
      }}
      onPointerLeave={() => {
        setIsHovered(false)
        onHover(null)
        document.body.style.cursor = 'default'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(zone)
      }}
    >
      <boxGeometry args={[zoneWidth, displayHeight, zoneDepth]} />
    </mesh>
  )
}
