'use client'

/**
 * DepotPanel — the Overview's detailed-data layer, floating beside the scene.
 *
 * Two levels only: depots, then the units mapped under the selected depot.
 * Selecting a unit opens its bus-level dashboard at the first section
 * (Road Health), via `/bus/<id>/<section>`.
 */

import { ArrowLeft, Bus as BusIcon, ChevronRight, Warehouse } from 'lucide-react'
import {
  busesForDepot,
  DEPOTS,
  formatNumber,
  STATUS_DOT,
  STATUS_LABEL,
  type Bus,
  type Depot,
} from '@/lib/fleet-data'

type DepotPanelProps = {
  selectedDepotId: string | null
  onSelectDepot: (id: string | null) => void
  selectedBusId: string | null
  onSelectBus: (id: string | null) => void
}

export function DepotPanel({
  selectedDepotId,
  onSelectDepot,
  selectedBusId,
  onSelectBus,
}: DepotPanelProps) {
  const depot = selectedDepotId ? DEPOTS.find((d) => d.id === selectedDepotId) ?? null : null

  return (
    <aside
      className="pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-lg
                 border border-hairline bg-surface/90 shadow-raised backdrop-blur-md sm:w-80"
      aria-label={depot ? `Units at ${depot.name}` : 'Depots'}
    >
      {depot ? (
        <DepotDetail
          depot={depot}
          selectedBusId={selectedBusId}
          onSelectBus={onSelectBus}
          onBack={() => {
            onSelectDepot(null)
            onSelectBus(null)
          }}
        />
      ) : (
        <DepotList onSelectDepot={onSelectDepot} />
      )}
    </aside>
  )
}

function DepotList({ onSelectDepot }: { onSelectDepot: (id: string) => void }) {
  return (
    <>
      <header className="border-b border-hairline px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight text-ink">Depots</h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          Select a depot in the list or in the 3D view
        </p>
      </header>

      <ul className="overflow-y-auto p-2">
        {DEPOTS.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => onSelectDepot(d.id)}
              className="group flex w-full items-start gap-3 rounded-md p-2.5 text-left
                         transition-colors duration-200 ease-out hover:bg-surface-muted"
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-sunken">
                <Warehouse className="h-3.5 w-3.5 text-ink-secondary" strokeWidth={1.75} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-medium text-ink">{d.name}</span>
                  <span className="shrink-0 text-label text-ink-muted">{d.code}</span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-ink-muted">{d.zone}</span>

                <span className="mt-2 grid grid-cols-3 gap-2">
                  <Stat label="Units" value={formatNumber(d.busCount)} />
                  <Stat label="Active" value={formatNumber(d.activeCount)} />
                  <Stat label="Health" value={formatNumber(d.healthScore, 1)} />
                </span>
              </span>

              <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="block">
      <span className="block text-label uppercase text-ink-muted">{label}</span>
      <span className="block text-xs font-semibold tabular-nums text-ink">{value}</span>
    </span>
  )
}

function DepotDetail({
  depot,
  selectedBusId,
  onSelectBus,
  onBack,
}: {
  depot: Depot
  selectedBusId: string | null
  onSelectBus: (id: string) => void
  onBack: () => void
}) {
  const buses = busesForDepot(depot.id)

  return (
    <>
      <header className="border-b border-hairline px-3 py-3">
        <button
          type="button"
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-label font-medium
                     uppercase text-ink-muted transition-colors duration-200 ease-out
                     hover:bg-surface-muted hover:text-ink"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={2} />
          All depots
        </button>

        <div className="px-1.5">
          <div className="flex items-baseline gap-2">
            <h2 className="truncate text-sm font-semibold tracking-tight text-ink">{depot.name}</h2>
            <span className="shrink-0 text-label text-ink-muted">{depot.code}</span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            <span className="tabular-nums">{buses.length}</span> of{' '}
            <span className="tabular-nums">{depot.busCount}</span> units shown ·{' '}
            <span className="tabular-nums">{formatNumber(depot.coveragePct, 1)}%</span> coverage
          </p>
        </div>
      </header>

      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {buses.map((b) => (
          <li key={b.id}>
            <BusRow bus={b} selected={b.id === selectedBusId} onSelect={() => onSelectBus(b.id)} />
          </li>
        ))}
      </ul>

      <footer className="border-t border-hairline px-4 py-2.5">
        <p className="text-label text-ink-muted">
          Selecting a unit opens its dashboard, starting on Road Health.
        </p>
      </footer>
    </>
  )
}

function BusRow({ bus, selected, onSelect }: { bus: Bus; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-md p-2.5 text-left transition-colors duration-200 ease-out ${
        selected ? 'bg-surface-sunken' : 'hover:bg-surface-muted'
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-sunken">
        <BusIcon className="h-3.5 w-3.5 text-ink-secondary" strokeWidth={1.75} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-xs font-medium tabular-nums text-ink">
            {bus.fleetNumber}
          </span>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">
            {formatNumber(bus.healthScore, 1)}
          </span>
        </span>

        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-label text-ink-muted">{bus.route}</span>
          <span className="flex shrink-0 items-center gap-1 text-label text-ink-muted">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: STATUS_DOT[bus.status] }}
              aria-hidden="true"
            />
            {STATUS_LABEL[bus.status]}
          </span>
        </span>
      </span>
    </button>
  )
}
