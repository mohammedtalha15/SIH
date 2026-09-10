'use client'

import { ZONE_COLORS } from '@/lib/constants'

export function WarehouseLegend() {
  const legendItems = [
    { label: 'Import Area', labelJa: '輸入エリア', color: ZONE_COLORS.import },
    { label: 'Export Area', labelJa: '輸出エリア', color: ZONE_COLORS.export },
    { label: 'Storage', labelJa: '保管', color: ZONE_COLORS.storage },
    { label: 'Special', labelJa: '特別', color: ZONE_COLORS.special },
  ]

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-xl border border-gray-700">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-gray-200">Legend:</span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: item.color }}
              />
              <div className="text-xs text-gray-300">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
