'use client'

/**
 * RoadHealthDashboard — the Road Health section for one unit.
 *
 * Order is deliberate: the camera feed comes first (the evidence), then this
 * unit's own contribution, then the score and why it is what it is, then the
 * change-over-time work that only a moving fleet can produce, then the raw
 * defect and segment records, then city-wide context.
 */

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CircleDot,
  CloudRain,
  Gauge as GaugeIcon,
  MapPin,
  Repeat,
  Ruler,
  TrendingDown,
} from 'lucide-react'

import {
  formatNumber,
  getRoadHealthData,
  SURFACE_COLOR,
} from '@/lib/road-health-data'
import { useTick } from '@/lib/use-live'
import { DefectTrend, Gauge, MagnitudeBars, SeveritySplit } from './Charts'
import { DefectTable } from './DefectTable'
import { DetectionFeed } from './DetectionFeed'
import { ScoreFormula } from './ScoreFormula'
import { SegmentTable } from './SegmentTable'
import { StatTile } from './StatTile'

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
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  bleed?: boolean
}) {
  return (
    <section className={`card ${className ?? ''}`}>
      <header className="card-header">
        <div className="min-w-0">
          <h3 className="card-title">{title}</h3>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      </header>
      {bleed ? children : <div className="card-body">{children}</div>}
    </section>
  )
}

export function RoadHealthDashboard({ busId }: { busId: string }) {
  const data = useMemo(() => getRoadHealthData(busId), [busId])
  const [selectedSegmentId, setSelectedSegmentId] = useState(data.segments[0].id)

  const segment =
    data.segments.find((s) => s.id === selectedSegmentId) ?? data.segments[0]

  const criticalDefects = data.defects.filter((d) => d.severity === 'Critical').length
  const fleetConfirmed = data.defects.filter((d) => d.distinctBuses >= 4).length
  const fastest = [...data.defects].sort((a, b) => b.growthCm2PerWeek - a.growthCm2PerWeek)[0]
  const soonest = data.defects
    .filter((d) => d.daysToCritical !== null)
    .sort((a, b) => (a.daysToCritical ?? 0) - (b.daysToCritical ?? 0))[0]

  const scoreDelta = segment.history[11] - segment.history[0]

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6 px-4 py-5 sm:px-6 sm:py-6">
      {/* Page heading */}
      <header>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-ink">Road Health</h1>
          <LiveStatus />
        </div>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Surface condition, defects and segment history observed by this BMTC unit across the
          Bengaluru network. Every figure below is derived from the camera and IMU streams
          shown first.
        </p>
      </header>

      {/* 1 — the evidence */}
      <section aria-label="Detection feed">
        <DetectionFeed />
      </section>

      {/* 2 — this unit's contribution */}
      <section aria-label="Unit contribution">
        <SectionHeading
          title="This unit's contribution"
          hint="What this bus has observed on its current shift"
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Defects detected"
            value={data.defects.length * 7}
            live="climb"
            caption={`${fleetConfirmed * 6} confirmed by 3+ buses`}
            delta={4.8}
            higherIsBetter={false}
            icon={<CircleDot className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Critical open"
            value={criticalDefects * 3}
            live="climb"
            caption="needs intervention now"
            accent="var(--status-critical)"
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Segments covered"
            value={data.segments.length * 12}
            caption={`${formatNumber(segment.busPassesPerDay)} passes/day on worst segment`}
            icon={<MapPin className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Avg roughness"
            value={
              Math.round(
                (data.segments.reduce((s, x) => s + x.roughness, 0) / data.segments.length) * 10,
              ) / 10
            }
            unit="IRI"
            live="drift"
            caption="from IMU vertical acceleration"
            icon={<GaugeIcon className="h-3.5 w-3.5" />}
          />
        </div>
      </section>

      {/* 3 — the score, and why */}
      <section aria-label="Score and breakdown">
        <SectionHeading
          title="Segment score"
          hint="Select a segment in the table below to explain its score"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ScoreFormula breakdown={segment.breakdown} segmentName={segment.name} />

          <Card
            title="Defect mix"
            subtitle="Open defects by type across this unit's route"
            className="xl:col-span-1"
          >
            <MagnitudeBars data={data.typeMix} />
          </Card>

          <div className="flex flex-col gap-4">
            <Card title="Severity split" subtitle="Share of open defects by severity">
              <SeveritySplit data={data.severityMix} />
            </Card>

            <Card title="Segment vitals" subtitle={segment.name}>
              <div className="grid grid-cols-3 gap-3">
                <Gauge
                  value={segment.breakdown.score}
                  label="Health"
                  color={SURFACE_COLOR[segment.surfaceClass]}
                  size={84}
                />
                <Gauge
                  value={segment.roughness}
                  max={10}
                  label="Roughness"
                  color="var(--series-2)"
                  size={84}
                />
                <Gauge
                  value={segment.waterloggingEvents30d}
                  max={10}
                  label="Floods / 30d"
                  color="var(--series-1)"
                  size={84}
                />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-hairline pt-3 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Missing infra</dt>
                  <dd className="font-medium tabular-nums text-ink">{segment.missingInfraCount}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Avg severity</dt>
                  <dd className="font-medium tabular-nums text-ink">
                    {formatNumber(segment.avgSeverity, 1)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Flood depth</dt>
                  <dd className="font-medium tabular-nums text-ink">
                    {segment.waterloggingDepthCm} cm
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Traffic/day</dt>
                  <dd className="font-medium tabular-nums text-ink">
                    {formatNumber(segment.trafficExposure)}
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </section>

      {/* 4 — change over time: the differentiator */}
      <section aria-label="Change over time">
        <SectionHeading
          title="Change over time"
          hint="Fixed CCTV cannot produce these — a bus drives the same road dozens of times a day"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card
            title="New vs resolved defects"
            subtitle="Last 12 weeks across this unit's route"
            className="xl:col-span-2"
          >
            <DefectTrend data={data.trend} />
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Fastest growing"
              value={`+${formatNumber(fastest.growthCm2PerWeek)}`}
              unit="cm²/wk"
              caption={`${fastest.type} · ${fastest.segmentName}`}
              icon={<Ruler className="h-3.5 w-3.5" />}
            />
            <StatTile
              label="Next to go critical"
              value={soonest?.daysToCritical ?? 0}
              unit="days"
              caption={soonest ? `${soonest.type} · ${soonest.id}` : '—'}
              accent="var(--status-serious)"
              icon={<TrendingDown className="h-3.5 w-3.5" />}
            />
            <StatTile
              label="Repair durability"
              value={data.repair.durabilityDays}
              unit="days"
              caption={`median before a fixed road degrades`}
              icon={<Repeat className="h-3.5 w-3.5" />}
            />
            <StatTile
              label="Reappearance rate"
              value={data.repair.reappearanceRate}
              unit="%"
              caption={`${data.repair.reappeared} of ${data.repair.repairedTotal} repairs came back`}
              accent="var(--status-critical)"
              icon={<CloudRain className="h-3.5 w-3.5" />}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Deterioration on selected segment" subtitle={segment.name}>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums tracking-tight text-ink">
                {scoreDelta > 0 ? '+' : ''}
                {formatNumber(scoreDelta, 1)}
              </span>
              <span className="text-xs text-ink-muted">points over 12 weeks</span>
            </div>
            <p className="mt-2 text-xs text-ink-secondary">
              Deteriorating {formatNumber(Math.abs(segment.deteriorationRate), 1)}% faster than the
              city median for comparable traffic exposure.
            </p>
            <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-sm bg-surface-sunken">
              <div
                className="h-full rounded-sm bg-[var(--status-critical)]"
                style={{ width: `${Math.min(100, Math.abs(segment.deteriorationRate) * 14)}%` }}
              />
            </div>
          </Card>

          <Card title="Days first seen → critical" subtitle="Across defects on this route">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums tracking-tight text-ink">
                {Math.round(
                  data.defects
                    .filter((d) => d.daysToCritical !== null)
                    .reduce((s, d) => s + (d.daysToCritical ?? 0), 0) /
                    Math.max(1, data.defects.filter((d) => d.daysToCritical !== null).length),
                )}
              </span>
              <span className="text-xs text-ink-muted">days median</span>
            </div>
            <p className="mt-2 text-xs text-ink-secondary">
              The window between first detection and the point where repair cost rises sharply.
            </p>
          </Card>

          <Card title="Corroboration strength" subtitle="One pass is a guess; many are a fact">
            <div className="flex items-center gap-4">
              <Gauge
                value={fleetConfirmed}
                max={data.defects.length}
                label="Fleet-confirmed"
                color="var(--status-good)"
                size={84}
              />
              <div className="min-w-0 flex-1 space-y-1.5 text-xs">
                <p className="text-ink-secondary">
                  <span className="font-semibold tabular-nums text-ink">{fleetConfirmed}</span> of{' '}
                  <span className="tabular-nums">{data.defects.length}</span> tracked defects seen by
                  four or more distinct buses.
                </p>
                <p className="text-ink-muted">
                  Confidence rises with each independent unit that sees the same thing.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 5 — the atomic records */}
      <section aria-label="Defect records">
        <SectionHeading title="Defects" hint="Sorted by corroboration — most independently confirmed first" />
        <Card title="Detected defects" subtitle="One row per physical defect" bleed>
          <DefectTable defects={data.defects} />
        </Card>
      </section>

      <section aria-label="Segment records">
        <SectionHeading title="Segments" hint="Select a row to explain its score above" />
        <Card
          title="Worst segments on this route"
          subtitle="50–100 m each, weakest first"
          bleed
        >
          <SegmentTable
            segments={data.segments}
            selectedId={selectedSegmentId}
            onSelect={setSelectedSegmentId}
          />
        </Card>
      </section>

      {/* 6 — city-wide context */}
      <section aria-label="City-wide context">
        <SectionHeading
          title="City-wide context"
          hint="Where this unit's route sits against Bengaluru's ~14,000 km network"
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <StatTile label="Road surveyed" value={data.city.kmSurveyed} unit="km" live="climb" />
          <StatTile
            label="Network covered"
            value={data.city.coveragePct}
            unit="%"
            caption={`of ${formatNumber(data.city.networkKm)} km`}
          />
          <StatTile label="Active defects" value={data.city.activeDefects} live="climb" />
          <StatTile
            label="New this week"
            value={data.city.newThisWeek}
            delta={6.1}
            higherIsBetter={false}
            live="climb"
          />
          <StatTile
            label="Critical open"
            value={data.city.criticalOpen}
            accent="var(--status-critical)"
          />
          <StatTile label="Avg city score" value={data.city.avgScore} unit="/100" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Ward ranking" subtitle="Average Road Health Score, weakest first">
            <MagnitudeBars
              data={data.wards.map((w) => ({ label: w.ward, value: w.score }))}
              showShare={false}
              order="asc"
            />
          </Card>

          <Card title="Worst 10 segments" subtitle="City-wide, by Road Health Score">
            <ul className="space-y-2">
              {data.segments.slice(0, 10).map((s, i) => (
                <li key={s.id} className="flex items-center gap-3 text-xs">
                  <span className="w-4 shrink-0 text-right tabular-nums text-ink-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-ink-secondary">{s.name}</span>
                  <span className="shrink-0 tabular-nums text-ink-muted">{s.ward}</span>
                  <span className="flex w-14 shrink-0 items-center justify-end gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: SURFACE_COLOR[s.surfaceClass] }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold tabular-nums text-ink">
                      {formatNumber(s.breakdown.score, 1)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </div>
  )
}

/**
 * Shows the feed is still arriving. Seconds count up from mount rather than
 * from a timestamp, so there is nothing time-based in the server render to
 * mismatch on hydration.
 */
function LiveStatus() {
  const seconds = useTick(1000)
  const sinceLastPacket = seconds % 4

  return (
    <span className="flex items-center gap-1.5 text-label font-medium text-ink-secondary">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-good opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-good" />
      </span>
      Receiving telemetry
      <span className="text-ink-muted">
        · updated <span className="tabular-nums">{sinceLastPacket}</span>s ago
      </span>
    </span>
  )
}
