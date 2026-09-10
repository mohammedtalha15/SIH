'use client'

import { useRef, useState, useEffect, useMemo, useContext } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Group } from 'three'
import { useSelectedBuilding } from './Scene'
import { AirportLoadingContext } from './AirportScene'

// =============================================================================
// RENDERING MODE FLAG
// Set to true to use pixel-based rendering (like roads/runways/concrete)
// Set to false to use the original shape-based extruded rendering
// =============================================================================
const USE_PIXEL_RENDERING = true

export type BuildingType = 'terminal' | 'warehouse'

export type BuildingData = {
  id: string
  name: string
  type: BuildingType
  shape: THREE.Shape
  height: number
  position: [number, number, number]
  capacity?: number
  status?: 'active' | 'maintenance' | 'idle'
  occupancy?: number
}

const IMAGE_WIDTH = 1320
const IMAGE_HEIGHT = 857
const WORLD_WIDTH = 200
const WORLD_HEIGHT = 130
const TERMINAL_HEIGHT = 1.3
const WAREHOUSE_HEIGHT = 0.8

function pixelToWorld(px: number, py: number): [number, number] {
  const x = (px / IMAGE_WIDTH - 0.5) * WORLD_WIDTH
  const z = (py / IMAGE_HEIGHT - 0.5) * WORLD_HEIGHT
  return [x, z]
}

function isYellow(r: number, g: number, b: number): boolean {
  return r > 200 && g > 200 && b < 100
}

function isRed(r: number, g: number, b: number): boolean {
  return r > 180 && g < 80 && b < 80
}

// Get boundary pixels from a set of filled pixels
function getBoundaryPixels(pixels: Array<[number, number]>): Array<[number, number]> {
  const pixelSet = new Set(pixels.map(p => `${p[0]},${p[1]}`))
  const boundary: Array<[number, number]> = []
  
  for (const [x, y] of pixels) {
    // A pixel is on the boundary if any 4-neighbor is empty
    const isBoundary = 
      !pixelSet.has(`${x-1},${y}`) || 
      !pixelSet.has(`${x+1},${y}`) ||
      !pixelSet.has(`${x},${y-1}`) || 
      !pixelSet.has(`${x},${y+1}`)
    
    if (isBoundary) {
      boundary.push([x, y])
    }
  }
  
  return boundary
}

// Order boundary pixels using greedy nearest-neighbor
// This walks along the boundary by always picking the closest unvisited pixel
function orderBoundaryGreedy(boundaryPixels: Array<[number, number]>): Array<[number, number]> {
  if (boundaryPixels.length < 3) return boundaryPixels
  
  // Start from the topmost-leftmost pixel
  let startIdx = 0
  for (let i = 1; i < boundaryPixels.length; i++) {
    if (boundaryPixels[i][1] < boundaryPixels[startIdx][1] ||
        (boundaryPixels[i][1] === boundaryPixels[startIdx][1] && boundaryPixels[i][0] < boundaryPixels[startIdx][0])) {
      startIdx = i
    }
  }
  
  const result: Array<[number, number]> = [boundaryPixels[startIdx]]
  const used = new Set<number>([startIdx])
  
  while (result.length < boundaryPixels.length) {
    const current = result[result.length - 1]
    let nearestIdx = -1
    let nearestDist = Infinity
    
    for (let i = 0; i < boundaryPixels.length; i++) {
      if (used.has(i)) continue
      
      const [x, y] = boundaryPixels[i]
      // Use Manhattan distance for speed, Euclidean for ties
      const dist = Math.abs(x - current[0]) + Math.abs(y - current[1])
      
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = i
      }
    }
    
    if (nearestIdx === -1 || nearestDist > 20) break // Stop if no nearby pixel found
    
    result.push(boundaryPixels[nearestIdx])
    used.add(nearestIdx)
  }
  
  return result
}

// Simplify the contour by keeping only every Nth point and points at corners
function simplifyContour(points: Array<[number, number]>, targetCount: number = 60): Array<[number, number]> {
  if (points.length <= targetCount) return points
  
  const step = Math.max(1, Math.floor(points.length / targetCount))
  const result: Array<[number, number]> = []
  
  for (let i = 0; i < points.length; i += step) {
    result.push(points[i])
  }
  
  return result
}

// Create THREE.Shape from ordered contour points
function createShapeFromContour(contour: Array<[number, number]>): THREE.Shape | null {
  if (contour.length < 3) return null
  
  const simplified = simplifyContour(contour, 80)
  if (simplified.length < 3) return null
  
  try {
    const shape = new THREE.Shape()
    const worldPoints = simplified.map(([px, py]) => pixelToWorld(px, py))
    
    shape.moveTo(worldPoints[0][0], -worldPoints[0][1])
    for (let i = 1; i < worldPoints.length; i++) {
      shape.lineTo(worldPoints[i][0], -worldPoints[i][1])
    }
    shape.closePath()
    
    return shape
  } catch (e) {
    console.error('Failed to create shape:', e)
    return null
  }
}

// Extract building shapes from image
function extractBuildingShapes(imageData: ImageData): Array<{
  type: BuildingType
  shape: THREE.Shape
  pixelCount: number
}> {
  const { width, height, data } = imageData
  const globalVisited = new Set<string>()
  const buildings: Array<{ type: BuildingType; shape: THREE.Shape; pixelCount: number }> = []

  function floodFill(startX: number, startY: number, colorCheck: (r: number, g: number, b: number) => boolean): Array<[number, number]> | null {
    const pixels: Array<[number, number]> = []
    const queue: Array<[number, number]> = [[startX, startY]]
    
    while (queue.length > 0) {
      const [x, y] = queue.shift()!
      const key = `${x},${y}`
      
      if (globalVisited.has(key) || x < 0 || x >= width || y < 0 || y >= height) continue
      
      const idx = (y * width + x) * 4
      if (!colorCheck(data[idx], data[idx + 1], data[idx + 2])) continue
      
      globalVisited.add(key)
      pixels.push([x, y])
      
      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }
    
    return pixels.length > 30 ? pixels : null
  }

  function processRegions(colorCheck: (r: number, g: number, b: number) => boolean, type: BuildingType) {
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const key = `${x},${y}`
        if (globalVisited.has(key)) continue
        
        const idx = (y * width + x) * 4
        if (!colorCheck(data[idx], data[idx + 1], data[idx + 2])) continue
        
        const pixels = floodFill(x, y, colorCheck)
        if (!pixels) continue
        
        const boundary = getBoundaryPixels(pixels)
        if (boundary.length < 10) continue
        
        const ordered = orderBoundaryGreedy(boundary)
        if (ordered.length < 10) continue
        
        const shape = createShapeFromContour(ordered)
        if (shape) {
          buildings.push({ type, shape, pixelCount: pixels.length })
        }
      }
    }
  }

  processRegions(isYellow, 'terminal')
  processRegions(isRed, 'warehouse')

  console.log(`Extracted ${buildings.length} buildings`)
  return buildings
}

function shapesToBuildingData(shapes: ReturnType<typeof extractBuildingShapes>): BuildingData[] {
  const terminalNames = ['Terminal Alpha', 'Terminal Beta', 'Terminal Gamma', 'Terminal Delta', 'Terminal Epsilon']
  const warehouseNames = ['Cargo Depot A', 'Cargo Depot B', 'Cargo Depot C', 'Cargo Depot D', 'Cargo Depot E', 'Cargo Hub F', 'Cargo Hub G', 'Cargo Hub H', 'Cargo Hub I', 'Cargo Hub J', 'Cargo Hub K', 'Cargo Hub L']
  
  let tIdx = 0, wIdx = 0
  const statuses: Array<'active' | 'maintenance' | 'idle'> = ['active', 'active', 'active', 'active', 'maintenance', 'idle']

  return shapes.map((s, i) => ({
    id: `building-${i}`,
    name: s.type === 'terminal' ? terminalNames[tIdx++ % terminalNames.length] : warehouseNames[wIdx++ % warehouseNames.length],
    type: s.type,
    shape: s.shape,
    height: s.type === 'terminal' ? TERMINAL_HEIGHT : WAREHOUSE_HEIGHT,
    position: [0, 0, 0] as [number, number, number],
    capacity: Math.floor(s.pixelCount / 5),
    status: statuses[i % statuses.length],
    occupancy: 50 + Math.floor(Math.random() * 45),
  }))
}

function useLayoutBuildings(): BuildingData[] {
  const [buildings, setBuildings] = useState<BuildingData[]>([])
  const { setAirportReady } = useContext(AirportLoadingContext)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/layout.png'
    
    img.onload = () => {
      console.log('Layout image loaded:', img.width, 'x', img.height)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        const shapes = extractBuildingShapes(imageData)
        const buildingData = shapesToBuildingData(shapes)
        setBuildings(buildingData)
        
        // Signal that buildings are ready after a short delay for rendering
        setTimeout(() => {
          console.log('Buildings rendered, signaling ready')
          setAirportReady()
        }, 500)
      }
    }
    
    img.onerror = () => {
      console.error('Failed to load layout image')
      // Still signal ready even on error
      setTimeout(() => setAirportReady(), 1000)
    }
  }, [setAirportReady])

  return buildings
}

const BUILDING_COLORS = {
  terminal: { base: '#d4883c', roof: '#a86830', hover: '#e8a050' },
  warehouse: { base: '#a84040', roof: '#7a2e2e', hover: '#c05050' },
}

const STATUS_COLORS = { active: '#4ade80', maintenance: '#fbbf24', idle: '#94a3b8' }

function ExtrudedBuilding({ data }: { data: BuildingData }) {
  const [isHovered, setIsHovered] = useState(false)
  const { selectedBuilding, setSelectedBuilding, setHoveredBuilding } = useSelectedBuilding()
  const isSelected = selectedBuilding?.id === data.id
  const colors = BUILDING_COLORS[data.type]

  const extrudeSettings = { steps: 1, depth: data.height, bevelEnabled: false }

  const shapePoints = data.shape.getPoints()
  const cx = shapePoints.reduce((sum, p) => sum + p.x, 0) / shapePoints.length
  const cy = shapePoints.reduce((sum, p) => sum + p.y, 0) / shapePoints.length

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
      <mesh
        castShadow
        receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); setHoveredBuilding(data); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setIsHovered(false); setHoveredBuilding(null); document.body.style.cursor = 'default' }}
        onClick={(e) => { e.stopPropagation(); setSelectedBuilding(isSelected ? null : data) }}
      >
        <extrudeGeometry args={[data.shape, extrudeSettings]} />
        <meshStandardMaterial color={isHovered || isSelected ? colors.hover : colors.base} flatShading />
      </mesh>

      <mesh position={[0, 0, data.height]} castShadow>
        <extrudeGeometry args={[data.shape, { ...extrudeSettings, depth: 0.2 }]} />
        <meshStandardMaterial color={colors.roof} flatShading />
      </mesh>

      {isSelected && (
        <Html position={[cx, cy, data.height + 2]} center distanceFactor={60} style={{ pointerEvents: 'none' }} rotation={[Math.PI / 2, 0, 0]}>
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border-2 border-blue-400 min-w-[180px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-800 font-bold text-sm">{data.name}</h3>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[data.status as keyof typeof STATUS_COLORS] }} />
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between"><span>Type:</span><span className="font-medium text-gray-800">{data.type === 'terminal' ? 'Terminal' : 'Warehouse'}</span></div>
              {data.capacity && <div className="flex justify-between"><span>Capacity:</span><span className="font-medium text-gray-800">{data.capacity} units</span></div>}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// =============================================================================
// PIXEL-BASED RENDERING (alternative approach like roads/runways/concrete)
// =============================================================================

type BuildingRegion = {
  type: BuildingType
  pixels: Array<[number, number]>
}

// Extract building regions as pixel arrays (for pixel-based rendering)
function extractBuildingRegions(imageData: ImageData): Array<BuildingRegion> {
  const { width, height, data } = imageData
  const globalVisited = new Set<string>()
  const buildings: Array<BuildingRegion> = []

  function floodFill(startX: number, startY: number, colorCheck: (r: number, g: number, b: number) => boolean): Array<[number, number]> | null {
    const pixels: Array<[number, number]> = []
    const queue: Array<[number, number]> = [[startX, startY]]
    
    while (queue.length > 0) {
      const [x, y] = queue.shift()!
      const key = `${x},${y}`
      
      if (globalVisited.has(key) || x < 0 || x >= width || y < 0 || y >= height) continue
      
      const idx = (y * width + x) * 4
      if (!colorCheck(data[idx], data[idx + 1], data[idx + 2])) continue
      
      globalVisited.add(key)
      pixels.push([x, y])
      
      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }
    
    return pixels.length > 0 ? pixels : null
  }

  function processRegions(colorCheck: (r: number, g: number, b: number) => boolean, type: BuildingType) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`
        if (globalVisited.has(key)) continue
        
        const idx = (y * width + x) * 4
        if (!colorCheck(data[idx], data[idx + 1], data[idx + 2])) continue
        
        const pixels = floodFill(x, y, colorCheck)
        if (!pixels || pixels.length === 0) continue
        
        buildings.push({ type, pixels })
      }
    }
  }

  processRegions(isYellow, 'terminal')
  processRegions(isRed, 'warehouse')

  console.log(`✅ Extracted ${buildings.length} building regions with ${buildings.reduce((sum, b) => sum + b.pixels.length, 0)} total pixels (pixel mode)`)
  return buildings
}

// Create merged geometry from building pixels
function createMergedBuildingGeometry(
  regions: Array<BuildingRegion>,
  buildingType: BuildingType
): THREE.BufferGeometry | null {
  const filteredRegions = regions.filter(r => r.type === buildingType)
  if (filteredRegions.length === 0) return null
  
  const buildingHeight = buildingType === 'terminal' ? TERMINAL_HEIGHT : WAREHOUSE_HEIGHT
  const pixelWorldSize = WORLD_WIDTH / IMAGE_WIDTH
  const buildingWidth = Math.max(pixelWorldSize * 1, 0.15)
  const halfWidth = buildingWidth / 2
  const halfHeight = buildingHeight / 2
  
  // Create a box geometry template
  const boxGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingWidth)
  const positions = boxGeometry.attributes.position.array as Float32Array
  const normals = boxGeometry.attributes.normal.array as Float32Array
  const uvs = boxGeometry.attributes.uv.array as Float32Array
  const indices = boxGeometry.index!.array as Uint16Array
  
  // Create top face vertices
  const topFaceVertices = [
    -halfWidth, halfHeight, -halfWidth,
     halfWidth, halfHeight, -halfWidth,
     halfWidth, halfHeight,  halfWidth,
    -halfWidth, halfHeight,  halfWidth,
  ]
  const topFaceNormals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]
  const topFaceUVs = [0, 0, 1, 0, 1, 1, 0, 1]
  const topFaceIndices = [0, 1, 2, 0, 2, 3]
  
  const allPositions: number[] = []
  const allNormals: number[] = []
  const allUvs: number[] = []
  const allIndices: number[] = []
  
  let vertexOffset = 0
  
  for (const region of filteredRegions) {
    for (const [px, py] of region.pixels) {
      const [worldX, worldZ] = pixelToWorld(px, py)
      const x = worldX
      const y = halfHeight + 0.1 // Slightly above ground
      const z = worldZ
      
      // Add box vertices
      for (let i = 0; i < positions.length; i += 3) {
        allPositions.push(positions[i] + x, positions[i + 1] + y, -positions[i + 2] + z)
      }
      
      for (let i = 0; i < normals.length; i++) {
        allNormals.push(normals[i])
      }
      
      for (let i = 0; i < uvs.length; i++) {
        allUvs.push(uvs[i])
      }
      
      for (let i = 0; i < indices.length; i++) {
        allIndices.push(indices[i] + vertexOffset)
      }
      
      vertexOffset += positions.length / 3
      
      // Add top face
      for (let i = 0; i < topFaceVertices.length; i += 3) {
        allPositions.push(
          topFaceVertices[i] + x,
          topFaceVertices[i + 1] + y,
          -topFaceVertices[i + 2] + z
        )
      }
      
      for (let i = 0; i < topFaceNormals.length; i++) {
        allNormals.push(topFaceNormals[i])
      }
      
      for (let i = 0; i < topFaceUVs.length; i++) {
        allUvs.push(topFaceUVs[i])
      }
      
      for (let i = 0; i < topFaceIndices.length; i++) {
        allIndices.push(topFaceIndices[i] + vertexOffset)
      }
      
      vertexOffset += 4
    }
  }
  
  const mergedGeometry = new THREE.BufferGeometry()
  mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3))
  mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3))
  mergedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(allUvs, 2))
  mergedGeometry.setIndex(allIndices)
  mergedGeometry.computeBoundingSphere()
  
  return mergedGeometry
}

function MergedBuildingsMesh({ regions, buildingType }: { regions: Array<BuildingRegion>; buildingType: BuildingType }) {
  const [isHovered, setIsHovered] = useState(false)
  const colors = BUILDING_COLORS[buildingType]
  const geometry = useMemo(() => createMergedBuildingGeometry(regions, buildingType), [regions, buildingType])
  
  // Get the warehouse context to switch views (only for warehouse buildings)
  const warehouseContext = useContext(AirportLoadingContext)
  
  if (!geometry) return null
  
  const handleClick = () => {
    if (buildingType === 'warehouse') {
      // Switch to warehouse view when clicking red cargo buildings
      console.log('Switching to warehouse view...')
      // We need to access the view mode from the parent context
      // For now, we'll dispatch a custom event
      window.dispatchEvent(new CustomEvent('switchToWarehouse'))
    }
  }
  
  return (
    <mesh 
      geometry={geometry} 
      castShadow 
      receiveShadow
      onPointerOver={(e) => {
        if (buildingType === 'warehouse') {
          e.stopPropagation()
          setIsHovered(true)
          document.body.style.cursor = 'pointer'
        }
      }}
      onPointerOut={() => {
        if (buildingType === 'warehouse') {
          setIsHovered(false)
          document.body.style.cursor = 'default'
        }
      }}
      onClick={(e) => {
        if (buildingType === 'warehouse') {
          e.stopPropagation()
          handleClick()
        }
      }}
    >
      <meshStandardMaterial 
        color={isHovered && buildingType === 'warehouse' ? colors.hover : colors.base} 
        flatShading 
      />
    </mesh>
  )
}

function useLayoutBuildingRegions(): Array<BuildingRegion> {
  const [regions, setRegions] = useState<Array<BuildingRegion>>([])

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/layout.png'
    
    img.onload = () => {
      console.log('🏢 Loading buildings from layout image (pixel mode):', img.width, 'x', img.height)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        const extractedRegions = extractBuildingRegions(imageData)
        setRegions(extractedRegions)
      }
    }
    
    img.onerror = () => console.error('Failed to load layout image for buildings')
  }, [])

  return regions
}

function PixelBasedBuildings() {
  const regions = useLayoutBuildingRegions()
  
  useEffect(() => {
    if (regions.length > 0) {
      const totalPixels = regions.reduce((sum, r) => sum + r.pixels.length, 0)
      console.log(`🏢 Rendering ${regions.length} building regions with ${totalPixels} total pixels as merged geometry`)
    }
  }, [regions])
  
  return (
    <group>
      <MergedBuildingsMesh regions={regions} buildingType="terminal" />
      <MergedBuildingsMesh regions={regions} buildingType="warehouse" />
    </group>
  )
}

// =============================================================================
// MAIN EXPORT - Uses flag to switch between rendering modes
// =============================================================================

export function Buildings() {
  const buildings = useLayoutBuildings()
  
  if (USE_PIXEL_RENDERING) {
    return <PixelBasedBuildings />
  }
  
  return (
    <group>
      {buildings.map((building) => (
        <ExtrudedBuilding key={building.id} data={building} />
      ))}
    </group>
  )
}
