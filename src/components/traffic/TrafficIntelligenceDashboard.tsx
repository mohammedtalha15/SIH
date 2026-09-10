'use client'

/**
 * TrafficIntelligenceDashboard — Traffic Intelligence section for one BMTC unit.
 *
 * Pipeline this communicates:
 *   Bus Camera + GPS/VTU + CAN/OBD
 *   → Edge AI (Hailo HAT) — YOLO object detection
 *   → ByteTrack multi-object tracking
 *   → Vehicle classification (cars, two-wheelers, buses, trucks, autos)
 *   → Traffic metrics (density, speed, queue, flow, occupancy)
 *   → Sensor fusion (GPS travel time + camera detections + IMU vibration)
 *   → Historical City Memory comparison
 *   → Predictive congestion modelling
 *   → GIS Traffic Intelligence
 *
 * Order: congestion score first (the headline), then live metrics, then
 * analytical sections, then history, then prediction.
 */

import { useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bus,
  Car,
  ChevronRight,
  Clock,
  Cpu,
  Gauge as GaugeIcon,
  History,
  MapPin,
  Navigation,
  Route,
  ShieldAlert,
  Timer,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Zap,
} from 'lucide-react'

import {
  congestionLevelFor,
  getTrafficData,
  LEVEL_BG,
  LEVEL_COLOR,
  LEVEL_TEXT_COLOR,
  produceLiveTrafficEvent,
  type CongestionBreakdown,
  type LiveTrafficEvent,
  type TrafficData,
  type TrafficFlowPoint,
  type TrafficHotspot,
  type TrafficLevel,
  type TrafficTrendPoint,
} from '@/lib/traffic-data'
import { BUSES } from '@/lib/fleet-data'
import { formatNumber } from '@/lib/road-health-data'
import { Gauge } from '@/components/road-health/Charts'
import { StatTile } from '@/components/road-health/StatTile'
import { useClimb, useDrift, useEventFeed, useTick } from '@/lib/use-live'

/* -------------------------------------------------------------------------- */
/* Layout primitives — identical to Road Health + Safety Intelligence          */
/* -------------------------------------------------------------------------- */

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}

function Card({
  title,
  subtitle,
  children,
  className,
  bleed = false,
  action,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  bleed?: boolean
  action?: React.ReactNode
}) {
  return (
    <section className={`card ${className ?? ''}`}>
      <header className="card-header">
        <div className="min-w-0 flex-1">
          <h3 className="card-title">{title}</h3>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {bleed ? children : <div className="card-body">{children}</div>}
    </section>
  )
}

function LiveStatus() {
  const seconds = useTick(1000)
  return (
    <span className="flex items-center gap-1.5 text-label font-medium text-ink-secondary">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-good opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-good" />
      </span>
      Receiving telemetry
      <span className="text-ink-muted">
        · updated <span className="tabular-nums">{seconds % 4}</span>s ago
      </span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Traffic level badge                                                          */
/* -------------------------------------------------------------------------- */

function LevelBadge({ level }: { level: TrafficLevel }) {
  const COLOR_CLASS: Record<TrafficLevel, string> = {
    Low:      'border-[var(--status-good)] text-[var(--status-good-text)] bg-[#f0faf0]',
    Moderate: 'border-[var(--status-warning)] text-[#8a5e00] bg-[#fef9ec]',
    High:     'border-[var(--status-serious)] text-[#7c3214] bg-[#fff2ed]',
    Severe:   'border-[var(--status-critical)] text-[#7a1b1b] bg-[#fef2f2]',
  }
  return (
    <span className={`badge shrink-0 font-semibold ${COLOR_CLASS[level]}`}>
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: LEVEL_COLOR[level] }}
        aria-hidden="true"
      />
      {level}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Traffic Flow Chart — bespoke SVG, 3-series stacked area                    */
/* -------------------------------------------------------------------------- */

const VB_W = 680
const VB_H = 200
const M = { top: 12, right: 14, bottom: 26, left: 38 }

function TrafficFlowChart({ data }: { data: TrafficFlowPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const plotW = VB_W - M.left - M.right
  const plotH = VB_H - M.top - M.bottom
  const yMax = Math.ceil(Math.max(...data.map((d) => d.vehiclesPerMin), 1) * 1.15 / 5) * 5

  const xAt = (i: number) => M.left + (i / (data.length - 1)) * plotW
  const yAt = (v: number) => M.top + (1 - v / yMax) * plotH

  const makePath = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(' ')

  const totalLine = makePath(data.map((d) => d.vehiclesPerMin))
  const inboundLine = makePath(data.map((d) => d.inbound))
  const outboundLine = makePath(data.map((d) => d.outbound))

  const ticks = [0, Math.round(yMax / 2), yMax]

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * VB_W
    const i = Math.round(((x - M.left) / plotW) * (data.length - 1))
    setHoverIdx(Math.min(data.length - 1, Math.max(0, i)))
  }

  const active = hoverIdx !== null ? data[hoverIdx] : null

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {[
          { label: 'Total vehicles/min', color: 'var(--series-1)' },
          { label: 'Inbound', color: 'var(--series-3)' },
          { label: 'Outbound', color: 'var(--series-2)' },
        ].map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <svg width="14" height="2" aria-hidden="true">
              <rect width="14" height="2" rx="1" fill={s.color} />
            </svg>
            {s.label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full touch-none"
        role="img"
        aria-label="Live traffic flow — vehicles per minute over last 12 readings"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="tf-fill-total" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-1)" stopOpacity="0.13" />
            <stop offset="100%" stopColor="var(--series-1)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={M.left + plotW} y1={yAt(t)} y2={yAt(t)} stroke="var(--grid)" strokeWidth="1" />
            <text x={M.left - 6} y={yAt(t)} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="var(--ink-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {t}
            </text>
          </g>
        ))}

        {data.map((d, i) => (
          <text key={d.label} x={xAt(i)} y={M.top + plotH + 16} textAnchor="middle" fontSize="9" fill="var(--ink-muted)">
            {d.label}
          </text>
        ))}

        <line x1={M.left} x2={M.left + plotW} y1={M.top + plotH} y2={M.top + plotH} stroke="var(--axis)" strokeWidth="1" />

        {/* Gradient fill under total */}
        <path d={`${totalLine} L${(M.left + plotW).toFixed(1)} ${M.top + plotH} L${M.left} ${M.top + plotH} Z`} fill="url(#tf-fill-total)" />

        {/* Three lines */}
        <path d={outboundLine} fill="none" stroke="var(--series-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3" />
        <path d={inboundLine} fill="none" stroke="var(--series-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={totalLine} fill="none" stroke="var(--series-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {hoverIdx !== null && active && (
          <g pointerEvents="none">
            <line x1={xAt(hoverIdx)} x2={xAt(hoverIdx)} y1={M.top} y2={M.top + plotH} stroke="var(--axis)" strokeWidth="1" strokeDasharray="3 3" />
            {[
              { v: active.vehiclesPerMin, color: 'var(--series-1)' },
              { v: active.inbound, color: 'var(--series-3)' },
              { v: active.outbound, color: 'var(--series-2)' },
            ].map((s, si) => (
              <circle key={si} cx={xAt(hoverIdx)} cy={yAt(s.v)} r="3.5" fill={s.color} stroke="var(--surface)" strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>

      {hoverIdx !== null && active && (
        <div
          className="pointer-events-none absolute top-6 z-10 min-w-[9rem] rounded-md border border-hairline bg-surface p-2.5 shadow-overlay animate-in fade-in"
          style={{
            left: `${(xAt(hoverIdx) / VB_W) * 100}%`,
            transform: hoverIdx > data.length / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
          }}
        >
          <p className="label-eyebrow mb-1.5">{active.label}</p>
          <ul className="space-y-1">
            {[
              { label: 'Total', value: active.vehiclesPerMin, color: 'var(--series-1)' },
              { label: 'Inbound', value: active.inbound, color: 'var(--series-3)' },
              { label: 'Outbound', value: active.outbound, color: 'var(--series-2)' },
            ].map((r) => (
              <li key={r.label} className="flex items-center gap-2 text-xs">
                <svg width="10" height="2" className="shrink-0" aria-hidden="true"><rect width="10" height="2" rx="1" fill={r.color} /></svg>
                <span className="font-semibold tabular-nums text-ink">{formatNumber(r.value)}</span>
                <span className="ml-auto text-ink-muted">{r.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Traffic Trend Chart — 3-series, 12 weeks                                   */
/* -------------------------------------------------------------------------- */

const TT_SERIES = [
  { key: 'congestionScore' as const, label: 'Congestion score', color: 'var(--series-2)' },
  { key: 'densityPerKm' as const, label: 'Density (veh/km)', color: 'var(--series-1)' },
  { key: 'avgSpeedKmh' as const, label: 'Avg speed (km/h)', color: 'var(--series-3)' },
]

function TrafficTrendChart({ data }: { data: TrafficTrendPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const plotW = VB_W - M.left - M.right
  const plotH = VB_H - M.top - M.bottom

  const yMax = Math.ceil(
    Math.max(...data.flatMap((d) => [d.congestionScore, d.densityPerKm, d.avgSpeedKmh])) * 1.1 / 10,
  ) * 10

  const xAt = (i: number) => M.left + (i / (data.length - 1)) * plotW
  const yAt = (v: number) => M.top + (1 - v / yMax) * plotH

  const makePath = (key: typeof TT_SERIES[number]['key']) =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)} ${yAt(d[key]).toFixed(1)}`).join(' ')

  const ticks = [0, Math.round(yMax / 2), yMax]
  const active = hoverIdx !== null ? data[hoverIdx] : null

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {TT_SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <svg width="14" height="2" aria-hidden="true"><rect width="14" height="2" rx="1" fill={s.color} /></svg>
            {s.label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full touch-none"
        role="img"
        aria-label="Traffic trend over 12 weeks"
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * VB_W
          const i = Math.round(((x - M.left) / plotW) * (data.length - 1))
          setHoverIdx(Math.min(data.length - 1, Math.max(0, i)))
        }}
        onPointerLeave={() => setHoverIdx(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={M.left + plotW} y1={yAt(t)} y2={yAt(t)} stroke="var(--grid)" strokeWidth="1" />
            <text x={M.left - 6} y={yAt(t)} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="var(--ink-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % 2 === 0 || i === data.length - 1 ? (
            <text key={d.week} x={xAt(i)} y={M.top + plotH + 16} textAnchor="middle" fontSize="9" fill="var(--ink-muted)">
              {d.week}
            </text>
          ) : null,
        )}
        <line x1={M.left} x2={M.left + plotW} y1={M.top + plotH} y2={M.top + plotH} stroke="var(--axis)" strokeWidth="1" />

        {TT_SERIES.map((s) => (
          <path key={s.key} d={makePath(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {hoverIdx !== null && active && (
          <g pointerEvents="none">
            <line x1={xAt(hoverIdx)} x2={xAt(hoverIdx)} y1={M.top} y2={M.top + plotH} stroke="var(--axis)" strokeWidth="1" strokeDasharray="3 3" />
            {TT_SERIES.map((s) => (
              <circle key={s.key} cx={xAt(hoverIdx)} cy={yAt(active[s.key])} r="3.5" fill={s.color} stroke="var(--surface)" strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>

      {hoverIdx !== null && active && (
        <div
          className="pointer-events-none absolute top-6 z-10 min-w-[10rem] rounded-md border border-hairline bg-surface p-2.5 shadow-overlay animate-in fade-in"
          style={{
            left: `${(xAt(hoverIdx) / VB_W) * 100}%`,
            transform: hoverIdx > data.length / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
          }}
        >
          <p className="label-eyebrow mb-1.5">{active.week}</p>
          <ul className="space-y-1">
            {TT_SERIES.map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-xs">
                <svg width="10" height="2" className="shrink-0" aria-hidden="true"><rect width="10" height="2" rx="1" fill={s.color} /></svg>
                <span className="font-semibold tabular-nums text-ink">{formatNumber(active[s.key], 1)}</span>
                <span className="ml-auto text-ink-muted">{s.label.split(' ')[0]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Congestion Score Formula — transparent waterfall                            */
/* -------------------------------------------------------------------------- */

function CongestionFormula({ breakdown }: { breakdown: CongestionBreakdown }) {
  const TERMS = [
    { label: 'Traffic density penalty', value: breakdown.densityPenalty, source: 'vehicles/km on the observed corridor' },
    { label: 'Speed reduction penalty', value: breakdown.speedPenalty, source: 'how far current speed is below historical baseline' },
    { label: 'Queue length penalty', value: breakdown.queuePenalty, source: 'current queue length relative to 1-km reference' },
    { label: 'Historical baseline deviation', value: breakdown.baselinePenalty, source: 'how much today deviates from the 12-week norm' },
  ]
  const maxTerm = Math.max(...TERMS.map((t) => t.value), 1)
  const totalDeducted = TERMS.reduce((s, t) => s + t.value, 0)
  const level = congestionLevelFor(breakdown.score)

  return (
    <div className="space-y-4">
      {/* Score + bar */}
      <div className="flex items-end gap-3">
        <span className="text-[2.75rem] font-semibold leading-none tabular-nums tracking-tight text-ink">
          {formatNumber(breakdown.score, 1)}
        </span>
        <span className="pb-1 text-sm text-ink-muted">/ 100</span>
        <LevelBadge level={level} />
        <span className="ml-auto pb-1 text-xs tabular-nums text-ink-muted">
          −{formatNumber(totalDeducted, 1)} deducted
        </span>
      </div>

      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-sm bg-surface-sunken">
        <div
          className="h-full rounded-sm transition-[width] duration-500 ease-out"
          style={{ width: `${breakdown.score}%`, backgroundColor: LEVEL_COLOR[level] }}
        />
      </div>

      <p className="rounded-md border border-hairline bg-surface-muted px-3 py-2 text-label leading-relaxed text-ink-secondary">
        Congestion Score = 100 − density penalty − speed penalty − queue penalty − historical deviation
      </p>

      <ol className="space-y-2.5">
        <li className="flex items-baseline justify-between gap-3 border-b border-hairline pb-2">
          <span className="text-xs font-medium text-ink">Base</span>
          <span className="text-xs font-semibold tabular-nums text-ink">100.0</span>
        </li>
        {TERMS.map((term) => (
          <li key={term.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-xs text-ink-secondary">{term.label}</span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--status-serious)]">
                −{formatNumber(term.value, 1)}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-surface-sunken">
              <div
                className="h-full rounded-sm bg-[var(--status-serious)] opacity-70"
                style={{ width: `${(term.value / maxTerm) * 100}%` }}
              />
            </div>
            <p className="mt-0.5 text-label text-ink-muted">{term.source}</p>
          </li>
        ))}
        <li className="flex items-baseline justify-between gap-3 border-t border-hairline pt-2.5">
          <span className="text-xs font-medium text-ink">Final score</span>
          <span className="text-sm font-semibold tabular-nums text-ink">{formatNumber(breakdown.score, 1)}</span>
        </li>
      </ol>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Vehicle class horizontal bars                                               */
/* -------------------------------------------------------------------------- */

type VehicleRow = { label: string; value: number; icon: React.ReactNode; color: string }

function VehicleClassBars({ rows }: { rows: VehicleRow[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const maxVal = Math.max(...rows.map((r) => r.value), 1)
  const total = rows.reduce((s, r) => s + r.value, 0)

  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => (
        <li
          key={r.label}
          className="cursor-default"
          onPointerEnter={() => setHover(i)}
          onPointerLeave={() => setHover(null)}
        >
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
              <span className="shrink-0 text-ink-muted">{r.icon}</span>
              {r.label}
            </span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">
              {formatNumber(r.value)}
              <span className="ml-1.5 font-normal text-ink-muted">
                ({((r.value / total) * 100).toFixed(0)}%)
              </span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-sm bg-surface-sunken">
            <div
              className="h-full rounded-sm transition-opacity duration-200 ease-out"
              style={{
                width: `${(r.value / maxVal) * 100}%`,
                backgroundColor: r.color,
                opacity: hover === null || hover === i ? 1 : 0.4,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/* -------------------------------------------------------------------------- */
/* Predictive level indicator                                                  */
/* -------------------------------------------------------------------------- */

function PredictiveLevel({ label, level, highlight = false }: { label: string; level: TrafficLevel; highlight?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center ${highlight ? 'border-[var(--hairline-strong)] bg-surface-muted' : 'border-hairline bg-surface'}`}>
      <span className="label-eyebrow">{label}</span>
      <span
        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-semibold"
        style={{ backgroundColor: LEVEL_BG[level], color: LEVEL_TEXT_COLOR[level] }}
      >
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LEVEL_COLOR[level] }} aria-hidden="true" />
        {level}
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Contributing factor row                                                     */
/* -------------------------------------------------------------------------- */

type FactorValue = 'Normal' | 'Elevated' | 'High' | 'Very High' | 'None' | 'Slight' | 'Moderate' | 'Severe' | 'Short' | 'Long' | 'Below Normal' | 'Above Normal' | 'Significantly Above' | boolean

function factorColor(val: FactorValue): string {
  if (val === true) return 'var(--status-critical)'
  if (val === false) return 'var(--status-good)'
  const HIGH = ['High', 'Very High', 'Severe', 'Long', 'Above Normal', 'Significantly Above']
  const MED = ['Elevated', 'Slight', 'Moderate', 'Short']
  const LOW = ['Normal', 'None', 'Below Normal']
  if (HIGH.includes(val as string)) return 'var(--status-serious)'
  if (MED.includes(val as string)) return 'var(--status-warning)'
  if (LOW.includes(val as string)) return 'var(--status-good)'
  return 'var(--ink-muted)'
}

function factorLabel(val: FactorValue): string {
  if (val === true) return 'DETECTED'
  if (val === false) return 'NONE'
  return String(val).toUpperCase()
}

function FactorRow({ label, value }: { label: string; value: FactorValue }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-ink-secondary">{label}</span>
      <span className="font-semibold tabular-nums" style={{ color: factorColor(value) }}>
        {factorLabel(value)}
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Hotspot row                                                                  */
/* -------------------------------------------------------------------------- */

function HotspotRow({
  spot,
  selected,
  onClick,
}: {
  spot: TrafficHotspot
  selected: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        className={`w-full rounded-lg border p-3 text-left transition-colors duration-200 ease-out ${
          selected
            ? 'border-[var(--hairline-strong)] bg-surface-muted'
            : 'border-transparent hover:border-hairline hover:bg-surface-muted'
        }`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-ink">{spot.location}</p>
            <p className="mt-0.5 text-label text-ink-muted">{spot.primaryCause}</p>
          </div>
          <LevelBadge level={spot.level} />
        </div>
        {selected && (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-hairline pt-3 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-ink-muted">Density</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatNumber(spot.densityPerKm)} veh/km</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Avg speed</dt>
              <dd className="font-semibold tabular-nums text-ink">{spot.avgSpeedKmh} km/h</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Queue</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatNumber(spot.queueM)} m</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Observed by</dt>
              <dd className="font-semibold tabular-nums text-ink">
                {spot.observingBuses} bus{spot.observingBuses !== 1 ? 'es' : ''} · {Math.round(spot.confidence * 100)}%
              </dd>
            </div>
          </dl>
        )}
      </button>
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/* Live event type styling                                                     */
/* -------------------------------------------------------------------------- */

const EVENT_ICON: Record<LiveTrafficEvent['type'], React.ReactNode> = {
  congestion: <AlertTriangle className="h-3.5 w-3.5" />,
  queue:      <BarChart3 className="h-3.5 w-3.5" />,
  slowdown:   <TrendingDown className="h-3.5 w-3.5" />,
  density:    <Users className="h-3.5 w-3.5" />,
  delay:      <Clock className="h-3.5 w-3.5" />,
  clearing:   <TrendingUp className="h-3.5 w-3.5" />,
}

const EVENT_COLOR: Record<LiveTrafficEvent['type'], string> = {
  congestion: 'text-[var(--status-serious)]',
  queue:      'text-[var(--status-warning)]',
  slowdown:   'text-[var(--status-warning)]',
  density:    'text-[var(--series-1)]',
  delay:      'text-[var(--status-critical)]',
  clearing:   'text-[var(--status-good-text)]',
}

/* -------------------------------------------------------------------------- */
/* Main dashboard                                                              */
/* -------------------------------------------------------------------------- */

export function TrafficIntelligenceDashboard({ busId }: { busId: string }) {
  const data: TrafficData = useMemo(() => getTrafficData(busId), [busId])
  const [selectedHotspotId, setSelectedHotspotId] = useState(data.hotspots[0]?.id ?? '')

  // Bus info for the header
  const bus = BUSES.find((b) => b.id === busId)

  // Live metrics — start from seeded value, only drift after mount
  const liveSpeed   = useDrift(data.avgSpeedKmh, data.avgSpeedKmh * 0.08, 3500)
  const liveDensity = useDrift(data.densityPerKm, data.densityPerKm * 0.07, 4000)
  const liveQueue   = useDrift(data.queueLengthM, 25, 5000)

  // Live event feed
  const { items: events, latestKey } = useEventFeed(
    [],
    produceLiveTrafficEvent,
    5800,
    8,
  )

  const vehicleRows: VehicleRow[] = [
    { label: 'Cars',         value: data.vehicleClasses.cars,        icon: <Car className="h-3 w-3" />,       color: 'var(--series-1)' },
    { label: 'Two-wheelers', value: data.vehicleClasses.twoWheelers, icon: <Navigation className="h-3 w-3" />, color: 'var(--series-3)' },
    { label: 'Buses',        value: data.vehicleClasses.buses,       icon: <Bus className="h-3 w-3" />,       color: 'var(--series-2)' },
    { label: 'Trucks',       value: data.vehicleClasses.trucks,      icon: <Truck className="h-3 w-3" />,     color: '#8b5cf6' },
    { label: 'Auto-rickshaws', value: data.vehicleClasses.autos,     icon: <Zap className="h-3 w-3" />,      color: '#f59e0b' },
  ]

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6 px-4 py-5 sm:px-6 sm:py-6">

      {/* ── Page heading ──────────────────────────────────────────────────── */}
      <header>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-ink">Traffic Intelligence</h1>
          <LiveStatus />
        </div>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Real-time traffic flow, congestion and mobility intelligence derived from the camera, GPS
          and vehicle telemetry of this BMTC unit and the wider fleet.
        </p>
        {bus && (
          <div className="mt-3 flex flex-wrap gap-3">
            <span className="badge">
              <Bus className="h-3 w-3" /> {bus.fleetNumber}
            </span>
            <span className="badge">
              <Route className="h-3 w-3" /> {bus.route}
            </span>
            <span className="badge">
              <Navigation className="h-3 w-3" /> {Math.round(liveSpeed)} km/h
            </span>
            <LevelBadge level={data.congestionLevel} />
          </div>
        )}
      </header>

      {/* ── KPI row ───────────────────────────────────────────────────────── */}
      <section aria-label="Traffic KPIs">
        <SectionHeading
          title="Traffic overview"
          hint="Key metrics observed on this corridor in the current window"
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {/* Congestion Score — the centrepiece KPI */}
          <div className="card col-span-2 flex items-center gap-4 p-4 lg:col-span-1">
            <Gauge
              value={data.congestionScore}
              max={100}
              label="Congestion"
              color={LEVEL_COLOR[data.congestionLevel]}
              size={80}
            />
            <div>
              <p className="label-eyebrow">Congestion score</p>
              <LevelBadge level={data.congestionLevel} />
            </div>
          </div>

          <StatTile
            label="Traffic density"
            value={Math.round(liveDensity)}
            unit="veh/km"
            live="drift"
            caption={`${data.avgSpeedKmh < data.baselineSpeedKmh ? '↑ above' : '↓ below'} normal density`}
            icon={<Users className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Avg traffic speed"
            value={round1(liveSpeed)}
            unit="km/h"
            caption={`Baseline: ${data.baselineSpeedKmh} km/h for this time`}
            accent={liveSpeed < data.baselineSpeedKmh * 0.6 ? 'var(--status-critical)' : undefined}
            icon={<Navigation className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Vehicles detected"
            value={data.vehicleCount}
            live="climb"
            caption={`${data.vehicleClasses.cars} cars · ${data.vehicleClasses.buses} buses`}
            icon={<Car className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Queue length"
            value={Math.round(liveQueue)}
            unit="m"
            caption={
              data.queueGrowthPct > 0
                ? `+${formatNumber(data.queueGrowthPct, 1)}% in last 10 min`
                : 'Queue stable / easing'
            }
            accent={data.queueLengthM > 500 ? 'var(--status-serious)' : undefined}
            icon={<BarChart3 className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Route delay"
            value={data.route.delayMin}
            unit="min"
            caption={data.route.routeName}
            delta={data.route.delayMin > 0 ? data.route.delayMin : undefined}
            higherIsBetter={false}
            accent={data.route.delayMin > 15 ? 'var(--status-critical)' : undefined}
            icon={<Clock className="h-3.5 w-3.5" />}
          />
        </div>
      </section>

      {/* ── Live traffic flow ─────────────────────────────────────────────── */}
      <section aria-label="Live traffic flow">
        <SectionHeading
          title="Live traffic flow"
          hint="Vehicles per minute — last 12 readings from edge AI detections"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card
            title="Flow trace"
            subtitle="Total, inbound and outbound — updated as frames are processed"
            className="xl:col-span-2"
          >
            <TrafficFlowChart data={data.flow} />
          </Card>

          <Card title="Vehicle classification" subtitle="Current detection window">
            <VehicleClassBars rows={vehicleRows} />
            <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-xs">
              <span className="text-ink-muted">Flow rate</span>
              <span className="font-semibold tabular-nums text-ink">
                {data.flowVehiclesPerMin} <span className="font-normal text-ink-muted">veh/min</span>
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Congestion analysis ───────────────────────────────────────────── */}
      <section aria-label="Congestion analysis">
        <SectionHeading
          title="Congestion analysis"
          hint="Score breakdown, queue dynamics, and speed reduction context"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* Score formula */}
          <Card title="Congestion score" subtitle="Transparent formula — not a black box" className="xl:col-span-1">
            <CongestionFormula breakdown={data.breakdown} />
          </Card>

          {/* Queue intelligence */}
          <Card title="Traffic queue intelligence" subtitle="Current queue state and trend">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-hairline bg-surface-muted p-3">
                  <p className="label-eyebrow">Queue length</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-ink">
                    {formatNumber(Math.round(liveQueue))} <span className="text-sm font-normal text-ink-muted">m</span>
                  </p>
                  <p className="mt-0.5 text-label text-ink-muted">
                    {data.queueGrowthPct > 5 ? '↑ Growing' : data.queueGrowthPct < -5 ? '↓ Easing' : '→ Stable'}
                  </p>
                </div>
                <div className="rounded-lg border border-hairline bg-surface-muted p-3">
                  <p className="label-eyebrow">Est. clearing</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-ink">
                    {data.estimatedClearingMin} <span className="text-sm font-normal text-ink-muted">min</span>
                  </p>
                  <p className="mt-0.5 text-label text-ink-muted">at current dissipation rate</p>
                </div>
              </div>

              <dl className="space-y-2.5 border-t border-hairline pt-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-muted">Queue growth (10 min)</dt>
                  <dd className={`font-semibold tabular-nums ${data.queueGrowthPct > 10 ? 'text-[var(--status-critical)]' : data.queueGrowthPct > 0 ? 'text-[var(--status-warning)]' : 'text-[var(--status-good-text)]'}`}>
                    {data.queueGrowthPct > 0 ? '+' : ''}{formatNumber(data.queueGrowthPct, 1)}%
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-muted">Shift maximum queue</dt>
                  <dd className="font-semibold tabular-nums text-ink">{formatNumber(data.queueMaxM)} m</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-muted">Avg traffic speed</dt>
                  <dd className="font-semibold tabular-nums text-ink">{round1(liveSpeed)} km/h</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-muted">Historical baseline speed</dt>
                  <dd className="font-semibold tabular-nums text-ink">{data.baselineSpeedKmh} km/h</dd>
                </div>
              </dl>

              {/* Speed vs baseline visual bar */}
              <div>
                <div className="mb-1 flex justify-between text-label text-ink-muted">
                  <span>Current speed</span>
                  <span>Baseline</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-sm bg-surface-sunken">
                  <div className="absolute inset-y-0 left-0 rounded-sm bg-[var(--series-1)]"
                    style={{ width: `${Math.min(100, (liveSpeed / data.baselineSpeedKmh) * 100)}%` }} />
                  <div className="absolute inset-y-0 w-px bg-ink-muted" style={{ left: '100%', transform: 'translateX(-1px)' }} />
                </div>
                <p className="mt-1 text-right text-label text-ink-muted">
                  {Math.round((liveSpeed / data.baselineSpeedKmh) * 100)}% of baseline
                </p>
              </div>
            </div>
          </Card>

          {/* Route performance */}
          <Card title="Route performance" subtitle={data.route.routeName}>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-hairline p-3">
                  <p className="label-eyebrow">Scheduled</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{data.route.scheduledMin}</p>
                  <p className="text-label text-ink-muted">min</p>
                </div>
                <div className="rounded-lg border border-hairline p-3">
                  <p className="label-eyebrow">Actual</p>
                  <p className={`mt-1 text-lg font-semibold tabular-nums ${data.route.delayMin > 10 ? 'text-[var(--status-critical)]' : data.route.delayMin > 0 ? 'text-[var(--status-serious)]' : 'text-ink'}`}>
                    {data.route.actualMin}
                  </p>
                  <p className="text-label text-ink-muted">min</p>
                </div>
                <div className="rounded-lg border border-hairline p-3">
                  <p className="label-eyebrow">Delay</p>
                  <p className={`mt-1 text-lg font-semibold tabular-nums ${data.route.delayMin > 10 ? 'text-[var(--status-critical)]' : data.route.delayMin > 0 ? 'text-[var(--status-serious)]' : 'text-[var(--status-good-text)]'}`}>
                    {data.route.delayMin > 0 ? `+${data.route.delayMin}` : data.route.delayMin}
                  </p>
                  <p className="text-label text-ink-muted">min</p>
                </div>
              </div>

              <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-muted">Traffic impact</dt>
                  <dd>
                    <span
                      className="font-semibold"
                      style={{ color: data.route.trafficImpact === 'None' ? 'var(--status-good)' :
                        data.route.trafficImpact === 'Low' ? 'var(--status-good-text)' :
                        data.route.trafficImpact === 'Moderate' ? 'var(--status-warning)' :
                        data.route.trafficImpact === 'High' ? 'var(--status-serious)' :
                        'var(--status-critical)' }}
                    >
                      {data.route.trafficImpact.toUpperCase()}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-muted">Avg route speed</dt>
                  <dd className="font-semibold tabular-nums text-ink">{data.route.avgSpeedKmh} km/h</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-muted">Congestion zones</dt>
                  <dd className="font-semibold tabular-nums text-ink">{data.route.congestionZones}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-ink-muted">Slowest segment</dt>
                  <dd className="text-right font-medium text-ink">{data.route.slowestSegment}</dd>
                </div>
              </dl>

              {/* Delay bar */}
              <div>
                <div className="mb-1 flex justify-between text-label text-ink-muted">
                  <span>Schedule adherence</span>
                  <span>{Math.round(Math.max(0, 100 - (data.route.delayMin / data.route.scheduledMin) * 100))}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-sm bg-surface-sunken">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${Math.max(0, 100 - (data.route.delayMin / data.route.scheduledMin) * 100)}%`,
                      backgroundColor: data.route.delayMin > 10 ? 'var(--status-critical)' : data.route.delayMin > 0 ? 'var(--status-warning)' : 'var(--status-good)',
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Historical baseline comparison ───────────────────────────────── */}
      <section aria-label="Historical baseline comparison">
        <SectionHeading
          title="City Memory comparison"
          hint="Current conditions compared against 12-week historical baseline for this corridor"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Baseline deviation" subtitle="This corridor vs its own 12-week norm">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-hairline bg-surface-muted p-3">
                  <p className="label-eyebrow">Current</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-ink">{formatNumber(data.congestionScore, 1)}</p>
                  <p className="text-label text-ink-muted">score</p>
                </div>
                <div className="rounded-lg border border-hairline bg-surface-muted p-3">
                  <p className="label-eyebrow">Baseline</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-ink">{formatNumber(data.historicalBaselineScore)}</p>
                  <p className="text-label text-ink-muted">12-week avg</p>
                </div>
                <div className="rounded-lg border border-hairline p-3"
                  style={{ borderColor: data.baselineDeviationPct > 20 ? 'var(--status-serious)' : 'var(--hairline)' }}>
                  <p className="label-eyebrow">Deviation</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight"
                    style={{ color: data.baselineDeviationPct > 20 ? 'var(--status-serious)' : data.baselineDeviationPct < -10 ? 'var(--status-good)' : 'var(--ink)' }}>
                    {data.baselineDeviationPct > 0 ? '+' : ''}{formatNumber(data.baselineDeviationPct, 1)}%
                  </p>
                  <p className="text-label text-ink-muted">vs norm</p>
                </div>
              </div>
              <p className="text-xs text-ink-secondary">
                {data.baselineDeviationPct > 20
                  ? `Current congestion is ${formatNumber(data.baselineDeviationPct, 1)}% above the historical norm for this corridor and time of day.`
                  : data.baselineDeviationPct < -10
                    ? 'Traffic is currently lighter than historical average. Conditions are better than typical.'
                    : 'Congestion is within normal expected range for this corridor and time window.'}
              </p>
            </div>
          </Card>

          {/* Fleet corroboration */}
          <Card title="Fleet corroboration" subtitle="Multi-bus confidence signal">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Gauge
                  value={Math.round(data.fleetCorroboration.confidence * 100)}
                  max={100}
                  label="Confidence"
                  color={data.fleetCorroboration.confidence > 0.8 ? 'var(--status-good)' : 'var(--status-warning)'}
                  size={80}
                />
                <div className="min-w-0 space-y-1 text-xs">
                  <p className="text-ink-secondary">
                    <span className="font-semibold tabular-nums text-ink">{data.fleetCorroboration.busCount}</span> buses
                    observed this corridor within <span className="tabular-nums">{data.fleetCorroboration.windowMin} min</span>.
                  </p>
                  <p className="text-ink-muted">
                    More independent observations → higher confidence. One pass is a guess; many are a fact.
                  </p>
                </div>
              </div>

              <ul className="space-y-1.5 border-t border-hairline pt-3">
                {data.fleetCorroboration.observations.map((obs, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-ink-secondary">
                      <Bus className="h-3 w-3 shrink-0 text-ink-muted" />
                      {obs.busId}
                      {i === 0 && <span className="badge text-[10px]">this unit</span>}
                    </span>
                    <span className="tabular-nums text-ink-muted">
                      {obs.speedKmh} km/h · {obs.densityPerKm} veh/km
                    </span>
                  </li>
                ))}
              </ul>

              <p className="rounded-md border border-hairline bg-surface-muted px-3 py-2 text-label leading-relaxed text-ink-secondary">
                Corroboration raises confidence — not certainty. Agreement among buses increases the signal-to-noise ratio.
              </p>
            </div>
          </Card>

          {/* URBANOS pipeline */}
          <Card title="URBANOS traffic pipeline" subtitle="How this intelligence is produced">
            <ol className="space-y-2">
              {[
                { icon: <Bus className="h-3.5 w-3.5" />,      step: 'Bus camera + GPS + CAN/OBD', note: 'raw sensor streams' },
                { icon: <Cpu className="h-3.5 w-3.5" />,      step: 'Edge AI (Hailo HAT)', note: 'on-device inference' },
                { icon: <Car className="h-3.5 w-3.5" />,      step: 'YOLO object detection', note: 'frame-by-frame' },
                { icon: <Navigation className="h-3.5 w-3.5" />, step: 'ByteTrack tracking', note: 'multi-object across frames' },
                { icon: <Truck className="h-3.5 w-3.5" />,    step: 'Vehicle classification', note: 'cars, buses, trucks, autos…' },
                { icon: <GaugeIcon className="h-3.5 w-3.5" />, step: 'Traffic metrics', note: 'density, speed, queue, flow' },
                { icon: <Activity className="h-3.5 w-3.5" />, step: 'Sensor fusion', note: 'GPS travel time + camera + IMU' },
                { icon: <History className="h-3.5 w-3.5" />,  step: 'City Memory', note: '12-week corridor history' },
                { icon: <Zap className="h-3.5 w-3.5" />,      step: 'Predictive intelligence', note: 'next 15–30 min forecast' },
              ].map((item, i, arr) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-ink-secondary">
                      {item.icon}
                    </span>
                    {i < arr.length - 1 && <div className="mt-0.5 h-3 w-px bg-hairline" />}
                  </div>
                  <div className="min-w-0 pb-1">
                    <p className="text-xs font-medium text-ink">{item.step}</p>
                    <p className="text-label text-ink-muted">{item.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </section>

      {/* ── Traffic hotspots ──────────────────────────────────────────────── */}
      <section aria-label="Traffic hotspots">
        <SectionHeading
          title="Traffic hotspots"
          hint="Corridors with elevated congestion observed by the fleet — click any row to expand"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Fleet-observed hotspots" subtitle="Ranked by congestion score, highest first">
            <ul className="space-y-1">
              {data.hotspots.map((spot, i) => (
                <div key={spot.id} className="flex items-start gap-2">
                  <span className="mt-3.5 w-4 shrink-0 text-right text-label tabular-nums text-ink-muted">{i + 1}</span>
                  <div className="flex-1">
                    <HotspotRow
                      spot={spot}
                      selected={selectedHotspotId === spot.id}
                      onClick={() => setSelectedHotspotId(spot.id === selectedHotspotId ? '' : spot.id)}
                    />
                  </div>
                </div>
              ))}
            </ul>
          </Card>

          {/* Hotspot summary grid */}
          <div className="space-y-4">
            <Card title="Severity distribution" subtitle="Hotspots by congestion level">
              <div className="space-y-2.5">
                {(['Severe', 'High', 'Moderate', 'Low'] as TrafficLevel[]).map((level) => {
                  const count = data.hotspots.filter((h) => h.level === level).length
                  return (
                    <div key={level}>
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LEVEL_COLOR[level] }} aria-hidden="true" />
                          {level}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-ink">{count}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-sm bg-surface-sunken">
                        <div
                          className="h-full rounded-sm"
                          style={{ width: `${(count / data.hotspots.length) * 100}%`, backgroundColor: LEVEL_COLOR[level] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card title="Worst hotspot" subtitle={data.hotspots[0]?.location ?? '—'}>
              {data.hotspots[0] && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <LevelBadge level={data.hotspots[0].level} />
                    <span className="text-xs text-ink-muted">Score: {formatNumber(data.hotspots[0].congestionScore, 1)}/100</span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {[
                      { label: 'Density', value: `${data.hotspots[0].densityPerKm} veh/km` },
                      { label: 'Avg speed', value: `${data.hotspots[0].avgSpeedKmh} km/h` },
                      { label: 'Queue', value: `${formatNumber(data.hotspots[0].queueM)} m` },
                      { label: 'Cause', value: data.hotspots[0].primaryCause },
                      { label: 'Buses observing', value: `${data.hotspots[0].observingBuses}` },
                      { label: 'Confidence', value: `${Math.round(data.hotspots[0].confidence * 100)}%` },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <dt className="text-ink-muted">{label}</dt>
                        <dd className="font-medium text-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* ── Traffic trend + events ────────────────────────────────────────── */}
      <section aria-label="Trend and live events">
        <SectionHeading
          title="Traffic trend analysis"
          hint="12-week history — congestion score, density and average speed"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card
            title="Traffic trend (12 weeks)"
            subtitle="Congestion score, density and average speed — oldest first"
            className="xl:col-span-2"
          >
            <TrafficTrendChart data={data.trend} />
          </Card>

          <Card title="Live traffic events" subtitle="Arriving from fleet observations">
            <ul className="space-y-2.5" key={latestKey}>
              {events.length === 0 && (
                <li className="py-4 text-center text-label text-ink-muted">
                  Waiting for events…
                </li>
              )}
              {events.map((ev) => (
                <li key={ev.id} className="flex items-start gap-2.5 animate-in fade-in">
                  <span className={`mt-0.5 shrink-0 ${EVENT_COLOR[ev.type]}`}>
                    {EVENT_ICON[ev.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-ink">{ev.location}</p>
                      <LevelBadge level={ev.severity} />
                    </div>
                    <p className="mt-0.5 text-label text-ink-secondary">{ev.detail}</p>
                    <p className="mt-0.5 text-label text-ink-muted">{ev.timestamp}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* ── Predictive + contributing factors ────────────────────────────── */}
      <section aria-label="Predictive intelligence and contributing factors">
        <SectionHeading
          title="Predictive traffic intelligence"
          hint="Estimated conditions based on observed trends and historical patterns"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Traffic forecast" subtitle="Estimated — not guaranteed">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <PredictiveLevel label="Current" level={data.predictive.current} highlight />
                <PredictiveLevel label="Next 15 min" level={data.predictive.next15} />
                <PredictiveLevel label="Next 30 min" level={data.predictive.next30} />
              </div>

              {/* Risk score */}
              <div>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="label-eyebrow">Congestion risk</span>
                  <span className="text-sm font-semibold tabular-nums text-ink">{data.predictive.riskPct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-sm bg-surface-sunken">
                  <div
                    className="h-full rounded-sm transition-[width] duration-500 ease-out"
                    style={{
                      width: `${data.predictive.riskPct}%`,
                      backgroundColor: data.predictive.riskPct > 70 ? 'var(--status-critical)' : data.predictive.riskPct > 45 ? 'var(--status-serious)' : 'var(--status-warning)',
                    }}
                  />
                </div>
              </div>

              {/* Explanatory sentence */}
              <div className="rounded-md border border-hairline bg-surface-muted px-3 py-2.5">
                <p className="mb-0.5 flex items-center gap-1.5 text-label font-medium text-ink-secondary">
                  <AlertCircle className="h-3 w-3" />
                  Why this forecast
                </p>
                <p className="text-xs leading-relaxed text-ink-secondary">
                  {data.predictive.explanation}
                </p>
              </div>
            </div>
          </Card>

          {/* Contributing factors */}
          <Card title="Contributing factors" subtitle="What is driving current traffic conditions">
            <div className="space-y-3">
              <div className="space-y-2 text-xs">
                <FactorRow label="Traffic density" value={data.factors.density} />
                <div className="border-b border-hairline" />
                <FactorRow label="Speed reduction vs baseline" value={data.factors.speedReduction} />
                <div className="border-b border-hairline" />
                <FactorRow label="Queue length" value={data.factors.queueLength} />
                <div className="border-b border-hairline" />
                <FactorRow label="Historical baseline" value={data.factors.historicalBaseline} />
                <div className="border-b border-hairline" />
                <FactorRow label="Safety incident nearby" value={data.factors.safetyIncident} />
                <div className="border-b border-hairline" />
                <FactorRow label="Road surface damage" value={data.factors.roadDamage} />
              </div>

              {/* Cross-module callout */}
              {(data.factors.safetyIncident || data.factors.roadDamage) && (
                <div className="rounded-md border border-[var(--status-warning)] bg-[#fef9ec] px-3 py-2.5">
                  <p className="mb-0.5 flex items-center gap-1.5 text-label font-medium text-[#8a5e00]">
                    <ShieldAlert className="h-3 w-3" />
                    Cross-module signal
                  </p>
                  <p className="text-xs leading-relaxed text-[#8a5e00]">
                    {data.factors.safetyIncident && data.factors.roadDamage
                      ? 'A safety incident and road surface damage are both contributing to congestion on this corridor. Refer to Safety Intelligence and Road Health modules for details.'
                      : data.factors.safetyIncident
                        ? 'A safety incident has been detected on or near this corridor. Refer to the Safety Intelligence module for event details.'
                        : 'Road surface damage is contributing to speed reduction on this corridor. Refer to the Road Health module for defect records.'}
                  </p>
                </div>
              )}

              <p className="rounded-md border border-hairline bg-surface-muted px-3 py-2 text-label leading-relaxed text-ink-secondary">
                URBANOS modules share signals. Road Health surface damage, Safety incidents and Bus Operations delays are all surfaced here when relevant.
              </p>
            </div>
          </Card>
        </div>
      </section>

    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Micro-utilities local to this file                                           */
/* -------------------------------------------------------------------------- */

function round1(v: number): number {
  return Math.round(v * 10) / 10
}
