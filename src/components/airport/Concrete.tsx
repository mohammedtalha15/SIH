'use client'

import { useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'

const IMAGE_WIDTH = 1320
const IMAGE_HEIGHT = 857
const WORLD_WIDTH = 200
const WORLD_HEIGHT = 130
const CONCRETE_HEIGHT = 0.02 // Height in 3D units (lowest layer)

function pixelToWorld(px: number, py: number): [number, number] {
  const x = (px / IMAGE_WIDTH - 0.5) * WORLD_WIDTH
  const z = (py / IMAGE_HEIGHT - 0.5) * WORLD_HEIGHT
  return [x, z]
}

// Detect concrete color: rgb(172, 176, 177) - gray concrete
function isConcreteColor(r: number, g: number, b: number): boolean {
  // Gray concrete: all RGB values are similar and in the 150-200 range
  // Allow some tolerance for anti-aliasing/compression
  const targetR = 172
  const targetG = 176
  const targetB = 177
  const tolerance = 30
  
  return (
    Math.abs(r - targetR) < tolerance &&
    Math.abs(g - targetG) < tolerance &&
    Math.abs(b - targetB) < tolerance &&
    Math.abs(r - g) < 15 && // RGB values should be close to each other (gray)
    Math.abs(g - b) < 15
  )
}

// Concrete region data - stores all pixels in a connected concrete region
export type ConcreteRegion = {
  pixels: Array<[number, number]> // All pixel coordinates in this concrete region
}

// Extract concrete regions from image - using the same approach as roads
function extractConcreteRegions(imageData: ImageData): Array<ConcreteRegion> {
  const { width, height, data } = imageData
  const globalVisited = new Set<string>()
  const concreteAreas: Array<ConcreteRegion> = []

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

  function processConcreteRegions() {
    const imgWidth = width
    const imgHeight = height
    const imgData = data
    
    // Scan every pixel to catch all concrete areas
    for (let y = 0; y < imgHeight; y++) {
      for (let x = 0; x < imgWidth; x++) {
        const key = `${x},${y}`
        if (globalVisited.has(key)) continue
        
        const idx = (y * imgWidth + x) * 4
        if (!isConcreteColor(imgData[idx], imgData[idx + 1], imgData[idx + 2])) continue
        
        const pixels = floodFill(x, y, isConcreteColor)
        if (!pixels || pixels.length === 0) continue
        
        // Just store all the pixels - we'll render them directly
        concreteAreas.push({ pixels })
      }
    }
  }

  processConcreteRegions()
  console.log(`✅ Extracted ${concreteAreas.length} concrete regions with ${concreteAreas.reduce((sum, r) => sum + r.pixels.length, 0)} total pixels`)
  return concreteAreas
}

// Create a merged geometry from all concrete regions
function createMergedConcreteGeometry(concreteRegions: Array<ConcreteRegion>): THREE.BufferGeometry | null {
  if (concreteRegions.length === 0) return null
  
  // Convert pixel size to world size
  const pixelWorldSize = WORLD_WIDTH / IMAGE_WIDTH
  const concreteWidth = Math.max(pixelWorldSize * 0.5, 0.5) // Smaller width - at least 0.5 unit wide
  const halfWidth = concreteWidth / 2
  const halfHeight = CONCRETE_HEIGHT / 2
  
  // Create a box geometry template
  const boxGeometry = new THREE.BoxGeometry(concreteWidth, CONCRETE_HEIGHT, concreteWidth)
  const positions = boxGeometry.attributes.position.array as Float32Array
  const normals = boxGeometry.attributes.normal.array as Float32Array
  const uvs = boxGeometry.attributes.uv.array as Float32Array
  const indices = boxGeometry.index!.array as Uint16Array
  
  // Create explicit face vertices for all sides
  // Top face
  const topFaceVertices = [
    -halfWidth, halfHeight, -halfWidth,  // Bottom-left
     halfWidth, halfHeight, -halfWidth,  // Bottom-right
     halfWidth, halfHeight,  halfWidth,  // Top-right
    -halfWidth, halfHeight,  halfWidth,  // Top-left
  ]
  const topFaceNormals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]
  const topFaceUVs = [0, 0, 1, 0, 1, 1, 0, 1]
  const topFaceIndices = [0, 1, 2, 0, 2, 3]
  
  // Bottom face
  const bottomFaceVertices = [
    -halfWidth, -halfHeight,  halfWidth,  // Top-left
     halfWidth, -halfHeight,  halfWidth,  // Top-right
     halfWidth, -halfHeight, -halfWidth,  // Bottom-right
    -halfWidth, -halfHeight, -halfWidth,  // Bottom-left
  ]
  const bottomFaceNormals = [0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0]
  const bottomFaceUVs = [0, 0, 1, 0, 1, 1, 0, 1]
  const bottomFaceIndices = [0, 1, 2, 0, 2, 3]
  
  // Front face (positive Z)
  const frontFaceVertices = [
    -halfWidth, -halfHeight, halfWidth,  // Bottom-left
     halfWidth, -halfHeight, halfWidth,  // Bottom-right
     halfWidth,  halfHeight, halfWidth,  // Top-right
    -halfWidth,  halfHeight, halfWidth,  // Top-left
  ]
  const frontFaceNormals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]
  const frontFaceUVs = [0, 0, 1, 0, 1, 1, 0, 1]
  const frontFaceIndices = [0, 1, 2, 0, 2, 3]
  
  // Back face (negative Z)
  const backFaceVertices = [
     halfWidth, -halfHeight, -halfWidth,  // Bottom-left
    -halfWidth, -halfHeight, -halfWidth,  // Bottom-right
    -halfWidth,  halfHeight, -halfWidth,  // Top-right
     halfWidth,  halfHeight, -halfWidth,  // Top-left
  ]
  const backFaceNormals = [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1]
  const backFaceUVs = [0, 0, 1, 0, 1, 1, 0, 1]
  const backFaceIndices = [0, 1, 2, 0, 2, 3]
  
  // Left face (negative X)
  const leftFaceVertices = [
    -halfWidth, -halfHeight, -halfWidth,  // Bottom-left
    -halfWidth, -halfHeight,  halfWidth,  // Bottom-right
    -halfWidth,  halfHeight,  halfWidth,  // Top-right
    -halfWidth,  halfHeight, -halfWidth,  // Top-left
  ]
  const leftFaceNormals = [-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0]
  const leftFaceUVs = [0, 0, 1, 0, 1, 1, 0, 1]
  const leftFaceIndices = [0, 1, 2, 0, 2, 3]
  
  // Right face (positive X)
  const rightFaceVertices = [
     halfWidth, -halfHeight,  halfWidth,  // Bottom-left
     halfWidth, -halfHeight, -halfWidth,  // Bottom-right
     halfWidth,  halfHeight, -halfWidth,  // Top-right
     halfWidth,  halfHeight,  halfWidth,  // Top-left
  ]
  const rightFaceNormals = [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0]
  const rightFaceUVs = [0, 0, 1, 0, 1, 1, 0, 1]
  const rightFaceIndices = [0, 1, 2, 0, 2, 3]
  
  // Collect all vertices and indices
  const allPositions: number[] = []
  const allNormals: number[] = []
  const allUvs: number[] = []
  const allIndices: number[] = []
  
  let vertexOffset = 0
  
  // Helper function to add a face
  const addFace = (
    faceVertices: number[],
    faceNormals: number[],
    faceUVs: number[],
    faceIndices: number[],
    offset: number,
    x: number,
    y: number,
    z: number
  ) => {
    // Add vertices (flip Z coordinate)
    for (let i = 0; i < faceVertices.length; i += 3) {
      allPositions.push(
        faceVertices[i] + x,
        faceVertices[i + 1] + y,
        -faceVertices[i + 2] + z // Flip Z coordinate
      )
    }
    
    // Add normals (flip Z component to match flipped vertices)
    for (let i = 0; i < faceNormals.length; i += 3) {
      allNormals.push(faceNormals[i], faceNormals[i + 1], -faceNormals[i + 2])
    }
    
    // Add UVs
    for (let i = 0; i < faceUVs.length; i++) {
      allUvs.push(faceUVs[i])
    }
    
    // Add indices (offset by current vertex count)
    for (let i = 0; i < faceIndices.length; i++) {
      allIndices.push(faceIndices[i] + offset)
    }
    
    return 4 // Each face has 4 vertices
  }
  
  // Process all concrete regions
  for (const region of concreteRegions) {
    for (const [px, py] of region.pixels) {
      const [worldX, worldZ] = pixelToWorld(px, py)
      const x = worldX
      const y = halfHeight
      const z = worldZ
      
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
      
      // Add all explicit faces for this box (top, bottom, front, back, left, right)
      vertexOffset += addFace(topFaceVertices, topFaceNormals, topFaceUVs, topFaceIndices, vertexOffset, x, y, z)
      vertexOffset += addFace(bottomFaceVertices, bottomFaceNormals, bottomFaceUVs, bottomFaceIndices, vertexOffset, x, y, z)
      vertexOffset += addFace(frontFaceVertices, frontFaceNormals, frontFaceUVs, frontFaceIndices, vertexOffset, x, y, z)
      vertexOffset += addFace(backFaceVertices, backFaceNormals, backFaceUVs, backFaceIndices, vertexOffset, x, y, z)
      vertexOffset += addFace(leftFaceVertices, leftFaceNormals, leftFaceUVs, leftFaceIndices, vertexOffset, x, y, z)
      vertexOffset += addFace(rightFaceVertices, rightFaceNormals, rightFaceUVs, rightFaceIndices, vertexOffset, x, y, z)
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

// Single mesh component for all concrete areas
function MergedConcreteMesh({ concreteRegions }: { concreteRegions: Array<ConcreteRegion> }) {
  const concreteColor = '#acb0b1' // rgb(172, 176, 177) in hex
  const geometry = useMemo(() => createMergedConcreteGeometry(concreteRegions), [concreteRegions])
  
  if (!geometry) return null
  
  return (
    <mesh
      geometry={geometry}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={concreteColor} flatShading />
    </mesh>
  )
}

function useLayoutConcrete(): Array<ConcreteRegion> {
  const [concreteAreas, setConcreteAreas] = useState<Array<ConcreteRegion>>([])

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/layout.png'
    
    img.onload = () => {
      console.log('🏗️ Loading concrete areas from layout image:', img.width, 'x', img.height)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        
        const regions = extractConcreteRegions(imageData)
        console.log(`🏗️ Concrete extraction complete: ${regions.length} concrete regions created`)
        setConcreteAreas(regions)
      }
    }
    
    img.onerror = () => console.error('Failed to load layout image for concrete')
  }, [])

  return concreteAreas
}

export function Concrete() {
  const concreteAreas = useLayoutConcrete()
  
  useEffect(() => {
    if (concreteAreas.length > 0) {
      const totalPixels = concreteAreas.reduce((sum, r) => sum + r.pixels.length, 0)
      console.log(`🏗️ Rendering ${concreteAreas.length} concrete regions with ${totalPixels} total pixels as merged geometry`)
    } else {
      console.log('⚠️ No concrete areas to render')
    }
  }, [concreteAreas])
  
  return <MergedConcreteMesh concreteRegions={concreteAreas} />
}
