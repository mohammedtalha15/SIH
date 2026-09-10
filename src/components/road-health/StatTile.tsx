'use client'

/**
 * StatTile — one headline figure. A single number answering a single question
 * is a stat tile, not a chart.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { formatNumber } from '@/lib/road-health-data'
import { useClimb, useDrift } from '@/lib/use-live'

export function StatTile({
  label,
  value,
  unit,
  caption,
  delta,
  higherIsBetter = true,
  accent,
  icon,
  live,
}: {
  label: string
  value: number | string
  unit?: string
  caption?: string
  delta?: number
  higherIsBetter?: boolean
  /** Tints the value — reserve for genuinely alarming figures. */
  accent?: string
  icon?: ReactNode
  /**
   * Makes the figure move as readings arrive. 'climb' only ever goes up (event
   * counts); 'drift' wanders around the base (a measured quantity).
   */
  live?: 'climb' | 'drift'
}) {
  const numeric = typeof value === 'number' ? value : null

  // Both hooks must be called unconditionally — they start at the base value
  // and only move after mount, so SSR and the first client render agree.
  const climbed = useClimb(numeric ?? 0, 2, 5200)
  const drifted = useDrift(numeric ?? 0, Math.max(0.4, Math.abs(numeric ?? 0) * 0.012), 3400)

  let shown: number | string = value
  if (numeric !== null && live === 'climb') shown = climbed
  if (numeric !== null && live === 'drift') shown = drifted

  // Flash briefly when the figure changes, so movement is noticed without
  // anything animating continuously.
  const [pulse, setPulse] = useState(false)
  const prev = useRef(shown)
  useEffect(() => {
    if (prev.current !== shown) {
      prev.current = shown
      setPulse(true)
      const id = setTimeout(() => setPulse(false), 600)
      return () => clearTimeout(id)
    }
  }, [shown])

  const showDelta = typeof delta === 'number'
  const up = showDelta && delta > 0
  // "Good" is a property of the metric, not the arrow: falling defect counts
  // are good, falling scores are not.
  const isGood = up === higherIsBetter
  const DeltaIcon = up ? ArrowUpRight : ArrowDownRight

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="label-eyebrow truncate">{label}</p>
        {icon && <span className="shrink-0 text-ink-muted">{icon}</span>}
      </div>

      <p className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`text-2xl font-semibold tabular-nums tracking-tight transition-opacity duration-200 ease-out ${
            pulse ? 'opacity-60' : 'opacity-100'
          }`}
          style={{ color: accent ?? 'var(--ink)' }}
        >
          {typeof shown === 'number'
            ? formatNumber(shown, Number.isInteger(numeric) && live !== 'drift' ? 0 : 1)
            : shown}
        </span>
        {unit && <span className="text-sm font-medium text-ink-muted">{unit}</span>}

        {showDelta && (
          <span
            className={`ml-auto flex items-center gap-0.5 whitespace-nowrap text-label font-medium ${
              isGood ? 'text-[var(--status-good-text)]' : 'text-[var(--status-critical)]'
            }`}
          >
            <DeltaIcon className="h-3 w-3 shrink-0" strokeWidth={2} />
            <span className="tabular-nums">
              {up ? '+' : ''}
              {formatNumber(delta, 1)}%
            </span>
          </span>
        )}
      </p>

      {/* Wrap rather than truncate: in a narrow 2-column grid these captions
          carry the identifying detail ("Damaged signboard · Airport Link"). */}
      {caption && <p className="mt-1.5 line-clamp-2 text-label leading-snug text-ink-muted">{caption}</p>}
    </div>
  )
}
