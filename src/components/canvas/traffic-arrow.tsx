'use client'

import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'
import type { TrafficArrow } from '@/lib/types'

type TrafficArrowProps = {
  arrow: TrafficArrow
}

export function TrafficArrowComponent({ arrow }: TrafficArrowProps) {
  const arrowMaterial = useMemo(() => {
    const mat = new MeshStandardMaterial({ color: '#0000FF' })
    return mat
  }, [])

  return (
    <group position={arrow.position} rotation={[0, arrow.direction, 0]}>
      <mesh material={arrowMaterial}>
        <coneGeometry args={[2, 5, 3]} />
      </mesh>
    </group>
  )
}
