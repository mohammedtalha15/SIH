'use client'

/**
 * ScoreFormula — the Road Health Score, shown as a deduction waterfall.
 *
 * The whole point is that the score is not a black box: asked "why is this road
 * 34?", the answer is on screen. So the chart is literally the formula —
 * 100 minus each named penalty, each bar proportional to what it cost.
 */

import type { ScoreBreakdown } from '@/lib/road-health-data'
import { formatNumber, SCORE_FORMULA, surfaceClassFor, SURFACE_COLOR } from '@/lib/road-health-data'

type Term = { label: string; value: number; source: string }

export function ScoreFormula({
  breakdown,
  segmentName,
}: {
  breakdown: ScoreBreakdown
  segmentName: string
}) {
  const terms: Term[] = [
    {
      label: 'Defect density × severity',
      value: breakdown.densityPenalty,
      source: 'defects per km, weighted by average severity',
    },
    {
      label: 'Roughness',
      value: breakdown.roughnessPenalty,
      source: 'IMU vertical acceleration, IRI-equivalent',
    },
    {
      label: 'Missing infrastructure',
      value: breakdown.infrastructurePenalty,
      source: 'signs, dividers and crossings not detected',
    },
    {
      label: 'Waterlogging',
      value: breakdown.waterloggingPenalty,
      source: 'flood events at this spot in the last 30 days',
    },
  ]

  const totalDeducted = terms.reduce((sum, t) => sum + t.value, 0)
  // Bars are proportional to the largest single deduction, so the dominant
  // cause is obvious at a glance rather than requiring the numbers to be read.
  const maxTerm = Math.max(...terms.map((t) => t.value), 1)
  const surface = surfaceClassFor(breakdown.score)

  return (
    <div className="card">
      <header className="card-header">
        <div className="min-w-0">
          <h2 className="card-title">Road Health Score</h2>
          <p className="card-subtitle truncate">{segmentName}</p>
        </div>
        <span className="badge shrink-0">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: SURFACE_COLOR[surface] }}
            aria-hidden="true"
          />
          {surface}
        </span>
      </header>

      <div className="card-body space-y-4">
        {/* Headline */}
        <div className="flex items-end gap-3">
          <span className="text-[2.75rem] font-semibold leading-none tabular-nums tracking-tight text-ink">
            {formatNumber(breakdown.score, 1)}
          </span>
          <span className="pb-1 text-sm text-ink-muted">/ 100</span>
          <span className="ml-auto pb-1 text-xs tabular-nums text-ink-muted">
            −{formatNumber(totalDeducted, 1)} deducted
          </span>
        </div>

        {/* Score bar: what remains vs what was lost */}
        <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-sm bg-surface-sunken">
          <div
            className="h-full rounded-sm"
            style={{ width: `${breakdown.score}%`, backgroundColor: SURFACE_COLOR[surface] }}
          />
        </div>

        {/* The formula, in words */}
        <p className="rounded-md border border-hairline bg-surface-muted px-3 py-2 text-label leading-relaxed text-ink-secondary">
          {SCORE_FORMULA}
        </p>

        {/* Deduction waterfall */}
        <ol className="space-y-2.5">
          <li className="flex items-baseline justify-between gap-3 border-b border-hairline pb-2">
            <span className="text-xs font-medium text-ink">Base</span>
            <span className="text-xs font-semibold tabular-nums text-ink">100.0</span>
          </li>

          {terms.map((term) => (
            <li key={term.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-xs text-ink-secondary">{term.label}</span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--status-critical)]">
                  −{formatNumber(term.value, 1)}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-surface-sunken">
                <div
                  className="h-full rounded-sm bg-[var(--status-critical)] opacity-70"
                  style={{ width: `${(term.value / maxTerm) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-label text-ink-muted">{term.source}</p>
            </li>
          ))}

          <li className="flex items-baseline justify-between gap-3 border-t border-hairline pt-2.5">
            <span className="text-xs font-medium text-ink">Final score</span>
            <span className="text-sm font-semibold tabular-nums text-ink">
              {formatNumber(breakdown.score, 1)}
            </span>
          </li>
        </ol>
      </div>
    </div>
  )
}
