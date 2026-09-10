'use client'

/**
 * Layout Editor - 2D Top-down view for editing warehouse layout
 * Features:
 * - Drag to move zones
 * - Resize zones with handles
 * - Add new zones
 * - Delete zones
 * - Edit zone properties (name, color, category)
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { 
  Move, 
  Maximize2, 
  Plus, 
  Trash2, 
  MousePointer, 
  Grid3X3,
  Undo2,
  Redo2,
  Download,
  Upload,
  RotateCcw,
  Save,
  ZoomIn,
  ZoomOut,
  Building2,
  FileUp
} from 'lucide-react'
import { useLayoutStore, EditableZone, ZONE_CATEGORY_COLORS } from '@/lib/stores/layoutStore'
import { ZoneEditPanel } from './ZoneEditPanel'
import { BuildingEditPanel } from './BuildingEditPanel'
import type { ZoneCategory } from '@/lib/types'

const SCALE = 2 // pixels per unit
const OFFSET_X = 300 // canvas offset
const OFFSET_Z = 250

export function LayoutEditor() {
  const {
    zones,
    buildings,
    selectedZoneId,
    editMode,
    gridSize,
    snapToGrid,
    showGrid,
    setSelectedZone,
    setEditMode,
    moveZone,
    resizeZone,
    addZone,
    deleteZone,
    undo,
    redo,
    resetToDefault,
    exportLayout,
    importLayout,
    saveToHistory,
    setSnapToGrid,
    setShowGrid,
  } = useLayoutStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; z: number } | null>(null)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [showImportModal, setShowImportModal] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [showBuildingPanel, setShowBuildingPanel] = useState(false)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Convert world coordinates to canvas coordinates
  const worldToCanvas = useCallback((x: number, z: number) => ({
    x: (x + OFFSET_X) * SCALE * zoom + pan.x,
    y: (z + OFFSET_Z) * SCALE * zoom + pan.y,
  }), [zoom, pan])

  // Convert canvas coordinates to world coordinates
  const canvasToWorld = useCallback((canvasX: number, canvasY: number) => ({
    x: (canvasX - pan.x) / (SCALE * zoom) - OFFSET_X,
    z: (canvasY - pan.y) / (SCALE * zoom) - OFFSET_Z,
  }), [zoom, pan])

  // Draw the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#0A0A0A'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#2A2A2A'
      ctx.lineWidth = 1
      
      const gridStep = gridSize * SCALE * zoom
      const startX = pan.x % gridStep
      const startY = pan.y % gridStep
      
      for (let x = startX; x < canvas.width; x += gridStep) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      
      for (let y = startY; y < canvas.height; y += gridStep) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    // Draw buildings (outlines)
    buildings.forEach((building) => {
      const pos = worldToCanvas(
        building.position[0] - building.size[0] / 2,
        building.position[2] - building.size[2] / 2
      )
      const width = building.size[0] * SCALE * zoom
      const height = building.size[2] * SCALE * zoom

      ctx.strokeStyle = '#FF6B35'
      ctx.lineWidth = 3
      ctx.strokeRect(pos.x, pos.y, width, height)

      // Building label
      ctx.fillStyle = '#FF6B35'
      ctx.font = `bold ${14 * zoom}px system-ui`
      ctx.fillText(building.name, pos.x + 10, pos.y - 10)
    })

    // Draw zones
    zones.forEach((zone) => {
      const building = buildings.find((b) => b.id === zone.buildingId)
      if (!building) return

      const worldX = building.position[0] + zone.position[0] - zone.size[0] / 2
      const worldZ = building.position[2] + zone.position[2] - zone.size[2] / 2
      
      const pos = worldToCanvas(worldX, worldZ)
      const width = zone.size[0] * SCALE * zoom
      const height = zone.size[2] * SCALE * zoom

      // Zone fill
      ctx.fillStyle = zone.color + '80' // Semi-transparent
      ctx.fillRect(pos.x, pos.y, width, height)

      // Zone border
      ctx.strokeStyle = selectedZoneId === zone.id ? '#FF6B35' : zone.color
      ctx.lineWidth = selectedZoneId === zone.id ? 3 : 2
      ctx.strokeRect(pos.x, pos.y, width, height)

      // Zone label
      ctx.fillStyle = '#FFFFFF'
      ctx.font = `${Math.max(10, 12 * zoom)}px system-ui`
      const label = zone.name.length > 20 ? zone.name.substring(0, 18) + '...' : zone.name
      ctx.fillText(label, pos.x + 5, pos.y + 15 * zoom)

      // Draw resize handles if selected
      if (selectedZoneId === zone.id && editMode === 'resize') {
        const handleSize = 10
        ctx.fillStyle = '#FF6B35'
        
        // Corner handles
        const handles = [
          { x: pos.x, y: pos.y, cursor: 'nw-resize' },
          { x: pos.x + width, y: pos.y, cursor: 'ne-resize' },
          { x: pos.x, y: pos.y + height, cursor: 'sw-resize' },
          { x: pos.x + width, y: pos.y + height, cursor: 'se-resize' },
        ]
        
        handles.forEach((h) => {
          ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize)
        })
      }
    })

    // Draw new zone preview when in draw mode
    if (editMode === 'draw' && dragStart && isDragging) {
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        // Draw preview rectangle from dragStart to current position
      }
    }
  }, [zones, buildings, selectedZoneId, editMode, showGrid, gridSize, zoom, pan, worldToCanvas, isDragging, dragStart])

  // Redraw on state changes
  useEffect(() => {
    draw()
  }, [draw])

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
        draw()
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [draw])

  // Find zone at position
  const findZoneAtPosition = useCallback((canvasX: number, canvasY: number): EditableZone | null => {
    const world = canvasToWorld(canvasX, canvasY)
    
    for (let i = zones.length - 1; i >= 0; i--) {
      const zone = zones[i]
      const building = buildings.find((b) => b.id === zone.buildingId)
      if (!building) continue

      const worldX = building.position[0] + zone.position[0]
      const worldZ = building.position[2] + zone.position[2]
      
      const halfWidth = zone.size[0] / 2
      const halfDepth = zone.size[2] / 2

      if (
        world.x >= worldX - halfWidth &&
        world.x <= worldX + halfWidth &&
        world.z >= worldZ - halfDepth &&
        world.z <= worldZ + halfDepth
      ) {
        return zone
      }
    }
    return null
  }, [zones, buildings, canvasToWorld])

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top

    // Middle mouse button or right-click for panning
    if (e.button === 1 || e.button === 2) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      return
    }

    const world = canvasToWorld(canvasX, canvasY)

    if (editMode === 'select' || editMode === 'move' || editMode === 'resize') {
      const zone = findZoneAtPosition(canvasX, canvasY)
      if (zone) {
        setSelectedZone(zone.id)
        if (editMode === 'move' || editMode === 'resize') {
          setIsDragging(true)
          setDragStart({ x: world.x, z: world.z })
        }
      } else {
        setSelectedZone(null)
      }
    } else if (editMode === 'draw') {
      setIsDragging(true)
      setDragStart({ x: world.x, z: world.z })
    } else if (editMode === 'delete') {
      const zone = findZoneAtPosition(canvasX, canvasY)
      if (zone) {
        deleteZone(zone.id)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Handle panning
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
      return
    }

    if (!isDragging || !dragStart) return

    const rect = canvas.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top
    const world = canvasToWorld(canvasX, canvasY)

    if (editMode === 'move' && selectedZoneId) {
      const zone = zones.find((z) => z.id === selectedZoneId)
      if (zone) {
        const building = buildings.find((b) => b.id === zone.buildingId)
        if (building) {
          const deltaX = world.x - dragStart.x
          const deltaZ = world.z - dragStart.z
          
          const newPosition: [number, number, number] = [
            zone.position[0] + deltaX,
            zone.position[1],
            zone.position[2] + deltaZ,
          ]
          
          moveZone(zone.id, newPosition)
          setDragStart({ x: world.x, z: world.z })
        }
      }
    } else if (editMode === 'resize' && selectedZoneId) {
      const zone = zones.find((z) => z.id === selectedZoneId)
      if (zone) {
        const deltaX = world.x - dragStart.x
        const deltaZ = world.z - dragStart.z
        
        const newSize: [number, number, number] = [
          Math.max(5, zone.size[0] + deltaX * 2),
          zone.size[1],
          Math.max(5, zone.size[2] + deltaZ * 2),
        ]
        
        resizeZone(zone.id, newSize)
        setDragStart({ x: world.x, z: world.z })
      }
    }
  }

  const handleMouseUp = () => {
    if (isDragging && (editMode === 'move' || editMode === 'resize')) {
      saveToHistory()
    }
    setIsDragging(false)
    setIsResizing(false)
    setDragStart(null)
    setResizeHandle(null)
    setIsPanning(false)
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((z) => Math.max(0.2, Math.min(3, z * delta)))
  }

  // Add new zone
  const handleAddZone = () => {
    const newZone: Omit<EditableZone, 'id'> = {
      name: 'New Zone',
      nameJa: '新しいゾーン',
      position: [0, 0.5, 0],
      size: [30, 0.5, 30],
      color: ZONE_CATEGORY_COLORS.storage,
      category: 'storage' as ZoneCategory,
      floor: 1,
      description: 'New zone',
      area: 900,
      buildingId: 'building-8',
      isLocked: false,
    }
    addZone(newZone)
  }

  // Export layout
  const handleExport = () => {
    const json = exportLayout()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'warehouse-layout.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import layout from JSON text
  const handleImport = () => {
    if (importJson) {
      importLayout(importJson)
      setShowImportModal(false)
      setImportJson('')
    }
  }

  // Import layout from file
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        if (content) {
          importLayout(content)
          setShowImportModal(false)
          setImportJson('')
        }
      }
      reader.readAsText(file)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle building selection from canvas click
  const handleBuildingClick = useCallback((canvasX: number, canvasY: number) => {
    const world = canvasToWorld(canvasX, canvasY)
    
    for (const building of buildings) {
      const halfWidth = building.size[0] / 2
      const halfDepth = building.size[2] / 2
      
      if (
        world.x >= building.position[0] - halfWidth &&
        world.x <= building.position[0] + halfWidth &&
        world.z >= building.position[2] - halfDepth &&
        world.z <= building.position[2] + halfDepth
      ) {
        setSelectedBuildingId(building.id)
        setShowBuildingPanel(true)
        return true
      }
    }
    return false
  }, [buildings, canvasToWorld])

  const selectedZone = zones.find((z) => z.id === selectedZoneId)
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId)

  return (
    <div className="absolute inset-0 pt-16 flex bg-[#0A0A0A]">
      {/* Left Toolbar */}
      <div className="w-14 bg-gray-900/95 border-r border-gray-700 flex flex-col items-center py-4 gap-2">
        <button
          onClick={() => setEditMode('select')}
          className={`p-2.5 rounded-lg transition-all ${
            editMode === 'select' ? 'bg-belli-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800'
          }`}
          title="Select (S)"
        >
          <MousePointer className="w-5 h-5" />
        </button>
        <button
          onClick={() => setEditMode('move')}
          className={`p-2.5 rounded-lg transition-all ${
            editMode === 'move' ? 'bg-belli-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800'
          }`}
          title="Move (M)"
        >
          <Move className="w-5 h-5" />
        </button>
        <button
          onClick={() => setEditMode('resize')}
          className={`p-2.5 rounded-lg transition-all ${
            editMode === 'resize' ? 'bg-belli-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800'
          }`}
          title="Resize (R)"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => setEditMode('delete')}
          className={`p-2.5 rounded-lg transition-all ${
            editMode === 'delete' ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-gray-800'
          }`}
          title="Delete (D)"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        
        <div className="w-8 h-px bg-gray-700 my-2" />
        
        <button
          onClick={handleAddZone}
          className="p-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-green-400 transition-all"
          title="Add Zone"
        >
          <Plus className="w-5 h-5" />
        </button>
        
        {/* Building Edit Button - Disabled per user request */}
        {/* <button
          onClick={() => {
            setSelectedBuildingId('building-8')
            setShowBuildingPanel(true)
            setSelectedZone(null)
          }}
          className={`p-2.5 rounded-lg transition-all ${
            showBuildingPanel ? 'bg-belli-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800'
          }`}
          title="Edit Building Walls"
        >
          <Building2 className="w-5 h-5" />
        </button> */}
        
        <div className="w-8 h-px bg-gray-700 my-2" />
        
        <button
          onClick={undo}
          className="p-2.5 rounded-lg text-gray-400 hover:bg-gray-800 transition-all"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          onClick={redo}
          className="p-2.5 rounded-lg text-gray-400 hover:bg-gray-800 transition-all"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-5 h-5" />
        </button>
        
        <div className="w-8 h-px bg-gray-700 my-2" />
        
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2.5 rounded-lg transition-all ${
            showGrid ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'
          }`}
          title="Toggle Grid"
        >
          <Grid3X3 className="w-5 h-5" />
        </button>
        
        <div className="flex-1" />
        
        <button
          onClick={handleExport}
          className="p-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-belli-orange-400 transition-all"
          title="Export Layout"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          className="p-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-belli-orange-400 transition-all"
          title="Import Layout"
        >
          <Upload className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowResetModal(true)}
          className="p-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-all"
          title="Reset to Default"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Zoom Controls */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
            className="p-2 bg-gray-900/95 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-700"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z / 1.2))}
            className="p-2 bg-gray-900/95 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-700"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="px-3 py-2 bg-gray-900/95 rounded-lg text-gray-300 border border-gray-700 text-sm">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Help Text */}
        <div className="absolute top-4 left-4 bg-gray-900/95 rounded-lg px-4 py-3 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">
            {editMode === 'select' && 'Click to select a zone'}
            {editMode === 'move' && 'Drag zones to move them'}
            {editMode === 'resize' && 'Drag zones to resize them'}
            {editMode === 'delete' && 'Click a zone to delete it'}
            {editMode === 'draw' && 'Click and drag to draw a new zone'}
          </p>
          <p className="text-gray-500 text-xs">
            Right-click + drag to pan • Scroll to zoom
          </p>
        </div>

        {/* Reset Button - More Visible */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2 bg-gray-900/95 rounded-lg text-gray-400 hover:bg-red-900/50 hover:text-red-400 border border-gray-700 hover:border-red-700 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Reset to Default</span>
          </button>
        </div>
      </div>

      {/* Right Panel - Zone or Building Properties */}
      {showBuildingPanel ? (
        <BuildingEditPanel
          buildingId={selectedBuildingId}
          onClose={() => {
            setShowBuildingPanel(false)
            setSelectedBuildingId(null)
          }}
          onSelectBuilding={(id) => setSelectedBuildingId(id)}
        />
      ) : (
        <ZoneEditPanel
          zone={selectedZone || null}
          onClose={() => setSelectedZone(null)}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-[550px] border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Import Layout</h3>
            
            {/* File Upload Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Upload JSON File
              </label>
              <div 
                className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-belli-orange-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="w-10 h-10 mx-auto text-gray-500 mb-2" />
                <p className="text-gray-400 text-sm">Click to upload or drag and drop</p>
                <p className="text-gray-500 text-xs mt-1">JSON files only</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
            
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-gray-500 text-sm">OR</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>
            
            {/* Paste JSON Section */}
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Paste JSON
            </label>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste your layout JSON here..."
              className="w-full h-48 bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 text-sm font-mono resize-none"
            />
            
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportJson('')
                }}
                className="px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importJson}
                className="px-4 py-2 rounded-lg bg-belli-orange-500 text-white hover:bg-belli-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-[400px] border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-200">Reset to Default</h3>
            </div>
            
            <p className="text-gray-400 text-sm mb-6">
              This will reset the warehouse layout to the original default configuration. 
              All your changes will be lost. This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToDefault()
                  setShowResetModal(false)
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium"
              >
                Reset Layout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
