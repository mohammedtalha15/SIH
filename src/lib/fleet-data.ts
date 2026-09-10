/**
 * Fleet data for the Overview dashboard.
 *
 * MVP data: hardcoded, or derived from a seeded generator. Deliberately NOT
 * `Math.random()` at module scope — the older `mock-data.ts` does that, so the
 * server and the client each produce different values and React reports a
 * hydration mismatch. Everything here renders identically on both.
 *
 * Depot ids match the warehouse ids the 3D scene emits on click, so selecting a
 * building in the scene resolves straight to a depot.
 */

export type BusStatus = 'on-route' | 'idle' | 'maintenance'

export type Bus = {
  id: string
  fleetNumber: string
  depotId: string
  route: string
  status: BusStatus
  /** Road-health score contributed by this unit's last shift, 0–100. */
  healthScore: number
  /** Defects detected on the current shift. */
  detections: number
  coverageKm: number
  lastPing: string
}

export type Depot = {
  /** Matches the warehouse id emitted by the 3D scene. */
  id: string
  name: string
  code: string
  zone: string
  busCount: number
  activeCount: number
  coveragePct: number
  healthScore: number
}

export const DEPOTS: Depot[] = [
  {
    id: 'warehouse-1',
    name: 'North Depot',
    code: 'DEP-N1',
    zone: 'North & Central wards',
    busCount: 132,
    activeCount: 118,
    coveragePct: 89.2,
    healthScore: 74.1,
  },
  {
    id: 'warehouse-2',
    name: 'East Depot',
    code: 'DEP-E2',
    zone: 'East & Riverside wards',
    busCount: 116,
    activeCount: 97,
    coveragePct: 84.7,
    healthScore: 70.8,
  },
]

const ROUTES_BY_DEPOT: Record<string, string[]> = {
  'warehouse-1': ['R-12 Ring Road', 'R-04 Station Loop', 'R-27 College Rd', 'R-31 Market Circle'],
  'warehouse-2': ['R-18 Dock Access', 'R-09 Riverside', 'R-22 Industrial Ave', 'R-15 Airport Link'],
}

const STATUS_CYCLE: BusStatus[] = [
  'on-route',
  'on-route',
  'on-route',
  'idle',
  'on-route',
  'maintenance',
  'on-route',
  'idle',
]

/**
 * Deterministic pseudo-random in [0,1) — a 32-bit integer hash of the index.
 * Seeded so SSR and the client agree; not for anything security-related.
 */
function seeded(i: number): number {
  let x = (i + 1) * 2654435761
  x ^= x >>> 15
  x = Math.imul(x, 2246822519)
  x ^= x >>> 13
  return (x >>> 0) / 4294967296
}

function buildBuses(depot: Depot, offset: number, count: number): Bus[] {
  const routes = ROUTES_BY_DEPOT[depot.id]
  return Array.from({ length: count }, (_, i) => {
    const n = offset + i
    const status = STATUS_CYCLE[n % STATUS_CYCLE.length]
    const health = 42 + seeded(n) * 48
    const mins = Math.floor(seeded(n + 500) * 55) + 1

    return {
      id: `bus-${n}`,
      fleetNumber: `${depot.code.slice(-2)}-${String(1040 + n * 7).padStart(4, '0')}`,
      depotId: depot.id,
      route: routes[n % routes.length],
      status,
      healthScore: Math.round(health * 10) / 10,
      detections: status === 'maintenance' ? 0 : Math.round(8 + seeded(n + 900) * 54),
      coverageKm: Math.round((12 + seeded(n + 1300) * 78) * 10) / 10,
      lastPing: status === 'maintenance' ? 'In workshop' : `${mins} min ago`,
    }
  })
}

/** A representative slice per depot — enough to browse, not the full roster. */
export const BUSES: Bus[] = [
  ...buildBuses(DEPOTS[0], 0, 14),
  ...buildBuses(DEPOTS[1], 14, 12),
]

export function busesForDepot(depotId: string): Bus[] {
  return BUSES.filter((b) => b.depotId === depotId)
}

export const STATUS_LABEL: Record<BusStatus, string> = {
  'on-route': 'On route',
  idle: 'Idle',
  maintenance: 'Maintenance',
}

/** Status colour is never the only cue — always paired with the label above. */
export const STATUS_DOT: Record<BusStatus, string> = {
  'on-route': 'var(--status-good)',
  idle: 'var(--ink-muted)',
  maintenance: 'var(--status-warning)',
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
