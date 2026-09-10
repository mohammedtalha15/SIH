'use client'

/**
 * DefectTable — the atomic unit: one pothole, one crack.
 *
 * Corroboration leads. One bus seeing something once is a guess; four buses
 * seeing it eleven times is a fact, so sighting count and distinct-bus count
 * get their own prominent column rather than being buried in a detail drawer.
 */

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Bus, ImageIcon } from 'lucide-react'

import {
  corroborationTier,
  formatDate,
  formatNumber,
  SEVERITY_COLOR,
  SEVERITY_RANK,
  type Defect,
} from '@/lib/road-health-data'

type SortKey = 'severity' | 'distinctBuses' | 'areaCm2' | 'lastSeen' | 'growth'

const STATUS_STYLE: Record<Defect['status'], string> = {
  New: 'border-transparent bg-ink text-ink-inverted',
  Confirmed: 'border-hairline-strong bg-surface-sunken text-ink',
  Reported: 'border-hairline bg-surface-muted text-ink-secondary',
  'Under repair': 'border-hairline bg-surface-muted text-ink-secondary',
  Fixed: 'border-hairline bg-surface-muted text-ink-muted',
  Reappeared: 'border-transparent bg-[var(--status-critical)] text-white',
}

const TONE_CLASS = {
  good: 'text-[var(--status-good-text)]',
  warning: 'text-[var(--status-serious)]',
  muted: 'text-ink-muted',
} as const

export function DefectTable({ defects }: { defects: Defect[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'distinctBuses',
    dir: 'desc',
  })

  const sorted = useMemo(() => {
    const f = sort.dir === 'asc' ? 1 : -1
    return [...defects].sort((a, b) => {
      switch (sort.key) {
        case 'severity':
          return (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) * f
        case 'distinctBuses':
          return (a.distinctBuses - b.distinctBuses) * f
        case 'areaCm2':
          return (a.areaCm2 - b.areaCm2) * f
        case 'growth':
          return (a.growthCm2PerWeek - b.growthCm2PerWeek) * f
        case 'lastSeen':
          return a.lastSeen.localeCompare(b.lastSeen) * f
      }
    })
  }, [defects, sort])

  function toggle(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  const columns: Array<{ key: SortKey | null; label: string; align?: 'right'; cls?: string }> = [
    { key: null, label: 'Defect' },
    { key: 'severity', label: 'Severity' },
    { key: 'distinctBuses', label: 'Corroboration' },
    { key: 'areaCm2', label: 'Size', align: 'right', cls: 'hidden md:table-cell' },
    { key: 'growth', label: 'Growth', align: 'right', cls: 'hidden lg:table-cell' },
    { key: null, label: 'Status', cls: 'hidden sm:table-cell' },
    { key: 'lastSeen', label: 'Last seen', align: 'right', cls: 'hidden xl:table-cell' },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-hairline">
            {columns.map((col) => (
              <th
                key={col.label}
                scope="col"
                aria-sort={
                  col.key && sort.key === col.key
                    ? sort.dir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
                className={`label-eyebrow whitespace-nowrap px-3 py-2 first:pl-5 last:pr-5 ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                } ${col.cls ?? ''}`}
              >
                {col.key ? (
                  <button
                    type="button"
                    onClick={() => toggle(col.key as SortKey)}
                    className={`inline-flex items-center gap-1 text-label font-medium uppercase tracking-[0.02em]
                                transition-colors duration-200 ease-out hover:text-ink ${
                                  col.align === 'right' ? 'flex-row-reverse' : ''
                                }`}
                  >
                    {col.label}
                    {sort.key === col.key ? (
                      sort.dir === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sorted.map((d) => {
            const tier = corroborationTier(d.distinctBuses)
            return (
              <tr
                key={d.id}
                className="border-b border-hairline last:border-0 transition-colors duration-200 ease-out hover:bg-surface-muted"
              >
                <td className="px-3 py-2.5 pl-5">
                  <div className="flex items-center gap-2.5">
                    {/* Evidence crop stands in for the S3 image */}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-hairline bg-surface-sunken">
                      <ImageIcon className="h-3.5 w-3.5 text-ink-muted" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{d.type}</span>
                      <span className="block truncate text-label text-ink-muted">
                        {d.id} · {d.segmentName} · {d.lane} lane
                      </span>
                    </span>
                  </div>
                </td>

                <td className="px-3 py-2.5">
                  <span className="badge">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: SEVERITY_COLOR[d.severity] }}
                      aria-hidden="true"
                    />
                    {d.severity}
                  </span>
                  <span className="mt-0.5 block text-label text-ink-muted">{d.depth} depth</span>
                </td>

                {/* The field that separates a guess from a fact */}
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1.5">
                    <Bus className="h-3.5 w-3.5 shrink-0 text-ink-muted" strokeWidth={1.75} />
                    <span className="text-xs font-semibold tabular-nums text-ink">
                      {d.distinctBuses}
                    </span>
                    <span className="text-label text-ink-muted">
                      buses · {formatNumber(d.sightings)} passes
                    </span>
                  </span>
                  <span className={`mt-0.5 block text-label font-medium ${TONE_CLASS[tier.tone]}`}>
                    {tier.label} · {(d.confidence * 100).toFixed(0)}% conf.
                  </span>
                </td>

                <td className="hidden px-3 py-2.5 text-right md:table-cell">
                  <span className="block text-xs font-medium tabular-nums text-ink">
                    {formatNumber(d.areaCm2)} cm²
                  </span>
                  <span className="block text-label tabular-nums text-ink-muted">
                    {d.widthCm} × {d.lengthCm} cm
                  </span>
                </td>

                <td className="hidden px-3 py-2.5 text-right lg:table-cell">
                  <span className="block text-xs font-medium tabular-nums text-ink">
                    +{formatNumber(d.growthCm2PerWeek)}
                  </span>
                  <span className="block text-label text-ink-muted">
                    {d.daysToCritical === null ? 'already critical' : `${d.daysToCritical}d to critical`}
                  </span>
                </td>

                <td className="hidden px-3 py-2.5 sm:table-cell">
                  <span className={`badge ${STATUS_STYLE[d.status]}`}>{d.status}</span>
                </td>

                <td className="hidden px-3 py-2.5 pr-5 text-right xl:table-cell">
                  <span className="block text-label tabular-nums text-ink-secondary">
                    {formatDate(d.lastSeen)}
                  </span>
                  <span className="block text-label tabular-nums text-ink-muted">
                    first {formatDate(d.firstSeen)}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
