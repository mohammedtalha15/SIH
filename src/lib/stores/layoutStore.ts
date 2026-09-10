'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Zone, Building, ZoneCategory } from '@/lib/types'
import { cargoBuilding8, cargoBuilding7 } from '@/lib/warehouse-data'

// Editable Zone with additional properties for editing
export interface EditableZone extends Zone {
  buildingId: string
  isLocked?: boolean
}

// Editable Building with mutable zones
export interface EditableBuilding {
  id: string
  name: string
  nameJa?: string
  position: [number, number, number]
  size: [number, number, number]
  color: string
}

interface LayoutState {
  // Editable zones
  zones: EditableZone[]
  buildings: EditableBuilding[]
  
  // Selection state
  selectedZoneId: string | null
  selectedBuildingId: string | null
  
  // Edit mode
  editMode: 'select' | 'move' | 'resize' | 'draw' | 'delete'
  
  // Grid settings
  gridSize: number
  snapToGrid: boolean
  showGrid: boolean
  
  // History for undo/redo
  history: EditableZone[][]
  historyIndex: number
  
  // Actions
  setSelectedZone: (zoneId: string | null) => void
  setSelectedBuilding: (buildingId: string | null) => void
  setEditMode: (mode: 'select' | 'move' | 'resize' | 'draw' | 'delete') => void
  
  // Zone CRUD operations
  addZone: (zone: Omit<EditableZone, 'id'>) => void
  updateZone: (zoneId: string, updates: Partial<EditableZone>) => void
  deleteZone: (zoneId: string) => void
  duplicateZone: (zoneId: string) => void
  
  // Zone transformations
  moveZone: (zoneId: string, position: [number, number, number]) => void
  resizeZone: (zoneId: string, size: [number, number, number]) => void
  
  // Building operations
  updateBuilding: (buildingId: string, updates: Partial<EditableBuilding>) => void
  
  // Grid settings
  setGridSize: (size: number) => void
  setSnapToGrid: (snap: boolean) => void
  setShowGrid: (show: boolean) => void
  
  // History operations
  undo: () => void
  redo: () => void
  saveToHistory: () => void
  
  // Reset to default
  resetToDefault: () => void
  
  // Export/Import
  exportLayout: () => string
  importLayout: (json: string) => void
}

// Convert warehouse data to editable format
const convertToEditableZones = (): EditableZone[] => {
  const building8Zones: EditableZone[] = cargoBuilding8.interior.zones.map(zone => ({
    ...zone,
    buildingId: 'building-8',
    isLocked: false,
  }))
  
  const building7Zones: EditableZone[] = cargoBuilding7.interior.zones.map(zone => ({
    ...zone,
    buildingId: 'building-7',
    isLocked: false,
  }))
  
  return [...building8Zones, ...building7Zones]
}

const convertToEditableBuildings = (): EditableBuilding[] => [
  {
    id: 'building-8',
    name: cargoBuilding8.name,
    nameJa: cargoBuilding8.nameJa,
    position: cargoBuilding8.position,
    size: cargoBuilding8.size,
    color: cargoBuilding8.exterior.color,
  },
  {
    id: 'building-7',
    name: cargoBuilding7.name,
    nameJa: cargoBuilding7.nameJa,
    position: cargoBuilding7.position,
    size: cargoBuilding7.size,
    color: cargoBuilding7.exterior.color,
  },
]

const initialZones = convertToEditableZones()
const initialBuildings = convertToEditableBuildings()

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      // Initial state
      zones: initialZones,
      buildings: initialBuildings,
      selectedZoneId: null,
      selectedBuildingId: null,
      editMode: 'select',
      gridSize: 5,
      snapToGrid: true,
      showGrid: true,
      history: [initialZones],
      historyIndex: 0,
      
      // Selection
      setSelectedZone: (zoneId) => set({ selectedZoneId: zoneId }),
      setSelectedBuilding: (buildingId) => set({ selectedBuildingId: buildingId }),
      setEditMode: (mode) => set({ editMode: mode }),
      
      // Zone CRUD
      addZone: (zone) => {
        const newZone: EditableZone = {
          ...zone,
          id: `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }
        set((state) => ({ zones: [...state.zones, newZone] }))
        get().saveToHistory()
      },
      
      updateZone: (zoneId, updates) => {
        set((state) => ({
          zones: state.zones.map((z) =>
            z.id === zoneId ? { ...z, ...updates } : z
          ),
        }))
        get().saveToHistory()
      },
      
      deleteZone: (zoneId) => {
        set((state) => ({
          zones: state.zones.filter((z) => z.id !== zoneId),
          selectedZoneId: state.selectedZoneId === zoneId ? null : state.selectedZoneId,
        }))
        get().saveToHistory()
      },
      
      duplicateZone: (zoneId) => {
        const zone = get().zones.find((z) => z.id === zoneId)
        if (zone) {
          const newZone: EditableZone = {
            ...zone,
            id: `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${zone.name} (Copy)`,
            position: [zone.position[0] + 10, zone.position[1], zone.position[2] + 10],
          }
          set((state) => ({ zones: [...state.zones, newZone] }))
          get().saveToHistory()
        }
      },
      
      // Transformations
      moveZone: (zoneId, position) => {
        const { snapToGrid, gridSize } = get()
        let finalPosition = position
        
        if (snapToGrid) {
          finalPosition = [
            Math.round(position[0] / gridSize) * gridSize,
            position[1],
            Math.round(position[2] / gridSize) * gridSize,
          ]
        }
        
        set((state) => ({
          zones: state.zones.map((z) =>
            z.id === zoneId ? { ...z, position: finalPosition } : z
          ),
        }))
      },
      
      resizeZone: (zoneId, size) => {
        const { snapToGrid, gridSize } = get()
        let finalSize = size
        
        if (snapToGrid) {
          finalSize = [
            Math.max(gridSize, Math.round(size[0] / gridSize) * gridSize),
            size[1],
            Math.max(gridSize, Math.round(size[2] / gridSize) * gridSize),
          ]
        }
        
        set((state) => ({
          zones: state.zones.map((z) =>
            z.id === zoneId ? { ...z, size: finalSize } : z
          ),
        }))
      },
      
      // Building operations
      updateBuilding: (buildingId, updates) => {
        set((state) => ({
          buildings: state.buildings.map((b) =>
            b.id === buildingId ? { ...b, ...updates } : b
          ),
        }))
      },
      
      // Grid settings
      setGridSize: (size) => set({ gridSize: size }),
      setSnapToGrid: (snap) => set({ snapToGrid: snap }),
      setShowGrid: (show) => set({ showGrid: show }),
      
      // History
      saveToHistory: () => {
        set((state) => {
          const newHistory = state.history.slice(0, state.historyIndex + 1)
          newHistory.push([...state.zones])
          return {
            history: newHistory.slice(-50), // Keep last 50 states
            historyIndex: Math.min(newHistory.length - 1, 49),
          }
        })
      },
      
      undo: () => {
        set((state) => {
          if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1
            return {
              zones: [...state.history[newIndex]],
              historyIndex: newIndex,
            }
          }
          return state
        })
      },
      
      redo: () => {
        set((state) => {
          if (state.historyIndex < state.history.length - 1) {
            const newIndex = state.historyIndex + 1
            return {
              zones: [...state.history[newIndex]],
              historyIndex: newIndex,
            }
          }
          return state
        })
      },
      
      // Reset
      resetToDefault: () => {
        const defaultZones = convertToEditableZones()
        set({
          zones: defaultZones,
          buildings: convertToEditableBuildings(),
          selectedZoneId: null,
          selectedBuildingId: null,
          history: [defaultZones],
          historyIndex: 0,
        })
      },
      
      // Export/Import
      exportLayout: () => {
        const { zones, buildings } = get()
        return JSON.stringify({ zones, buildings }, null, 2)
      },
      
      importLayout: (json) => {
        try {
          const data = JSON.parse(json)
          if (data.zones && data.buildings) {
            set({
              zones: data.zones,
              buildings: data.buildings,
              selectedZoneId: null,
              selectedBuildingId: null,
            })
            get().saveToHistory()
          }
        } catch (e) {
          console.error('Failed to import layout:', e)
        }
      },
    }),
    {
      name: 'warehouse-layout-storage',
      partialize: (state) => ({
        zones: state.zones,
        buildings: state.buildings,
        gridSize: state.gridSize,
        snapToGrid: state.snapToGrid,
        showGrid: state.showGrid,
      }),
    }
  )
)

// Utility function to get zones by building
export const getZonesByBuilding = (zones: EditableZone[], buildingId: string) => {
  return zones.filter((z) => z.buildingId === buildingId)
}

// Zone category colors
export const ZONE_CATEGORY_COLORS: Record<ZoneCategory, string> = {
  import: '#2D7A6B',
  export: '#3B7BBF',
  storage: '#6B7B8C',
  office: '#8B5CF6',
  special: '#EAB308',
}
