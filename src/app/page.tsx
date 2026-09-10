'use client'

/**
 * Overview dashboard — Bus Fleet Intelligence System.
 *
 * The 3D city model is the subject of this screen, so it runs full-bleed and
 * every piece of chrome floats over it: the navbar, the summary metrics, and
 * the depot/unit panel. (On the bus-level dashboard the navbar becomes a
 * traditional side rail — that screen is not built yet.)
 *
 * Flow: pick a depot (in the panel or by clicking a building in the model),
 * then pick one of the units mapped under it.
 */

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, X } from 'lucide-react'

import { DepotPanel } from '@/components/dashboard/DepotPanel'
import { FloatingNav, type ViewKey } from '@/components/dashboard/FloatingNav'
import { busSectionHref } from '@/lib/bus-sections'
import { BUSES, DEPOTS, formatNumber, STATUS_DOT, STATUS_LABEL } from '@/lib/fleet-data'
import { WarehouseInventoryProvider } from '@/lib/warehouse-inventory'

// Client-only: Three.js touches `window` at module scope, so rendering the
// scene on the server throws.
const WarehouseScene = dynamic(
  () => import('@/components/canvas/warehouse-scene').then((m) => ({ default: m.WarehouseScene })),
  { ssr: false, loading: () => <SceneLoading /> },
)

// Also client-only: it imports drei, and therefore three.
const SceneLoadingOverlay = dynamic(
  () =>
    import('@/components/dashboard/SceneLoadingOverlay').then((m) => ({
      default: m.SceneLoadingOverlay,
    })),
  { ssr: false },
)

function SceneLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-canvas">
      <div className="text-center">
        <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-hairline-strong border-t-ink" />
        <p className="text-sm font-medium text-ink">Loading Bus Fleet Intelligence System</p>
        <p className="mt-1 text-xs text-ink-muted">Preparing the city model</p>
      </div>
    </div>
  )
}

export default function OverviewPage() {
  const router = useRouter()
  const [view, setView] = useState<ViewKey>('fleet')
  const [depotId, setDepotId] = useState<string | null>(null)
  const [busId, setBusId] = useState<string | null>(null)
  const [sceneReady, setSceneReady] = useState(false)

  const bus = busId ? BUSES.find((b) => b.id === busId) ?? null : null
  const depot = depotId ? DEPOTS.find((d) => d.id === depotId) ?? null : null

  return (
    <WarehouseInventoryProvider>
      <main className="relative h-screen w-full overflow-hidden bg-canvas">
        {/* Base layer: the model */}
        <div className="canvas-container">
          <WarehouseScene
            onOpenWarehouseLayout={(id) => {
              setDepotId(id)
              setBusId(null)
            }}
            onReady={() => setSceneReady(true)}
          />
          <SceneLoadingOverlay visible={!sceneReady} />
        </div>

        <FloatingNav view={view} onViewChange={setView} />

        {/* Floating workspace. `pointer-events-none` on the frame so the model
            stays draggable between the panels; each panel re-enables its own. */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 top-[3.75rem] z-20 sm:inset-x-4 sm:bottom-4 sm:top-[4.25rem]">
          <div className="mx-auto flex h-full max-w-[92rem] gap-3 sm:gap-4">
            {/* Left: unit detail sits at the foot of the model */}
            <div className="flex min-w-0 flex-1 flex-col justify-end gap-3">
              <div className="flex flex-col gap-2">
                {bus && (
                  <div className="pointer-events-auto w-full max-w-md rounded-lg border border-hairline
                                  bg-surface/90 shadow-raised backdrop-blur-md animate-in zoom-in-95">
                    <div className="flex items-start justify-between gap-3 border-b border-hairline px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold tabular-nums tracking-tight text-ink">
                          {bus.fleetNumber}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-muted">
                          {bus.route} · {depot?.name}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="flex items-center gap-1.5 whitespace-nowrap text-label font-medium text-ink-secondary">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: STATUS_DOT[bus.status] }}
                            aria-hidden="true"
                          />
                          {STATUS_LABEL[bus.status]}
                        </span>
                        <button
                          type="button"
                          onClick={() => setBusId(null)}
                          className="rounded-md p-1 text-ink-muted transition-colors duration-200 ease-out hover:bg-surface-muted hover:text-ink"
                          aria-label="Close unit detail"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <dl className="grid grid-cols-4 divide-x divide-hairline">
                      <Figure label="Health" value={formatNumber(bus.healthScore, 1)} />
                      <Figure label="Detections" value={formatNumber(bus.detections)} />
                      <Figure label="Covered" value={`${formatNumber(bus.coverageKm, 1)} km`} />
                      <Figure label="Last ping" value={bus.lastPing} small />
                    </dl>

                    <div className="border-t border-hairline px-3 py-2">
                      <Link
                        href={busSectionHref(bus.id)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md
                                   bg-ink px-3 py-1.5 text-xs font-medium text-ink-inverted
                                   transition-opacity duration-200 ease-out hover:opacity-90"
                      >
                        Open unit dashboard
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                      </Link>
                    </div>
                  </div>
                )}

                <p className="pointer-events-none w-fit rounded-md border border-hairline bg-surface/85
                              px-2.5 py-1.5 text-label text-ink-secondary shadow-card backdrop-blur-md">
                  Drag to rotate · Scroll to zoom · Click a depot in the model to list its units
                </p>
              </div>
            </div>

            {/* Right: depots, then the units mapped under the selected depot */}
            <div className="hidden shrink-0 sm:flex">
              <DepotPanel
                selectedDepotId={depotId}
                onSelectDepot={setDepotId}
                selectedBusId={busId}
                onSelectBus={(id) => {
                  setBusId(id)
                  // Warm the route while the reader looks at the summary card.
                  // `id` is null when the panel clears the selection.
                  if (id) router.prefetch(busSectionHref(id))
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </WarehouseInventoryProvider>
  )
}

function Figure({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="px-3 py-2.5">
      <dt className="label-eyebrow truncate">{label}</dt>
      <dd
        className={`mt-0.5 truncate font-semibold tabular-nums text-ink ${
          small ? 'text-xs' : 'text-base'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
