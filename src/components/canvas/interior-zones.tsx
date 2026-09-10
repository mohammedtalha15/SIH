'use client'

import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'
import { ZoneBlock } from './zone-block'
import { ZoneLabel } from './zone-label'
import { cargoBuilding8, cargoBuilding7, zoneBoundaries } from '@/lib/warehouse-data'
import { useLayoutStore, getZonesByBuilding } from '@/lib/stores/layoutStore'
import type { Zone } from '@/lib/types'
import type { ViewMode } from '@/lib/types'

type InteriorZonesProps = {
  viewMode: ViewMode
  onZoneSelect: (zone: Zone | null) => void
  selectedZoneId?: string
}

export function InteriorZones({ viewMode, onZoneSelect, selectedZoneId }: InteriorZonesProps) {
  // Get zones from layout store (editable) instead of static data
  const { zones: editableZones, buildings } = useLayoutStore()
  
  // Get zones for each building from the editable store
  const building8Zones = useMemo(() => 
    getZonesByBuilding(editableZones, 'building-8'),
    [editableZones]
  )
  
  const building7Zones = useMemo(() => 
    getZonesByBuilding(editableZones, 'building-7'),
    [editableZones]
  )
  
  // Get building positions (use editable buildings if available)
  const building8Position = useMemo(() => {
    const b = buildings.find(b => b.id === 'building-8')
    return b?.position || cargoBuilding8.position
  }, [buildings])
  
  const building7Position = useMemo(() => {
    const b = buildings.find(b => b.id === 'building-7')
    return b?.position || cargoBuilding7.position
  }, [buildings])

  const handleZoneClick = (zone: Zone) => {
    onZoneSelect(zone)
  }

  const handleZoneHover = (zone: Zone | null) => {
    // Hover handling can be extended here
  }

  return (
    <group>
      {/* Cargo Building 8 zones - from editable store */}
      {building8Zones.map((zone) => (
        <group key={zone.id}>
          <ZoneBlock
            zone={zone}
            buildingPosition={building8Position}
            viewMode={viewMode}
            isSelected={zone.id === selectedZoneId}
            onHover={handleZoneHover}
            onClick={handleZoneClick}
          />
          <ZoneLabel
            zone={zone}
            buildingPosition={building8Position}
            viewMode={viewMode}
            onClick={handleZoneClick}
          />
        </group>
      ))}
      
      {/* Cargo Building 7 zones - from editable store */}
      {building7Zones.map((zone) => (
        <group key={zone.id}>
          <ZoneBlock
            zone={zone}
            buildingPosition={building7Position}
            viewMode={viewMode}
            isSelected={zone.id === selectedZoneId}
            onHover={handleZoneHover}
            onClick={handleZoneClick}
          />
          <ZoneLabel
            zone={zone}
            buildingPosition={building7Position}
            viewMode={viewMode}
            onClick={handleZoneClick}
          />
        </group>
      ))}
      
      {/* Zone boundaries for Building 8 - 外観モードのみ */}
      {viewMode === 'exterior' && (
        <ZoneBoundaries buildingPosition={building8Position} />
      )}
      
      {/* Interior mode: add floor boundary lines */}
      {viewMode === 'interior' && (
        <>
          <FloorBoundaryLines buildingPosition={building8Position} />
          <FloorBoundaryLines buildingPosition={building7Position} />
        </>
      )}
    </group>
  )
}

// インテリアモード用の床境界線
function FloorBoundaryLines({ buildingPosition }: { buildingPosition: [number, number, number] }) {
  const [bx, , bz] = buildingPosition
  
  const lineMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: '#FFD700', // 黄色のセーフティライン
      emissive: '#FFD700',
      emissiveIntensity: 0.3,
      roughness: 0.3,
    })
  }, [])

  // 主要な通路ラインを描画
  return (
    <group position={[bx, 0.35, bz]}>
      {/* 中央通路 */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={lineMaterial}>
        <planeGeometry args={[2, 180]} />
      </mesh>
      {/* 横通路 */}
      <mesh position={[0, 0, 40]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={lineMaterial}>
        <planeGeometry args={[2, 200]} />
      </mesh>
      <mesh position={[0, 0, -40]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={lineMaterial}>
        <planeGeometry args={[2, 200]} />
      </mesh>
    </group>
  )
}

// エリア間の境界線を描画（外観モード用）
function ZoneBoundaries({ buildingPosition }: { buildingPosition: [number, number, number] }) {
  const [bx, by, bz] = buildingPosition
  
  const boundaryMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: '#E5E7EB', // 薄いグレー
      roughness: 0.5,
    })
  }, [])

  return (
    <group position={[bx, by + 0.7, bz]}>
      {zoneBoundaries.map((boundary) => {
        const segments = []
        for (let i = 0; i < boundary.points.length - 1; i++) {
          const [x1, z1] = boundary.points[i]
          const [x2, z2] = boundary.points[i + 1]
          
          const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2)
          const angle = Math.atan2(z2 - z1, x2 - x1)
          const midX = (x1 + x2) / 2
          const midZ = (z1 + z2) / 2
          
          segments.push(
            <mesh
              key={`${boundary.id}-${i}`}
              position={[midX, 0, midZ]}
              rotation={[0, -angle + Math.PI / 2, 0]}
              material={boundaryMaterial}
            >
              <boxGeometry args={[boundary.width, 0.3, length + 0.5]} />
            </mesh>
          )
        }
        return <group key={boundary.id}>{segments}</group>
      })}
    </group>
  )
}
