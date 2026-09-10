'use client'

import { Html, Text } from '@react-three/drei'
import type { Zone, ViewMode } from '@/lib/types'

type ZoneLabelProps = {
  zone: Zone
  buildingPosition: [number, number, number]
  viewMode: ViewMode
  onClick?: (zone: Zone) => void
}

export function ZoneLabel({ zone, buildingPosition, viewMode, onClick }: ZoneLabelProps) {
  const [bx, by, bz] = buildingPosition
  const [x, , z] = zone.position
  
  const labelX = bx + x
  const labelZ = bz + z

  const bgColor = zone.category === 'import' ? '#2D7A6B' : 
                  zone.category === 'export' ? '#3B7BBF' : 
                  '#6B7280'

  const isMainArea = zone.id === 'import-area' || zone.id === 'export-area'

  // インテリアモードでは立て看板スタイルで表示（両面）
  if (viewMode === 'interior') {
    const signHeight = isMainArea ? 3.5 : 2.8
    const signWidth = isMainArea ? 10 : 7
    
    return (
      <group position={[labelX, 0, labelZ]}>
        {/* 支柱 */}
        <mesh position={[0, signHeight / 2, 0]}>
          <cylinderGeometry args={[0.1, 0.1, signHeight, 8]} />
          <meshStandardMaterial color="#6B7280" metalness={0.7} roughness={0.3} />
        </mesh>
        
        {/* 看板プレート（表） - Clickable */}
        <mesh 
          position={[0, signHeight, 0.08]}
          onClick={onClick ? () => onClick(zone) : undefined}
          onPointerOver={(e) => {
            if (onClick) {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }
          }}
          onPointerOut={() => {
            if (onClick) {
              document.body.style.cursor = 'default'
            }
          }}
        >
          <boxGeometry args={[signWidth, 1.5, 0.15]} />
          <meshStandardMaterial color={bgColor} />
        </mesh>
        
        {/* 看板枠（表） */}
        <mesh position={[0, signHeight, 0.16]}>
          <boxGeometry args={[signWidth + 0.3, 1.7, 0.02]} />
          <meshStandardMaterial color="#1F2937" />
        </mesh>
        
        {/* テキスト（表面） */}
        <Text
          position={[0, signHeight + 0.15, 0.25]}
          fontSize={isMainArea ? 0.7 : 0.5}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {zone.name}
        </Text>
        
        {/* 日本語サブテキスト（表面） */}
        {zone.nameJa && (
          <Text
            position={[0, signHeight - 0.35, 0.25]}
            fontSize={0.35}
            color="#E5E7EB"
            anchorX="center"
            anchorY="middle"
          >
            {zone.nameJa}
          </Text>
        )}

        {/* テキスト（裏面） */}
        <Text
          position={[0, signHeight + 0.15, -0.25]}
          fontSize={isMainArea ? 0.7 : 0.5}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          rotation={[0, Math.PI, 0]}
        >
          {zone.name}
        </Text>
        
        {/* 日本語サブテキスト（裏面） */}
        {zone.nameJa && (
          <Text
            position={[0, signHeight - 0.35, -0.25]}
            fontSize={0.35}
            color="#E5E7EB"
            anchorX="center"
            anchorY="middle"
            rotation={[0, Math.PI, 0]}
          >
            {zone.nameJa}
          </Text>
        )}
      </group>
    )
  }

  // 外観モードでは浮かぶラベル
  const labelY = by + 12

  return (
    <group position={[labelX, labelY, labelZ]}>
      {/* 接続線 */}
      <mesh position={[0, -4, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 8, 4]} />
        <meshStandardMaterial color={bgColor} />
      </mesh>
      
      {/* ラベルカード - Clickable */}
      <Html
        center
        style={{ pointerEvents: onClick ? 'auto' : 'none' }}
      >
        <div
          onClick={onClick ? () => onClick(zone) : undefined}
          style={{
            backgroundColor: bgColor,
            color: 'white',
            padding: isMainArea ? '6px 14px' : '5px 10px',
            borderRadius: '4px',
            fontWeight: isMainArea ? 'bold' : '600',
            fontSize: isMainArea ? '12px' : '10px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            transform: 'skewX(-5deg)',
            minWidth: isMainArea ? '84px' : '66px',
            textAlign: 'center',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (onClick) {
              e.currentTarget.style.transform = 'skewX(-5deg) scale(1.05)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (onClick) {
              e.currentTarget.style.transform = 'skewX(-5deg) scale(1)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
            }
          }}
        >
          {zone.name}
        </div>
      </Html>
    </group>
  )
}

type AllZoneLabelsProps = {
  zones: Zone[]
  buildingPosition: [number, number, number]
  viewMode: ViewMode
}

export function AllZoneLabels({ zones, buildingPosition, viewMode }: AllZoneLabelsProps) {
  return (
    <>
      {zones.map((zone) => (
        <ZoneLabel
          key={zone.id}
          zone={zone}
          buildingPosition={buildingPosition}
          viewMode={viewMode}
        />
      ))}
    </>
  )
}
