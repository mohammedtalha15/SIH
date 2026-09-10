import type { PixelType, PixelGrid, BoundingBox } from './types'
import type { BuildingData } from '@/components/airport/Buildings'
import { SCENE_CONFIG, MATERIAL_COLORS } from './constants'
import * as THREE from 'three'

/**
 * Convert pixel coordinates to 3D world coordinates
 * Centers the layout around origin (0, 0, 0)
 */
export function pixelToWorld(
  pixelX: number,
  pixelY: number,
  gridWidth: number,
  gridHeight: number
): { x: number; z: number } {
  const { scaleFactor } = SCENE_CONFIG
  
  // Center the grid around origin
  const centerX = gridWidth / 2
  const centerY = gridHeight / 2
  
  return {
    x: (pixelX - centerX) * scaleFactor,
    z: (pixelY - centerY) * scaleFactor,
  }
}

/**
 * Connected component labeling using flood fill
 * Groups adjacent pixels of the same type into regions
 */
export function findConnectedRegions(
  grid: PixelGrid,
  targetType: PixelType
): Array<Array<{ x: number; y: number }>> {
  const visited = new Set<string>()
  const regions: Array<Array<{ x: number; y: number }>> = []

  const getKey = (x: number, y: number) => `${x},${y}`

  const floodFill = (startX: number, startY: number): Array<{ x: number; y: number }> => {
    const region: Array<{ x: number; y: number }> = []
    const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }]

    while (stack.length > 0) {
      const { x, y } = stack.pop()!
      const key = getKey(x, y)

      if (visited.has(key)) continue
      if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) continue
      if (grid.data[y][x] !== targetType) continue

      visited.add(key)
      region.push({ x, y })

      // 4-directional connectivity
      stack.push({ x: x + 1, y })
      stack.push({ x: x - 1, y })
      stack.push({ x, y: y + 1 })
      stack.push({ x, y: y - 1 })
    }

    return region
  }

  // Scan entire grid for unvisited pixels of target type
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.data[y][x] === targetType && !visited.has(getKey(x, y))) {
        const region = floodFill(x, y)
        if (region.length > 10) { // Filter out tiny regions (noise)
          regions.push(region)
        }
      }
    }
  }

  return regions
}

/**
 * Calculate bounding box for a region of pixels
 */
export function calculateBoundingBox(pixels: Array<{ x: number; y: number }>): BoundingBox {
  if (pixels.length === 0) {
    return { minX: 0, minZ: 0, maxX: 0, maxZ: 0 }
  }

  let minX = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxZ = -Infinity

  for (const { x, y } of pixels) {
    minX = Math.min(minX, x)
    minZ = Math.min(minZ, y)
    maxX = Math.max(maxX, x)
    maxZ = Math.max(maxZ, y)
  }

  return { minX, minZ, maxX, maxZ }
}

/**
 * Convert pixel regions to BuildingData for 3D rendering
 */
export function generateBuildingsFromGrid(grid: PixelGrid): BuildingData[] {
  const buildings: BuildingData[] = []
  const { scaleFactor } = SCENE_CONFIG
  const buildingYellowHeight = 32 // Default height for terminals (8 * 4 scale)
  const buildingRedHeight = 20   // Default height for warehouses (5 * 4 scale)

  // Find yellow building regions (terminals)
  const yellowRegions = findConnectedRegions(grid, 'building_yellow')
  yellowRegions.forEach((region, index) => {
    const bbox = calculateBoundingBox(region)
    const center = pixelToWorld(
      (bbox.minX + bbox.maxX) / 2,
      (bbox.minZ + bbox.maxZ) / 2,
      grid.width,
      grid.height
    )
    
    const width = (bbox.maxX - bbox.minX) * scaleFactor
    const depth = (bbox.maxZ - bbox.minZ) * scaleFactor

    // Only include reasonably sized buildings
    if (width > 5 && depth > 5) {
      const shape = new THREE.Shape()
      shape.moveTo(-width / 2, -depth / 2)
      shape.lineTo(width / 2, -depth / 2)
      shape.lineTo(width / 2, depth / 2)
      shape.lineTo(-width / 2, depth / 2)
      shape.closePath()
      
      buildings.push({
        id: `terminal-${index + 1}`,
        name: `Cargo Terminal ${index + 1}`,
        type: 'terminal',
        shape,
        height: buildingYellowHeight,
        position: [center.x, 0, center.z],
        capacity: Math.round(400 + Math.random() * 400),
        occupancy: Math.round(200 + Math.random() * 300),
        status: ['active', 'maintenance', 'idle'][Math.floor(Math.random() * 3)] as BuildingData['status'],
      })
    }
  })

  // Find red building regions (warehouses)
  const redRegions = findConnectedRegions(grid, 'building_red')
  redRegions.forEach((region, index) => {
    const bbox = calculateBoundingBox(region)
    const center = pixelToWorld(
      (bbox.minX + bbox.maxX) / 2,
      (bbox.minZ + bbox.maxZ) / 2,
      grid.width,
      grid.height
    )
    
    const width = (bbox.maxX - bbox.minX) * scaleFactor
    const depth = (bbox.maxZ - bbox.minZ) * scaleFactor

    // Only include reasonably sized buildings
    if (width > 3 && depth > 3) {
      const shape = new THREE.Shape()
      shape.moveTo(-width / 2, -depth / 2)
      shape.lineTo(width / 2, -depth / 2)
      shape.lineTo(width / 2, depth / 2)
      shape.lineTo(-width / 2, depth / 2)
      shape.closePath()
      
      buildings.push({
        id: `warehouse-${String.fromCharCode(65 + index)}`,
        name: `Warehouse ${String.fromCharCode(65 + index)}`,
        type: 'warehouse',
        shape,
        height: buildingRedHeight,
        position: [center.x, 0, center.z],
        capacity: Math.round(200 + Math.random() * 300),
        occupancy: Math.round(100 + Math.random() * 200),
        status: ['active', 'maintenance', 'idle'][Math.floor(Math.random() * 3)] as BuildingData['status'],
      })
    }
  })

  return buildings
}

/**
 * Generate ground mesh data from apron pixels
 * Returns vertices for a merged mesh covering all apron areas
 */
export function generateGroundGeometry(
  grid: PixelGrid,
  targetType: PixelType
): Float32Array {
  const { scaleFactor } = SCENE_CONFIG
  const vertices: number[] = []

  // Create a quad for each pixel of the target type
  // (This is simplified - in production, you'd merge adjacent quads)
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.data[y][x] === targetType) {
        const { x: worldX, z: worldZ } = pixelToWorld(x, y, grid.width, grid.height)
        const halfSize = scaleFactor / 2

        // Two triangles forming a quad
        // Triangle 1
        vertices.push(
          worldX - halfSize, 0, worldZ - halfSize,
          worldX + halfSize, 0, worldZ - halfSize,
          worldX + halfSize, 0, worldZ + halfSize
        )
        // Triangle 2
        vertices.push(
          worldX - halfSize, 0, worldZ - halfSize,
          worldX + halfSize, 0, worldZ + halfSize,
          worldX - halfSize, 0, worldZ + halfSize
        )
      }
    }
  }

  return new Float32Array(vertices)
}

/**
 * Generate simplified ground plane bounds from pixel grid
 */
export function getGroundBounds(grid: PixelGrid): {
  width: number
  depth: number
  centerX: number
  centerZ: number
} {
  const { scaleFactor } = SCENE_CONFIG
  
  return {
    width: grid.width * scaleFactor,
    depth: grid.height * scaleFactor,
    centerX: 0,
    centerZ: 0,
  }
}

/**
 * Extract runway rectangles from the grid
 */
export function extractRunways(grid: PixelGrid): Array<{
  x: number
  z: number
  width: number
  depth: number
}> {
  const regions = findConnectedRegions(grid, 'runway')
  const runways: Array<{ x: number; z: number; width: number; depth: number }> = []
  const { scaleFactor } = SCENE_CONFIG

  for (const region of regions) {
    const bbox = calculateBoundingBox(region)
    const center = pixelToWorld(
      (bbox.minX + bbox.maxX) / 2,
      (bbox.minZ + bbox.maxZ) / 2,
      grid.width,
      grid.height
    )

    const width = (bbox.maxX - bbox.minX) * scaleFactor
    const depth = (bbox.maxZ - bbox.minZ) * scaleFactor

    // Only include large enough areas (filter small taxiway segments)
    if (width > 20 || depth > 20) {
      runways.push({
        x: center.x,
        z: center.z,
        width,
        depth,
      })
    }
  }

  return runways
}

