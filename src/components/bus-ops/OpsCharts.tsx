'use client'

/**
 * Charts for the Bus Operations section.
 *
 * Colour follows the job: magnitude uses one sequential blue ramp, state uses
 * the reserved status roles, and the demand chart keeps demand and supply on a
 * single axis by expressing supply as seats offered — same unit as passengers,
 * so no second scale is needed.
 */

import { useState } from 'react'

import { formatNumber, type HourDemand, type StopDwell } from '@/lib/bus-ops-data'

const BLUE_RAMP = ['#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7', '#86b6ef', '#9ec5f4', '#b7d3f6']

/* -------------------------------------------------------------------------- */
/* Dwell time per stop                                                         */
/* -------------------------------------------------------------------------- */

/** Long dwell means crowding or a ticketing delay; a skipped stop is its own state. */
export function DwellChart({ data }: { data: StopDwell[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.dwellSec), 60)

  return (
    <ul className="space-y-2">
      {data.map((d, i) => {
        const long = d.dwellSec > 75
        return (
          <li
            key={d.stop}
            className="relative"
            tabIndex={0}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span
                className={`truncate text-xs ${d.skipped ? 'text-ink-muted line-through' : 'text-ink-secondary'}`}
              >
                {d.stop}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">
                {d.skipped ? (
                  <span className="text-label font-medium uppercase text-[var(--status-critical)]">
                    Skipped
                  </span>
                ) : (
                  `${d.dwellSec}s`
                )}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-surface-sunken">
              <div
                className="h-full rounded-sm transition-opacity duration-200 ease-out"
                style={{
                  width: d.skipped ? '100%' : `${(d.dwellSec / max) * 100}%`,
                  backgroundColor: d.skipped
                    ? 'var(--status-critical)'
                    : long
                      ? 'var(--status-warning)'
                      : 'var(--series-1)',
                  opacity: d.skipped ? 0.25 : hover === null || hover === i ? 1 : 0.5,
                }}
              />
            </div>

            {hover === i && !d.skipped && (
              <div className="pointer-events-none absolute -top-1 right-0 z-10 -translate-y-full rounded-md border border-hairline bg-surface px-2.5 py-1.5 shadow-overlay animate-in fade-in">
                <p className="text-xs">
                  <span className="font-semibold tabular-nums text-ink">{d.dwellSec}s</span>
                  <span className="ml-1.5 text-ink-muted">dwell</span>
                </p>
                <p className="text-label tabular-nums text-ink-muted">
                  {d.boarded} boarded · {d.alighted} alighted
                </p>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/* -------------------------------------------------------------------------- */
/* Demand vs supply by hour                                                    */
/* -------------------------------------------------------------------------- */

const VB_W = 640
const VB_H = 200
const M = { top: 12, right: 12, bottom: 24, left: 42 }

export function DemandCurve({ data }: { data: HourDemand[] }) {
  const [hover, setHover] = useState<number | null>(null)

  const plotW = VB_W - M.left - M.right
  const plotH = VB_H - M.top - M.bottom
  const max = Math.ceil(Math.max(...data.flatMap((d) => [d.demand, d.supply])) / 250) * 250

  const xAt = (i: number) => M.left + (i / (data.length - 1)) * plotW
  const yAt = (v: number) => M.top + (1 - v / max) * plotH
  const barW = plotW / data.length - 3

  const ticks = [0, max / 2, max]

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <svg width="10" height="10" aria-hidden="true">
            <rect width="10" height="10" rx="2" fill="var(--series-1)" />
          </svg>
          Passenger demand
        </span>
        <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <svg width="14" height="2" aria-hidden="true">
            <rect width="14" height="2" rx="1" fill="var(--series-2)" />
          </svg>
          Seats offered
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full"
        role="img"
        aria-label="Passenger demand against seats offered, by hour"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={M.left + plotW} y1={yAt(t)} y2={yAt(t)} stroke="var(--grid)" strokeWidth="1" />
            <text
              x={M.left - 7}
              y={yAt(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="9"
              fill="var(--ink-muted)"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatNumber(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => (
          <rect
            key={d.hour}
            x={xAt(i) - barW / 2}
            y={yAt(d.demand)}
            width={barW}
            height={M.top + plotH - yAt(d.demand)}
            rx="2"
            fill="var(--series-1)"
            opacity={hover === null || hover === i ? 1 : 0.45}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
          />
        ))}

        <polyline
          points={data.map((d, i) => `${xAt(i)} ${yAt(d.supply)}`).join(' ')}
          fill="none"
          stroke="var(--series-2)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((d, i) =>
          i % 3 === 0 ? (
            <text
              key={d.hour}
              x={xAt(i)}
              y={M.top + plotH + 14}
              textAnchor="middle"
              fontSize="9"
              fill="var(--ink-muted)"
            >
              {d.hour}
            </text>
          ) : null,
        )}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-8 z-10 rounded-md border border-hairline bg-surface p-2.5 shadow-overlay animate-in fade-in"
          style={{
            left: `${(xAt(hover) / VB_W) * 100}%`,
            transform: hover > data.length / 2 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)',
          }}
        >
          <p className="label-eyebrow mb-1">{data[hover].hour}</p>
          <p className="text-xs">
            <span className="font-semibold tabular-nums text-ink">
              {formatNumber(data[hover].demand)}
            </span>
            <span className="ml-1.5 text-ink-muted">demand</span>
          </p>
          <p className="text-xs">
            <span className="font-semibold tabular-nums text-ink">
              {formatNumber(data[hover].supply)}
            </span>
            <span className="ml-1.5 text-ink-muted">seats</span>
          </p>
          <p className="mt-1 border-t border-hairline pt-1 text-label text-ink-secondary">
            {data[hover].demand > data[hover].supply ? 'Short of capacity' : 'Capacity spare'}
          </p>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Origin–destination matrix                                                   */
/* -------------------------------------------------------------------------- */

/** Continuous magnitude → one sequential hue, light to dark. */
export function ODMatrix({
  stops,
  matrix,
}: {
  stops: string[]
  matrix: { from: string; to: string; trips: number }[]
}) {
  const [hover, setHover] = useState<{ from: string; to: string; trips: number } | null>(null)
  const max = Math.max(...matrix.map((m) => m.trips), 1)

  const short = (s: string) => s.split(' ')[0].slice(0, 8)
  const cell = (from: string, to: string) =>
    matrix.find((m) => m.from === from && m.to === to)?.trips ?? 0

  return (
    <div className="relative overflow-x-auto">
      <table className="border-separate border-spacing-0.5 text-label">
        <thead>
          <tr>
            <th className="sticky left-0 bg-surface pr-2 text-left font-medium text-ink-muted">
              From ↓ / To →
            </th>
            {stops.map((s) => (
              <th key={s} className="px-1 pb-1 text-center font-medium text-ink-muted">
                {short(s)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stops.map((from) => (
            <tr key={from}>
              <th className="sticky left-0 whitespace-nowrap bg-surface pr-2 text-left font-medium text-ink-secondary">
                {short(from)}
              </th>
              {stops.map((to) => {
                const v = cell(from, to)
                const intensity = v / max
                const step = Math.min(
                  BLUE_RAMP.length - 1,
                  Math.floor((1 - intensity) * BLUE_RAMP.length),
                )
                return (
                  <td key={to} className="p-0">
                    <div
                      className="flex h-8 w-14 cursor-default items-center justify-center rounded-sm tabular-nums transition-transform duration-200 ease-out"
                      style={{
                        backgroundColor: v === 0 ? 'var(--surface-sunken)' : BLUE_RAMP[step],
                        // Dark cells need light text; the ramp crosses over near step 3.
                        color: v === 0 ? 'var(--ink-muted)' : step <= 3 ? '#fff' : 'var(--ink)',
                      }}
                      onPointerEnter={() => setHover({ from, to, trips: v })}
                      onPointerLeave={() => setHover(null)}
                    >
                      {v === 0 ? '—' : v}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {hover && hover.trips > 0 && (
        <p className="mt-2 text-label text-ink-secondary">
          <span className="font-semibold tabular-nums text-ink">{hover.trips}</span> journeys ·{' '}
          {hover.from} → {hover.to}
        </p>
      )}
      {!hover && (
        <p className="mt-2 text-label text-ink-muted">
          Hover a cell for the flow. Darker means more journeys.
        </p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Small horizontal magnitude bars                                             */
/* -------------------------------------------------------------------------- */

export function OpsBars({
  data,
  unit,
}: {
  data: { label: string; value: number; note?: string }[]
  unit?: string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <ul className="space-y-2.5">
      {data.map((d, i) => (
        <li key={d.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-xs text-ink-secondary">{d.label}</span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">
              {formatNumber(d.value, Number.isInteger(d.value) ? 0 : 1)}
              {unit && <span className="ml-0.5 font-normal text-ink-muted">{unit}</span>}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-surface-sunken">
            <div
              className="h-full rounded-sm"
              style={{
                width: `${(d.value / max) * 100}%`,
                backgroundColor: BLUE_RAMP[Math.min(i, BLUE_RAMP.length - 1)],
              }}
            />
          </div>
          {d.note && <p className="mt-0.5 text-label text-ink-muted">{d.note}</p>}
        </li>
      ))}
    </ul>
  )
}
