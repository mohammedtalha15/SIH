'use client'

/**
 * Building Edit Panel - Edit building wall dimensions
 * Allows adjusting building perimeter, width, and length
 */

import { useState, useEffect } from 'react'
import { X, Building2, ArrowRight, AlertTriangle } from 'lucide-react'
import { useLayoutStore } from '@/lib/stores/layoutStore'

interface BuildingEditPanelProps {
  buildingId: string | null
  onClose: () => void
  onSelectBuilding: (id: string) => void
}

export function BuildingEditPanel({ buildingId, onClose, onSelectBuilding }: BuildingEditPanelProps) {
  const { buildings, zones, updateBuilding, saveToHistory } = useLayoutStore()
  
  const [sizeX, setSizeX] = useState(200)
  const [sizeZ, setSizeZ] = useState(180)
  const [posX, setPosX] = useState(0)
  const [posZ, setPosZ] = useState(0)
  const [name, setName] = useState('')
  const [showWarning, setShowWarning] = useState(false)

  const selectedBuilding = buildings.find(b => b.id === buildingId)
  
  // Get zones for this building
  const buildingZones = zones.filter(z => z.buildingId === buildingId)
  
  // Calculate if any zones would be outside the new building bounds
  const checkZonesOutOfBounds = (newSizeX: number, newSizeZ: number) => {
    const halfWidth = newSizeX / 2
    const halfDepth = newSizeZ / 2
    
    for (const zone of buildingZones) {
      const zoneRight = zone.position[0] + zone.size[0] / 2
      const zoneLeft = zone.position[0] - zone.size[0] / 2
      const zoneFront = zone.position[2] + zone.size[2] / 2
      const zoneBack = zone.position[2] - zone.size[2] / 2
      
      if (zoneRight > halfWidth || zoneLeft < -halfWidth ||
          zoneFront > halfDepth || zoneBack < -halfDepth) {
        return true
      }
    }
    return false
  }

  // Update local state when building changes
  useEffect(() => {
    if (selectedBuilding) {
      setSizeX(selectedBuilding.size[0])
      setSizeZ(selectedBuilding.size[2])
      setPosX(selectedBuilding.position[0])
      setPosZ(selectedBuilding.position[2])
      setName(selectedBuilding.name)
    }
  }, [selectedBuilding])

  // Check for out-of-bounds zones when size changes
  useEffect(() => {
    setShowWarning(checkZonesOutOfBounds(sizeX, sizeZ))
  }, [sizeX, sizeZ, buildingZones])

  // Apply changes
  const handleApply = () => {
    if (!buildingId) return
    
    updateBuilding(buildingId, {
      name,
      size: [sizeX, selectedBuilding?.size[1] || 15, sizeZ],
      position: [posX, selectedBuilding?.position[1] || 0, posZ],
    })
    saveToHistory()
  }

  // Calculate perimeter and area
  const perimeter = 2 * (sizeX + sizeZ)
  const area = sizeX * sizeZ

  if (!buildingId) {
    return (
      <div className="w-80 bg-gray-900/95 border-l border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Building Properties</h3>
        <p className="text-gray-500 text-sm mb-6">Select a building to edit its dimensions</p>
        
        <div className="space-y-3">
          {buildings.map((building) => (
            <button
              key={building.id}
              onClick={() => onSelectBuilding(building.id)}
              className="w-full p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-belli-orange-500 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-belli-orange-500" />
                <div>
                  <p className="text-gray-200 font-medium">{building.name}</p>
                  <p className="text-gray-500 text-xs">
                    {building.size[0]} × {building.size[2]} m
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-gray-900/95 border-l border-gray-700 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-belli-orange-600 to-belli-red-500 p-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Edit Building
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Building Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Building
          </label>
          <select
            value={buildingId}
            onChange={(e) => onSelectBuilding(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-belli-orange-500"
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Building Name */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Building Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-belli-orange-500"
          />
        </div>

        {/* Wall Dimensions */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Wall Dimensions (meters)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Width (X)</label>
              <input
                type="number"
                value={sizeX}
                onChange={(e) => setSizeX(Math.max(50, parseFloat(e.target.value) || 50))}
                min={50}
                step={5}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-belli-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Length (Z)</label>
              <input
                type="number"
                value={sizeZ}
                onChange={(e) => setSizeZ(Math.max(50, parseFloat(e.target.value) || 50))}
                min={50}
                step={5}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-belli-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Building Position */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Building Position
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X Position</label>
              <input
                type="number"
                value={posX}
                onChange={(e) => setPosX(parseFloat(e.target.value) || 0)}
                step={5}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-belli-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Z Position</label>
              <input
                type="number"
                value={posZ}
                onChange={(e) => setPosZ(parseFloat(e.target.value) || 0)}
                step={5}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-belli-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Calculated Stats */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Perimeter</span>
            <span className="text-lg font-semibold text-belli-orange-400">
              {perimeter.toLocaleString()} m
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Floor Area</span>
            <span className="text-lg font-semibold text-belli-orange-400">
              {area.toLocaleString()} m²
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Zones Inside</span>
            <span className="text-sm font-semibold text-gray-200">
              {buildingZones.length} zones
            </span>
          </div>
        </div>

        {/* Warning if zones would be out of bounds */}
        {showWarning && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 text-sm font-medium">Zones Outside Bounds</p>
              <p className="text-yellow-500/70 text-xs mt-1">
                Some zones may extend outside the building perimeter. Consider adjusting zone positions.
              </p>
            </div>
          </div>
        )}

        {/* Quick Resize Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Quick Resize
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setSizeX(sizeX * 0.9)
                setSizeZ(sizeZ * 0.9)
              }}
              className="px-3 py-2 bg-gray-800 rounded-lg text-gray-400 hover:bg-gray-700 text-sm"
            >
              Shrink 10%
            </button>
            <button
              onClick={() => {
                setSizeX(sizeX * 1.1)
                setSizeZ(sizeZ * 1.1)
              }}
              className="px-3 py-2 bg-gray-800 rounded-lg text-gray-400 hover:bg-gray-700 text-sm"
            >
              Expand 10%
            </button>
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApply}
          className="w-full px-4 py-3 rounded-lg bg-belli-orange-500 text-white hover:bg-belli-orange-600 font-medium transition-all"
        >
          Apply Changes
        </button>

        {/* Building List */}
        <div className="pt-4 border-t border-gray-700">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Other Buildings
          </label>
          <div className="space-y-2">
            {buildings.filter(b => b.id !== buildingId).map((building) => (
              <button
                key={building.id}
                onClick={() => onSelectBuilding(building.id)}
                className="w-full p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-belli-orange-500 transition-all text-left flex items-center gap-3"
              >
                <Building2 className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-300 text-sm">{building.name}</p>
                  <p className="text-gray-500 text-xs">
                    {building.size[0]} × {building.size[2]} m
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
