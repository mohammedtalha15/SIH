'use client'

/**
 * Zone Edit Panel - Edit properties of a selected zone
 */

import { useState, useEffect } from 'react'
import { X, Copy, Trash2, Lock, Unlock } from 'lucide-react'
import { useLayoutStore, EditableZone, ZONE_CATEGORY_COLORS } from '@/lib/stores/layoutStore'
import type { ZoneCategory } from '@/lib/types'

interface ZoneEditPanelProps {
  zone: EditableZone | null
  onClose: () => void
}

export function ZoneEditPanel({ zone, onClose }: ZoneEditPanelProps) {
  const { updateZone, deleteZone, duplicateZone, buildings } = useLayoutStore()
  
  const [name, setName] = useState('')
  const [nameJa, setNameJa] = useState('')
  const [category, setCategory] = useState<ZoneCategory>('storage')
  const [color, setColor] = useState('#6B7B8C')
  const [description, setDescription] = useState('')
  const [area, setArea] = useState(0)
  const [buildingId, setBuildingId] = useState('building-8')
  const [posX, setPosX] = useState(0)
  const [posZ, setPosZ] = useState(0)
  const [sizeX, setSizeX] = useState(30)
  const [sizeZ, setSizeZ] = useState(30)
  const [isLocked, setIsLocked] = useState(false)

  // Update local state when zone changes
  useEffect(() => {
    if (zone) {
      setName(zone.name)
      setNameJa(zone.nameJa || '')
      setCategory(zone.category)
      setColor(zone.color)
      setDescription(zone.description || '')
      setArea(zone.area || 0)
      setBuildingId(zone.buildingId)
      setPosX(zone.position[0])
      setPosZ(zone.position[2])
      setSizeX(zone.size[0])
      setSizeZ(zone.size[2])
      setIsLocked(zone.isLocked || false)
    }
  }, [zone])

  // Save changes
  const handleSave = () => {
    if (!zone) return
    
    updateZone(zone.id, {
      name,
      nameJa: nameJa || undefined,
      category,
      color,
      description: description || undefined,
      area: sizeX * sizeZ,
      buildingId,
      position: [posX, zone.position[1], posZ],
      size: [sizeX, zone.size[1], sizeZ],
      isLocked,
    })
  }

  // Auto-save on change
  useEffect(() => {
    if (zone) {
      const timeout = setTimeout(handleSave, 300)
      return () => clearTimeout(timeout)
    }
  }, [name, nameJa, category, color, description, buildingId, posX, posZ, sizeX, sizeZ, isLocked])

  // Handle category change - also update color
  const handleCategoryChange = (newCategory: ZoneCategory) => {
    setCategory(newCategory)
    setColor(ZONE_CATEGORY_COLORS[newCategory])
  }

  if (!zone) {
    return (
      <div className="w-80 bg-gray-900/95 border-l border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Zone Properties</h3>
        <p className="text-gray-500 text-sm">Select a zone to edit its properties</p>
        
        <div className="mt-8">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Zone Categories</h4>
          <div className="space-y-2">
            {Object.entries(ZONE_CATEGORY_COLORS).map(([cat, col]) => (
              <div key={cat} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: col }}
                />
                <span className="text-gray-300 text-sm capitalize">{cat}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-8">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Keyboard Shortcuts</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Select</span>
              <span className="text-gray-500">S</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Move</span>
              <span className="text-gray-500">M</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Resize</span>
              <span className="text-gray-500">R</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Delete</span>
              <span className="text-gray-500">D</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Undo</span>
              <span className="text-gray-500">Ctrl+Z</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Redo</span>
              <span className="text-gray-500">Ctrl+Y</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-gray-900/95 border-l border-gray-700 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-belli-orange-600 to-belli-red-500 p-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Edit Zone</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Zone Name */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Zone Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-belli-orange-500"
          />
        </div>

        {/* Japanese Name */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Japanese Name
          </label>
          <input
            type="text"
            value={nameJa}
            onChange={(e) => setNameJa(e.target.value)}
            placeholder="日本語名"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-belli-orange-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value as ZoneCategory)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-belli-orange-500"
          >
            <option value="import">Import</option>
            <option value="export">Export</option>
            <option value="storage">Storage</option>
            <option value="office">Office</option>
            <option value="special">Special</option>
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono text-sm focus:outline-none focus:border-belli-orange-500"
            />
          </div>
        </div>

        {/* Building */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Building
          </label>
          <select
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-belli-orange-500"
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Position (relative to building)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X</label>
              <input
                type="number"
                value={posX}
                onChange={(e) => setPosX(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-belli-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Z</label>
              <input
                type="number"
                value={posZ}
                onChange={(e) => setPosZ(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-belli-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Size
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Width (X)</label>
              <input
                type="number"
                value={sizeX}
                onChange={(e) => setSizeX(parseFloat(e.target.value) || 5)}
                min={5}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-belli-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Depth (Z)</label>
              <input
                type="number"
                value={sizeZ}
                onChange={(e) => setSizeZ(parseFloat(e.target.value) || 5)}
                min={5}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-belli-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Area (calculated) */}
        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Calculated Area</span>
            <span className="text-lg font-semibold text-belli-orange-400">
              {(sizeX * sizeZ).toLocaleString()} m²
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-belli-orange-500 resize-none"
          />
        </div>

        {/* Lock Zone */}
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <span className="text-sm text-gray-400">Lock Zone</span>
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`p-2 rounded-lg transition-all ${
              isLocked ? 'bg-belli-orange-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-700">
          <button
            onClick={() => duplicateZone(zone.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-all"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <button
            onClick={() => {
              deleteZone(zone.id)
              onClose()
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
