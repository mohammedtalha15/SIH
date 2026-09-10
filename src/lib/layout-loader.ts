import type { BuildingData } from '@/components/airport/Buildings'
import * as THREE from 'three'

// Layout JSON structure types
type LayoutRunway = {
  id: string
  pos: [number, number]
  size: [number, number]
  label: string
}

type LayoutBuildingInstance = {
  pos: [number, number]
  size: [number, number, number] // [width, depth, height]
  name: string
}

type LayoutBuildingGroup = {
  type: 'terminal' | 'warehouse'
  color: string
  instances: LayoutBuildingInstance[]
}

type LayoutJSON = {
  airport_name: string
  dimensions: { width: number; height: number }
  layers: {
    foundation: { color: string; description: string }
    runways: LayoutRunway[]
    buildings: LayoutBuildingGroup[]
  }
}

// Scale factor to convert layout units to 3D world units
const LAYOUT_SCALE = 4

/**
 * Load and parse the layout JSON into 3D-ready data structures
 */
export async function loadLayoutFromJSON(path: string): Promise<{
  buildings: BuildingData[]
  runways: Array<{ id: string; x: number; z: number; width: number; depth: number; label: string }>
  dimensions: { width: number; depth: number }
  foundationColor: string
}> {
  const response = await fetch(path)
  const layout: LayoutJSON = await response.json()

  return parseLayout(layout)
}

/**
 * Parse layout JSON into 3D structures
 */
export function parseLayout(layout: LayoutJSON) {
  const scale = LAYOUT_SCALE

  // Parse runways
  const runways = layout.layers.runways.map((runway) => ({
    id: runway.id,
    x: runway.pos[0] * scale,
    z: runway.pos[1] * scale,
    width: runway.size[0] * scale,
    depth: runway.size[1] * scale,
    label: runway.label,
  }))

  // Parse buildings
  const buildings: BuildingData[] = []
  let terminalIndex = 1
  let warehouseIndex = 0

  for (const group of layout.layers.buildings) {
    for (const instance of group.instances) {
      const isTerminal = group.type === 'terminal'
      const id = isTerminal
        ? `terminal-${terminalIndex++}`
        : `warehouse-${String.fromCharCode(65 + warehouseIndex++)}`

      const width = instance.size[0] * scale
      const depth = instance.size[1] * scale
      const shape = new THREE.Shape()
      shape.moveTo(-width / 2, -depth / 2)
      shape.lineTo(width / 2, -depth / 2)
      shape.lineTo(width / 2, depth / 2)
      shape.lineTo(-width / 2, depth / 2)
      shape.closePath()
      
      buildings.push({
        id,
        name: instance.name,
        type: isTerminal ? 'terminal' : 'warehouse',
        shape,
        height: instance.size[2] * scale,
        position: [instance.pos[0] * scale, 0, instance.pos[1] * scale],
        capacity: Math.round(instance.size[0] * instance.size[1] * 10 + Math.random() * 200),
        occupancy: Math.round(instance.size[0] * instance.size[1] * 5 + Math.random() * 150),
        status: ['active', 'maintenance', 'idle'][Math.floor(Math.random() * 3)] as BuildingData['status'],
      })
    }
  }

  return {
    buildings,
    runways,
    dimensions: {
      width: layout.dimensions.width * scale,
      depth: layout.dimensions.height * scale,
    },
    foundationColor: layout.layers.foundation.color,
  }
}

// Pre-parsed layout data for SSR/static generation
export const DEFAULT_LAYOUT: LayoutJSON = {
  airport_name: "Cargo Terminal Alpha",
  dimensions: { width: 200, height: 200 },
  layers: {
    foundation: {
      color: "#333333",
      description: "Main concrete apron and taxiway base"
    },
    runways: [
      { id: "runway_north", pos: [-57, -21], size: [75, 7], label: "RWY 16L" },
      { id: "runway_south", pos: [12, 28], size: [125, 7], label: "RWY 34R" }
    ],
    buildings: [
      {
        type: "terminal",
        color: "#ffcc00",
        instances: [
          { pos: [0, -5], size: [15, 12, 8], name: "Main Cargo Hub" },
          { pos: [-10, -8], size: [10, 5, 6], name: "Terminal West Wing" }
        ]
      },
      {
        type: "warehouse",
        color: "#ff4444",
        instances: [
          { pos: [-15, 10], size: [6, 4, 5], name: "Cold Storage A" },
          { pos: [-15, 16], size: [6, 4, 5], name: "Cold Storage B" },
          { pos: [-15, 22], size: [6, 4, 5], name: "Cold Storage C" },
          { pos: [75, 12], size: [4, 8, 5], name: "Export Logistics 1" },
          { pos: [75, 22], size: [4, 8, 5], name: "Export Logistics 2" },
          { pos: [35, -35], size: [5, 5, 4], name: "Maintenance Hangar" }
        ]
      }
    ]
  }
}

// Get pre-parsed static layout
export function getStaticLayout() {
  return parseLayout(DEFAULT_LAYOUT)
}

