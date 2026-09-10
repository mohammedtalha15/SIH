/**
 * Bus Operations data for the bus-level dashboard — BMTC, Bengaluru.
 *
 * Route numbers, stop names and depot names are real; every measurement is
 * synthetic and derived from a seeded hash of the bus id, so each unit gets its
 * own stable figures. Never `Math.random()` at module scope — that is what
 * makes `mock-data.ts` produce hydration mismatches.
 */

/* -------------------------------------------------------------------------- */
/* Seeded generator                                                            */
/* -------------------------------------------------------------------------- */

function rand(seed: number): number {
  let x = (seed + 1) * 2654435761
  x ^= x >>> 15
  x = Math.imul(x, 2246822519)
  x ^= x >>> 13
  return (x >>> 0) / 4294967296
}

function hashId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const between = (r: number, lo: number, hi: number) => lo + r * (hi - lo)
const pick = <T,>(arr: readonly T[], r: number): T => arr[Math.floor(r * arr.length) % arr.length]
const round = (v: number, dp = 0) => {
  const f = Math.pow(10, dp)
  return Math.round(v * f) / f
}

/* -------------------------------------------------------------------------- */
/* Section 1 — live, per bus                                                   */
/* -------------------------------------------------------------------------- */

export type OnTimeState = 'Early' | 'On time' | 'Late'
export type DeviceState = 'Online' | 'Degraded' | 'Offline'

export type DeviceHealth = {
  edgeBox: DeviceState
  cameras: { alive: number; total: number }
  gpsLock: boolean
  gpsSatellites: number
  /** Signal strength, 0–4 bars. */
  signalBars: number
  network: '4G' | '5G' | '3G'
  lastSyncSeconds: number
}

export type LiveBus = {
  registration: string
  route: string
  tripId: string
  direction: 'Up' | 'Down'
  lat: number
  lng: number
  speedKmh: number
  headingDeg: number
  onTime: OnTimeState
  /** Signed minutes: negative is early, positive is late. */
  deviationMin: number
  nextStop: string
  etaMin: number
  /** Metres to the bus ahead on the same route — the bunching signal. */
  gapToNextBusM: number
  occupancy: number
  /** Seated capacity. */
  capacity: number
  /** Standees the vehicle is permitted to carry beyond the seats. */
  standingCapacity: number
  driverId: string
  driverName: string
  shiftHours: number
  device: DeviceHealth
}

const BENGALURU_STOPS = [
  'Yeshwanthpura Bus Station',
  'Mekhri Circle',
  'Malleshwaram 18th Cross',
  'Navarang',
  'Majestic (KBS)',
  'Corporation',
  'Shivajinagara Bus Station',
  'Trinity Circle',
  'Domlur',
  'Marathahalli Bridge',
  'Kundalahalli Gate',
  'Hope Farm',
  'Kadugodi Bus Station',
]

const DRIVERS = [
  'Ravi Kumar M',
  'Shivanna B',
  'Naveen Gowda',
  'Manjunath H',
  'Prakash R',
  'Lokesh N',
  'Anil Kumar S',
]

/* -------------------------------------------------------------------------- */
/* Section 2 — per trip                                                        */
/* -------------------------------------------------------------------------- */

export type TripStatus = 'Completed' | 'In progress' | 'Cut short' | 'Cancelled'

export type Trip = {
  id: string
  direction: 'Up' | 'Down'
  scheduledStart: string
  actualStart: string
  scheduledMin: number
  actualMin: number
  delayMin: number
  /** Percentage of the scheduled path actually driven. */
  adherencePct: number
  deviationEvents: number
  deviationMinutes: number
  stopsScheduled: number
  stopsSkipped: number
  avgSpeedKmh: number
  maxSpeedKmh: number
  idleMin: number
  boarded: number
  alighted: number
  status: TripStatus
}

export type StopDwell = {
  stop: string
  /** Seconds. */
  dwellSec: number
  boarded: number
  alighted: number
  skipped: boolean
}

/* -------------------------------------------------------------------------- */
/* Section 3 — per route                                                       */
/* -------------------------------------------------------------------------- */

export type HeadwayArrival = {
  /** Minutes since the window opened. */
  atMin: number
  /** Gap to the previous arrival, in minutes. */
  headwayMin: number
  busReg: string
  kind: 'normal' | 'bunched' | 'gap'
}

export type DelayHotspot = {
  segment: string
  minutesLost: number
  trips: number
}

export type RouteStats = {
  route: string
  tripsScheduled: number
  tripsCompleted: number
  onTimePct: number
  avgDelayMin: number
  delayVarianceMin: number
  /** Scheduled headway for the window, in minutes. */
  scheduledHeadwayMin: number
  headwayAdherencePct: number
  bunchingEvents: number
  gapEvents: number
  avgLoad: number
  loadFactorPct: number
  overcrowdedTrips: number
  emptyRunningTrips: number
  revenuePerKm: number
  arrivals: HeadwayArrival[]
  hotspots: DelayHotspot[]
}

/* -------------------------------------------------------------------------- */
/* Section 4 — fleet-wide                                                      */
/* -------------------------------------------------------------------------- */

export type OffRoadReason = { reason: string; count: number }

export type FleetStats = {
  inService: number
  totalFleet: number
  availabilityPct: number
  offRoad: OffRoadReason[]
  kmToday: number
  onTimePct: number
  passengersToday: number
  avgLoadFactorPct: number
  /** km per litre for diesel units. */
  kmPerLitre: number
  /** km per kWh for the electric fleet. */
  kmPerKwh: number
  dieselLitres: number
  energyKwh: number
  costPerKm: number
  breakdownsPer10kKm: number
}

/* -------------------------------------------------------------------------- */
/* Section 5 — vehicle health (CAN/OBD)                                        */
/* -------------------------------------------------------------------------- */

export type Reading = {
  label: string
  value: number
  unit: string
  /** Operating band; outside it the rule fires. */
  min: number
  max: number
  state: 'Normal' | 'Watch' | 'Alert'
}

export type FaultCode = {
  code: string
  system: string
  description: string
  severity: 'Info' | 'Warning' | 'Critical'
  firstSeen: string
  occurrences: number
}

export type VehicleHealth = {
  readings: Reading[]
  faults: FaultCode[]
  brakeWearPct: number
  tyrePressures: { position: string; bar: number; target: number }[]
  odometerKm: number
  engineHours: number
  kmSinceService: number
  serviceIntervalKm: number
  daysSinceService: number
  /** Rule-derived, not learned — see RISK_RULES. */
  riskLevel: 'Low' | 'Medium' | 'High'
  riskReasons: string[]
  estimatedDaysToFailure: number | null
}

/**
 * The rules behind the risk level. Stated explicitly because this is a
 * threshold engine over live fault codes, not a trained model — there is no
 * failure history behind it to justify calling it a prediction.
 */
export const RISK_RULES = [
  'Any Critical DTC active → High',
  'Brake wear above 70% → High',
  'Two or more Warning DTCs → Medium',
  'Service overdue by more than 2,000 km → Medium',
  'Any reading outside its operating band → Medium',
] as const

/* -------------------------------------------------------------------------- */
/* Section 6 — driver behaviour                                                */
/* -------------------------------------------------------------------------- */

export type DriverBehaviour = {
  driverId: string
  driverName: string
  /** Events per 100 km. */
  harshBraking: number
  harshAcceleration: number
  sharpCornering: number
  overspeedEvents: number
  overspeedMinutes: number
  idlingMinutes: number
  safetyScore: number
  /** Rank among the depot's drivers on fuel efficiency. */
  efficiencyRank: number
  efficiencyOf: number
  continuousHours: number
  fatigueFlag: boolean
  /** Route difficulty 0–100; harder routes produce more events for the same driving. */
  routeDifficulty: number
}

/* -------------------------------------------------------------------------- */
/* Section 7 — demand and planning                                             */
/* -------------------------------------------------------------------------- */

export type StopDemand = {
  stop: string
  boardings: number
  alightings: number
}

export type HourDemand = {
  hour: string
  /** Passengers wanting to travel. */
  demand: number
  /** Seats offered — same unit as demand, so both share one axis. */
  supply: number
}

export type CorridorAdvice = {
  corridor: string
  demandIndex: number
  frequencyPerHour: number
  verdict: 'Underserved' | 'Overserved' | 'Balanced'
  suggestion: string
}

export type BusOpsData = {
  live: LiveBus
  trips: Trip[]
  dwell: StopDwell[]
  route: RouteStats
  fleet: FleetStats
  health: VehicleHealth
  driver: DriverBehaviour
  stopDemand: StopDemand[]
  hourly: HourDemand[]
  corridors: CorridorAdvice[]
  /** Origin→destination flows between the route's main stops. */
  odMatrix: { from: string; to: string; trips: number }[]
  odStops: string[]
}

/* -------------------------------------------------------------------------- */
/* Builder                                                                     */
/* -------------------------------------------------------------------------- */

function hhmm(totalMin: number): string {
  const h = Math.floor(totalMin / 60) % 24
  const m = Math.floor(totalMin % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function buildArrivals(seed: number, scheduledHeadway: number): HeadwayArrival[] {
  const arrivals: HeadwayArrival[] = []
  let t = 0
  for (let i = 0; i < 16; i++) {
    const s = seed + i * 311
    const r = rand(s)
    // Most arrivals land near the schedule; some cluster, some leave a hole.
    let gap: number
    if (r < 0.22) gap = scheduledHeadway * between(rand(s + 1), 0.12, 0.38) // bunched
    else if (r < 0.36) gap = scheduledHeadway * between(rand(s + 2), 1.9, 3.1) // gap
    else gap = scheduledHeadway * between(rand(s + 3), 0.75, 1.3)

    t += gap
    const ratio = gap / scheduledHeadway
    arrivals.push({
      atMin: round(t, 1),
      headwayMin: round(gap, 1),
      busReg: `KA-01-F-${String(1200 + ((seed + i * 91) % 800)).padStart(4, '0')}`,
      kind: ratio < 0.4 ? 'bunched' : ratio > 1.8 ? 'gap' : 'normal',
    })
  }
  return arrivals
}

export function getBusOpsData(busId: string, route: string, registration: string): BusOpsData {
  const seed = hashId(busId)

  /* --- live ------------------------------------------------------------- */
  // A BMTC non-AC bus seats ~40 and is permitted ~25 standees; occupancy above
  // the seat count is normal, so the panel must model standees rather than
  // clamp at 100% and report "56 / 52 seats".
  const capacity = 40
  const standingCapacity = 25
  const nextStopIdx = Math.floor(between(rand(seed + 1), 1, BENGALURU_STOPS.length - 1))
  const deviationMin = round(between(rand(seed + 2), -4, 14), 0)
  const camerasAlive = rand(seed + 3) < 0.82 ? 4 : 3
  const driverIdx = Math.floor(between(rand(seed + 4), 0, DRIVERS.length))

  const live: LiveBus = {
    registration,
    route,
    tripId: `TRP-${String(40100 + (seed % 900)).padStart(5, '0')}`,
    direction: rand(seed + 5) > 0.5 ? 'Up' : 'Down',
    lat: round(between(rand(seed + 6), 12.862, 13.139), 5),
    lng: round(between(rand(seed + 7), 77.464, 77.784), 5),
    speedKmh: round(between(rand(seed + 8), 0, 46), 0),
    headingDeg: round(between(rand(seed + 9), 0, 359), 0),
    onTime: deviationMin < -1 ? 'Early' : deviationMin > 5 ? 'Late' : 'On time',
    deviationMin,
    nextStop: BENGALURU_STOPS[nextStopIdx],
    etaMin: round(between(rand(seed + 10), 1, 9), 0),
    gapToNextBusM: round(between(rand(seed + 11), 120, 4200), 0),
    occupancy: Math.round(between(rand(seed + 12), 8, 58)),
    capacity,
    standingCapacity,
    driverId: `DRV-${String(2100 + (seed % 700)).padStart(4, '0')}`,
    driverName: DRIVERS[driverIdx],
    shiftHours: round(between(rand(seed + 13), 1.2, 8.6), 1),
    device: {
      edgeBox: rand(seed + 14) < 0.9 ? 'Online' : 'Degraded',
      cameras: { alive: camerasAlive, total: 4 },
      gpsLock: rand(seed + 15) < 0.95,
      gpsSatellites: Math.round(between(rand(seed + 16), 6, 14)),
      signalBars: Math.round(between(rand(seed + 17), 1, 4)),
      network: rand(seed + 18) < 0.75 ? '4G' : '5G',
      lastSyncSeconds: Math.round(between(rand(seed + 19), 1, 40)),
    },
  }

  /* --- trips ------------------------------------------------------------ */
  const trips: Trip[] = Array.from({ length: 8 }, (_, i) => {
    const s = seed + 200 + i * 457
    const schedStartMin = 6 * 60 + i * 95
    const startDelay = Math.round(between(rand(s), -2, 12))
    const schedMin = Math.round(between(rand(s + 1), 55, 95))
    const actualMin = Math.round(schedMin * between(rand(s + 2), 0.94, 1.34))
    const stopsScheduled = Math.round(between(rand(s + 3), 22, 38))
    const stopsSkipped = rand(s + 4) < 0.45 ? Math.round(between(rand(s + 5), 1, 5)) : 0
    const boarded = Math.round(between(rand(s + 6), 90, 340))

    return {
      id: `TRP-${String(40100 + (seed % 900) - i).padStart(5, '0')}`,
      direction: i % 2 === 0 ? 'Up' : 'Down',
      scheduledStart: hhmm(schedStartMin),
      actualStart: hhmm(schedStartMin + startDelay),
      scheduledMin: schedMin,
      actualMin,
      delayMin: actualMin - schedMin + startDelay,
      adherencePct: round(between(rand(s + 7), 88.5, 99.9), 1),
      deviationEvents: rand(s + 8) < 0.35 ? Math.round(between(rand(s + 9), 1, 3)) : 0,
      deviationMinutes: Math.round(between(rand(s + 10), 0, 14)),
      stopsScheduled,
      stopsSkipped,
      avgSpeedKmh: round(between(rand(s + 11), 14, 27), 1),
      maxSpeedKmh: round(between(rand(s + 12), 48, 78), 0),
      idleMin: Math.round(between(rand(s + 13), 4, 26)),
      boarded,
      alighted: Math.round(boarded * between(rand(s + 14), 0.9, 1.0)),
      status: i === 0 ? 'In progress' : stopsSkipped > 3 ? 'Cut short' : 'Completed',
    }
  })

  /* --- dwell ------------------------------------------------------------ */
  const dwell: StopDwell[] = BENGALURU_STOPS.map((stop, i) => {
    const s = seed + 900 + i * 137
    const skipped = rand(s) < 0.12
    const boarded = skipped ? 0 : Math.round(between(rand(s + 1), 2, 41))
    return {
      stop,
      dwellSec: skipped ? 0 : Math.round(between(rand(s + 2), 14, 128)),
      boarded,
      alighted: skipped ? 0 : Math.round(between(rand(s + 3), 1, 38)),
      skipped,
    }
  })

  /* --- route ------------------------------------------------------------ */
  const scheduledHeadwayMin = Math.round(between(rand(seed + 300), 8, 16))
  const arrivals = buildArrivals(seed + 400, scheduledHeadwayMin)
  const tripsScheduled = Math.round(between(rand(seed + 301), 48, 96))

  const routeStats: RouteStats = {
    route,
    tripsScheduled,
    tripsCompleted: Math.round(tripsScheduled * between(rand(seed + 302), 0.88, 0.995)),
    onTimePct: round(between(rand(seed + 303), 54, 88), 1),
    avgDelayMin: round(between(rand(seed + 304), 3.2, 13.8), 1),
    delayVarianceMin: round(between(rand(seed + 305), 4, 17), 1),
    scheduledHeadwayMin,
    headwayAdherencePct: round(between(rand(seed + 306), 46, 82), 1),
    bunchingEvents: arrivals.filter((a) => a.kind === 'bunched').length,
    gapEvents: arrivals.filter((a) => a.kind === 'gap').length,
    avgLoad: Math.round(between(rand(seed + 307), 22, 48)),
    loadFactorPct: round(between(rand(seed + 308), 42, 96), 1),
    overcrowdedTrips: Math.round(between(rand(seed + 309), 2, 19)),
    emptyRunningTrips: Math.round(between(rand(seed + 310), 0, 7)),
    revenuePerKm: round(between(rand(seed + 311), 18, 44), 1),
    arrivals,
    hotspots: [
      'Silk Board Junction',
      'Marathahalli Bridge',
      'Tin Factory',
      'Hebbal Flyover',
      'K.R. Market',
    ]
      .map((segment, i) => ({
        segment,
        minutesLost: round(between(rand(seed + 320 + i), 1.4, 11.2), 1),
        trips: Math.round(between(rand(seed + 340 + i), 12, 74)),
      }))
      .sort((a, b) => b.minutesLost - a.minutesLost),
  }

  /* --- fleet ------------------------------------------------------------ */
  const totalFleet = 132
  const inService = Math.round(totalFleet * between(rand(seed + 500), 0.79, 0.93))
  const off = totalFleet - inService
  const breakdown = Math.round(off * between(rand(seed + 501), 0.15, 0.4))
  const maintenance = Math.round(off * between(rand(seed + 502), 0.3, 0.5))

  const fleet: FleetStats = {
    inService,
    totalFleet,
    availabilityPct: round((inService / totalFleet) * 100, 1),
    offRoad: [
      { reason: 'Maintenance', count: maintenance },
      { reason: 'Breakdown', count: breakdown },
      { reason: 'No driver', count: Math.max(0, off - breakdown - maintenance) },
    ].filter((r) => r.count > 0),
    kmToday: Math.round(between(rand(seed + 503), 18_000, 31_000)),
    onTimePct: round(between(rand(seed + 504), 58, 84), 1),
    passengersToday: Math.round(between(rand(seed + 505), 41_000, 96_000)),
    avgLoadFactorPct: round(between(rand(seed + 506), 48, 82), 1),
    kmPerLitre: round(between(rand(seed + 507), 3.1, 4.6), 2),
    kmPerKwh: round(between(rand(seed + 508), 0.72, 1.05), 2),
    dieselLitres: Math.round(between(rand(seed + 509), 3_800, 7_400)),
    energyKwh: Math.round(between(rand(seed + 510), 5_200, 11_800)),
    costPerKm: round(between(rand(seed + 511), 34, 58), 1),
    breakdownsPer10kKm: round(between(rand(seed + 512), 0.4, 3.1), 2),
  }

  /* --- vehicle health --------------------------------------------------- */
  const engineTemp = round(between(rand(seed + 600), 78, 108), 0)
  const oilPressure = round(between(rand(seed + 601), 1.8, 4.6), 1)
  const batteryV = round(between(rand(seed + 602), 22.9, 28.4), 1)
  const brakeWearPct = round(between(rand(seed + 603), 18, 84), 0)
  const kmSinceService = Math.round(between(rand(seed + 604), 1_200, 14_500))
  const serviceIntervalKm = 12_000

  const band = (v: number, min: number, max: number): Reading['state'] => {
    if (v < min || v > max) return 'Alert'
    const margin = (max - min) * 0.1
    return v < min + margin || v > max - margin ? 'Watch' : 'Normal'
  }

  const readings: Reading[] = [
    { label: 'Engine temperature', value: engineTemp, unit: '°C', min: 75, max: 100, state: band(engineTemp, 75, 100) },
    { label: 'Oil pressure', value: oilPressure, unit: 'bar', min: 2.0, max: 4.5, state: band(oilPressure, 2.0, 4.5) },
    { label: 'Battery voltage', value: batteryV, unit: 'V', min: 23.5, max: 28.0, state: band(batteryV, 23.5, 28.0) },
  ]

  const FAULT_POOL: Omit<FaultCode, 'firstSeen' | 'occurrences'>[] = [
    { code: 'P0128', system: 'Cooling', description: 'Coolant thermostat below regulating temperature', severity: 'Warning' },
    { code: 'P0299', system: 'Air intake', description: 'Turbocharger underboost', severity: 'Warning' },
    { code: 'P2002', system: 'Exhaust', description: 'Diesel particulate filter efficiency below threshold', severity: 'Critical' },
    { code: 'C1234', system: 'Braking', description: 'Wheel speed sensor intermittent, rear left', severity: 'Warning' },
    { code: 'U0100', system: 'Network', description: 'Lost communication with ECM/PCM', severity: 'Critical' },
    { code: 'P0401', system: 'EGR', description: 'Exhaust gas recirculation flow insufficient', severity: 'Info' },
  ]

  const faultCount = Math.floor(between(rand(seed + 610), 0, 4))
  const faults: FaultCode[] = Array.from({ length: faultCount }, (_, i) => {
    const f = FAULT_POOL[Math.floor(between(rand(seed + 620 + i), 0, FAULT_POOL.length))]
    const daysAgo = Math.round(between(rand(seed + 630 + i), 1, 40))
    return {
      ...f,
      firstSeen: new Date(Date.UTC(2026, 8, 10) - daysAgo * 86_400_000).toISOString().slice(0, 10),
      occurrences: Math.round(between(rand(seed + 640 + i), 1, 48)),
    }
  })

  // Rules, applied in order — mirrors RISK_RULES so the panel can show its work.
  const riskReasons: string[] = []
  if (faults.some((f) => f.severity === 'Critical')) riskReasons.push('Critical DTC active')
  if (brakeWearPct > 70) riskReasons.push(`Brake wear at ${brakeWearPct}%`)
  if (faults.filter((f) => f.severity === 'Warning').length >= 2) riskReasons.push('Two or more Warning DTCs')
  if (kmSinceService > serviceIntervalKm + 2000) riskReasons.push('Service overdue by more than 2,000 km')
  readings.filter((r) => r.state === 'Alert').forEach((r) => riskReasons.push(`${r.label} outside band`))

  const riskLevel: VehicleHealth['riskLevel'] =
    faults.some((f) => f.severity === 'Critical') || brakeWearPct > 70
      ? 'High'
      : riskReasons.length > 0
        ? 'Medium'
        : 'Low'

  const health: VehicleHealth = {
    readings,
    faults,
    brakeWearPct,
    tyrePressures: [
      { position: 'Front left', bar: round(between(rand(seed + 650), 6.4, 8.2), 1), target: 7.5 },
      { position: 'Front right', bar: round(between(rand(seed + 651), 6.4, 8.2), 1), target: 7.5 },
      { position: 'Rear left', bar: round(between(rand(seed + 652), 6.8, 8.6), 1), target: 8.0 },
      { position: 'Rear right', bar: round(between(rand(seed + 653), 6.8, 8.6), 1), target: 8.0 },
    ],
    odometerKm: Math.round(between(rand(seed + 660), 180_000, 640_000)),
    engineHours: Math.round(between(rand(seed + 661), 9_000, 31_000)),
    kmSinceService,
    serviceIntervalKm,
    daysSinceService: Math.round(between(rand(seed + 662), 8, 140)),
    riskLevel,
    riskReasons,
    estimatedDaysToFailure:
      riskLevel === 'High' ? Math.round(between(rand(seed + 663), 3, 21)) : null,
  }

  /* --- driver ----------------------------------------------------------- */
  const harshBraking = round(between(rand(seed + 700), 0.8, 9.4), 1)
  const harshAccel = round(between(rand(seed + 701), 0.6, 7.8), 1)
  const cornering = round(between(rand(seed + 702), 0.3, 5.2), 1)
  const overspeed = Math.round(between(rand(seed + 703), 0, 14))
  const continuousHours = round(between(rand(seed + 704), 1.5, 6.4), 1)

  const driver: DriverBehaviour = {
    driverId: live.driverId,
    driverName: live.driverName,
    harshBraking,
    harshAcceleration: harshAccel,
    sharpCornering: cornering,
    overspeedEvents: overspeed,
    overspeedMinutes: round(between(rand(seed + 705), 0, 22), 0),
    idlingMinutes: Math.round(between(rand(seed + 706), 12, 74)),
    safetyScore: round(
      Math.max(35, 100 - harshBraking * 2.4 - harshAccel * 1.9 - cornering * 2.1 - overspeed * 1.1),
      0,
    ),
    efficiencyRank: Math.round(between(rand(seed + 707), 1, 42)),
    efficiencyOf: 42,
    continuousHours,
    fatigueFlag: continuousHours > 4.5,
    routeDifficulty: Math.round(between(rand(seed + 708), 38, 92)),
  }

  /* --- demand ----------------------------------------------------------- */
  const stopDemand: StopDemand[] = BENGALURU_STOPS.map((stop, i) => ({
    stop,
    boardings: Math.round(between(rand(seed + 800 + i), 40, 460)),
    alightings: Math.round(between(rand(seed + 830 + i), 40, 440)),
  }))

  const hourly: HourDemand[] = Array.from({ length: 16 }, (_, i) => {
    const hour = 6 + i
    // Two commuter peaks, morning heavier than evening.
    const peak =
      Math.exp(-Math.pow(hour - 9, 2) / 5) * 1 + Math.exp(-Math.pow(hour - 18.5, 2) / 6) * 0.86
    const demand = Math.round(260 + peak * 1180 * between(rand(seed + 860 + i), 0.88, 1.12))
    // Supply is seats offered, so it shares the passenger axis.
    const supply = Math.round(340 + peak * 900 * between(rand(seed + 880 + i), 0.8, 1.1))
    return { hour: `${String(hour).padStart(2, '0')}:00`, demand, supply }
  })

  const odStops = BENGALURU_STOPS.filter((_, i) => i % 2 === 0).slice(0, 6)
  const odMatrix = odStops.flatMap((from, i) =>
    odStops.map((to, j) => ({
      from,
      to,
      trips: i === j ? 0 : Math.round(between(rand(seed + 900 + i * 7 + j), 4, 240)),
    })),
  )

  const corridors: CorridorAdvice[] = [
    'ORR · Silk Board–K.R. Puram',
    'Hosur Rd · Madiwala–E-City',
    'Old Airport Rd · Domlur–Marathahalli',
    'Tumkur Rd · Yeshwanthpura–Nelamangala',
    'Kanakapura Rd · Banashankari–Konanakunte',
  ].map((corridor, i) => {
    const demandIndex = Math.round(between(rand(seed + 950 + i), 28, 98))
    const frequencyPerHour = Math.round(between(rand(seed + 960 + i), 2, 14))
    // Demand per bus per hour; high means the corridor is starved of service.
    const ratio = demandIndex / Math.max(1, frequencyPerHour)
    const verdict: CorridorAdvice['verdict'] =
      ratio > 11 ? 'Underserved' : ratio < 4 ? 'Overserved' : 'Balanced'
    return {
      corridor,
      demandIndex,
      frequencyPerHour,
      verdict,
      suggestion:
        verdict === 'Underserved'
          ? `Add ${Math.max(1, Math.round(ratio / 6))} trips/hour`
          : verdict === 'Overserved'
            ? `Reallocate ${Math.max(1, Math.round(frequencyPerHour * 0.2))} trips/hour`
            : 'Hold current frequency',
    }
  })

  return {
    live,
    trips,
    dwell,
    route: routeStats,
    fleet,
    health,
    driver,
    stopDemand,
    hourly,
    corridors,
    odMatrix,
    odStops,
  }
}

/* -------------------------------------------------------------------------- */
/* Presentation helpers                                                        */
/* -------------------------------------------------------------------------- */

export const ONTIME_COLOR: Record<OnTimeState, string> = {
  Early: 'var(--status-warning)',
  'On time': 'var(--status-good)',
  Late: 'var(--status-critical)',
}

export const RISK_COLOR: Record<VehicleHealth['riskLevel'], string> = {
  Low: 'var(--status-good)',
  Medium: 'var(--status-warning)',
  High: 'var(--status-critical)',
}

export const READING_COLOR: Record<Reading['state'], string> = {
  Normal: 'var(--status-good)',
  Watch: 'var(--status-warning)',
  Alert: 'var(--status-critical)',
}

export const SEVERITY_COLOR: Record<FaultCode['severity'], string> = {
  Info: 'var(--ink-muted)',
  Warning: 'var(--status-warning)',
  Critical: 'var(--status-critical)',
}

export const HEADWAY_COLOR: Record<HeadwayArrival['kind'], string> = {
  normal: 'var(--series-1)',
  bunched: 'var(--status-critical)',
  gap: 'var(--status-warning)',
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function compassPoint(deg: number): string {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return points[Math.round(deg / 45) % 8]
}
