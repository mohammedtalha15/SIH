'use client'

/**
 * SafetyIntelligenceDashboard — Safety Intelligence section for one BMTC unit.
 *
 * Pipeline this communicates:
 *   Camera → Object Detection → Object Tracking → Trajectory Analysis →
 *   Sensor Fusion (IMU + GPS + CAN/OBD + ANPR) → Event Detection →
 *   Risk Scoring → Incident Record → Dashboard
 *
 * Order: safety score first (the headline), then the events, then evidence.
 */

import { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Car,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock,
  Eye,
  Gauge as GaugeIcon,
  Info,
  MapPin,
  Navigation,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

import {
  EVENT_LABEL,
  getSafetyData,
  produceLiveEvent,
  SEVERITY_COLOR,
  SEVERITY_RANK,
  safetyScoreColor,
  safetyScoreLabel,
  type SafetyEventType,
  type SafetyIncident,
  type SafetySeverity,
} from '@/lib/safety-data'
import { BUSES } from '@/lib/fleet-data'
import { formatNumber } from '@/lib/road-health-data'
import { Gauge } from '@/components/road-health/Charts'
import { StatTile } from '@/components/road-health/StatTile'
import { useTick, useEventFeed } from '@/lib/use-live'

/* -------------------------------------------------------------------------- */
/* Layout primitives — same as Road Health & Bus Operations                     */
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
/* Severity badge                                                               */
/* -------------------------------------------------------------------------- */

const SEVERITY_BADGE: Record<SafetySeverity, string> = {
  Low:      'border-hairline bg-surface-muted text-ink-secondary',
  Medium:   'border-[var(--status-warning)] bg-[#fef9ec] text-[#8a5e00]',
  High:     'border-[var(--status-serious)] bg-[#fff2ed] text-[#7c3214]',
  Critical: 'border-transparent bg-[var(--status-critical)] text-white',
}

function SeverityBadge({ severity }: { severity: SafetySeverity }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-label font-medium border ${SEVERITY_BADGE[severity]}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: SEVERITY_COLOR[severity] }}
        aria-hidden="true"
      />
      {severity}
    </span>
  )
}

const EVENT_ICON: Record<SafetyEventType, React.ElementType> = {
  near_miss:           AlertTriangle,
  harsh_braking:       TrendingDown,
  overspeed:           GaugeIcon,
  pedestrian_conflict: Users,
  unsafe_lane_change:  Navigation,
  vehicle_conflict:    Car,
  collision:           Siren,
  sudden_stop:         ShieldAlert,
}

function EventTypeBadge({ type }: { type: SafetyEventType }) {
  const Icon = EVENT_ICON[type]
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary">
      <Icon className="h-3 w-3 shrink-0" strokeWidth={1.75} />
      {EVENT_LABEL[type]}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Safety Trend Chart — SVG, same architecture as DefectTrend                   */
/* -------------------------------------------------------------------------- */

const TREND_SERIES = [
  { key: 'harshBraking' as const, label: 'Harsh braking', color: 'var(--series-2)' },
  { key: 'nearMiss'     as const, label: 'Near misses',   color: 'var(--status-critical)' },
  { key: 'overspeed'   as const, label: 'Overspeed',     color: 'var(--status-warning)' },
] as const

const VB_W = 680
const VB_H = 200
const M = { top: 14, right: 14, bottom: 26, left: 36 }

function niceAxis(dataMax: number): { max: number; ticks: number[] } {
  const padded = dataMax * 1.1
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(padded, 1))))
  const norm = padded / mag
  const max = ([1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10].find((s) => norm <= s) ?? 10) * mag
  const isRound = (n: number) => {
    const m = Math.pow(10, Math.floor(Math.log10(Math.max(n, 1))))
    return [1, 2, 2.5, 5, 10].some((s) => Math.abs(n / m - s) < 1e-9)
  }
  const divisions = [4, 5, 3, 2].find((d) => isRound(max / d)) ?? 4
  return { max, ticks: Array.from({ length: divisions + 1 }, (_, i) => (max / divisions) * i) }
}

type TrendPoint = { week: string; harshBraking: number; nearMiss: number; overspeed: number; safetyScore: number }

function SafetyTrendChart({ data }: { data: TrendPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const plotW = VB_W - M.left - M.right
  const plotH = VB_H - M.top - M.bottom

  const yMax = useMemo(
    () =>
      niceAxis(
        Math.max(...data.flatMap((d) => [d.harshBraking, d.nearMiss, d.overspeed])),
      ).max,
    [data],
  )

  const { ticks } = useMemo(() => niceAxis(yMax), [yMax])

  const xAt = (i: number) => M.left + (i / (data.length - 1)) * plotW
  const yAt = (v: number) => M.top + (1 - v / yMax) * plotH

  const paths = useMemo(() => {
    const build = (key: 'harshBraking' | 'nearMiss' | 'overspeed') => {
      const line = data
        .map((d, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(2)} ${yAt(d[key]).toFixed(2)}`)
        .join(' ')
      return { line, area: `${line} L${(M.left + plotW).toFixed(2)} ${M.top + plotH} L${M.left} ${M.top + plotH} Z` }
    }
    return { harshBraking: build('harshBraking'), nearMiss: build('nearMiss'), overspeed: build('overspeed') }
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
        aria-label="Safety events per week over the last 12 weeks"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="si-fill-hb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-2)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--series-2)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={M.left + plotW} y1={yAt(t)} y2={yAt(t)} stroke="var(--grid)" strokeWidth="1" />
            <text
              x={M.left - 7} y={yAt(t)} textAnchor="end" dominantBaseline="middle"
              fontSize="9" fill="var(--ink-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatNumber(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) =>
          i % 2 === 0 || i === data.length - 1 ? (
            <text key={d.week} x={xAt(i)} y={M.top + plotH + 15} textAnchor="middle" fontSize="9" fill="var(--ink-muted)">
              {d.week}
            </text>
          ) : null,
        )}

        <line x1={M.left} x2={M.left + plotW} y1={M.top + plotH} y2={M.top + plotH} stroke="var(--axis)" strokeWidth="1" />

        <path d={paths.harshBraking.area} fill="url(#si-fill-hb)" />
        <path d={paths.overspeed.line}    fill="none" stroke="var(--status-warning)"  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={paths.nearMiss.line}     fill="none" stroke="var(--status-critical)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={paths.harshBraking.line} fill="none" stroke="var(--series-2)"        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {hoverIndex !== null && active && (
          <g pointerEvents="none">
            <line
              x1={xAt(hoverIndex)} x2={xAt(hoverIndex)}
              y1={M.top} y2={M.top + plotH}
              stroke="var(--axis)" strokeWidth="1" strokeDasharray="3 3"
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
          className="pointer-events-none absolute top-6 z-10 min-w-[10rem] rounded-md border border-hairline bg-surface p-2.5 shadow-overlay animate-in fade-in"
          style={{
            left: `${(xAt(hoverIndex) / VB_W) * 100}%`,
            transform: hoverIndex > data.length / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
          }}
        >
          <p className="label-eyebrow mb-1.5">{active.week}</p>
          <ul className="space-y-1">
            {TREND_SERIES.map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-xs">
                <svg width="10" height="2" className="shrink-0" aria-hidden="true">
                  <rect width="10" height="2" rx="1" fill={s.color} />
                </svg>
                <span className="font-semibold tabular-nums text-ink">{active[s.key]}</span>
                <span className="ml-auto text-ink-muted">{s.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 border-t border-hairline pt-1.5 text-label tabular-nums text-ink-muted">
            Safety score {formatNumber(active.safetyScore, 1)}
          </p>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Behaviour Bars                                                               */
/* -------------------------------------------------------------------------- */

function BehaviourBars({ behaviour }: { behaviour: ReturnType<typeof getSafetyData>['behaviour'] }) {
  const items = [
    { label: 'Harsh braking',      value: behaviour.harshBrakingCount,      warn: 6,  critical: 10 },
    { label: 'Harsh acceleration',  value: behaviour.harshAccelerationCount, warn: 4,  critical: 8  },
    { label: 'Rapid lane changes',  value: behaviour.rapidLaneChanges,       warn: 3,  critical: 6  },
    { label: 'Unsafe following',    value: behaviour.unsafeFollowingCount,   warn: 2,  critical: 5  },
    { label: 'Sudden stops',        value: behaviour.suddenStops,           warn: 2,  critical: 4  },
    { label: 'Overspeed events',    value: behaviour.overspeedCount,         warn: 3,  critical: 6  },
  ]
  const max = Math.max(...items.map((i) => i.value), 1)

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const color =
          item.value >= item.critical
            ? 'var(--status-critical)'
            : item.value >= item.warn
              ? 'var(--status-warning)'
              : 'var(--series-1)'
        return (
          <li key={item.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="truncate text-xs text-ink-secondary">{item.label}</span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">{item.value}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-sm bg-surface-sunken">
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* -------------------------------------------------------------------------- */
/* Incident Table                                                               */
/* -------------------------------------------------------------------------- */

type SortKey = 'severity' | 'timestamp' | 'speed' | 'confidence'

const STATUS_STYLE: Record<SafetyIncident['status'], string> = {
  New:            'border-transparent bg-ink text-ink-inverted',
  'Under review': 'border-hairline bg-surface-sunken text-ink',
  Confirmed:      'border-hairline bg-surface-muted text-ink-secondary',
  Closed:         'border-hairline bg-surface-muted text-ink-muted',
}

function IncidentTable({
  incidents,
  onSelect,
  selectedId,
}: {
  incidents: SafetyIncident[]
  onSelect: (id: string) => void
  selectedId: string | null
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'severity',
    dir: 'desc',
  })
  const [typeFilter, setTypeFilter] = useState<SafetyEventType | 'all'>('all')
  const [sevFilter, setSevFilter]   = useState<SafetySeverity | 'all'>('all')

  const filtered = useMemo(() => {
    let out = incidents
    if (typeFilter !== 'all') out = out.filter((i) => i.eventType === typeFilter)
    if (sevFilter  !== 'all') out = out.filter((i) => i.severity === sevFilter)
    return out
  }, [incidents, typeFilter, sevFilter])

  const sorted = useMemo(() => {
    const f = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      switch (sort.key) {
        case 'severity':    return (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) * f
        case 'timestamp':   return a.timestamp.localeCompare(b.timestamp) * f
        case 'speed':       return (a.speed - b.speed) * f
        case 'confidence':  return (a.confidence - b.confidence) * f
      }
    })
  }, [filtered, sort])

  function toggle(key: SortKey) {
    setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col) return <ChevronDown className="h-3 w-3 text-ink-muted opacity-30" />
    return sort.dir === 'desc'
      ? <ChevronDown className="h-3 w-3 text-ink-secondary" />
      : <ChevronRight className="h-3 w-3 rotate-[-90deg] text-ink-secondary" />
  }

  const EVENT_TYPE_OPTIONS: SafetyEventType[] = [
    'near_miss', 'harsh_braking', 'overspeed', 'pedestrian_conflict',
    'unsafe_lane_change', 'vehicle_conflict', 'sudden_stop',
  ]

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-5 pb-3">
        <select
          className="rounded-md border border-hairline bg-surface-muted px-2 py-1 text-label text-ink-secondary focus:outline-none focus:ring-1 focus:ring-ink"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as SafetyEventType | 'all')}
          aria-label="Filter by event type"
        >
          <option value="all">All types</option>
          {EVENT_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{EVENT_LABEL[t]}</option>
          ))}
        </select>

        <select
          className="rounded-md border border-hairline bg-surface-muted px-2 py-1 text-label text-ink-secondary focus:outline-none focus:ring-1 focus:ring-ink"
          value={sevFilter}
          onChange={(e) => setSevFilter(e.target.value as SafetySeverity | 'all')}
          aria-label="Filter by severity"
        >
          <option value="all">All severities</option>
          {(['Critical', 'High', 'Medium', 'Low'] as SafetySeverity[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <span className="ml-auto text-label text-ink-muted tabular-nums">{sorted.length} records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <thead>
            <tr className="border-y border-hairline bg-surface-muted">
              <th className="px-5 py-2 text-left" scope="col">
                <span className="label-eyebrow">Incident</span>
              </th>
              <th className="px-3 py-2 text-left" scope="col">
                <button
                  onClick={() => toggle('severity')}
                  className="label-eyebrow flex items-center gap-1 hover:text-ink"
                >
                  Severity <SortIcon col="severity" />
                </button>
              </th>
              <th className="px-3 py-2 text-left" scope="col">
                <span className="label-eyebrow">Location</span>
              </th>
              <th className="px-3 py-2 text-right" scope="col">
                <button
                  onClick={() => toggle('speed')}
                  className="label-eyebrow flex items-center justify-end gap-1 hover:text-ink w-full"
                >
                  Speed <SortIcon col="speed" />
                </button>
              </th>
              <th className="hidden px-3 py-2 text-right sm:table-cell" scope="col">
                <button
                  onClick={() => toggle('confidence')}
                  className="label-eyebrow flex items-center justify-end gap-1 hover:text-ink w-full"
                >
                  Confidence <SortIcon col="confidence" />
                </button>
              </th>
              <th className="hidden px-3 py-2 text-left md:table-cell" scope="col">
                <span className="label-eyebrow">Status</span>
              </th>
              <th className="hidden px-5 py-2 text-right xl:table-cell" scope="col">
                <button
                  onClick={() => toggle('timestamp')}
                  className="label-eyebrow flex items-center justify-end gap-1 hover:text-ink w-full"
                >
                  Time <SortIcon col="timestamp" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((inc) => {
              const Icon = EVENT_ICON[inc.eventType]
              const isSelected = selectedId === inc.id
              return (
                <tr
                  key={inc.id}
                  onClick={() => onSelect(inc.id)}
                  className={`cursor-pointer border-b border-hairline transition-colors duration-150 ${
                    isSelected
                      ? 'bg-surface-sunken'
                      : 'hover:bg-surface-muted'
                  }`}
                >
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
                        style={{ backgroundColor: `${SEVERITY_COLOR[inc.severity]}22` }}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} style={{ color: SEVERITY_COLOR[inc.severity] }} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-ink tabular-nums">{inc.id}</span>
                        <span className="block truncate text-label text-ink-muted">{EVENT_LABEL[inc.eventType]}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <SeverityBadge severity={inc.severity} />
                  </td>
                  <td className="max-w-[12rem] px-3 py-2.5">
                    <span className="truncate text-xs text-ink-secondary block">{inc.location}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-xs font-medium tabular-nums text-ink">
                      {inc.speed} <span className="font-normal text-ink-muted">km/h</span>
                    </span>
                  </td>
                  <td className="hidden px-3 py-2.5 text-right sm:table-cell">
                    <span className="text-xs tabular-nums text-ink-secondary">
                      {Math.round(inc.confidence * 100)}%
                    </span>
                  </td>
                  <td className="hidden px-3 py-2.5 md:table-cell">
                    <span className={`badge text-label ${STATUS_STYLE[inc.status]}`}>{inc.status}</span>
                  </td>
                  <td className="hidden px-5 py-2.5 text-right xl:table-cell">
                    <span className="text-label tabular-nums text-ink-muted">
                      {inc.timestamp.slice(11, 19)}
                    </span>
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-ink-muted">
                  No incidents match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Incident Reconstruction                                                      */
/* -------------------------------------------------------------------------- */

const RECONSTRUCTION_STEPS = [
  { key: 'before',     label: 'Before event',         icon: Eye,         hint: 'Normal operation detected' },
  { key: 'detected',   label: 'Event detected',        icon: AlertTriangle, hint: 'IMU + Camera trigger' },
  { key: 'tracking',   label: 'Object tracking',       icon: Navigation,  hint: 'ByteTrack trajectory analysis' },
  { key: 'event',      label: 'Critical moment',       icon: Siren,       hint: 'Risk scored from sensor fusion' },
  { key: 'anpr',       label: 'Plate recognition',     icon: ScanLine,    hint: 'OCR confidence estimate' },
  { key: 'gps',        label: 'GPS location locked',   icon: MapPin,      hint: 'Coordinates recorded' },
  { key: 'recorded',   label: 'Incident recorded',     icon: CircleCheck, hint: 'Uploaded to platform' },
]

function IncidentReconstruction({ incident }: { incident: SafetyIncident }) {
  const hasAnpr = incident.vehicleNumber !== null
  const steps = hasAnpr
    ? RECONSTRUCTION_STEPS
    : RECONSTRUCTION_STEPS.filter((s) => s.key !== 'anpr')

  return (
    <div className="space-y-4">
      {/* Identity row */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-ink tabular-nums">{incident.id}</span>
            <SeverityBadge severity={incident.severity} />
            <span className={`badge text-label ${STATUS_STYLE[incident.status]}`}>{incident.status}</span>
          </div>
          <p className="text-xs text-ink-secondary">
            <EventTypeBadge type={incident.eventType} />
            {' · '}
            <span className="text-ink-muted">{incident.timestamp}</span>
          </p>
        </div>
      </div>

      {/* Reconstruction timeline */}
      <div>
        <p className="label-eyebrow mb-2">Event reconstruction</p>
        <ol className="flex flex-wrap gap-1.5">
          {steps.map((step, i) => {
            const Icon = step.icon
            const isAnpr = step.key === 'anpr'
            const isLast = i === steps.length - 1
            return (
              <li key={step.key} className="flex items-center gap-1.5">
                <div
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${
                    isAnpr
                      ? 'border-[var(--status-good)] bg-[#f0faf0] text-[var(--status-good-text)]'
                      : isLast
                        ? 'border-hairline-strong bg-surface-sunken text-ink'
                        : 'border-hairline bg-surface-muted text-ink-secondary'
                  }`}
                >
                  <Icon className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                  <span className="font-medium">{step.label}</span>
                </div>
                {!isLast && (
                  <ChevronRight className="h-3 w-3 shrink-0 text-ink-muted" />
                )}
              </li>
            )
          })}
        </ol>
      </div>

      {/* Detail grid */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-ink-muted">Location</dt>
          <dd className="mt-0.5 font-medium text-ink">{incident.location}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Speed at event</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-ink">{incident.speed} km/h</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Detection confidence</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-ink">{Math.round(incident.confidence * 100)}%</dd>
        </div>
        {incident.ttc !== null && (
          <div>
            <dt className="text-ink-muted">Time-to-collision</dt>
            <dd
              className="mt-0.5 font-medium tabular-nums"
              style={{ color: incident.ttc < 2 ? 'var(--status-critical)' : 'var(--status-serious)' }}
            >
              {incident.ttc} s
            </dd>
          </div>
        )}
        {incident.decelerationMs2 !== null && (
          <div>
            <dt className="text-ink-muted">Deceleration</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-ink">{incident.decelerationMs2} m/s²</dd>
          </div>
        )}
        {incident.behaviour && (
          <div>
            <dt className="text-ink-muted">Behaviour</dt>
            <dd className="mt-0.5 font-medium text-ink">{incident.behaviour}</dd>
          </div>
        )}
        <div className="col-span-2 sm:col-span-3">
          <dt className="text-ink-muted">Sensor sources</dt>
          <dd className="mt-0.5 flex flex-wrap gap-1">
            {incident.sensorSources.map((s) => (
              <span key={s} className="badge">{s}</span>
            ))}
          </dd>
        </div>
      </dl>

      {/* ANPR block */}
      {incident.vehicleNumber && (
        <div className="rounded-md border border-hairline bg-surface-muted p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <ScanLine className="h-3.5 w-3.5 text-ink-muted" strokeWidth={1.75} />
            <p className="text-xs font-semibold text-ink">ANPR / OCR detection</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-ink-muted">Registration</dt>
              <dd className="mt-0.5 font-semibold tabular-nums tracking-wider text-ink">
                {incident.vehicleNumber}
              </dd>
            </div>
            {incident.vehicleType && (
              <div>
                <dt className="text-ink-muted">Vehicle type</dt>
                <dd className="mt-0.5 font-medium text-ink">{incident.vehicleType}</dd>
              </div>
            )}
            {incident.plateConfidence !== null && (
              <div>
                <dt className="text-ink-muted">Plate confidence</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-ink">
                  {Math.round(incident.plateConfidence * 100)}%
                </dd>
              </div>
            )}
          </dl>
          <p className="mt-2 text-label text-ink-muted">
            Registration data is operational context. Treated as a confidence estimate, not a definitive identification.
          </p>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Near-Miss Panel                                                              */
/* -------------------------------------------------------------------------- */

function NearMissPanel({ stats }: { stats: ReturnType<typeof getSafetyData>['nearMiss'] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="label-eyebrow">Near misses today</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-ink">
            {stats.countToday}
          </p>
        </div>
        <div className="card p-4">
          <p className="label-eyebrow">Closest call (TTC)</p>
          <p
            className="mt-2 text-2xl font-semibold tabular-nums tracking-tight"
            style={{ color: stats.minTtc < 1.5 ? 'var(--status-critical)' : 'var(--status-serious)' }}
          >
            {stats.minTtc}
            <span className="ml-1 text-sm font-normal text-ink-muted">s</span>
          </p>
        </div>
        <div className="card p-4">
          <p className="label-eyebrow">Avg TTC</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-ink">
            {stats.avgTtc}
            <span className="ml-1 text-sm font-normal text-ink-muted">s</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Vehicle near misses',     value: stats.vehicleNearMisses,    icon: Car },
          { label: 'Pedestrian near misses',  value: stats.pedestrianNearMisses, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken">
              <Icon className="h-4 w-4 text-ink-secondary" strokeWidth={1.75} />
            </span>
            <div>
              <p className="label-eyebrow">{label}</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-ink">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TTC risk note */}
      <p className="flex gap-2 rounded-md border border-hairline bg-surface-muted px-3 py-2 text-label leading-relaxed text-ink-secondary">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" strokeWidth={1.75} />
        <span>
          Time-to-collision (TTC) is estimated from camera trajectory and IMU data.
          Events below 2.0 s are treated as near-miss threshold events.
          Values are confidence estimates, not definitive measurements.
        </span>
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Safety Hotspots                                                              */
/* -------------------------------------------------------------------------- */

const RISK_DOT: Record<'Moderate' | 'High' | 'Critical', string> = {
  Moderate: 'var(--status-warning)',
  High:     'var(--status-serious)',
  Critical: 'var(--status-critical)',
}

function SafetyHotspots({ hotspots }: { hotspots: ReturnType<typeof getSafetyData>['hotspots'] }) {
  return (
    <ul className="space-y-2.5">
      {hotspots.map((h, i) => (
        <li key={h.location + i} className="flex items-start gap-3 rounded-md border border-hairline p-3">
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded"
            style={{ backgroundColor: `${RISK_DOT[h.riskLevel]}22` }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: RISK_DOT[h.riskLevel] }}
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <p className="truncate text-xs font-semibold text-ink">{h.location}</p>
              <span
                className="shrink-0 text-label font-medium"
                style={{ color: RISK_DOT[h.riskLevel] }}
              >
                {h.riskLevel}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-3">
              <EventTypeBadge type={h.primaryType} />
              <span className="text-label text-ink-muted tabular-nums">{h.eventCount} events</span>
            </div>
          </div>
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" strokeWidth={1.75} />
        </li>
      ))}
    </ul>
  )
}

/* -------------------------------------------------------------------------- */
/* Live event timeline                                                          */
/* -------------------------------------------------------------------------- */

function LiveEventTimeline({ incidents }: { incidents: SafetyIncident[] }) {
  const { items } = useEventFeed(
    incidents.slice(0, 5).map((inc) => ({
      id: inc.id,
      eventType: inc.eventType,
      severity: inc.severity,
      timestamp: inc.timestamp.slice(11, 19),
      location: inc.location,
      detail:
        inc.ttc !== null
          ? `TTC: ${inc.ttc} s`
          : inc.decelerationMs2 !== null
            ? `Decel: ${inc.decelerationMs2} m/s²`
            : `Speed: ${inc.speed} km/h`,
    })),
    (index) => {
      const live = produceLiveEvent(index)
      return {
        id: live.id,
        eventType: live.eventType,
        severity: live.severity,
        timestamp: live.timestamp.slice(11, 19),
        location: live.location,
        detail: live.detail,
      }
    },
    5800,
    8,
  )

  return (
    <ul className="divide-y divide-hairline">
      {items.map((item) => {
        const Icon = EVENT_ICON[item.eventType]
        return (
          <li key={item.id} className="flex gap-3 py-2.5 first:pt-0">
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded"
              style={{ backgroundColor: `${SEVERITY_COLOR[item.severity]}1a` }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} style={{ color: SEVERITY_COLOR[item.severity] }} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-ink">{EVENT_LABEL[item.eventType]}</span>
                <span className="shrink-0 text-label tabular-nums text-ink-muted">{item.timestamp}</span>
              </div>
              <p className="mt-0.5 truncate text-label text-ink-secondary">{item.location}</p>
              <p className="mt-0.5 text-label text-ink-muted">{item.detail}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* -------------------------------------------------------------------------- */
/* Score Formula breakdown                                                      */
/* -------------------------------------------------------------------------- */

function ScoreBreakdownCard({ breakdown }: { breakdown: ReturnType<typeof getSafetyData>['scoreBreakdown'] }) {
  const scoreColor = safetyScoreColor(breakdown.score)
  const scoreLabel = safetyScoreLabel(breakdown.score)

  const penalties = [
    { label: 'Harsh braking penalty',  value: breakdown.harshBrakingPenalty, max: 30 },
    { label: 'Overspeed penalty',      value: breakdown.overspeedPenalty,    max: 20 },
    { label: 'Near-miss penalty',      value: breakdown.nearMissPenalty,     max: 25 },
    { label: 'Incident penalty',       value: breakdown.incidentPenalty,     max: 15 },
  ]

  return (
    <section className="card">
      <header className="card-header">
        <div className="min-w-0">
          <h3 className="card-title">Safety score formula</h3>
          <p className="card-subtitle">100 minus event penalties — each term shown</p>
        </div>
      </header>
      <div className="card-body space-y-4">
        <div className="flex items-center gap-4">
          <Gauge value={breakdown.score} label={scoreLabel} color={scoreColor} size={96} />
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-xs text-ink-secondary">
              Score = 100 − harsh braking − overspeed − near misses − incidents
            </p>
            <p className="text-label text-ink-muted">
              Penalties are capped individually so no single behaviour saturates the scale.
            </p>
          </div>
        </div>

        <ul className="space-y-2.5">
          {penalties.map((p) => (
            <li key={p.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="truncate text-xs text-ink-secondary">{p.label}</span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">
                  −{formatNumber(p.value, 1)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-sm bg-surface-sunken">
                <div
                  className="h-full rounded-sm bg-[var(--series-2)]"
                  style={{ width: `${(p.value / p.max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-baseline justify-between rounded-md border border-hairline-strong bg-surface-sunken px-3 py-2">
          <span className="text-xs font-medium text-ink-secondary">Final score</span>
          <span className="text-xl font-semibold tabular-nums tracking-tight" style={{ color: scoreColor }}>
            {formatNumber(breakdown.score, 1)}<span className="ml-1 text-xs font-normal text-ink-muted">/100</span>
          </span>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Main dashboard                                                               */
/* -------------------------------------------------------------------------- */

export function SafetyIntelligenceDashboard({ busId }: { busId: string }) {
  const bus  = BUSES.find((b) => b.id === busId)
  const data = useMemo(() => getSafetyData(busId), [busId])

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    data.incidents[0]?.id ?? null,
  )

  const selectedIncident = data.incidents.find((i) => i.id === selectedIncidentId) ?? data.incidents[0]

  const criticalCount  = data.incidents.filter((i) => i.severity === 'Critical').length
  const highCount      = data.incidents.filter((i) => i.severity === 'High').length
  const anprCaptured   = data.incidents.filter((i) => i.vehicleNumber !== null).length

  const scoreColor = safetyScoreColor(data.scoreBreakdown.score)

  function handleIncidentSelect(id: string) {
    setSelectedIncidentId(id)
    // Scroll the reconstruction panel into view on small screens.
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('si-reconstruction')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6 px-4 py-5 sm:px-6 sm:py-6">
      {/* Page heading */}
      <header>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-ink">Safety Intelligence</h1>
          <LiveStatus />
        </div>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Real-time driving behaviour, incident and near-miss intelligence for{' '}
          {bus?.fleetNumber ?? busId} on {bus?.route ?? 'assigned route'}.
          Derived from camera, IMU, GPS, CAN/OBD and ANPR fusion at the edge.
        </p>
      </header>

      {/* 1 — KPI tiles */}
      <section aria-label="Safety KPIs">
        <SectionHeading title="Safety overview" hint="Current shift · derived from all sensor streams" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <div className="card col-span-2 flex items-center gap-4 p-4 xl:col-span-1">
            <Gauge value={data.scoreBreakdown.score} label="Safety score" color={scoreColor} size={84} />
            <div className="min-w-0 flex-1">
              <p className="label-eyebrow">Status</p>
              <p className="mt-0.5 text-sm font-semibold" style={{ color: scoreColor }}>
                {safetyScoreLabel(data.scoreBreakdown.score)}
              </p>
            </div>
          </div>
          <StatTile
            label="Safety incidents"
            value={data.incidents.length}
            live="climb"
            caption={`${criticalCount} critical · ${highCount} high`}
            accent={criticalCount > 0 ? 'var(--status-critical)' : undefined}
            icon={<ShieldAlert className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Near misses"
            value={data.nearMiss.countToday}
            live="climb"
            caption={`Closest TTC: ${data.nearMiss.minTtc} s`}
            accent={data.nearMiss.minTtc < 1.5 ? 'var(--status-critical)' : 'var(--status-serious)'}
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Harsh braking"
            value={data.behaviour.harshBrakingCount}
            live="climb"
            caption="IMU deceleration events"
            icon={<TrendingDown className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Overspeed events"
            value={data.behaviour.overspeedCount}
            live="climb"
            caption={`Max speed: ${data.behaviour.maxSpeedKmh} km/h`}
            icon={<GaugeIcon className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Pedestrian risk"
            value={data.nearMiss.pedestrianNearMisses}
            caption={`${anprCaptured} plates captured by ANPR`}
            live="climb"
            icon={<Users className="h-3.5 w-3.5" />}
          />
        </div>
      </section>

      {/* 2 — Driving behaviour */}
      <section aria-label="Driving behaviour">
        <SectionHeading
          title="Driving behaviour"
          hint="IMU, CAN/OBD and GPS — no additional hardware"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card
            title="Safety event trend"
            subtitle="Harsh braking, near misses and overspeed — last 12 weeks"
            className="xl:col-span-2"
          >
            <SafetyTrendChart data={data.trend} />
          </Card>

          <div className="flex flex-col gap-4">
            <Card title="Event counts" subtitle="This shift — from CAN/OBD and IMU">
              <BehaviourBars behaviour={data.behaviour} />
            </Card>

            <Card title="Speed profile" subtitle="Current shift">
              <dl className="space-y-2 text-xs">
                {[
                  { label: 'Average speed', value: `${data.behaviour.avgSpeedKmh} km/h`, icon: GaugeIcon },
                  { label: 'Maximum speed', value: `${data.behaviour.maxSpeedKmh} km/h`, icon: TrendingUp },
                  { label: 'Unsafe following', value: `${data.behaviour.unsafeFollowingCount} events`, icon: Car },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-ink-muted">
                      <Icon className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                      {label}
                    </dt>
                    <dd className="font-semibold tabular-nums text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </div>
      </section>

      {/* 3 — Incidents table */}
      <section aria-label="Incidents">
        <SectionHeading title="Incidents" hint="Click a row to open the reconstruction below" />
        <Card title="All incidents" subtitle="Sorted by severity · select a row for details" bleed>
          <IncidentTable
            incidents={data.incidents}
            onSelect={handleIncidentSelect}
            selectedId={selectedIncidentId}
          />
        </Card>
      </section>

      {/* 4 — Near miss + Pedestrian safety */}
      <section aria-label="Near-miss and pedestrian safety">
        <SectionHeading title="Near-miss detection" hint="Camera trajectory + TTC estimation" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <NearMissPanel stats={data.nearMiss} />
          </div>
          <ScoreBreakdownCard breakdown={data.scoreBreakdown} />
        </div>
      </section>

      {/* 5 — Incident reconstruction */}
      <section id="si-reconstruction" aria-label="Incident reconstruction">
        <SectionHeading
          title="Incident reconstruction"
          hint={selectedIncident ? `Selected: ${selectedIncident.id}` : 'Select an incident from the table above'}
        />
        {selectedIncident ? (
          <Card title="Incident detail" subtitle="Sensor-fusion reconstruction of the selected event">
            <IncidentReconstruction incident={selectedIncident} />
          </Card>
        ) : (
          <div className="flex h-24 items-center justify-center rounded-lg border border-hairline bg-surface text-sm text-ink-muted">
            Select an incident from the table above to view its reconstruction.
          </div>
        )}
      </section>

      {/* 6 — Safety hotspots + live timeline */}
      <section aria-label="Safety hotspots and timeline">
        <SectionHeading
          title="Safety hotspots"
          hint="Locations with repeated safety events on this route"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card
            title="Hotspot locations"
            subtitle="Repeated safety events — most frequent first"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex flex-wrap gap-3 text-label">
                {(['Moderate', 'High', 'Critical'] as const).map((r) => (
                  <span key={r} className="flex items-center gap-1.5 text-ink-secondary">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_DOT[r] }} />
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <SafetyHotspots hotspots={data.hotspots} />
          </Card>

          <Card
            title="Live event timeline"
            subtitle="Safety events arriving from edge — newest first"
          >
            <LiveEventTimeline incidents={data.incidents} />
          </Card>
        </div>
      </section>

      {/* 7 — Safety trend (12-week score history) */}
      <section aria-label="Safety trend">
        <SectionHeading title="Safety score trend" hint="12-week history for this unit" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card
            title="Score over 12 weeks"
            subtitle="How this unit's safety score has evolved"
            className="lg:col-span-2"
          >
            <div className="relative">
              <div className="mb-3 flex items-center gap-1.5">
                <svg width="14" height="2" aria-hidden="true">
                  <rect width="14" height="2" rx="1" fill={scoreColor} />
                </svg>
                <span className="text-xs text-ink-secondary">Safety score</span>
              </div>
              <ScoreSparklineLarge data={data.trend.map((d) => d.safetyScore)} color={scoreColor} weeks={data.trend.map((d) => d.week)} />
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <Card title="This week vs. 12-week avg" subtitle="Score context">
              <dl className="space-y-3 text-xs">
                {[
                  {
                    label: '12-week average',
                    value: formatNumber(
                      data.trend.reduce((s, d) => s + d.safetyScore, 0) / data.trend.length,
                      1,
                    ),
                  },
                  {
                    label: 'Best week',
                    value: formatNumber(Math.max(...data.trend.map((d) => d.safetyScore)), 1),
                  },
                  {
                    label: 'Worst week',
                    value: formatNumber(Math.min(...data.trend.map((d) => d.safetyScore)), 1),
                  },
                  {
                    label: 'Current score',
                    value: formatNumber(data.scoreBreakdown.score, 1),
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <dt className="text-ink-muted">{label}</dt>
                    <dd className="font-semibold tabular-nums text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card title="URBANOS pipeline" subtitle="How this score is produced">
              <ol className="space-y-1.5 text-label">
                {[
                  { step: 'Camera + IMU + GPS + CAN',   icon: Zap },
                  { step: 'Edge AI — Hailo accelerator', icon: Cpu },
                  { step: 'Event detection & fusion',   icon: ShieldCheck },
                  { step: 'Risk scoring',               icon: Timer },
                  { step: 'Safety Intelligence',         icon: ShieldAlert },
                ].map(({ step, icon: Icon }) => (
                  <li key={step} className="flex items-center gap-2 text-ink-secondary">
                    <Icon className="h-3 w-3 shrink-0 text-ink-muted" strokeWidth={1.75} />
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Score sparkline — full-width version for the trend card                      */
/* -------------------------------------------------------------------------- */

function ScoreSparklineLarge({ data, color, weeks }: { data: number[]; color: string; weeks: string[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const W = 680
  const H = 160
  const PAD = { top: 10, right: 10, bottom: 24, left: 36 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const min = Math.max(0,   Math.min(...data) - 5)
  const max = Math.min(100, Math.max(...data) + 5)
  const span = max - min || 1

  const xAt = (i: number) => PAD.left + (i / (data.length - 1)) * plotW
  const yAt = (v: number) => PAD.top + (1 - (v - min) / span) * plotH

  const line  = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(' ')
  const area  = `${line} L${(PAD.left + plotW).toFixed(1)} ${PAD.top + plotH} L${PAD.left} ${PAD.top + plotH} Z`
  const ticks = [min, (min + max) / 2, max].map((v) => Math.round(v))

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.round(((x - PAD.left) / plotW) * (data.length - 1))
    setHoverIndex(Math.min(data.length - 1, Math.max(0, i)))
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        role="img"
        aria-label="Safety score over 12 weeks"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="si-score-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={PAD.left + plotW} y1={yAt(t)} y2={yAt(t)} stroke="var(--grid)" strokeWidth="1" />
            <text x={PAD.left - 7} y={yAt(t)} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="var(--ink-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {t}
            </text>
          </g>
        ))}

        {weeks.map((w, i) =>
          i % 2 === 0 || i === weeks.length - 1 ? (
            <text key={w} x={xAt(i)} y={PAD.top + plotH + 15} textAnchor="middle" fontSize="9" fill="var(--ink-muted)">
              {w}
            </text>
          ) : null,
        )}

        <line x1={PAD.left} x2={PAD.left + plotW} y1={PAD.top + plotH} y2={PAD.top + plotH} stroke="var(--axis)" strokeWidth="1" />

        <path d={area} fill="url(#si-score-area)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {data.map((v, i) => (
          <circle
            key={i}
            cx={xAt(i)}
            cy={yAt(v)}
            r={hoverIndex === i ? 4.5 : 2.5}
            fill={color}
            stroke="var(--surface)"
            strokeWidth="1.5"
            style={{ transition: 'r 150ms ease-out' }}
          />
        ))}

        {hoverIndex !== null && (
          <line
            x1={xAt(hoverIndex)} x2={xAt(hoverIndex)}
            y1={PAD.top} y2={PAD.top + plotH}
            stroke="var(--axis)" strokeWidth="1" strokeDasharray="3 3"
            pointerEvents="none"
          />
        )}
      </svg>

      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[7rem] rounded-md border border-hairline bg-surface p-2 shadow-overlay animate-in fade-in"
          style={{
            left: `${(xAt(hoverIndex) / W) * 100}%`,
            transform: hoverIndex > data.length / 2 ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)',
          }}
        >
          <p className="label-eyebrow mb-1">{weeks[hoverIndex]}</p>
          <p className="text-sm font-semibold tabular-nums" style={{ color }}>
            {formatNumber(data[hoverIndex], 1)}
          </p>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Inline Cpu icon (lucide doesn't export it by that name in older versions)    */
/* -------------------------------------------------------------------------- */

function Cpu({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth ?? 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
    </svg>
  )
}
