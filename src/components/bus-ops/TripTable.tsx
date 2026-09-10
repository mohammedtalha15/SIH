'use client'

/**
 * TripTable — one row per full run from origin to terminus.
 *
 * Skipped stops lead. A driver dropping stops is usually running late and
 * trying to catch up, which makes it both a service-quality and a safety
 * signal — so it gets its own column rather than sitting inside a detail view.
 */

import { formatNumber, type Trip, type TripStatus } from '@/lib/bus-ops-data'

const STATUS_STYLE: Record<TripStatus, string> = {
  Completed: 'border-hairline bg-surface-muted text-ink-secondary',
  'In progress': 'border-transparent bg-ink text-ink-inverted',
  'Cut short': 'border-transparent bg-[var(--status-serious)] text-white',
  Cancelled: 'border-transparent bg-[var(--status-critical)] text-white',
}

export function TripTable({ trips }: { trips: Trip[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-hairline">
            {[
              { label: 'Trip', align: 'left' },
              { label: 'Start sched / actual', align: 'left' },
              { label: 'Journey', align: 'right' },
              { label: 'Delay', align: 'right' },
              { label: 'Stops skipped', align: 'right' },
              { label: 'Adherence', align: 'right' },
              { label: 'Idle', align: 'right' },
              { label: 'Boarded', align: 'right' },
              { label: 'Status', align: 'left' },
            ].map((c) => (
              <th
                key={c.label}
                scope="col"
                className={`label-eyebrow whitespace-nowrap px-3 py-2 first:pl-5 last:pr-5 ${
                  c.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {trips.map((t) => {
            const late = t.delayMin > 5
            return (
              <tr
                key={t.id}
                className="border-b border-hairline last:border-0 transition-colors duration-200 ease-out hover:bg-surface-muted"
              >
                <td className="px-3 py-2.5 pl-5">
                  <span className="block font-medium tabular-nums text-ink">{t.id}</span>
                  <span className="block text-label text-ink-muted">{t.direction}</span>
                </td>

                <td className="px-3 py-2.5">
                  <span className="block tabular-nums text-ink-secondary">
                    {t.scheduledStart} → {t.actualStart}
                  </span>
                  <span className="block text-label text-ink-muted">
                    {t.actualStart === t.scheduledStart ? 'on time off depot' : 'departed late'}
                  </span>
                </td>

                <td className="px-3 py-2.5 text-right">
                  <span className="block tabular-nums text-ink">{t.actualMin} min</span>
                  <span className="block text-label tabular-nums text-ink-muted">
                    sched {t.scheduledMin}
                  </span>
                </td>

                <td className="px-3 py-2.5 text-right">
                  <span
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: late ? 'var(--status-critical)' : 'var(--ink)' }}
                  >
                    {t.delayMin > 0 ? '+' : ''}
                    {t.delayMin}
                  </span>
                </td>

                {/* The signal worth reading first */}
                <td className="px-3 py-2.5 text-right">
                  {t.stopsSkipped === 0 ? (
                    <span className="text-xs tabular-nums text-ink-muted">0</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            t.stopsSkipped > 3 ? 'var(--status-critical)' : 'var(--status-warning)',
                        }}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-semibold tabular-nums text-ink">
                        {t.stopsSkipped}
                      </span>
                      <span className="text-label text-ink-muted">/ {t.stopsScheduled}</span>
                    </span>
                  )}
                </td>

                <td className="px-3 py-2.5 text-right tabular-nums text-ink-secondary">
                  {formatNumber(t.adherencePct, 1)}%
                  {t.deviationEvents > 0 && (
                    <span className="block text-label text-ink-muted">
                      {t.deviationEvents} deviation{t.deviationEvents > 1 ? 's' : ''}
                    </span>
                  )}
                </td>

                <td className="px-3 py-2.5 text-right tabular-nums text-ink-secondary">
                  {t.idleMin} min
                </td>

                <td className="px-3 py-2.5 text-right">
                  <span className="block tabular-nums text-ink">{formatNumber(t.boarded)}</span>
                  <span className="block text-label tabular-nums text-ink-muted">
                    {formatNumber(t.alighted)} off
                  </span>
                </td>

                <td className="px-3 py-2.5 pr-5">
                  <span className={`badge ${STATUS_STYLE[t.status]}`}>{t.status}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
