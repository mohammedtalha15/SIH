'use client'

import { useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'

const IMAGE_WIDTH = 1320
const IMAGE_HEIGHT = 857
const WORLD_WIDTH = 200
const WORLD_HEIGHT = 130
const RUNWAY_HEIGHT = 0.04 // Height in 3D units (middle layer, above concrete)

function pixelToWorld(px: number, py: number): [number, number] {
  const x = (px / IMAGE_WIDTH - 0.5) * WORLD_WIDTH
  const z = (py / IMAGE_HEIGHT - 0.5) * WORLD_HEIGHT
  return [x, z]
}

// Detect runway color: pure white (rgb values all high)
function isRunwayColor(r: number, g: number, b: number): boolean {
  // White runways: all RGB values are high (close to 255)
  return r > 240 && g > 240 && b > 240
}

// Runway region data - stores all pixels in a connected runway region
export type RunwayRegion = {
  pixels: Array<[number, number]> // All pixel coordinates in this runway region
}

// Extract runway regions from image - using the same approach as roads
function extractRunwayRegions(imageData: ImageData): Array<RunwayRegion> {
  const { width, height, data } = imageData
  const globalVisited = new Set<string>()
  const runways: Array<RunwayRegion> = []

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

  function processRunwayRegions() {
    const imgWidth = width
    const imgHeight = height
    const imgData = data
    
    // Scan every pixel to catch all runways
    for (let y = 0; y < imgHeight; y++) {
      for (let x = 0; x < imgWidth; x++) {
        const key = `${x},${y}`
        if (globalVisited.has(key)) continue
        
        const idx = (y * imgWidth + x) * 4
        if (!isRunwayColor(imgData[idx], imgData[idx + 1], imgData[idx + 2])) continue
        
        const pixels = floodFill(x, y, isRunwayColor)
        if (!pixels || pixels.length === 0) continue
        
        // Just store all the pixels - we'll render them directly
        runways.push({ pixels })
      }
    }
  }

  processRunwayRegions()
  console.log(`✅ Extracted ${runways.length} runway regions with ${runways.reduce((sum, r) => sum + r.pixels.length, 0)} total pixels`)
  return runways
}

// Create a merged geometry from all runway regions
function createMergedRunwayGeometry(runwayRegions: Array<RunwayRegion>): THREE.BufferGeometry | null {
  if (runwayRegions.length === 0) return null
  
  // Convert pixel size to world size
  const pixelWorldSize = WORLD_WIDTH / IMAGE_WIDTH
  const runwayWidth = Math.max(pixelWorldSize * 0.5, 0.5) // Smaller width - at least 0.5 unit wide
  const halfWidth = runwayWidth / 2
  const halfHeight = RUNWAY_HEIGHT / 2
  
  // Create a box geometry template
  const boxGeometry = new THREE.BoxGeometry(runwayWidth, RUNWAY_HEIGHT, runwayWidth)
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
  
  // Collect all vertices and indices
  const allPositions: number[] = []
  const allNormals: number[] = []
  const allUvs: number[] = []
  const allIndices: number[] = []
  
  let vertexOffset = 0
  
  // Process all runway regions
  for (const region of runwayRegions) {
    for (const [px, py] of region.pixels) {
      const [worldX, worldZ] = pixelToWorld(px, py)
      const x = worldX
      const y = halfHeight
      const z = worldZ
      
      // Add vertices for this box (translated)
      for (let i = 0; i < positions.length; i += 3) {
        allPositions.push(positions[i] + x, positions[i + 1] + y, -positions[i + 2] + z)
      }
      
      // Add normals
      for (let i = 0; i < normals.length; i++) {
        allNormals.push(normals[i])
      }
      
      // Add UVs
      for (let i = 0; i < uvs.length; i++) {
        allUvs.push(uvs[i])
      }
      
      // Add indices
      for (let i = 0; i < indices.length; i++) {
        allIndices.push(indices[i] + vertexOffset)
      }
      
      vertexOffset += positions.length / 3
      
      // Add top face for this box
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
  
  // Create merged geometry
  const mergedGeometry = new THREE.BufferGeometry()
  mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3))
  mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3))
  mergedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(allUvs, 2))
  mergedGeometry.setIndex(allIndices)
  mergedGeometry.computeBoundingSphere()
  
  return mergedGeometry
}

// Single mesh component for all runways
function MergedRunwaysMesh({ runwayRegions }: { runwayRegions: Array<RunwayRegion> }) {
  const runwayColor = '#acb0b1' // Same as concrete color
  const geometry = useMemo(() => createMergedRunwayGeometry(runwayRegions), [runwayRegions])
  
  if (!geometry) return null
  
  return (
    <mesh
      geometry={geometry}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={runwayColor} flatShading />
    </mesh>
  )
}

function useLayoutRunways(): Array<RunwayRegion> {
  const [runways, setRunways] = useState<Array<RunwayRegion>>([])

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/layout.png'
    
    img.onload = () => {
      console.log('🛫 Loading runways from layout image:', img.width, 'x', img.height)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        
        const regions = extractRunwayRegions(imageData)
        console.log(`🛫 Runway extraction complete: ${regions.length} runway regions created`)
        setRunways(regions)
      }
    }
    
    img.onerror = () => console.error('Failed to load layout image for runways')
  }, [])

  return runways
}

export function Runways() {
  const runways = useLayoutRunways()
  
  useEffect(() => {
    if (runways.length > 0) {
      const totalPixels = runways.reduce((sum, r) => sum + r.pixels.length, 0)
      console.log(`🛫 Rendering ${runways.length} runway regions with ${totalPixels} total pixels as merged geometry`)
    } else {
      console.log('⚠️ No runways to render')
    }
  }, [runways])
  
  return <MergedRunwaysMesh runwayRegions={runways} />
}

