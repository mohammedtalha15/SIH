'use client'

/**
 * HeadwayTimeline — bunching and gaps on one route, over a 2-hour window.
 *
 * This is the metric worth showing off. Passengers experience bunching as
 * "nothing for 25 minutes, then three at once", and it is a scheduling and
 * holding-strategy failure rather than a driver failure — so the chart shows
 * arrivals against the *scheduled* headway rather than ranking drivers.
 *
 * Encoding: each arrival is a tick on a time axis, and the bar beneath it is
 * the gap since the previous bus. Colour is a reserved status role (bunched /
 * gap), never a series colour, and every tick carries a written label on hover.
 */

import { useState } from 'react'

import { formatNumber, HEADWAY_COLOR, type HeadwayArrival } from '@/lib/bus-ops-data'

export function HeadwayTimeline({
  arrivals,
  scheduledHeadwayMin,
}: {
  arrivals: HeadwayArrival[]
  scheduledHeadwayMin: number
}) {
  const [hover, setHover] = useState<number | null>(null)

  const totalMin = Math.max(...arrivals.map((a) => a.atMin))
  const maxHeadway = Math.max(...arrivals.map((a) => a.headwayMin), scheduledHeadwayMin * 2)

  const bunched = arrivals.filter((a) => a.kind === 'bunched').length
  const gaps = arrivals.filter((a) => a.kind === 'gap').length

  return (
    <div className="space-y-4">
      {/* Legend — identity never rests on colour alone */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {(
          [
            ['normal', 'Within schedule'],
            ['bunched', 'Bunched (<40% of headway)'],
            ['gap', 'Gap (>180% of headway)'],
          ] as const
        ).map(([kind, label]) => (
          <span key={kind} className="flex items-center gap-1.5 text-label text-ink-secondary">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: HEADWAY_COLOR[kind] }}
              aria-hidden="true"
            />
            {label}
          </span>
        ))}
      </div>

      {/* Arrival ticks on a time axis */}
      <div>
        <p className="label-eyebrow mb-2">Arrivals at Marathahalli Bridge</p>
        <div className="relative h-14 rounded-md border border-hairline bg-surface-muted/50 px-2">
          {/* Where buses *should* arrive, at the scheduled headway */}
          {Array.from({ length: Math.floor(totalMin / scheduledHeadwayMin) + 1 }, (_, i) => (
            <span
              key={i}
              className="absolute top-0 h-full border-l border-dashed border-hairline-strong/60"
              style={{
                left: `calc(0.5rem + ${((i * scheduledHeadwayMin) / totalMin) * 100}% - ${((i * scheduledHeadwayMin) / totalMin) * 1}rem)`,
              }}
              aria-hidden="true"
            />
          ))}

          {arrivals.map((a, i) => (
            <button
              key={i}
              type="button"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="absolute top-0 h-full w-4 -translate-x-1/2 cursor-default"
              // Inset by the container padding so the last tick isn't clipped.
              style={{ left: `calc(0.5rem + ${(a.atMin / totalMin) * 100}% - ${(a.atMin / totalMin) * 1}rem)` }}
              aria-label={`${a.busReg} at +${a.atMin} minutes, ${a.headwayMin} minute headway`}
            >
              <span
                className="absolute left-1/2 top-2 h-10 w-[3px] -translate-x-1/2 rounded-full transition-transform duration-200 ease-out"
                style={{
                  backgroundColor: HEADWAY_COLOR[a.kind],
                  transform: hover === i ? 'scaleY(1.12)' : 'scaleY(1)',
                }}
              />
            </button>
          ))}

          {hover !== null && (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-y-full rounded-md border border-hairline bg-surface px-2.5 py-1.5 shadow-overlay animate-in fade-in"
              style={{
                left: `calc(0.5rem + ${(arrivals[hover].atMin / totalMin) * 100}% - ${(arrivals[hover].atMin / totalMin) * 1}rem)`,
                transform:
                  arrivals[hover].atMin > totalMin / 2
                    ? 'translate(calc(-100% + 8px), -100%)'
                    : 'translate(-8px, -100%)',
              }}
            >
              <p className="text-xs font-semibold tabular-nums text-ink">
                {formatNumber(arrivals[hover].headwayMin, 1)} min headway
              </p>
              <p className="text-label tabular-nums text-ink-muted">
                {arrivals[hover].busReg} · +{formatNumber(arrivals[hover].atMin, 0)} min
              </p>
              <p className="text-label capitalize text-ink-secondary">{arrivals[hover].kind}</p>
            </div>
          )}
        </div>
        <div className="mt-1 flex justify-between text-label tabular-nums text-ink-muted">
          <span>0 min</span>
          <span>scheduled every {scheduledHeadwayMin} min</span>
          <span>{Math.round(totalMin)} min</span>
        </div>
      </div>

      {/* Headway per arrival, against the schedule */}
      <div>
        <p className="label-eyebrow mb-2">Gap to previous bus</p>
        <div className="relative flex h-20 items-end gap-1">
          {/* The scheduled headway, as a reference line */}
          {/* z-10 so it sits above the bars — beneath them it was invisible */}
          <span
            className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-ink/40"
            style={{ bottom: `${(scheduledHeadwayMin / maxHeadway) * 80}px` }}
            aria-hidden="true"
          />
          {arrivals.map((a, i) => (
            <span
              key={i}
              className="group relative flex-1"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              <span
                className="block w-full rounded-sm transition-opacity duration-200 ease-out"
                style={{
                  height: `${(a.headwayMin / maxHeadway) * 80}px`,
                  backgroundColor: HEADWAY_COLOR[a.kind],
                  opacity: hover === null || hover === i ? 1 : 0.5,
                }}
              />
            </span>
          ))}
        </div>
        <p className="mt-1 text-label text-ink-muted">
          Dashed line marks the scheduled {scheduledHeadwayMin}-minute headway.
        </p>
      </div>

      {/* The reading, in words */}
      <div className="grid grid-cols-2 gap-3 border-t border-hairline pt-3">
        <div>
          <p className="label-eyebrow">Bunching events</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--status-critical)]">
            {bunched}
          </p>
          <p className="text-label text-ink-muted">buses arriving nose-to-tail</p>
        </div>
        <div>
          <p className="label-eyebrow">Service gaps</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--status-serious)]">
            {gaps}
          </p>
          <p className="text-label text-ink-muted">holes longer than 2× headway</p>
        </div>
      </div>
    </div>
  )
}
