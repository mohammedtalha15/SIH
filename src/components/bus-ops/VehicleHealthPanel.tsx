'use client'

/**
 * VehicleHealthPanel — CAN/OBD readings, fault codes and service state.
 *
 * The risk level is a THRESHOLD ENGINE over live fault codes, not a trained
 * model — there is no failure history behind this MVP to justify calling it a
 * prediction. So the rules are printed alongside the verdict and the panel
 * lists which of them actually fired. Anything else would be overclaiming.
 */

import { AlertTriangle, Info, ShieldAlert, Wrench } from 'lucide-react'

import {
  formatNumber,
  READING_COLOR,
  RISK_COLOR,
  RISK_RULES,
  SEVERITY_COLOR,
  type VehicleHealth,
} from '@/lib/bus-ops-data'

const SEVERITY_ICON = {
  Info,
  Warning: AlertTriangle,
  Critical: ShieldAlert,
} as const

export function VehicleHealthPanel({ health }: { health: VehicleHealth }) {
  const serviceDuePct = Math.min(120, (health.kmSinceService / health.serviceIntervalKm) * 100)
  const overdue = health.kmSinceService > health.serviceIntervalKm

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {/* Live readings */}
      <section className="card">
        <header className="card-header">
          <div>
            <h3 className="card-title">Live readings</h3>
            <p className="card-subtitle">From the CAN bus, against operating bands</p>
          </div>
        </header>
        <div className="card-body space-y-4">
          {health.readings.map((r) => {
            const span = r.max - r.min
            // Clamp so an out-of-band reading still renders inside the track.
            const pos = Math.max(0, Math.min(100, ((r.value - r.min) / span) * 100))
            return (
              <div key={r.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-xs text-ink-secondary">{r.label}</span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">
                    {r.value}
                    <span className="ml-0.5 font-normal text-ink-muted">{r.unit}</span>
                  </span>
                </div>
                <div className="relative mt-2 h-1.5 w-full rounded-sm bg-surface-sunken">
                  <span
                    className="absolute top-1/2 h-3 w-[3px] -translate-y-1/2 rounded-full"
                    style={{ left: `${pos}%`, backgroundColor: READING_COLOR[r.state] }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-label tabular-nums text-ink-muted">
                  <span>{r.min}</span>
                  <span style={{ color: READING_COLOR[r.state] }}>{r.state}</span>
                  <span>{r.max}</span>
                </div>
              </div>
            )
          })}

          {/* Brake wear */}
          <div className="border-t border-hairline pt-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-ink-secondary">Brake wear</span>
              <span className="text-xs font-semibold tabular-nums text-ink">
                {health.brakeWearPct}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-sm bg-surface-sunken">
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${health.brakeWearPct}%`,
                  backgroundColor:
                    health.brakeWearPct > 70
                      ? 'var(--status-critical)'
                      : health.brakeWearPct > 50
                        ? 'var(--status-warning)'
                        : 'var(--status-good)',
                }}
              />
            </div>
          </div>

          {/* Tyres */}
          <div className="border-t border-hairline pt-3">
            <p className="label-eyebrow mb-2">Tyre pressure</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {health.tyrePressures.map((t) => {
                const off = Math.abs(t.bar - t.target) > 0.6
                return (
                  <div key={t.position} className="flex justify-between gap-2">
                    <dt className="truncate text-label text-ink-muted">{t.position}</dt>
                    <dd
                      className="shrink-0 text-label font-medium tabular-nums"
                      style={{ color: off ? 'var(--status-warning)' : 'var(--ink)' }}
                    >
                      {t.bar} bar
                    </dd>
                  </div>
                )
              })}
            </dl>
          </div>
        </div>
      </section>

      {/* Fault codes */}
      <section className="card">
        <header className="card-header">
          <div>
            <h3 className="card-title">Active fault codes</h3>
            <p className="card-subtitle">Live DTCs read from the engine ECU</p>
          </div>
          <span className="badge shrink-0 tabular-nums">{health.faults.length}</span>
        </header>
        <div className="card-body">
          {health.faults.length === 0 ? (
            <p className="rounded-md border border-dashed border-hairline-strong bg-surface-muted/50 px-4 py-8 text-center text-xs text-ink-muted">
              No active fault codes.
            </p>
          ) : (
            <ul className="space-y-3">
              {health.faults.map((f, i) => {
                const Icon = SEVERITY_ICON[f.severity]
                return (
                  <li key={`${f.code}-${i}`} className="flex gap-2.5">
                    <Icon
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      style={{ color: SEVERITY_COLOR[f.severity] }}
                      strokeWidth={1.75}
                    />
                    <div className="min-w-0">
                      <p className="flex items-baseline gap-2">
                        <span className="font-mono text-xs font-semibold text-ink">{f.code}</span>
                        <span className="truncate text-label text-ink-muted">{f.system}</span>
                      </p>
                      <p className="text-xs leading-snug text-ink-secondary">{f.description}</p>
                      <p className="text-label tabular-nums text-ink-muted">
                        {f.severity} · {f.occurrences}× since {f.firstSeen}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Service + risk */}
      <section className="card">
        <header className="card-header">
          <div>
            <h3 className="card-title">Service &amp; risk</h3>
            <p className="card-subtitle">Threshold rules, not a learned model</p>
          </div>
          <span className="badge shrink-0">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: RISK_COLOR[health.riskLevel] }}
              aria-hidden="true"
            />
            {health.riskLevel} risk
          </span>
        </header>

        <div className="card-body space-y-4">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
                <Wrench className="h-3 w-3" strokeWidth={1.75} />
                Since last service
              </span>
              <span className="text-xs font-semibold tabular-nums text-ink">
                {formatNumber(health.kmSinceService)} km
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-sm bg-surface-sunken">
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${Math.min(100, serviceDuePct)}%`,
                  backgroundColor: overdue ? 'var(--status-critical)' : 'var(--series-1)',
                }}
              />
            </div>
            <p className="mt-1 text-label tabular-nums text-ink-muted">
              {overdue
                ? `Overdue by ${formatNumber(health.kmSinceService - health.serviceIntervalKm)} km`
                : `${formatNumber(health.serviceIntervalKm - health.kmSinceService)} km remaining`}{' '}
              · interval {formatNumber(health.serviceIntervalKm)} km
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-hairline pt-3 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Odometer</dt>
              <dd className="font-medium tabular-nums text-ink">
                {formatNumber(health.odometerKm)} km
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Engine hours</dt>
              <dd className="font-medium tabular-nums text-ink">
                {formatNumber(health.engineHours)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Days since</dt>
              <dd className="font-medium tabular-nums text-ink">{health.daysSinceService}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Est. to failure</dt>
              <dd className="font-medium tabular-nums text-ink">
                {health.estimatedDaysToFailure === null
                  ? '—'
                  : `${health.estimatedDaysToFailure} d`}
              </dd>
            </div>
          </dl>

          {/* Show the working */}
          <div className="border-t border-hairline pt-3">
            <p className="label-eyebrow mb-1.5">Rules that fired</p>
            {health.riskReasons.length === 0 ? (
              <p className="text-xs text-ink-muted">None — all thresholds within limits.</p>
            ) : (
              <ul className="space-y-1">
                {health.riskReasons.map((r) => (
                  <li key={r} className="flex gap-1.5 text-xs text-ink-secondary">
                    <span
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: RISK_COLOR[health.riskLevel] }}
                      aria-hidden="true"
                    />
                    {r}
                  </li>
                ))}
              </ul>
            )}

            <details className="mt-2.5">
              <summary className="cursor-pointer text-label text-ink-muted hover:text-ink">
                All rules ({RISK_RULES.length})
              </summary>
              <ul className="mt-1.5 space-y-1">
                {RISK_RULES.map((r) => (
                  <li key={r} className="text-label leading-relaxed text-ink-muted">
                    {r}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
