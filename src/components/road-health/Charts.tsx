'use client'

/**
 * Charts for the Road Health section.
 *
 * Colour follows the job it does: magnitude uses one sequential blue ramp,
 * severity uses the reserved status roles (never a series colour), and the
 * two-series trend uses categorical slots 1 and 2 on a single y-axis — two
 * counts of the same thing, so a second scale would be the dual-axis mistake.
 */

import { useMemo, useRef, useState } from 'react'

import { formatNumber, SEVERITY_COLOR, type Severity, type TrendPoint } from '@/lib/road-health-data'

/* Sequential blue, dark→light. Stops at step 250, the lightest that still
   clears 2:1 on white for an ordinal ramp. */
const BLUE_RAMP = ['#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7', '#86b6ef', '#9ec5f4', '#b7d3f6']

/* -------------------------------------------------------------------------- */
/* Horizontal magnitude bars                                                   */
/* -------------------------------------------------------------------------- */

export function MagnitudeBars({
  data,
  unit,
  showShare = true,
  order = 'desc',
}: {
  data: { label: string; value: number }[]
  unit?: string
  showShare?: boolean
  /** 'asc' puts the smallest first — for rankings where low is worst. */
  order?: 'asc' | 'desc'
}) {
  const [hover, setHover] = useState<number | null>(null)

  const sorted = [...data].sort((a, b) => (order === 'asc' ? a.value - b.value : b.value - a.value))
  const max = Math.max(...sorted.map((d) => d.value), 1)
  const total = sorted.reduce((s, d) => s + d.value, 0)

  return (
    <ul className="space-y-2.5">
      {sorted.map((d, i) => {
        const isHover = hover === i
        return (
          <li
            key={d.label}
            className="relative cursor-default"
            tabIndex={0}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
          >
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="truncate text-xs text-ink-secondary">{d.label}</span>
              {/* Direct label — value readable without hovering */}
              <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">
                {formatNumber(d.value)}
                {unit && <span className="ml-0.5 font-normal text-ink-muted">{unit}</span>}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-sm bg-surface-sunken">
              <div
                className="h-full rounded-sm transition-opacity duration-200 ease-out"
                style={{
                  width: `${(d.value / max) * 100}%`,
                  backgroundColor: BLUE_RAMP[Math.min(i, BLUE_RAMP.length - 1)],
                  opacity: hover === null || isHover ? 1 : 0.5,
                }}
              />
            </div>
            {isHover && showShare && (
              <div className="pointer-events-none absolute -top-1 right-0 z-10 -translate-y-full rounded-md border border-hairline bg-surface px-2.5 py-1.5 shadow-overlay animate-in fade-in">
                <p className="text-xs">
                  <span className="font-semibold tabular-nums text-ink">{formatNumber(d.value)}</span>
                  <span className="ml-1.5 text-ink-muted">{d.label}</span>
                </p>
                <p className="text-label tabular-nums text-ink-muted">
                  {((d.value / total) * 100).toFixed(1)}% of total
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
/* Severity split — a single stacked bar using the reserved status roles        */
/* -------------------------------------------------------------------------- */

export function SeveritySplit({ data }: { data: { label: Severity; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1

  return (
    <div className="space-y-3">
      {/* 2px surface gaps between segments keep adjacent fills distinct */}
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-sm">
        {data.map((d) => (
          <div
            key={d.label}
            className="h-full first:rounded-l-sm last:rounded-r-sm"
            style={{ width: `${(d.value / total) * 100}%`, backgroundColor: SEVERITY_COLOR[d.label] }}
            title={`${d.label}: ${formatNumber(d.value)}`}
          />
        ))}
      </div>

      <ul className="space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: SEVERITY_COLOR[d.label] }}
              aria-hidden="true"
            />
            <span className="text-ink-secondary">{d.label}</span>
            <span className="ml-auto font-semibold tabular-nums text-ink">
              {formatNumber(d.value)}
            </span>
            <span className="w-12 text-right tabular-nums text-ink-muted">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Trend — new vs resolved defects, one axis, crosshair tooltip                 */
/* -------------------------------------------------------------------------- */

const TREND_SERIES = [
  { key: 'newDefects', label: 'New defects', color: 'var(--series-2)' },
  { key: 'resolved', label: 'Resolved', color: 'var(--series-1)' },
] as const

const VB_W = 680
const VB_H = 220
const M = { top: 14, right: 14, bottom: 26, left: 40 }

function niceAxis(dataMax: number): { max: number; ticks: number[] } {
  const padded = dataMax * 1.08
  const mag = Math.pow(10, Math.floor(Math.log10(padded)))
  const norm = padded / mag
  const max = ([1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10].find((s) => norm <= s) ?? 10) * mag
  const isRound = (n: number) => {
    const m = Math.pow(10, Math.floor(Math.log10(n)))
    return [1, 2, 2.5, 5, 10].some((s) => Math.abs(n / m - s) < 1e-9)
  }
  const divisions = [4, 5, 3, 2].find((d) => isRound(max / d)) ?? 4
  return { max, ticks: Array.from({ length: divisions + 1 }, (_, i) => (max / divisions) * i) }
}

export function DefectTrend({ data }: { data: TrendPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const plotW = VB_W - M.left - M.right
  const plotH = VB_H - M.top - M.bottom

  const { max: yMax, ticks } = useMemo(
    () => niceAxis(Math.max(...data.flatMap((d) => [d.newDefects, d.resolved]))),
    [data],
  )

  const xAt = (i: number) => M.left + (i / (data.length - 1)) * plotW
  const yAt = (v: number) => M.top + (1 - v / yMax) * plotH

  const paths = useMemo(() => {
    const build = (key: 'newDefects' | 'resolved') => {
      const line = data
        .map((d, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(2)} ${yAt(d[key]).toFixed(2)}`)
        .join(' ')
      return {
        line,
        area: `${line} L${(M.left + plotW).toFixed(2)} ${M.top + plotH} L${M.left} ${M.top + plotH} Z`,
      }
    }
    return { newDefects: build('newDefects'), resolved: build('resolved') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, yMax])

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * VB_W
    const i = Math.round(((x - M.left) / plotW) * (data.length - 1))
    setHoverIndex(Math.min(data.length - 1, Math.max(0, i)))
  }

  const active = hoverIndex === null ? null : data[hoverIndex]

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {TREND_SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <svg width="14" height="2" aria-hidden="true">
              <rect width="14" height="2" rx="1" fill={s.color} />
            </svg>
            {s.label}
          </span>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full touch-none"
        role="img"
        aria-label="New and resolved defects per week over the last 12 weeks"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="rh-fill-new" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-2)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--series-2)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={M.left}
              x2={M.left + plotW}
              y1={yAt(t)}
              y2={yAt(t)}
              stroke="var(--grid)"
              strokeWidth="1"
            />
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

        {data.map((d, i) =>
          i % 2 === 0 || i === data.length - 1 ? (
            <text
              key={d.week}
              x={xAt(i)}
              y={M.top + plotH + 15}
              textAnchor="middle"
              fontSize="9"
              fill="var(--ink-muted)"
            >
              {d.week}
            </text>
          ) : null,
        )}

        <line
          x1={M.left}
          x2={M.left + plotW}
          y1={M.top + plotH}
          y2={M.top + plotH}
          stroke="var(--axis)"
          strokeWidth="1"
        />

        <path d={paths.newDefects.area} fill="url(#rh-fill-new)" />
        <path
          d={paths.resolved.line}
          fill="none"
          stroke="var(--series-1)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={paths.newDefects.line}
          fill="none"
          stroke="var(--series-2)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {hoverIndex !== null && active && (
          <g pointerEvents="none">
            <line
              x1={xAt(hoverIndex)}
              x2={xAt(hoverIndex)}
              y1={M.top}
              y2={M.top + plotH}
              stroke="var(--axis)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            {TREND_SERIES.map((s) => (
              <circle
                key={s.key}
                cx={xAt(hoverIndex)}
                cy={yAt(active[s.key])}
                r="3.5"
                fill={s.color}
                stroke="var(--surface)"
                strokeWidth="2"
              />
            ))}
          </g>
        )}
      </svg>

      {hoverIndex !== null && active && (
        <div
          className="pointer-events-none absolute top-6 z-10 min-w-[9rem] rounded-md border border-hairline bg-surface p-2.5 shadow-overlay animate-in fade-in"
          style={{
            left: `${(xAt(hoverIndex) / VB_W) * 100}%`,
            transform:
              hoverIndex > data.length / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
          }}
        >
          <p className="label-eyebrow mb-1.5">Week {hoverIndex + 1}</p>
          <ul className="space-y-1">
            {TREND_SERIES.map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-xs">
                <svg width="10" height="2" className="shrink-0" aria-hidden="true">
                  <rect width="10" height="2" rx="1" fill={s.color} />
                </svg>
                <span className="font-semibold tabular-nums text-ink">
                  {formatNumber(active[s.key])}
                </span>
                <span className="ml-auto text-ink-muted">{s.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 border-t border-hairline pt-1.5 text-label tabular-nums text-ink-muted">
            Avg score {formatNumber(active.avgScore, 1)}
          </p>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Score history sparkline                                                     */
/* -------------------------------------------------------------------------- */

export function ScoreSparkline({ points, width = 120, height = 30 }: { points: number[]; width?: number; height?: number }) {
  const PAD = 2
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1

  const coords = points.map((p, i) => {
    const x = PAD + (i / (points.length - 1)) * (width - PAD * 2)
    const y = PAD + (1 - (p - min) / span) * (height - PAD * 2)
    return [x, y] as const
  })

  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  // Falling score is bad, so the trend colour follows meaning, not direction.
  const improving = points[points.length - 1] >= points[0]
  const stroke = improving ? 'var(--status-good-text)' : 'var(--status-critical)'
  const [lx, ly] = coords[coords.length - 1]

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="presentation" aria-hidden="true">
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.25" fill={stroke} stroke="var(--surface)" strokeWidth="1.5" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Radial gauge — a single bounded percentage                                  */
/* -------------------------------------------------------------------------- */

export function Gauge({
  value,
  max = 100,
  label,
  color = 'var(--series-1)',
  size = 96,
}: {
  value: number
  max?: number
  label: string
  color?: string
  size?: number
}) {
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value / max))

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${label}: ${value} of ${max}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            className="transition-[stroke-dashoffset] duration-200 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-base font-semibold tabular-nums text-ink">
          {formatNumber(value, value % 1 === 0 ? 0 : 1)}
        </span>
      </div>
      <span className="text-center text-label text-ink-muted">{label}</span>
    </div>
  )
}
