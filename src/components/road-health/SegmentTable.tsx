'use client'

/**
 * SegmentTable — the worst road segments this unit covers, weakest first.
 *
 * Selecting a row drives the score breakdown card, so the formula on screen
 * always explains the segment the reader is looking at.
 */

import {
  formatNumber,
  SURFACE_COLOR,
  type Segment,
} from '@/lib/road-health-data'
import { ScoreSparkline } from './Charts'

export function SegmentTable({
  segments,
  selectedId,
  onSelect,
}: {
  segments: Segment[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-hairline">
            {[
              { label: 'Segment', align: 'left' },
              { label: 'Score', align: 'right' },
              { label: '12-wk trend', align: 'left' },
              { label: 'Defects', align: 'right' },
              { label: 'Density', align: 'right' },
              { label: 'Roughness', align: 'right' },
              { label: 'Flooding', align: 'right' },
              { label: 'Traffic/day', align: 'right' },
              { label: 'Bus passes', align: 'right' },
            ].map((c) => (
              <th
                key={c.label}
                scope="col"
                className={`label-eyebrow whitespace-nowrap px-3 py-2 first:pl-5 last:pr-5 ${
                  c.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {segments.map((s) => {
            const isSelected = s.id === selectedId
            return (
              <tr
                key={s.id}
                onClick={() => onSelect(s.id)}
                aria-selected={isSelected}
                className={`cursor-pointer border-b border-hairline last:border-0 transition-colors duration-200 ease-out ${
                  isSelected ? 'bg-surface-sunken' : 'hover:bg-surface-muted'
                }`}
              >
                <td className="px-3 py-2.5 pl-5">
                  <span className="block truncate font-medium text-ink">{s.name}</span>
                  <span className="block truncate text-label text-ink-muted">
                    {s.id} · {s.ward} · {s.lengthM} m
                  </span>
                </td>

                <td className="px-3 py-2.5 text-right">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: SURFACE_COLOR[s.surfaceClass] }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold tabular-nums text-ink">
                      {formatNumber(s.breakdown.score, 1)}
                    </span>
                  </span>
                  <span className="block text-label text-ink-muted">{s.surfaceClass}</span>
                </td>

                <td className="px-3 py-2.5">
                  <ScoreSparkline points={s.history} width={84} height={24} />
                </td>

                <td className="px-3 py-2.5 text-right tabular-nums text-ink-secondary">
                  {s.defectCount}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink-secondary">
                  {formatNumber(s.defectDensity, 1)}
                  <span className="ml-0.5 text-label text-ink-muted">/km</span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink-secondary">
                  {formatNumber(s.roughness, 1)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="block tabular-nums text-ink-secondary">
                    {s.waterloggingEvents30d}×
                  </span>
                  <span className="block text-label tabular-nums text-ink-muted">
                    {s.waterloggingDepthCm} cm
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink-secondary">
                  {formatNumber(s.trafficExposure)}
                </td>
                <td className="px-3 py-2.5 pr-5 text-right tabular-nums text-ink-secondary">
                  {s.busPassesPerDay}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
