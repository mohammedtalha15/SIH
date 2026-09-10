import { MeshStandardMaterial } from 'three'
import { BUILDING_COLORS, OPACITY } from './constants'

// CG-style materials for exterior
export function createCorrugatedMetalMaterial(): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color: BUILDING_COLORS.corrugatedMetal,
    metalness: 0.3,
    roughness: 0.7,
  })
  return material
}

export function createSmoothPanelMaterial(): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color: BUILDING_COLORS.smoothPanel,
    metalness: 0.1,
    roughness: 0.4,
  })
  return material
}

export function createAsphaltMaterial(): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color: '#2C2C2C',
    roughness: 0.9,
    metalness: 0.0,
  })
  return material
}

export function createConcreteMaterial(): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color: '#F5F5F5',
    roughness: 0.8,
    metalness: 0.0,
  })
  return material
}

// Isometric cutaway materials for interior
export function createZoneMaterial(color: string, opacity: number = OPACITY.zone): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color,
    transparent: opacity < 1.0,
    opacity,
    roughness: 0.3,
    metalness: 0.1,
  })
  return material
}

export function createCutawayWallMaterial(): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color: BUILDING_COLORS.corrugatedMetal,
    transparent: true,
    opacity: OPACITY.cutawayWall,
    roughness: 0.7,
    metalness: 0.3,
  })
  return material
}

// New exterior materials matching isometric reference
export function createExteriorWallMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: '#A0A0A0',
    roughness: 0.6,
    metalness: 0.2,
  })
}

export function createWindowMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: '#3B82F6',
    roughness: 0.1,
    metalness: 0.5,
    transparent: true,
    opacity: 0.8,
  })
}

export function createDockDoorMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: '#6B7280',
    roughness: 0.7,
    metalness: 0.3,
  })
}

export function createCanopyMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: '#4B5563',
    roughness: 0.5,
    metalness: 0.4,
  })
}

// Interior materials for realistic warehouse
export function createPolishedConcreteMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: '#6B7280',
    roughness: 0.3,
    metalness: 0.1,
  })
}

export function createCeilingMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: '#374151',
    roughness: 0.8,
    metalness: 0.2,
  })
}

export function createSteelBeamMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: '#4B5563',
    roughness: 0.4,
    metalness: 0.6,
  })
}
