'use client'

import { useMemo } from 'react'
import { createCorrugatedMetalMaterial, createSmoothPanelMaterial } from '@/lib/materials'

type BuildingFacadeProps = {
  width: number
  height: number
  depth: number
  material: 'corrugated_metal' | 'smooth_panel'
  color?: string
}

export function BuildingFacade({ width, height, depth, material, color }: BuildingFacadeProps) {
  const facadeMaterial = useMemo(() => {
    if (material === 'corrugated_metal') {
      return createCorrugatedMetalMaterial()
    }
    return createSmoothPanelMaterial()
  }, [material])

  if (color) {
    facadeMaterial.color.set(color)
  }

  return (
    <mesh material={facadeMaterial} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
    </mesh>
  )
}
