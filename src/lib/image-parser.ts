import type { PixelType, PixelGrid } from './types'
import { COLOR_THRESHOLDS } from './constants'

/**
 * Classify a single pixel based on its RGB values
 */
export function classifyPixel(r: number, g: number, b: number): PixelType {
  const { background, runway, buildingYellow, buildingRed } = COLOR_THRESHOLDS

  // Light gray background: skip (will be transparent in 3D)
  if (
    r > background.minR &&
    g > background.minG &&
    b > background.minB &&
    Math.abs(r - g) < background.maxDiff
  ) {
    return 'background'
  }

  // White runways (very high brightness)
  if (r > runway.minR && g > runway.minG && b > runway.minB) {
    return 'runway'
  }

  // Yellow buildings (high R, high G, low B - orange/yellow tones)
  if (r > buildingYellow.minR && g > buildingYellow.minG && b < buildingYellow.maxB) {
    return 'building_yellow'
  }

  // Red buildings (high R, low G, relatively low B - red/pink tones)
  if (r > buildingRed.minR && g < buildingRed.maxG && b < buildingRed.maxB) {
    return 'building_red'
  }

  // Everything else is dark gray apron/roads
  return 'apron'
}

/**
 * Load an image and extract pixel data into a classified grid
 */
export async function parseLayoutImage(imagePath: string): Promise<PixelGrid> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Image parsing requires browser environment'))
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      const pixels = imageData.data

      // Create 2D grid of classified pixels
      const grid: PixelType[][] = []

      for (let y = 0; y < img.height; y++) {
        const row: PixelType[] = []
        for (let x = 0; x < img.width; x++) {
          const idx = (y * img.width + x) * 4
          const r = pixels[idx]
          const g = pixels[idx + 1]
          const b = pixels[idx + 2]
          row.push(classifyPixel(r, g, b))
        }
        grid.push(row)
      }

      resolve({
        width: img.width,
        height: img.height,
        data: grid,
      })
    }

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imagePath}`))
    }

    img.src = imagePath
  })
}

/**
 * Downsample pixel grid for performance (reduces resolution)
 */
export function downsampleGrid(grid: PixelGrid, factor: number): PixelGrid {
  const newWidth = Math.floor(grid.width / factor)
  const newHeight = Math.floor(grid.height / factor)
  const newData: PixelType[][] = []

  for (let y = 0; y < newHeight; y++) {
    const row: PixelType[] = []
    for (let x = 0; x < newWidth; x++) {
      // Sample from the center of each cell
      const srcX = Math.floor(x * factor + factor / 2)
      const srcY = Math.floor(y * factor + factor / 2)
      row.push(grid.data[srcY]?.[srcX] ?? 'background')
    }
    newData.push(row)
  }

  return {
    width: newWidth,
    height: newHeight,
    data: newData,
  }
}

/**
 * Get pixels of a specific type as coordinate list
 */
export function getPixelsByType(
  grid: PixelGrid,
  type: PixelType
): Array<{ x: number; y: number }> {
  const pixels: Array<{ x: number; y: number }> = []

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.data[y][x] === type) {
        pixels.push({ x, y })
      }
    }
  }

  return pixels
}

/**
 * Count pixels by type for debugging
 */
export function countPixelTypes(grid: PixelGrid): Partial<Record<PixelType, number>> {
  const counts: Partial<Record<PixelType, number>> = {
    background: 0,
    apron: 0,
    runway: 0,
    building_yellow: 0,
    building_red: 0,
  }

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const type = grid.data[y][x]
      counts[type] = (counts[type] || 0) + 1
    }
  }

  return counts
}

