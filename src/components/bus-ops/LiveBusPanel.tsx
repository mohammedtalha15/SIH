'use client'

/**
 * LiveBusPanel — where this unit is right now.
 *
 * Speed, position, occupancy and the sync clock move after mount via the live
 * hooks; everything renders its seeded value first so SSR and hydration agree.
 */

import {
  Compass,
  Cpu,
  Gauge as GaugeIcon,
  MapPin,
  Navigation,
  Radio,
  Signal,
  Users,
  Video,
} from 'lucide-react'

import {
  compassPoint,
  formatNumber,
  ONTIME_COLOR,
  type LiveBus,
} from '@/lib/bus-ops-data'
import { useDrift, useTick } from '@/lib/use-live'

function Field({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div className="min-w-0">
      <p className="label-eyebrow truncate">{label}</p>
      <p
        className="mt-0.5 truncate text-sm font-semibold tabular-nums"
        style={{ color: accent ?? 'var(--ink)' }}
      >
        {value}
      </p>
      {sub && <p className="truncate text-label text-ink-muted">{sub}</p>}
    </div>
  )
}

/** Bunching is a distance problem: too close is as bad as too far. */
function gapVerdict(metres: number): { label: string; color: string } {
  if (metres < 400) return { label: 'Bunching risk', color: 'var(--status-critical)' }
  if (metres > 3000) return { label: 'Service gap', color: 'var(--status-warning)' }
  return { label: 'Well spaced', color: 'var(--status-good)' }
}

export function LiveBusPanel({ live }: { live: LiveBus }) {
  const tick = useTick(1000)
  const speed = useDrift(live.speedKmh, 9, 2200)
  const occupancy = useDrift(live.occupancy, 5, 4200)
  const gap = useDrift(live.gapToNextBusM, 260, 3200)

  const syncAge = live.device.lastSyncSeconds + (tick % 12)
  const totalCapacity = live.capacity + live.standingCapacity
  const occ = Math.max(0, Math.min(totalCapacity, Math.round(occupancy)))
  const seated = Math.min(occ, live.capacity)
  const standing = Math.max(0, occ - live.capacity)
  const loadPct = (occ / totalCapacity) * 100
  const verdict = gapVerdict(gap)

  const deviceOk =
    live.device.edgeBox === 'Online' &&
    live.device.gpsLock &&
    live.device.cameras.alive === live.device.cameras.total

  return (
    <div className="card">
      <header className="card-header">
        <div className="min-w-0">
          <h3 className="card-title flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-ink-muted" strokeWidth={1.75} />
            Live status
          </h3>
          <p className="card-subtitle truncate">
            {live.route} · trip {live.tripId} · {live.direction}
          </p>
        </div>
        <span className="badge shrink-0">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: ONTIME_COLOR[live.onTime] }}
            aria-hidden="true"
          />
          {live.onTime}
          {live.deviationMin !== 0 && (
            <span className="tabular-nums">
              {live.deviationMin > 0 ? ` +${live.deviationMin}` : ` ${live.deviationMin}`} min
            </span>
          )}
        </span>
      </header>

      <div className="card-body space-y-4">
        {/* Position and motion */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field
            label="Speed"
            value={`${Math.max(0, Math.round(speed))} km/h`}
            sub={speed < 3 ? 'stationary' : 'in motion'}
          />
          <Field
            label="Heading"
            value={`${compassPoint(live.headingDeg)} ${live.headingDeg}°`}
            sub="from GPS track"
          />
          <Field
            label="Position"
            value={`${live.lat.toFixed(4)}, ${live.lng.toFixed(4)}`}
            sub="WGS-84"
          />
          <Field label="Driver" value={live.driverName} sub={`${live.driverId} · ${live.shiftHours} h shift`} />
        </div>

        {/* Next stop + bunching */}
        <div className="grid grid-cols-1 gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
          <div className="rounded-md border border-hairline bg-surface-muted/50 p-3">
            <p className="label-eyebrow flex items-center gap-1.5">
              <MapPin className="h-3 w-3" strokeWidth={1.75} />
              Next stop
            </p>
            <p className="mt-1 truncate text-sm font-medium text-ink">{live.nextStop}</p>
            <p className="text-label tabular-nums text-ink-muted">
              ETA {live.etaMin} min
            </p>
          </div>

          <div className="rounded-md border border-hairline bg-surface-muted/50 p-3">
            <p className="label-eyebrow flex items-center gap-1.5">
              <Navigation className="h-3 w-3" strokeWidth={1.75} />
              Gap to bus ahead
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-ink">
              {formatNumber(Math.round(gap))} m
            </p>
            <p className="flex items-center gap-1.5 text-label" style={{ color: verdict.color }}>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: verdict.color }}
                aria-hidden="true"
              />
              {verdict.label}
            </p>
          </div>
        </div>

        {/* Occupancy */}
        <div className="border-t border-hairline pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="label-eyebrow flex items-center gap-1.5">
              <Users className="h-3 w-3" strokeWidth={1.75} />
              Occupancy
            </p>
            <p className="text-xs font-semibold tabular-nums text-ink">
              {occ} <span className="font-normal text-ink-muted">/ {totalCapacity} aboard</span>
            </p>
          </div>
          {/* Seated fill, then standees, with the seat line marked between them */}
          <div className="relative mt-2 flex h-2 w-full gap-px overflow-hidden rounded-sm bg-surface-sunken">
            <div
              className="h-full transition-[width] duration-200 ease-out"
              style={{
                width: `${(seated / totalCapacity) * 100}%`,
                backgroundColor: 'var(--series-1)',
              }}
            />
            <div
              className="h-full transition-[width] duration-200 ease-out"
              style={{
                width: `${(standing / totalCapacity) * 100}%`,
                backgroundColor:
                  loadPct > 88 ? 'var(--status-critical)' : 'var(--status-warning)',
              }}
            />
            <span
              className="pointer-events-none absolute top-0 h-full w-px bg-surface"
              style={{ left: `${(live.capacity / totalCapacity) * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <p className="mt-1 text-label tabular-nums text-ink-muted">
            {seated} seated · {standing} standing · {loadPct.toFixed(0)}% of permitted load — from
            cabin camera count
          </p>
        </div>

        {/* Device health */}
        <div className="border-t border-hairline pt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="label-eyebrow flex items-center gap-1.5">
              <Cpu className="h-3 w-3" strokeWidth={1.75} />
              Device health
            </p>
            <span className="badge">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: deviceOk ? 'var(--status-good)' : 'var(--status-warning)',
                }}
                aria-hidden="true"
              />
              {deviceOk ? 'All systems nominal' : 'Degraded'}
            </span>
          </div>

          <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            <div>
              <dt className="text-label text-ink-muted">Edge box</dt>
              <dd className="text-xs font-medium text-ink">{live.device.edgeBox}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-label text-ink-muted">
                <Video className="h-2.5 w-2.5" strokeWidth={2} />
                Cameras
              </dt>
              <dd className="text-xs font-medium tabular-nums text-ink">
                {live.device.cameras.alive}/{live.device.cameras.total} alive
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-label text-ink-muted">
                <Compass className="h-2.5 w-2.5" strokeWidth={2} />
                GPS
              </dt>
              <dd className="text-xs font-medium tabular-nums text-ink">
                {live.device.gpsLock ? `Lock · ${live.device.gpsSatellites} sats` : 'No lock'}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-label text-ink-muted">
                <Signal className="h-2.5 w-2.5" strokeWidth={2} />
                Network
              </dt>
              <dd className="flex items-center gap-1.5 text-xs font-medium text-ink">
                {live.device.network}
                <span className="flex items-end gap-px" aria-hidden="true">
                  {[1, 2, 3, 4].map((b) => (
                    <span
                      key={b}
                      className="w-0.5 rounded-sm"
                      style={{
                        height: `${b * 2 + 2}px`,
                        backgroundColor:
                          b <= live.device.signalBars ? 'var(--ink)' : 'var(--hairline-strong)',
                      }}
                    />
                  ))}
                </span>
              </dd>
            </div>
          </dl>

          <p className="mt-2.5 flex items-center gap-1.5 text-label tabular-nums text-ink-muted">
            <GaugeIcon className="h-3 w-3" strokeWidth={1.75} />
            Last sync {syncAge}s ago
          </p>
        </div>
      </div>
    </div>
  )
}
