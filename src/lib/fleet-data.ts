/**
 * Fleet data for the Overview dashboard — BMTC, Bengaluru.
 *
 * Depots, route numbers and registration series are real BMTC/Bengaluru values
 * (depot list and divisions per BMTC's published depot table; route numbers per
 * BMTC's own route listings). The measurements attached to them are synthetic.
 *
 * MVP data: hardcoded, or derived from a seeded generator. Deliberately NOT
 * `Math.random()` at module scope — the older `mock-data.ts` does that, so the
 * server and the client each produce different values and React reports a
 * hydration mismatch. Everything here renders identically on both.
 *
 * The first two depot ids match the warehouse ids the 3D scene emits on click,
 * so selecting a building in the scene resolves straight to a depot. The rest
 * are list-only — BMTC runs 50 depots and the model shows two sheds.
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
    name: 'Yeshwanthpura',
    code: 'D-08',
    zone: 'North division · Bengaluru Urban',
    busCount: 132,
    activeCount: 118,
    coveragePct: 89.2,
    healthScore: 74.1,
  },
  {
    id: 'warehouse-2',
    name: 'Koramangala',
    code: 'D-15',
    zone: 'East division · Bengaluru Urban',
    busCount: 116,
    activeCount: 97,
    coveragePct: 84.7,
    healthScore: 70.8,
  },
  {
    id: 'depot-shanthinagara',
    name: 'Shanthinagara',
    code: 'D-02',
    zone: 'South division · Bengaluru Urban',
    busCount: 148,
    activeCount: 129,
    coveragePct: 91.4,
    healthScore: 72.5,
  },
  {
    id: 'depot-krishnarajapura',
    name: 'Krishnarajapura',
    code: 'D-24',
    zone: 'North-East division · Bengaluru Urban',
    busCount: 121,
    activeCount: 104,
    coveragePct: 82.3,
    healthScore: 66.9,
  },
  {
    id: 'depot-kengeri',
    name: 'Kengeri',
    code: 'D-12',
    zone: 'South-West division · Bengaluru Urban',
    busCount: 109,
    activeCount: 92,
    coveragePct: 78.6,
    healthScore: 69.4,
  },
  {
    id: 'depot-electronic-city',
    name: 'Electronic City',
    code: 'D-19',
    zone: 'East division · Bengaluru Urban',
    busCount: 137,
    activeCount: 119,
    coveragePct: 86.1,
    healthScore: 64.2,
  },
]

/** Real BMTC route numbers, grouped by the depot that plausibly works them. */
const ROUTES_BY_DEPOT: Record<string, string[]> = {
  'warehouse-1': ['252 Yeshwanthpura–Majestic', '276 KBS–Vidyaranyapura', 'G-8 Nelamangala–BRV', '250I KBS–Chikkabanavara'],
  'warehouse-2': ['G-2 E-City–Brigade Rd', '201R Srinagara–CV Raman Nagar', '171 Koramangala–Shivajinagara', 'G-3 Sarjapura–M.G. Road'],
  'depot-shanthinagara': ['G-4 Bannerghatta–Brigade Rd', '365 KBS–Bannerghatta NP', '356C KBS–Electronic City', 'V-356 Shanthinagara–E-City'],
  'depot-krishnarajapura': ['500D Hebbala–Central Silk Board', 'G-12 Halsoor–K.R. Puram', '335E KBS–Kadugodi', '500DB Hebbala–Hope Farm'],
  'depot-kengeri': ['G-6 Kengeri Sat. Town–Hudson Circle', '375A Kengeri–E-City', '500KS Kengeri–Kadugodi', '45G KBS–BSK 3rd Stage'],
  'depot-electronic-city': ['356M KBS–Anekal', '360B KBS–Attibele', '600KA Vijayanagara–E-City PH II', '505 E-City–ITPL'],
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
  // Every depot in DEPOTS has an entry; fall back so a new depot can't crash the list.
  const routes = ROUTES_BY_DEPOT[depot.id] ?? ROUTES_BY_DEPOT['warehouse-1']
  return Array.from({ length: count }, (_, i) => {
    const n = offset + i
    const status = STATUS_CYCLE[n % STATUS_CYCLE.length]
    const health = 42 + seeded(n) * 48
    const mins = Math.floor(seeded(n + 500) * 55) + 1

    return {
      id: `bus-${n}`,
      fleetNumber: `KA-01-F-${String(1040 + n * 37).padStart(4, '0')}`,
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

/**
 * A representative slice per depot — enough to browse, not the full roster.
 * BMTC runs ~7,000 buses; these stand in for the ones this MVP tracks.
 */
export const BUSES: Bus[] = DEPOTS.flatMap((depot, i) =>
  buildBuses(depot, i * 14, 12 + (i % 3)),
)

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
