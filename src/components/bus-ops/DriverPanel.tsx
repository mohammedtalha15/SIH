'use client'

/**
 * DriverPanel — driving events from the IMU and CAN bus.
 *
 * Framed for TRAINING AND ROUTE-DIFFICULTY ADJUSTMENT, not enforcement. The
 * events are shown next to the route's difficulty index, because the same
 * driving produces more harsh-braking events on Silk Board than on a quiet
 * suburban loop — reading the raw count as driver quality would be wrong, and
 * a surveillance framing is a real deployment blocker with driver unions.
 */

import { GraduationCap, Info, TimerReset } from 'lucide-react'

import { formatNumber, type DriverBehaviour } from '@/lib/bus-ops-data'
import { Gauge } from '@/components/road-health/Charts'

export function DriverPanel({ driver }: { driver: DriverBehaviour }) {
  const events = [
    { label: 'Harsh braking', value: driver.harshBraking },
    { label: 'Harsh acceleration', value: driver.harshAcceleration },
    { label: 'Sharp cornering', value: driver.sharpCornering },
  ]
  const maxEvent = Math.max(...events.map((e) => e.value), 1)

  // The same event count means different things on different roads.
  const difficultyAdjusted =
    driver.harshBraking / Math.max(0.5, driver.routeDifficulty / 55)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Score + framing */}
      <section className="card">
        <header className="card-header">
          <div>
            <h3 className="card-title">Driving profile</h3>
            <p className="card-subtitle truncate">
              {driver.driverName} · {driver.driverId}
            </p>
          </div>
        </header>
        <div className="card-body space-y-4">
          <div className="flex items-center gap-4">
            <Gauge
              value={driver.safetyScore}
              label="Safety score"
              color={
                driver.safetyScore >= 75
                  ? 'var(--status-good)'
                  : driver.safetyScore >= 55
                    ? 'var(--status-warning)'
                    : 'var(--status-serious)'
              }
              size={88}
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-xs text-ink-secondary">
                Ranked{' '}
                <span className="font-semibold tabular-nums text-ink">
                  {driver.efficiencyRank}
                </span>{' '}
                of <span className="tabular-nums">{driver.efficiencyOf}</span> on fuel efficiency at
                this depot.
              </p>
              <p className="text-label text-ink-muted">
                Route difficulty index{' '}
                <span className="tabular-nums">{driver.routeDifficulty}</span>/100.
              </p>
            </div>
          </div>

          {/* The framing is part of the product, not a footnote */}
          <p className="flex gap-2 rounded-md border border-hairline bg-surface-muted px-3 py-2 text-label leading-relaxed text-ink-secondary">
            <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" strokeWidth={1.75} />
            <span>
              Used for training and route-difficulty adjustment, not for penalties. Event rates are
              compared against the difficulty of the roads actually driven.
            </span>
          </p>
        </div>
      </section>

      {/* Events */}
      <section className="card">
        <header className="card-header">
          <div>
            <h3 className="card-title">Events per 100 km</h3>
            <p className="card-subtitle">Derived from IMU and CAN, no extra hardware</p>
          </div>
        </header>
        <div className="card-body space-y-3">
          {events.map((e) => (
            <div key={e.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-xs text-ink-secondary">{e.label}</span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">
                  {formatNumber(e.value, 1)}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-surface-sunken">
                <div
                  className="h-full rounded-sm bg-[var(--series-1)]"
                  style={{ width: `${(e.value / maxEvent) * 100}%` }}
                />
              </div>
            </div>
          ))}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-hairline pt-3 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Overspeeding</dt>
              <dd className="font-medium tabular-nums text-ink">{driver.overspeedEvents}×</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Over limit for</dt>
              <dd className="font-medium tabular-nums text-ink">{driver.overspeedMinutes} min</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Idling</dt>
              <dd className="font-medium tabular-nums text-ink">{driver.idlingMinutes} min</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Adjusted braking</dt>
              <dd className="font-medium tabular-nums text-ink">
                {formatNumber(difficultyAdjusted, 1)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Fatigue */}
      <section className="card">
        <header className="card-header">
          <div>
            <h3 className="card-title">Shift &amp; fatigue</h3>
            <p className="card-subtitle">Continuous driving without a scheduled break</p>
          </div>
        </header>
        <div className="card-body space-y-3">
          <div className="flex items-baseline gap-2">
            <span
              className="text-3xl font-semibold tabular-nums tracking-tight"
              style={{
                color: driver.fatigueFlag ? 'var(--status-critical)' : 'var(--ink)',
              }}
            >
              {formatNumber(driver.continuousHours, 1)}
            </span>
            <span className="text-xs text-ink-muted">hours continuous</span>
          </div>

          {/* 4.5 h is the break threshold this MVP assumes */}
          <div className="relative h-1.5 w-full rounded-sm bg-surface-sunken">
            <div
              className="h-full rounded-sm"
              style={{
                width: `${Math.min(100, (driver.continuousHours / 8) * 100)}%`,
                backgroundColor: driver.fatigueFlag
                  ? 'var(--status-critical)'
                  : 'var(--status-good)',
              }}
            />
            <span
              className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-ink-muted"
              style={{ left: `${(4.5 / 8) * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <p className="text-label tabular-nums text-ink-muted">
            Break due at 4.5 h · shift total {driver.continuousHours} h
          </p>

          {driver.fatigueFlag ? (
            <p className="flex gap-2 rounded-md border border-hairline bg-surface-muted px-3 py-2 text-label leading-relaxed text-[var(--status-critical)]">
              <TimerReset className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
              <span>Break overdue. Scheduling should route a relief driver to the next terminus.</span>
            </p>
          ) : (
            <p className="flex gap-2 rounded-md border border-hairline bg-surface-muted px-3 py-2 text-label leading-relaxed text-ink-secondary">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" strokeWidth={1.75} />
              <span>Within the continuous-driving limit.</span>
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
