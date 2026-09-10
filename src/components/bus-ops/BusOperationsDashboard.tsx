'use client'

/**
 * BusOperationsDashboard — the Bus Operations section for one unit.
 *
 * Ordered from the immediate to the strategic: where the bus is now, the trips
 * it has run, how its route is behaving, the depot fleet around it, the
 * vehicle's own health, the driving, and finally what the demand data suggests
 * should change.
 */

import { useMemo } from 'react'
import {
  Activity,
  BatteryCharging,
  Bus,
  CircleDollarSign,
  Clock,
  Fuel,
  Gauge as GaugeIcon,
  TrendingDown,
  Users,
  Wrench,
} from 'lucide-react'

import { formatNumber, getBusOpsData } from '@/lib/bus-ops-data'
import { BUSES } from '@/lib/fleet-data'
import { StatTile } from '@/components/road-health/StatTile'
import { DemandCurve, DwellChart, ODMatrix, OpsBars } from './OpsCharts'
import { DriverPanel } from './DriverPanel'
import { HeadwayTimeline } from './HeadwayTimeline'
import { LiveBusPanel } from './LiveBusPanel'
import { TripTable } from './TripTable'
import { VehicleHealthPanel } from './VehicleHealthPanel'
import { useTick } from '@/lib/use-live'

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

export function BusOperationsDashboard({ busId }: { busId: string }) {
  const bus = BUSES.find((b) => b.id === busId)
  const registration = bus?.fleetNumber ?? busId
  const route = bus?.route ?? 'Unassigned route'

  const data = useMemo(
    () => getBusOpsData(busId, route, registration),
    [busId, route, registration],
  )

  const { live, trips, dwell, fleet, health, driver } = data
  const routeStats = data.route

  const skippedTotal = trips.reduce((s, t) => s + t.stopsSkipped, 0)
  const longestDwell = [...dwell].sort((a, b) => b.dwellSec - a.dwellSec)[0]

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6 px-4 py-5 sm:px-6 sm:py-6">
      <header>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-ink">Bus Operations</h1>
          <LiveStatus />
        </div>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Route adherence, schedule, utilisation and vehicle telemetry for {registration} on{' '}
          {route}.
        </p>
      </header>

      {/* 1 — live */}
      <section aria-label="Live status">
        <SectionHeading title="Live" hint="Where this unit is right now" />
        <LiveBusPanel live={live} />
      </section>

      {/* 2 — trips */}
      <section aria-label="Trips">
        <SectionHeading
          title="Trips today"
          hint="One row per full run — skipped stops and dwell time read first"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card
            title="Completed runs"
            subtitle="Scheduled against actual"
            className="xl:col-span-2"
            bleed
          >
            <TripTable trips={trips} />
          </Card>

          <Card
            title="Dwell time per stop"
            subtitle="Long dwell means crowding or a ticketing delay"
          >
            <DwellChart data={dwell} />
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Stops skipped today"
            value={skippedTotal}
            caption="usually a driver catching up on time"
            accent={skippedTotal > 8 ? 'var(--status-critical)' : undefined}
            icon={<TrendingDown className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Longest dwell"
            value={longestDwell.dwellSec}
            unit="s"
            caption={longestDwell.stop}
            icon={<Clock className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Avg speed"
            value={
              Math.round(
                (trips.reduce((s, t) => s + t.avgSpeedKmh, 0) / trips.length) * 10,
              ) / 10
            }
            unit="km/h"
            caption="across today's runs"
            live="drift"
            icon={<GaugeIcon className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Idle time"
            value={trips.reduce((s, t) => s + t.idleMin, 0)}
            unit="min"
            caption="engine on, not moving"
            icon={<Activity className="h-3.5 w-3.5" />}
          />
        </div>
      </section>

      {/* 3 — route, with bunching as the headline */}
      <section aria-label="Route performance">
        <SectionHeading
          title="Route performance"
          hint="Passengers feel bunching as “nothing for 25 minutes, then three at once” — a scheduling failure, not a driver one"
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card
            title="Headway &amp; bunching"
            subtitle={`${routeStats.route} · 2-hour window`}
            className="xl:col-span-2"
          >
            <HeadwayTimeline
              arrivals={routeStats.arrivals}
              scheduledHeadwayMin={routeStats.scheduledHeadwayMin}
            />
          </Card>

          <div className="flex flex-col gap-4">
            <Card title="Schedule" subtitle="Trips and punctuality">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                {[
                  ['Trips scheduled', formatNumber(routeStats.tripsScheduled)],
                  ['Trips completed', formatNumber(routeStats.tripsCompleted)],
                  ['On time (±5 min)', `${formatNumber(routeStats.onTimePct, 1)}%`],
                  ['Avg delay', `${formatNumber(routeStats.avgDelayMin, 1)} min`],
                  ['Delay variance', `±${formatNumber(routeStats.delayVarianceMin, 1)} min`],
                  ['Headway adherence', `${formatNumber(routeStats.headwayAdherencePct, 1)}%`],
                  ['Avg load', `${formatNumber(routeStats.avgLoad)} pax`],
                  ['Load factor', `${formatNumber(routeStats.loadFactorPct, 1)}%`],
                  ['Overcrowded trips', formatNumber(routeStats.overcrowdedTrips)],
                  ['Empty running', formatNumber(routeStats.emptyRunningTrips)],
                  ['Revenue per km', `₹${formatNumber(routeStats.revenuePerKm, 1)}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="truncate text-ink-muted">{k}</dt>
                    <dd className="shrink-0 font-medium tabular-nums text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card title="Delay hotspots" subtitle="Which segments eat the time">
              <OpsBars
                data={routeStats.hotspots.map((h) => ({
                  label: h.segment,
                  value: h.minutesLost,
                  note: `across ${h.trips} trips`,
                }))}
                unit=" min"
              />
            </Card>
          </div>
        </div>
      </section>

      {/* 4 — fleet */}
      <section aria-label="Fleet">
        <SectionHeading title="Depot fleet" hint="The pool this unit belongs to" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <StatTile
            label="In service"
            value={fleet.inService}
            caption={`of ${fleet.totalFleet} buses`}
            icon={<Bus className="h-3.5 w-3.5" />}
          />
          <StatTile label="Availability" value={fleet.availabilityPct} unit="%" />
          <StatTile
            label="Km driven today"
            value={fleet.kmToday}
            live="climb"
            icon={<GaugeIcon className="h-3.5 w-3.5" />}
          />
          <StatTile label="Fleet on-time" value={fleet.onTimePct} unit="%" />
          <StatTile
            label="Passengers today"
            value={fleet.passengersToday}
            live="climb"
            icon={<Users className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Cost per km"
            value={fleet.costPerKm}
            unit="₹"
            icon={<CircleDollarSign className="h-3.5 w-3.5" />}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Off-road buses" subtitle="And why they are not running">
            <OpsBars data={fleet.offRoad.map((o) => ({ label: o.reason, value: o.count }))} />
          </Card>

          <Card title="Energy" subtitle="Diesel and electric halves of the fleet">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              {[
                ['Km per litre', `${formatNumber(fleet.kmPerLitre, 2)}`, Fuel],
                ['Km per kWh', `${formatNumber(fleet.kmPerKwh, 2)}`, BatteryCharging],
                ['Diesel used', `${formatNumber(fleet.dieselLitres)} L`, Fuel],
                ['Energy used', `${formatNumber(fleet.energyKwh)} kWh`, BatteryCharging],
              ].map(([k, v, Icon]) => {
                const I = Icon as typeof Fuel
                return (
                  <div key={k as string} className="flex justify-between gap-2">
                    <dt className="flex min-w-0 items-center gap-1.5 text-ink-muted">
                      <I className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{k as string}</span>
                    </dt>
                    <dd className="shrink-0 font-medium tabular-nums text-ink">{v as string}</dd>
                  </div>
                )
              })}
            </dl>
            <div className="mt-3 border-t border-hairline pt-3">
              <div className="flex justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-ink-muted">
                  <Wrench className="h-3 w-3" strokeWidth={1.75} />
                  Breakdowns per 10,000 km
                </span>
                <span className="font-medium tabular-nums text-ink">
                  {formatNumber(fleet.breakdownsPer10kKm, 2)}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Load factor" subtitle="Average seat occupancy across the depot">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums tracking-tight text-ink">
                {formatNumber(fleet.avgLoadFactorPct, 1)}
              </span>
              <span className="text-xs text-ink-muted">%</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-sm bg-surface-sunken">
              <div
                className="h-full rounded-sm bg-[var(--series-1)]"
                style={{ width: `${fleet.avgLoadFactorPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
              Below about 40% suggests empty running; above 90% means passengers are being left
              behind at stops.
            </p>
          </Card>
        </div>
      </section>

      {/* 5 — vehicle health */}
      <section aria-label="Vehicle health">
        <SectionHeading
          title="Vehicle health"
          hint="A threshold engine over live fault codes — not a trained model"
        />
        <VehicleHealthPanel health={health} />
      </section>

      {/* 6 — driver */}
      <section aria-label="Driver behaviour">
        <SectionHeading
          title="Driving"
          hint="For training and route-difficulty adjustment, not penalties"
        />
        <DriverPanel driver={driver} />
      </section>

      {/* 7 — demand and planning */}
      <section aria-label="Demand and planning">
        <SectionHeading
          title="Demand &amp; planning"
          hint="What the boarding data suggests should change"
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card
            title="Demand against capacity"
            subtitle="Passengers wanting to travel vs seats offered, by hour"
            className="xl:col-span-2"
          >
            <DemandCurve data={data.hourly} />
          </Card>

          <Card title="Busiest stops" subtitle="Boardings across the route">
            <OpsBars
              data={[...data.stopDemand]
                .sort((a, b) => b.boardings - a.boardings)
                .slice(0, 7)
                .map((s) => ({
                  label: s.stop,
                  value: s.boardings,
                  note: `${s.alightings} alightings`,
                }))}
            />
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Origin–destination flows" subtitle="Journeys between the route's main stops">
            <ODMatrix stops={data.odStops} matrix={data.odMatrix} />
          </Card>

          <Card title="Frequency recommendations" subtitle="Demand index against trips per hour">
            <ul className="space-y-3">
              {data.corridors.map((c) => {
                const color =
                  c.verdict === 'Underserved'
                    ? 'var(--status-critical)'
                    : c.verdict === 'Overserved'
                      ? 'var(--status-warning)'
                      : 'var(--status-good)'
                return (
                  <li key={c.corridor} className="border-b border-hairline pb-3 last:border-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-xs font-medium text-ink">{c.corridor}</span>
                      <span className="badge shrink-0">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                        {c.verdict}
                      </span>
                    </div>
                    <p className="mt-1 text-label tabular-nums text-ink-muted">
                      Demand index {c.demandIndex} · {c.frequencyPerHour} trips/hour
                    </p>
                    <p className="text-label font-medium text-ink-secondary">{c.suggestion}</p>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </section>
    </div>
  )
}
