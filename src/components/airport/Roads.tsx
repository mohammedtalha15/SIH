'use client'

import { useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'

const IMAGE_WIDTH = 1320
const IMAGE_HEIGHT = 857
const WORLD_WIDTH = 200
const WORLD_HEIGHT = 130
const ROAD_HEIGHT = 0.06 // Height in 3D units (top layer, above runways)

function pixelToWorld(px: number, py: number): [number, number] {
  const x = (px / IMAGE_WIDTH - 0.5) * WORLD_WIDTH
  const z = (py / IMAGE_HEIGHT - 0.5) * WORLD_HEIGHT
  return [x, z]
}

// Detect road color: rgb(220, 1, 217) - magenta/pink
// Magenta colors have high R, very low G, and high B
function isRoadColor(r: number, g: number, b: number): boolean {
  // More flexible detection: high red, very low green, high blue
  // This should catch rgb(220, 1, 217) and similar magenta/pink colors
  // Relaxed thresholds to catch all magenta/pink pixels
  const isMagentaLike = r > 150 && g < 80 && b > 150 && (r + b) > (g * 3)
  // Also check if it's close to the target color (within 70 units for each channel)
  const closeToTarget = Math.abs(r - 220) < 70 && Math.abs(g - 1) < 70 && Math.abs(b - 217) < 70
  return isMagentaLike || closeToTarget
}

// Scan entire image to find all magenta-like colors
function findMagentaColors(imageData: ImageData): Array<{ r: number; g: number; b: number; count: number }> {
  const { width, height, data } = imageData
  const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>()
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      
      // Check if it's magenta-like
      if (r > 150 && g < 80 && b > 150) {
        const key = `${r},${g},${b}`
        if (colorMap.has(key)) {
          colorMap.get(key)!.count++
        } else {
          colorMap.set(key, { r, g, b, count: 1 })
        }
      }
    }
  }
  
  // Sort by count and return top colors
  return Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
}

// Debug function to sample pixel colors
function samplePixelColors(imageData: ImageData, sampleCount: number = 100) {
  const { width, height, data } = imageData
  const samples: Array<{ r: number; g: number; b: number; x: number; y: number; matches: boolean }> = []
  
  for (let i = 0; i < sampleCount; i++) {
    const x = Math.floor(Math.random() * width)
    const y = Math.floor(Math.random() * height)
    const idx = (y * width + x) * 4
    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]
    const matches = isRoadColor(r, g, b)
    
    samples.push({ r, g, b, x, y, matches })
  }
  
  return samples
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

// Calculate average width of a road segment by finding perpendicular cross-sections
function calculateRoadWidth(pixels: Array<[number, number]>, centerline: Array<[number, number]>): number {
  if (centerline.length < 2) {
    // For very short roads, estimate from pixel count
    const estimatedWidth = Math.sqrt(pixels.length / Math.PI) * 2
    return Math.max(1.5, Math.min(estimatedWidth * WORLD_WIDTH / IMAGE_WIDTH, 4))
  }
  
  const pixelSet = new Set(pixels.map(p => `${p[0]},${p[1]}`))
  let totalWidth = 0
  let sampleCount = 0
  
  // Sample width at several points along the centerline
  const step = Math.max(1, Math.floor(centerline.length / 10))
  for (let i = step; i < centerline.length - step; i += step) {
    const [x, y] = centerline[i]
    const prevIdx = Math.max(0, i - step)
    const nextIdx = Math.min(centerline.length - 1, i + step)
    
    let prevX = centerline[prevIdx][0]
    let prevY = centerline[prevIdx][1]
    let nextX = centerline[nextIdx][0]
    let nextY = centerline[nextIdx][1]
    
    // Direction vector (average of forward and backward)
    let dx = (nextX - prevX) / 2
    let dy = (nextY - prevY) / 2
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 0.001) continue
    
    dx /= len
    dy /= len
    
    // Perpendicular direction
    const perpX = -dy
    const perpY = dx
    
    // Measure width in perpendicular direction (limit to reasonable distance)
    let leftDist = 0
    let rightDist = 0
    
    // Check left side (max 5 pixels for 3-4 pixel wide roads)
    for (let d = 1; d <= 5; d++) {
      const checkX = Math.round(x + perpX * d)
      const checkY = Math.round(y + perpY * d)
      if (pixelSet.has(`${checkX},${checkY}`)) {
        leftDist = d
      } else {
        break
      }
    }
    
    // Check right side
    for (let d = 1; d <= 5; d++) {
      const checkX = Math.round(x - perpX * d)
      const checkY = Math.round(y - perpY * d)
      if (pixelSet.has(`${checkX},${checkY}`)) {
        rightDist = d
      } else {
        break
      }
    }
    
    if (leftDist > 0 || rightDist > 0) {
      totalWidth += leftDist + rightDist
      sampleCount++
    }
  }
  
  if (sampleCount === 0) {
    // Fallback: estimate from bounding box
    const bbox = {
      minX: Math.min(...pixels.map(p => p[0])),
      maxX: Math.max(...pixels.map(p => p[0])),
      minY: Math.min(...pixels.map(p => p[1])),
      maxY: Math.max(...pixels.map(p => p[1]))
    }
    const pixelWidth = Math.min(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY)
    const worldWidth = (pixelWidth * WORLD_WIDTH) / IMAGE_WIDTH
    return Math.max(1.5, Math.min(worldWidth, 4))
  }
  
  const avgPixelWidth = totalWidth / sampleCount
  // Convert pixel width to world units
  const worldWidth = (avgPixelWidth * WORLD_WIDTH) / IMAGE_WIDTH
  // Clamp to reasonable values for 1-4 pixel wide roads (max 3 units total width)
  return Math.max(1.5, Math.min(worldWidth, 3))
}

// Extract centerline path from thin road pixels
// For 3-4 pixel wide roads, we find the skeleton/centerline
function extractCenterlinePath(pixels: Array<[number, number]>): Array<[number, number]> {
  if (pixels.length < 2) return pixels
  if (pixels.length === 2) return pixels
  
  const pixelSet = new Set(pixels.map(p => `${p[0]},${p[1]}`))
  
  // For wider roads (3-4 pixels), find the centerline by:
  // 1. Finding endpoints or branch points
  // 2. Following the path while staying in the middle
  
  // Find potential start points (pixels with 1-2 neighbors)
  const candidates: Array<[number, number]> = []
  for (const [x, y] of pixels) {
    let neighbors = 0
    if (pixelSet.has(`${x+1},${y}`)) neighbors++
    if (pixelSet.has(`${x-1},${y}`)) neighbors++
    if (pixelSet.has(`${x},${y+1}`)) neighbors++
    if (pixelSet.has(`${x},${y-1}`)) neighbors++
    
    if (neighbors <= 2) {
      candidates.push([x, y])
    }
  }
  
  // If we have endpoints, start from one
  let startPixel: [number, number]
  if (candidates.length > 0) {
    // Prefer pixels with only 1 neighbor (true endpoints)
    const endpoints = candidates.filter(([x, y]) => {
      let neighbors = 0
      if (pixelSet.has(`${x+1},${y}`)) neighbors++
      if (pixelSet.has(`${x-1},${y}`)) neighbors++
      if (pixelSet.has(`${x},${y+1}`)) neighbors++
      if (pixelSet.has(`${x},${y-1}`)) neighbors++
      return neighbors === 1
    })
    
    if (endpoints.length > 0) {
      startPixel = endpoints[0]
    } else {
      startPixel = candidates[0]
    }
  } else {
    // No clear endpoints, use topmost-leftmost
    startPixel = pixels[0]
    for (let i = 1; i < pixels.length; i++) {
      if (pixels[i][1] < startPixel[1] || 
          (pixels[i][1] === startPixel[1] && pixels[i][0] < startPixel[0])) {
        startPixel = pixels[i]
      }
    }
  }
  
  // For 3-4 pixel wide roads, use a path-following algorithm that traces through the road
  // This is more accurate than averaging for winding roads
  const path: Array<[number, number]> = [startPixel]
  const used = new Set<string>([`${startPixel[0]},${startPixel[1]}`])
  
  // Follow the path using greedy nearest-neighbor, but prefer forward direction
  let lastDirection: [number, number] | null = null
  
  while (path.length < pixels.length && used.size < pixels.length) {
    const current = path[path.length - 1]
    let bestPixel: [number, number] | null = null
    let bestScore = Infinity
    
    // Calculate current direction
    if (path.length > 1) {
      const prev = path[path.length - 2]
      lastDirection = [current[0] - prev[0], current[1] - prev[1]]
      const len = Math.sqrt(lastDirection[0] ** 2 + lastDirection[1] ** 2)
      if (len > 0) {
        lastDirection[0] /= len
        lastDirection[1] /= len
      }
    }
    
    for (const pixel of pixels) {
      const key = `${pixel[0]},${pixel[1]}`
      if (used.has(key)) continue
      
      const dx = pixel[0] - current[0]
      const dy = pixel[1] - current[1]
      const dist = Math.abs(dx) + Math.abs(dy)
      
      // Only consider adjacent or nearby pixels (max 2 pixels away for 3-4 pixel wide roads)
      if (dist > 2) continue
      
      // Score: prefer forward direction, then distance
      let score = dist
      if (lastDirection) {
        const dirX = dx / (dist || 1)
        const dirY = dy / (dist || 1)
        const dot = dirX * lastDirection[0] + dirY * lastDirection[1]
        // Prefer forward direction (positive dot product)
        score -= dot * 0.5
      }
      
      if (score < bestScore) {
        bestScore = score
        bestPixel = pixel
      }
    }
    
    if (!bestPixel) break
    
    path.push(bestPixel)
    used.add(`${bestPixel[0]},${bestPixel[1]}`)
  }
  
  return path
}

// Order boundary pixels using greedy nearest-neighbor
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
      const dist = Math.abs(x - current[0]) + Math.abs(y - current[1])
      
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = i
      }
    }
    
    if (nearestIdx === -1 || nearestDist > 20) break
    
    result.push(boundaryPixels[nearestIdx])
    used.add(nearestIdx)
  }
  
  return result
}

// Simplify the contour by keeping only every Nth point
function simplifyContour(points: Array<[number, number]>, targetCount: number = 60): Array<[number, number]> {
  if (points.length <= targetCount) return points
  
  const step = Math.max(1, Math.floor(points.length / targetCount))
  const result: Array<[number, number]> = []
  
  for (let i = 0; i < points.length; i += step) {
    result.push(points[i])
  }
  
  return result
}

// Create a widened shape from a thin line path
// For thin roads, we create a shape by offsetting the centerline perpendicularly
// But we constrain it to stay within the actual road pixels
function createWidenedPathShape(path: Array<[number, number]>, width: number, roadPixels: Array<[number, number]>): THREE.Shape | null {
  if (path.length < 2) return null
  
  const worldPath = path.map(([px, py]) => pixelToWorld(px, py))
  const roadPixelSet = new Set(roadPixels.map(p => `${p[0]},${p[1]}`))
  
  // For very short paths, create a simple circle
  if (path.length < 3) {
    const [x, z] = worldPath[0]
    const shape = new THREE.Shape()
    shape.absarc(x, -z, width / 2, 0, Math.PI * 2, false)
    return shape
  }
  
  // Create offset points perpendicular to the path direction
  const leftPoints: Array<[number, number]> = []
  const rightPoints: Array<[number, number]> = []
  
  for (let i = 0; i < worldPath.length; i++) {
    const [x, z] = worldPath[i]
    const [px, py] = path[i]
    
    let dx = 0
    let dz = 0
    
    if (i === 0) {
      // First point: use direction to next point
      const [nx, nz] = worldPath[i + 1]
      dx = nx - x
      dz = nz - z
    } else if (i === worldPath.length - 1) {
      // Last point: use direction from previous point
      const [prevX, prevZ] = worldPath[i - 1]
      dx = x - prevX
      dz = z - prevZ
    } else {
      // Middle point: average direction
      const [prevX, prevZ] = worldPath[i - 1]
      const [nextX, nextZ] = worldPath[i + 1]
      dx = (nextX - prevX) / 2
      dz = (nextZ - prevZ) / 2
    }
    
    // Normalize and get perpendicular vector
    const len = Math.sqrt(dx * dx + dz * dz)
    if (len < 0.001) {
      // No direction, use default perpendicular
      dx = 1
      dz = 0
    } else {
      dx /= len
      dz /= len
    }
    
    // Perpendicular vector (rotate 90 degrees)
    const perpX = -dz * (width / 2)
    const perpZ = dx * (width / 2)
    
    // Use the calculated width, but ensure it's reasonable
    // For 1-4 pixel wide roads, the width should be small
    const halfWidth = Math.min(width / 2, 2.5) // Max 2.5 units half-width
    
    const leftX = x + perpX
    const leftZ = z + perpZ
    const rightX = x - perpX
    const rightZ = z - perpZ
    
    leftPoints.push([leftX, leftZ])
    rightPoints.push([rightX, rightZ])
  }
  
  // Create shape from left and right sides
  try {
    const shape = new THREE.Shape()
    const [startX, startZ] = leftPoints[0]
    shape.moveTo(startX, -startZ)
    
    // Left side
    for (let i = 1; i < leftPoints.length; i++) {
      const [x, z] = leftPoints[i]
      shape.lineTo(x, -z)
    }
    
    // Right side (in reverse)
    for (let i = rightPoints.length - 1; i >= 0; i--) {
      const [x, z] = rightPoints[i]
      shape.lineTo(x, -z)
    }
    
    shape.closePath()
    return shape
  } catch (e) {
    console.error('Failed to create widened path shape:', e)
    return null
  }
}

// Create THREE.Shape from ordered contour points (for filled regions)
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
    console.error('Failed to create road shape:', e)
    return null
  }
}

// Road region data - stores all pixels in a connected road region
export type RoadRegion = {
  pixels: Array<[number, number]> // All pixel coordinates in this road region
}

// Extract road regions from image - SIMPLE APPROACH: just get all connected road pixels
function extractRoadRegions(imageData: ImageData): Array<RoadRegion> {
  const { width, height, data } = imageData
  const globalVisited = new Set<string>()
  const roads: Array<RoadRegion> = []

  function floodFill(startX: number, startY: number, colorCheck: (r: number, g: number, b: number) => boolean): Array<[number, number]> | null {
    const pixels: Array<[number, number]> = []
    const queue: Array<[number, number]> = [[startX, startY]]
    const imgWidth = width
    const imgHeight = height
    const imgData = data
    
    while (queue.length > 0) {
      const [x, y] = queue.shift()!
      const key = `${x},${y}`
      
      if (globalVisited.has(key) || x < 0 || x >= imgWidth || y < 0 || y >= imgHeight) continue
      
      const idx = (y * imgWidth + x) * 4
      if (!colorCheck(imgData[idx], imgData[idx + 1], imgData[idx + 2])) continue
      
      globalVisited.add(key)
      pixels.push([x, y])
      
      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }
    
    return pixels.length > 0 ? pixels : null
  }

  function processRoadRegions() {
    const imgWidth = width
    const imgHeight = height
    const imgData = data
    
    // Scan every pixel to catch all roads
    for (let y = 0; y < imgHeight; y++) {
      for (let x = 0; x < imgWidth; x++) {
        const key = `${x},${y}`
        if (globalVisited.has(key)) continue
        
        const idx = (y * imgWidth + x) * 4
        if (!isRoadColor(imgData[idx], imgData[idx + 1], imgData[idx + 2])) continue
        
        const pixels = floodFill(x, y, isRoadColor)
        if (!pixels || pixels.length === 0) continue
        
        // Just store all the pixels - we'll render them directly
        roads.push({ pixels })
      }
    }
  }

  processRoadRegions()
  console.log(`✅ Extracted ${roads.length} road regions with ${roads.reduce((sum, r) => sum + r.pixels.length, 0)} total pixels`)
  return roads
}

function useLayoutRoads(): Array<RoadRegion> {
  const [roads, setRoads] = useState<Array<RoadRegion>>([])

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/layout.png'
    
    img.onload = () => {
      console.log('🛣️ Loading roads from layout image:', img.width, 'x', img.height)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        
        const regions = extractRoadRegions(imageData)
        console.log(`🛣️ Road extraction complete: ${regions.length} road regions created`)
        setRoads(regions)
      }
    }
    
    img.onerror = () => console.error('Failed to load layout image for roads')
  }, [])

  return roads
}

// Create a merged geometry from all road regions
function createMergedRoadGeometry(roadRegions: Array<RoadRegion>): THREE.BufferGeometry | null {
  if (roadRegions.length === 0) return null
  
  // Convert pixel size to world size
  const pixelWorldSize = WORLD_WIDTH / IMAGE_WIDTH
  const roadWidth = Math.max(pixelWorldSize * 1.2, 0.05) // Smaller width - at least 1 unit wide
  const halfWidth = roadWidth / 2
  const halfHeight = ROAD_HEIGHT / 2
  
  // Create a box geometry template (without top - we'll add a separate top face)
  const boxGeometry = new THREE.BoxGeometry(roadWidth, ROAD_HEIGHT, roadWidth)
  const positions = boxGeometry.attributes.position.array as Float32Array
  const normals = boxGeometry.attributes.normal.array as Float32Array
  const uvs = boxGeometry.attributes.uv.array as Float32Array
  const indices = boxGeometry.index!.array as Uint16Array
  
  // Create top face vertices (a flat quad on top of the box)
  const topFaceVertices = [
    -halfWidth, halfHeight, -halfWidth,  // Bottom-left
     halfWidth, halfHeight, -halfWidth,  // Bottom-right
     halfWidth, halfHeight,  halfWidth,  // Top-right
    -halfWidth, halfHeight,  halfWidth,  // Top-left
  ]
  const topFaceNormals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0] // All pointing up
  const topFaceUVs = [0, 0, 1, 0, 1, 1, 0, 1]
  const topFaceIndices = [0, 1, 2, 0, 2, 3] // Two triangles
  
  // Collect all vertices and indices
  const allPositions: number[] = []
  const allNormals: number[] = []
  const allUvs: number[] = []
  const allIndices: number[] = []
  
  let vertexOffset = 0
  
  // Process all road regions
  for (const region of roadRegions) {
    for (const [px, py] of region.pixels) {
      const [worldX, worldZ] = pixelToWorld(px, py)
      const x = worldX
      const y = halfHeight
      const z = worldZ // Negate Z to match building coordinate system
      
      // Add vertices for this box (translated)
      // Z coordinate: negate template Z offset to flip along Z axis, then add world Z position
      for (let i = 0; i < positions.length; i += 3) {
        allPositions.push(positions[i] + x, positions[i + 1] + y, -positions[i + 2] + z)
      }
      
      // Add normals (same for all boxes)
      for (let i = 0; i < normals.length; i++) {
        allNormals.push(normals[i])
      }
      
      // Add UVs (same for all boxes)
      for (let i = 0; i < uvs.length; i++) {
        allUvs.push(uvs[i])
      }
      
      // Add indices (offset by current vertex count)
      for (let i = 0; i < indices.length; i++) {
        allIndices.push(indices[i] + vertexOffset)
      }
      
      vertexOffset += positions.length / 3
      
      // Add top face for this box
      for (let i = 0; i < topFaceVertices.length; i += 3) {
        allPositions.push(
          topFaceVertices[i] + x,
          topFaceVertices[i + 1] + y,
          -topFaceVertices[i + 2] + z // Flip Z coordinate
        )
      }
      
      // Add top face normals
      for (let i = 0; i < topFaceNormals.length; i++) {
        allNormals.push(topFaceNormals[i])
      }
      
      // Add top face UVs
      for (let i = 0; i < topFaceUVs.length; i++) {
        allUvs.push(topFaceUVs[i])
      }
      
      // Add top face indices (offset by current vertex count)
      for (let i = 0; i < topFaceIndices.length; i++) {
        allIndices.push(topFaceIndices[i] + vertexOffset)
      }
      
      vertexOffset += 4 // Top face has 4 vertices
    }
  }
  
  // Create merged geometry
  const mergedGeometry = new THREE.BufferGeometry()
  mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3))
  mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3))
  mergedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(allUvs, 2))
  mergedGeometry.setIndex(allIndices)
  mergedGeometry.computeBoundingSphere()
  
  return mergedGeometry
}

// Single mesh component for all roads
function MergedRoadsMesh({ roadRegions }: { roadRegions: Array<RoadRegion> }) {
  const roadColor = '#404040' // Dark gray
  const geometry = useMemo(() => createMergedRoadGeometry(roadRegions), [roadRegions])
  
  if (!geometry) return null
  
  return (
    <mesh
      geometry={geometry}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={roadColor} flatShading />
    </mesh>
  )
}

export function Roads() {
  const roads = useLayoutRoads()
  
  useEffect(() => {
    if (roads.length > 0) {
      const totalPixels = roads.reduce((sum, r) => sum + r.pixels.length, 0)
      console.log(`🛣️ Rendering ${roads.length} road regions with ${totalPixels} total pixels as merged geometry`)
    } else {
      console.log('⚠️ No roads to render')
    }
  }, [roads])
  
  return <MergedRoadsMesh roadRegions={roads} />
}

