/**
 * Traffic Intelligence data for the bus-level dashboard — BMTC, Bengaluru.
 *
 * What this represents:
 *   One BMTC unit's camera + GPS + IMU feeds an edge AI (Hailo HAT) that runs
 *   YOLO object detection → ByteTrack multi-object tracking → vehicle
 *   classification → speed estimation → traffic metrics → sensor fusion.
 *   Multiple buses reporting the same corridor increase confidence.
 *
 * Road names and ward names are real Bengaluru arterial corridors.
 * Every measurement is synthetic, seeded from the bus id so each unit has
 * its own stable, internally consistent figures.
 *
 * Never `Math.random()` at module scope — that is what makes `mock-data.ts`
 * produce hydration mismatches (server and client evaluate independently).
 */

/* -------------------------------------------------------------------------- */
/* Seeded generator — identical pattern to road-health-data.ts                 */
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

const pick = <T,>(arr: readonly T[], r: number): T =>
  arr[Math.floor(r * arr.length) % arr.length]
const between = (r: number, lo: number, hi: number) => lo + r * (hi - lo)
const round = (v: number, dp = 0) => {
  const f = Math.pow(10, dp)
  return Math.round(v * f) / f
}

/* -------------------------------------------------------------------------- */
/* Domain types                                                                 */
/* -------------------------------------------------------------------------- */

export type TrafficLevel = 'Low' | 'Moderate' | 'High' | 'Severe'

export type VehicleClasses = {
  cars: number
  twoWheelers: number
  buses: number
  trucks: number
  autos: number
  total: number
}

export type TrafficHotspot = {
  id: string
  location: string
  lat: number
  lng: number
  /** Vehicles per km. */
  densityPerKm: number
  avgSpeedKmh: number
  /** Queue in metres. */
  queueM: number
  congestionScore: number
  level: TrafficLevel
  /** Primary reason for congestion. */
  primaryCause: string
  /** Distinct BMTC buses that observed this hotspot in the last window. */
  observingBuses: number
  /** 0–1 composite confidence based on bus count and recency. */
  confidence: number
  /** Minutes since the most recent observation. */
  lastObservedMin: number
}

export type TrafficTrendPoint = {
  week: string
  densityPerKm: number
  avgSpeedKmh: number
  congestionScore: number
  routeDelayMin: number
}

export type TrafficFlowPoint = {
  /** Label: "T-11", "T-10" ... "Now" */
  label: string
  /** Total vehicles per minute. */
  vehiclesPerMin: number
  /** Inbound (towards city centre). */
  inbound: number
  /** Outbound (away from city centre). */
  outbound: number
}

export type CongestionBreakdown = {
  base: 100
  densityPenalty: number
  speedPenalty: number
  queuePenalty: number
  baselinePenalty: number
  score: number
}

export type PredictiveForecast = {
  current: TrafficLevel
  next15: TrafficLevel
  next30: TrafficLevel
  /** 0–100. Never presented as a guarantee. */
  riskPct: number
  /** Sentence explaining why the prediction was made. */
  explanation: string
}

export type ContributingFactors = {
  density: 'Normal' | 'Elevated' | 'High' | 'Very High'
  speedReduction: 'None' | 'Slight' | 'Moderate' | 'Severe'
  queueLength: 'None' | 'Short' | 'Moderate' | 'Long'
  historicalBaseline: 'Below Normal' | 'Normal' | 'Above Normal' | 'Significantly Above'
  safetyIncident: boolean
  roadDamage: boolean
}

export type FleetCorroboration = {
  /** Distinct BMTC buses that reported the same corridor in the window. */
  busCount: number
  /** Width of the observation window in minutes. */
  windowMin: number
  /** 0–1. Rises with bus count and recency. */
  confidence: number
  observations: { busId: string; speedKmh: number; densityPerKm: number }[]
}

export type RoutePerformance = {
  routeName: string
  scheduledMin: number
  actualMin: number
  delayMin: number
  /** km/h averaged along the full route. */
  avgSpeedKmh: number
  congestionZones: number
  slowestSegment: string
  trafficImpact: 'None' | 'Low' | 'Moderate' | 'High' | 'Severe'
}

export type TrafficData = {
  busId: string
  /** Overall congestion score 0–100, higher = more congested. */
  congestionScore: number
  congestionLevel: TrafficLevel
  breakdown: CongestionBreakdown
  /** Vehicles per km on the observed corridor. */
  densityPerKm: number
  avgSpeedKmh: number
  /** Historical baseline speed for this time/location. */
  baselineSpeedKmh: number
  vehicleCount: number
  vehicleClasses: VehicleClasses
  /** Vehicles per minute at the current observation point. */
  flowVehiclesPerMin: number
  /** Current queue length in metres. */
  queueLengthM: number
  /** Queue growth percentage in the last 10 minutes. */
  queueGrowthPct: number
  /** Observed maximum queue in this shift. */
  queueMaxM: number
  /** Estimated minutes until queue clears at current dissipation rate. */
  estimatedClearingMin: number
  route: RoutePerformance
  /** 12-week baseline congestion score for comparison. */
  historicalBaselineScore: number
  /** Deviation from baseline in percent. */
  baselineDeviationPct: number
  fleetCorroboration: FleetCorroboration
  hotspots: TrafficHotspot[]
  trend: TrafficTrendPoint[]
  flow: TrafficFlowPoint[]
  predictive: PredictiveForecast
  factors: ContributingFactors
}

/* -------------------------------------------------------------------------- */
/* Presentation helpers                                                         */
/* -------------------------------------------------------------------------- */

export const LEVEL_COLOR: Record<TrafficLevel, string> = {
  Low:      'var(--status-good)',
  Moderate: 'var(--status-warning)',
  High:     'var(--status-serious)',
  Severe:   'var(--status-critical)',
}

export const LEVEL_BG: Record<TrafficLevel, string> = {
  Low:      '#f0faf0',
  Moderate: '#fef9ec',
  High:     '#fff2ed',
  Severe:   '#fef2f2',
}

export const LEVEL_TEXT_COLOR: Record<TrafficLevel, string> = {
  Low:      'var(--status-good-text)',
  Moderate: '#8a5e00',
  High:     '#7c3214',
  Severe:   '#7a1b1b',
}

export function congestionLevelFor(score: number): TrafficLevel {
  if (score < 30) return 'Low'
  if (score < 55) return 'Moderate'
  if (score < 75) return 'High'
  return 'Severe'
}

export function trafficImpactFor(delayMin: number): RoutePerformance['trafficImpact'] {
  if (delayMin <= 0)  return 'None'
  if (delayMin <= 5)  return 'Low'
  if (delayMin <= 12) return 'Moderate'
  if (delayMin <= 22) return 'High'
  return 'Severe'
}

/* -------------------------------------------------------------------------- */
/* Reference data — real Bengaluru arterial corridors                           */
/* -------------------------------------------------------------------------- */

const CORRIDORS = [
  'Outer Ring Road — Marathahalli',
  'Hosur Road — Electronic City Flyover',
  'Silk Board Junction',
  'Bannerghatta Road — JP Nagar',
  'Old Airport Road — HAL',
  'Mysore Road — Kengeri Underpass',
  'Tumkur Road — Peenya',
  'Bellary Road — Hebbal',
  'Whitefield Main Road — ITPL',
  'Sarjapur Road — HSR Layout',
  'MG Road Underpass',
  'Ejipura Signal',
  'Koramangala 80 Ft Road',
  'Yeshwanthpura Circle',
  'Mekhri Circle — Bellary Road',
] as const

const CONGESTION_CAUSES = [
  'Signal bottleneck',
  'High vehicle density',
  'Lane merge conflict',
  'Intersection delay',
  'Queue spillback',
  'Road narrowing',
  'Bus stop conflict',
  'Divider gap overflow',
  'Parked vehicles on carriageway',
  'Construction zone',
] as const

const ROUTE_NAMES = [
  '500D Hebbala–Silk Board',
  'G-2 E-City–Brigade Road',
  'G-4 Bannerghatta–Brigade Road',
  '201R Srinagara–CV Raman Nagar',
  '252 Yeshwanthpura–Majestic',
  '356C KBS–Electronic City',
  '375A Kengeri–E-City',
  '600KA Vijayanagara–E-City PH II',
] as const

const SLOW_SEGMENTS = [
  'Silk Board signal — 650 m approach',
  'Hebbal flyover merge lane',
  'Marathahalli Bridge',
  'Ejipura signal box',
  'Bellary Road — IISC gate junction',
  'Koramangala 80 Ft Rd — BDA complex',
  'Old Airport Road — HAL intersection',
  'Mysore Road — Kengeri underpass approach',
] as const

const FLEET_BUS_IDS = [
  'BMTC-104', 'BMTC-217', 'BMTC-305', 'BMTC-412',
  'BMTC-518', 'BMTC-623', 'BMTC-731',
] as const

/* Reference date — keeps SSR and client in sync. */
const BASE_MS = Date.UTC(2026, 8, 10) + 14 * 3600_000

function isoTime(secOffset: number): string {
  return new Date(BASE_MS - secOffset * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19)
}

/* -------------------------------------------------------------------------- */
/* Generators                                                                   */
/* -------------------------------------------------------------------------- */

function computeCongestion(
  densityPerKm: number,
  avgSpeedKmh: number,
  baselineSpeedKmh: number,
  queueM: number,
): CongestionBreakdown {
  // Density penalty: higher density → higher penalty, capped at 35
  const densityPenalty = round(Math.min(35, (densityPerKm / 120) * 35), 1)

  // Speed penalty: how far below baseline, capped at 30
  const speedRatio = Math.max(0, (baselineSpeedKmh - avgSpeedKmh) / baselineSpeedKmh)
  const speedPenalty = round(Math.min(30, speedRatio * 40), 1)

  // Queue penalty: longer queue → higher penalty, capped at 20
  const queuePenalty = round(Math.min(20, (queueM / 1000) * 20), 1)

  // Baseline deviation penalty: if current is significantly above historical
  const baselinePenalty = round(Math.min(15, densityPenalty * 0.3), 1)

  const raw = 100 - densityPenalty - speedPenalty - queuePenalty - baselinePenalty
  return {
    base: 100,
    densityPenalty,
    speedPenalty,
    queuePenalty,
    baselinePenalty,
    score: round(Math.max(0, Math.min(100, raw)), 1),
  }
}

function buildFlow(seed: number, baseFlow: number): TrafficFlowPoint[] {
  return Array.from({ length: 12 }, (_, i) => {
    const s = seed + 300 + i * 41
    const label = i === 11 ? 'Now' : `T-${11 - i}`
    const total = Math.round(between(rand(s), baseFlow * 0.7, baseFlow * 1.3))
    const inbound = Math.round(total * between(rand(s + 1), 0.45, 0.65))
    return {
      label,
      vehiclesPerMin: total,
      inbound,
      outbound: total - inbound,
    }
  })
}

function buildTrend(seed: number, baseScore: number, baseSpeed: number, baseDensity: number): TrafficTrendPoint[] {
  return Array.from({ length: 12 }, (_, w) => {
    const s = seed + 700 + w * 53
    const drift = (11 - w) * between(rand(s), 0.3, 1.6)
    const noise = between(rand(s + 20), -1.4, 1.4)
    const score = round(Math.max(5, Math.min(95, baseScore + drift + noise)), 1)
    return {
      week: `W${w + 1}`,
      densityPerKm: Math.round(between(rand(s + 2), baseDensity * 0.6, baseDensity * 1.4)),
      avgSpeedKmh: round(between(rand(s + 3), baseSpeed * 0.6, baseSpeed * 1.4), 1),
      congestionScore: score,
      routeDelayMin: Math.round(between(rand(s + 4), 0, 24)),
    }
  })
}

function buildHotspots(seed: number): TrafficHotspot[] {
  return Array.from({ length: 7 }, (_, i) => {
    const s = seed + 500 + i * 103
    const density = Math.round(between(rand(s), 28, 118))
    const speed = Math.round(between(rand(s + 1), 8, 52))
    const queue = Math.round(between(rand(s + 2), 80, 820) / 10) * 10
    const breakdown = computeCongestion(density, speed, speed * between(rand(s + 3), 1.3, 2.1), queue)
    const busCount = Math.round(between(rand(s + 4), 1, 5))
    return {
      id: `HS-${100 + ((seed + i * 37) % 900)}`,
      location: pick(CORRIDORS, rand(s + 5)),
      lat: round(between(rand(s + 6), 12.862, 13.139), 5),
      lng: round(between(rand(s + 7), 77.464, 77.784), 5),
      densityPerKm: density,
      avgSpeedKmh: speed,
      queueM: queue,
      congestionScore: breakdown.score,
      level: congestionLevelFor(breakdown.score),
      primaryCause: pick(CONGESTION_CAUSES, rand(s + 8)),
      observingBuses: busCount,
      confidence: round(Math.min(0.97, 0.55 + busCount * 0.08 + rand(s + 9) * 0.1), 2),
      lastObservedMin: Math.round(between(rand(s + 10), 1, 12)),
    }
  }).sort((a, b) => b.congestionScore - a.congestionScore)
}

function buildCorroboration(seed: number, busId: string, avgSpeedKmh: number, densityPerKm: number): FleetCorroboration {
  const busCount = Math.round(between(rand(seed + 400), 2, 6))
  const observations = Array.from({ length: busCount }, (_, i) => {
    const s = seed + 401 + i * 71
    return {
      busId: i === 0 ? busId : `${pick(FLEET_BUS_IDS, rand(s))}`,
      speedKmh: round(between(rand(s + 1), avgSpeedKmh * 0.8, avgSpeedKmh * 1.2), 1),
      densityPerKm: Math.round(between(rand(s + 2), densityPerKm * 0.85, densityPerKm * 1.15)),
    }
  })
  return {
    busCount,
    windowMin: Math.round(between(rand(seed + 410), 4, 12)),
    confidence: round(Math.min(0.97, 0.58 + busCount * 0.07), 2),
    observations,
  }
}

function buildPredictive(
  seed: number,
  currentLevel: TrafficLevel,
  densityPerKm: number,
  avgSpeedKmh: number,
  baselineSpeedKmh: number,
  queueGrowthPct: number,
): PredictiveForecast {
  const speedDeviationPct = Math.round(((baselineSpeedKmh - avgSpeedKmh) / baselineSpeedKmh) * 100)
  const densityConsecutiveMin = Math.round(between(rand(seed + 600), 6, 20))

  // If density is already high and growing, escalate level
  const LEVELS: TrafficLevel[] = ['Low', 'Moderate', 'High', 'Severe']
  const idx = LEVELS.indexOf(currentLevel)
  const escalating = queueGrowthPct > 10 && densityPerKm > 60

  const next15Idx = Math.min(3, idx + (escalating ? 1 : 0))
  const next30Idx = Math.min(3, next15Idx + (escalating && rand(seed + 601) > 0.4 ? 1 : 0))

  const riskPct = Math.round(
    Math.min(97,
      35 +
      (idx * 14) +
      (escalating ? 18 : 0) +
      (queueGrowthPct > 15 ? 10 : 0) +
      rand(seed + 602) * 8,
    ),
  )

  let explanation: string
  if (escalating) {
    explanation = `Traffic density has increased for ${densityConsecutiveMin} consecutive minutes and average speed is ${speedDeviationPct}% below the historical baseline. Queue is growing at ${queueGrowthPct}% in the last 10 minutes.`
  } else if (idx >= 2) {
    explanation = `Sustained high density (${densityPerKm} veh/km) with average speed ${speedDeviationPct}% below baseline. No significant dissipation signal detected yet.`
  } else {
    explanation = `Traffic is within normal parameters. Density is ${densityPerKm} veh/km and speed is ${speedDeviationPct < 10 ? 'near' : 'below'} the historical baseline. Conditions are stable.`
  }

  return {
    current: currentLevel,
    next15: LEVELS[next15Idx],
    next30: LEVELS[next30Idx],
    riskPct,
    explanation,
  }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                   */
/* -------------------------------------------------------------------------- */

export function getTrafficData(busId: string): TrafficData {
  const seed = hashId(busId)

  // Core traffic conditions — all derived so they're consistent with each other
  const densityPerKm     = Math.round(between(rand(seed + 1), 18, 112))
  const baselineSpeedKmh = Math.round(between(rand(seed + 2), 28, 56))
  const speedRatio       = between(rand(seed + 3), 0.38, 1.05) // current / baseline
  const avgSpeedKmh      = Math.max(6, round(baselineSpeedKmh * speedRatio, 1))
  const queueM           = Math.round(between(rand(seed + 4), 60, 920) / 10) * 10
  const breakdown        = computeCongestion(densityPerKm, avgSpeedKmh, baselineSpeedKmh, queueM)
  const congestionScore  = breakdown.score
  const level            = congestionLevelFor(congestionScore)

  // Vehicle classes — total is consistent with overall vehicle count
  const total      = Math.round(between(rand(seed + 10), 80, 260))
  const carShare   = between(rand(seed + 11), 0.38, 0.52)
  const twShare    = between(rand(seed + 12), 0.20, 0.32)
  const busShare   = between(rand(seed + 13), 0.08, 0.14)
  const truckShare = between(rand(seed + 14), 0.04, 0.09)
  const cars       = Math.round(total * carShare)
  const twowheelers = Math.round(total * twShare)
  const buses      = Math.round(total * busShare)
  const trucks     = Math.round(total * truckShare)
  const autos      = Math.max(0, total - cars - twowheelers - buses - trucks)

  // Queue dynamics
  const queueGrowthPct     = round(between(rand(seed + 20), -8, 32), 1)
  const queueMaxM          = queueM + Math.round(between(rand(seed + 21), 0, 400) / 10) * 10
  const estimatedClearingMin = Math.round(between(rand(seed + 22), 2, 22))

  // Route performance
  const scheduledMin       = Math.round(between(rand(seed + 30), 32, 68))
  const delayMin           = Math.round(between(rand(seed + 31), -2, 28))
  const actualMin          = scheduledMin + delayMin
  const routeAvgSpeed      = round(between(rand(seed + 32), 14, 42), 1)
  const congestionZones    = Math.round(between(rand(seed + 33), 1, 6))

  // Historical baseline comparison
  const historicalBaselineScore = Math.round(between(rand(seed + 40), 28, 62))
  const baselineDeviationPct    = round(((congestionScore - historicalBaselineScore) / Math.max(1, historicalBaselineScore)) * 100, 1)

  // Flow series
  const baseFlow = Math.round(between(rand(seed + 50), 12, 48))
  const flow     = buildFlow(seed, baseFlow)

  // Trend (12 weeks)
  const trend = buildTrend(seed, congestionScore, avgSpeedKmh, densityPerKm)

  // Hotspots
  const hotspots = buildHotspots(seed)

  // Fleet corroboration
  const fleetCorroboration = buildCorroboration(seed, busId, avgSpeedKmh, densityPerKm)

  // Predictive
  const predictive = buildPredictive(seed, level, densityPerKm, avgSpeedKmh, baselineSpeedKmh, queueGrowthPct)

  // Contributing factors
  const factors: ContributingFactors = {
    density:
      densityPerKm > 90 ? 'Very High' : densityPerKm > 65 ? 'High' : densityPerKm > 40 ? 'Elevated' : 'Normal',
    speedReduction:
      speedRatio < 0.5 ? 'Severe' : speedRatio < 0.7 ? 'Moderate' : speedRatio < 0.85 ? 'Slight' : 'None',
    queueLength:
      queueM > 600 ? 'Long' : queueM > 300 ? 'Moderate' : queueM > 100 ? 'Short' : 'None',
    historicalBaseline:
      baselineDeviationPct > 30
        ? 'Significantly Above'
        : baselineDeviationPct > 10
          ? 'Above Normal'
          : baselineDeviationPct > -10
            ? 'Normal'
            : 'Below Normal',
    safetyIncident: rand(seed + 80) > 0.7,
    roadDamage:     rand(seed + 81) > 0.62,
  }

  return {
    busId,
    congestionScore,
    congestionLevel: level,
    breakdown,
    densityPerKm,
    avgSpeedKmh,
    baselineSpeedKmh,
    vehicleCount: total,
    vehicleClasses: { cars, twoWheelers: twowheelers, buses, trucks, autos, total },
    flowVehiclesPerMin: baseFlow,
    queueLengthM: queueM,
    queueGrowthPct,
    queueMaxM,
    estimatedClearingMin,
    route: {
      routeName: pick(ROUTE_NAMES, rand(seed + 60)),
      scheduledMin,
      actualMin,
      delayMin,
      avgSpeedKmh: routeAvgSpeed,
      congestionZones,
      slowestSegment: pick(SLOW_SEGMENTS, rand(seed + 61)),
      trafficImpact: trafficImpactFor(delayMin),
    },
    historicalBaselineScore,
    baselineDeviationPct,
    fleetCorroboration,
    hotspots,
    trend,
    flow,
    predictive,
    factors,
  }
}

/**
 * Produce one traffic event for the live feed (useEventFeed producer).
 * Called after mount only — Math.random() is fine here.
 */
export type LiveTrafficEvent = {
  id: string
  type: 'congestion' | 'queue' | 'slowdown' | 'density' | 'delay' | 'clearing'
  severity: TrafficLevel
  timestamp: string
  location: string
  detail: string
}

const LIVE_LOCATIONS = [
  'Silk Board Junction',
  'Outer Ring Road — Marathahalli',
  'Hosur Road — Electronic City',
  'Bellary Road — Hebbal',
  'Old Airport Road — Domlur',
  'Bannerghatta Road — JP Nagar',
]

const LIVE_TYPES: LiveTrafficEvent['type'][] = ['congestion', 'queue', 'slowdown', 'density', 'delay', 'clearing']
const LIVE_DETAILS: Record<LiveTrafficEvent['type'], string[]> = {
  congestion: ['Score elevated to 74/100', 'Congestion score: 81/100', 'High congestion persisting'],
  queue:      ['Queue growth: +18% in 10 min', 'Queue: 540 m and growing', 'Queue: 380 m, stable'],
  slowdown:   ['Avg speed: 18 km/h', 'Avg speed dropped to 22 km/h', 'Speed: 14 km/h — severe'],
  density:    ['87 vehicles/km detected', 'Density: 102 veh/km via fleet', '64 vehicles/km — elevated'],
  delay:      ['Route delay +11 min', 'Route impact: +8 min over schedule', 'Delay widening: +14 min'],
  clearing:   ['Queue dissipating — speed recovering', 'Density decreasing', 'Congestion easing'],
}

export function produceLiveTrafficEvent(index: number): LiveTrafficEvent {
  const LEVELS: TrafficLevel[] = ['Moderate', 'High', 'High', 'Severe', 'Moderate', 'Low']
  const i = index % LIVE_TYPES.length
  const type = LIVE_TYPES[i]
  const details = LIVE_DETAILS[type]
  return {
    id: `TI-L${index + 1}`,
    type,
    severity: LEVELS[i],
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    location: LIVE_LOCATIONS[index % LIVE_LOCATIONS.length],
    detail: details[index % details.length],
  }
}
