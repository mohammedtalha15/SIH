'use client'

import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { MATERIAL_COLORS, TAXIWAYS } from '@/lib/constants'

type RunwayData = {
  id: string
  x: number
  z: number
  width: number
  depth: number
  label?: string
}

type RunwayProps = {
  data: RunwayData[]
}

export function Runway({ data }: RunwayProps) {
  return (
    <group>
      {data.map((runway) => (
        <RunwaySegment key={runway.id} {...runway} />
      ))}
      
      {/* Taxiways connecting runways to apron */}
      {TAXIWAYS.map((taxiway, index) => (
        <TaxiwaySegment key={`taxiway-${index}`} {...taxiway} />
      ))}
    </group>
  )
}

function RunwaySegment({ id, x, z, width, depth, label }: RunwayData) {
  // Create runway markings - center line dashes
  const centerMarkings = useMemo(() => {
    const marks = []
    const markSpacing = 30
    const markLength = 18
    const numMarks = Math.floor(width / markSpacing)
    const startX = -width / 2 + 25

    for (let i = 0; i < numMarks; i++) {
      marks.push({
        x: startX + i * markSpacing,
        width: markLength,
        depth: 2,
      })
    }

    return marks
  }, [width])

  // Threshold markings at runway ends
  const thresholdMarkings = useMemo(() => {
    const marks = []
    const numBars = Math.max(4, Math.floor(depth / 4))
    const barSpacing = (depth - 8) / (numBars + 1)
    
    for (let i = 0; i < numBars; i++) {
      marks.push({
        z: -depth / 2 + 4 + barSpacing * (i + 1),
      })
    }
    
    return marks
  }, [depth])

  return (
    <group position={[x, 0.1, z]}>
      {/* Main runway surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color={MATERIAL_COLORS.runway}
          roughness={0.6}
          metalness={0}
        />
      </mesh>

      {/* Center line markings */}
      {centerMarkings.map((mark, index) => (
        <mesh
          key={`center-${index}`}
          position={[mark.x, 0.03, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[mark.width, mark.depth]} />
          <meshStandardMaterial
            color={MATERIAL_COLORS.runwayMarkings}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* Edge stripes */}
      <mesh position={[0, 0.03, depth / 2 - 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width - 15, 2.5]} />
        <meshStandardMaterial color={MATERIAL_COLORS.runwayMarkings} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.03, -depth / 2 + 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width - 15, 2.5]} />
        <meshStandardMaterial color={MATERIAL_COLORS.runwayMarkings} roughness={0.5} />
      </mesh>

      {/* Threshold markings - left end */}
      <group position={[-width / 2 + 30, 0.03, 0]}>
        {thresholdMarkings.map((mark, i) => (
          <mesh key={`threshold-l-${i}`} position={[0, 0, mark.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[35, 2.2]} />
            <meshStandardMaterial color={MATERIAL_COLORS.runwayMarkings} roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* Threshold markings - right end */}
      <group position={[width / 2 - 30, 0.03, 0]}>
        {thresholdMarkings.map((mark, i) => (
          <mesh key={`threshold-r-${i}`} position={[0, 0, mark.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[35, 2.2]} />
            <meshStandardMaterial color={MATERIAL_COLORS.runwayMarkings} roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* Runway designation label */}
      {label && (
        <>
          <RunwayLabel position={[-width / 2 + 60, 0.05, 0]} label={label} />
          <RunwayLabel position={[width / 2 - 60, 0.05, 0]} label={getOppositeRunway(label)} rotation={Math.PI} />
        </>
      )}

      {/* 3D Label floating above runway */}
      {label && (
        <Html
          position={[0, 15, 0]}
          center
          distanceFactor={200}
          style={{ pointerEvents: 'none' }}
        >
          <div className="whitespace-nowrap rounded bg-slate-900/80 px-2 py-1 font-mono text-xs text-white backdrop-blur-sm">
            {label}
          </div>
        </Html>
      )}
    </group>
  )
}

// Get opposite runway designation (e.g., 16L -> 34R)
function getOppositeRunway(label: string): string {
  const match = label.match(/RWY (\d+)([LRC]?)/)
  if (!match) return label
  
  const num = parseInt(match[1])
  const suffix = match[2]
  const oppositeNum = ((num + 18 - 1) % 36) + 1
  const oppositeSuffix = suffix === 'L' ? 'R' : suffix === 'R' ? 'L' : suffix
  
  return `RWY ${oppositeNum.toString().padStart(2, '0')}${oppositeSuffix}`
}

// Simplified runway number display
function RunwayLabel({ 
  position, 
  label,
  rotation = 0 
}: { 
  position: [number, number, number]
  label: string
  rotation?: number 
}) {
  // Extract just the number for display
  const displayNum = label.replace('RWY ', '')

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Background area for number */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[25, 18]} />
        <meshStandardMaterial color={MATERIAL_COLORS.runwayMarkings} roughness={0.5} />
      </mesh>
    </group>
  )
}

function TaxiwaySegment({ x, z, width, depth }: { x: number; z: number; width: number; depth: number }) {
  return (
    <group position={[x, 0.06, z]}>
      {/* Taxiway surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color="#c0c0c0"
          roughness={0.65}
          metalness={0}
        />
      </mesh>
      
      {/* Yellow center line */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, depth - 6]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.6} />
      </mesh>

      {/* Edge markings */}
      <mesh position={[-width / 2 + 1, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, depth - 6]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.6} opacity={0.5} transparent />
      </mesh>
      <mesh position={[width / 2 - 1, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, depth - 6]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.6} opacity={0.5} transparent />
      </mesh>
    </group>
  )
}
