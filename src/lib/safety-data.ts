/**
 * Safety Intelligence data for the bus-level dashboard — BMTC, Bengaluru.
 *
 * Road names, ward names and the coordinate envelope are real Bengaluru values.
 * Every measurement is synthetic and derived from a seeded hash of the bus id
 * so each unit gets its own stable, internally consistent figures.
 *
 * Never `Math.random()` at module scope — that is what makes `mock-data.ts`
 * produce hydration mismatches, since the server and client each evaluate the
 * module separately.
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

export type SafetyEventType =
  | 'near_miss'
  | 'harsh_braking'
  | 'overspeed'
  | 'pedestrian_conflict'
  | 'unsafe_lane_change'
  | 'vehicle_conflict'
  | 'collision'
  | 'sudden_stop'

export type SafetySeverity = 'Low' | 'Medium' | 'High' | 'Critical'
export type IncidentStatus = 'New' | 'Under review' | 'Confirmed' | 'Closed'

/** Sensor sources that contributed to detecting this event. */
export type SensorSource = 'Camera' | 'IMU' | 'GPS' | 'CAN/OBD' | 'ANPR'

export type SafetyIncident = {
  id: string
  busId: string
  eventType: SafetyEventType
  severity: SafetySeverity
  /** 0–1. Never presented as absolute truth. */
  confidence: number
  /** ISO-8601 time string — fixed reference date keeps SSR stable. */
  timestamp: string
  /** Human-readable location name. */
  location: string
  /** Bengaluru coordinate envelope. */
  lat: number
  lng: number
  /** km/h at the moment of the event. */
  speed: number
  /** Time-to-collision in seconds. Null for non-proximity events. */
  ttc: number | null
  /** KA registration if ANPR captured a plate. */
  vehicleNumber: string | null
  /** Vehicle type if detected by computer vision. */
  vehicleType: string | null
  /** Behaviour description. */
  behaviour: string | null
  /** ANPR plate confidence. Only meaningful when vehicleNumber is set. */
  plateConfidence: number | null
  /** Deceleration in m/s². Negative = braking. Null for non-braking events. */
  decelerationMs2: number | null
  sensorSources: SensorSource[]
  status: IncidentStatus
}

export type DrivingBehaviourPoint = {
  /** Week label, oldest first — e.g. "W1". */
  week: string
  harshBraking: number
  overspeed: number
  nearMiss: number
  safetyScore: number
}

export type SafetyScoreBreakdown = {
  base: 100
  harshBrakingPenalty: number
  overspeedPenalty: number
  nearMissPenalty: number
  incidentPenalty: number
  score: number
}

export type NearMissStats = {
  countToday: number
  pedestrianNearMisses: number
  vehicleNearMisses: number
  /** Average time-to-collision across events with TTC data. */
  avgTtc: number
  /** Minimum TTC recorded — the most dangerous event. */
  minTtc: number
  /** Severity of the closest call. */
  highestRiskSeverity: SafetySeverity
}

export type SafetyHotspot = {
  location: string
  lat: number
  lng: number
  /** Total events at this location. */
  eventCount: number
  /** Dominant event type. */
  primaryType: SafetyEventType
  riskLevel: 'Moderate' | 'High' | 'Critical'
}

export type SafetyData = {
  busId: string
  scoreBreakdown: SafetyScoreBreakdown
  incidents: SafetyIncident[]
  nearMiss: NearMissStats
  trend: DrivingBehaviourPoint[]
  hotspots: SafetyHotspot[]
  /** Driving behaviour aggregates for the current shift. */
  behaviour: {
    avgSpeedKmh: number
    maxSpeedKmh: number
    harshBrakingCount: number
    harshAccelerationCount: number
    rapidLaneChanges: number
    overspeedCount: number
    unsafeFollowingCount: number
    suddenStops: number
  }
}

/* -------------------------------------------------------------------------- */
/* Presentation helpers                                                         */
/* -------------------------------------------------------------------------- */

export const EVENT_LABEL: Record<SafetyEventType, string> = {
  near_miss: 'Near Miss',
  harsh_braking: 'Harsh Braking',
  overspeed: 'Overspeed',
  pedestrian_conflict: 'Pedestrian Conflict',
  unsafe_lane_change: 'Unsafe Lane Change',
  vehicle_conflict: 'Vehicle Conflict',
  collision: 'Collision',
  sudden_stop: 'Sudden Stop',
}

export const SEVERITY_COLOR: Record<SafetySeverity, string> = {
  Low: 'var(--status-good)',
  Medium: 'var(--status-warning)',
  High: 'var(--status-serious)',
  Critical: 'var(--status-critical)',
}

export const SEVERITY_RANK: Record<SafetySeverity, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
}

export function safetyScoreColor(score: number): string {
  if (score >= 75) return 'var(--status-good)'
  if (score >= 55) return 'var(--status-warning)'
  return 'var(--status-serious)'
}

export function safetyScoreLabel(score: number): 'Good' | 'Moderate' | 'High Risk' {
  if (score >= 75) return 'Good'
  if (score >= 55) return 'Moderate'
  return 'High Risk'
}

/* -------------------------------------------------------------------------- */
/* Reference data — real Bengaluru locations along BMTC trunk corridors        */
/* -------------------------------------------------------------------------- */

const LOCATIONS = [
  'MG Road Junction',
  'Silk Board Flyover',
  'Hebbal Flyover',
  'Ejipura Signal',
  'Koramangala 80 Ft Road',
  'Yeshwanthpura Circle',
  'Bannerghatta Road — BTM Layout',
  'Mysore Road — Kengeri Underpass',
  'Old Airport Road — Domlur',
  'Hosur Road — HSR Layout',
  'Bellary Road — Mekhri Circle',
  'Outer Ring Road — Marathahalli',
  'Whitefield Main Road — ITPL Gate',
  'Tumkur Road — Peenya',
  'Sarjapur Road — Carmelaram',
  'Magadi Road — Rajajinagar',
]

const VEHICLE_TYPES = ['Car', 'Two-wheeler', 'Auto', 'Truck', 'SUV', 'Van'] as const

const BEHAVIOURS: Record<SafetyEventType, string[]> = {
  near_miss: ['Sudden lane change', 'Cut in from left', 'Cut in from right', 'Merging without signal'],
  harsh_braking: ['Emergency stop', 'Pedestrian crossing', 'Vehicle braked ahead', 'Signal jumped red'],
  overspeed: ['Over posted limit', 'Speeding in school zone', 'Highway overspeed', 'Downgrade overspeed'],
  pedestrian_conflict: ['Pedestrian on carriageway', 'J-walking detected', 'Bus stop crossing conflict'],
  unsafe_lane_change: ['No signal', 'Cut across two lanes', 'Lane change in intersection', 'Weaving detected'],
  vehicle_conflict: ['Wrong-way vehicle', 'Head-on near miss', 'Tailgating detected', 'Side-swipe risk'],
  collision: ['Minor impact', 'Scrape at bus stop', 'Reversing contact'],
  sudden_stop: ['Emergency brake', 'Mechanical fault stop', 'Obstacle avoidance'],
}

const SENSOR_COMBOS: SensorSource[][] = [
  ['Camera', 'IMU', 'GPS'],
  ['Camera', 'IMU', 'GPS', 'CAN/OBD'],
  ['Camera', 'IMU', 'GPS', 'ANPR'],
  ['Camera', 'IMU', 'GPS', 'CAN/OBD', 'ANPR'],
  ['IMU', 'GPS', 'CAN/OBD'],
]

/**
 * KA series plates — representative only, not linked to real individuals.
 * Used only when ANPR detects a plate in a safety context.
 */
const KA_PREFIXES = ['KA 01', 'KA 03', 'KA 05', 'KA 51', 'KA 53']
const KA_SUFFIXES = [
  'AB 1234', 'CD 5678', 'EF 9012', 'GH 3456',
  'MN 7890', 'PQ 2345', 'RS 6789', 'TU 0123',
]

const STATUSES: IncidentStatus[] = ['New', 'Under review', 'Confirmed', 'Closed', 'New', 'Under review']

/* Reference date keeps SSR and client in agreement. */
const BASE_UTC = Date.UTC(2026, 8, 10) // 2026-09-10

function isoTime(secondsAgo: number): string {
  return new Date(BASE_UTC + 14 * 3600_000 - secondsAgo * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19)
}

/* -------------------------------------------------------------------------- */
/* Generators                                                                   */
/* -------------------------------------------------------------------------- */

function computeScore(behaviour: SafetyData['behaviour'], nearMissCount: number, incidentCount: number): SafetyScoreBreakdown {
  const harshBrakingPenalty = round(Math.min(30, behaviour.harshBrakingCount * 1.8), 1)
  const overspeedPenalty    = round(Math.min(20, behaviour.overspeedCount * 2.2), 1)
  const nearMissPenalty     = round(Math.min(25, nearMissCount * 4.5), 1)
  const incidentPenalty     = round(Math.min(15, incidentCount * 1.2), 1)
  const raw = 100 - harshBrakingPenalty - overspeedPenalty - nearMissPenalty - incidentPenalty
  return {
    base: 100,
    harshBrakingPenalty,
    overspeedPenalty,
    nearMissPenalty,
    incidentPenalty,
    score: round(Math.max(0, Math.min(100, raw)), 1),
  }
}

function buildIncidents(seed: number, busId: string): SafetyIncident[] {
  const EVENT_TYPES: SafetyEventType[] = [
    'near_miss', 'harsh_braking', 'overspeed', 'pedestrian_conflict',
    'unsafe_lane_change', 'vehicle_conflict', 'harsh_braking', 'sudden_stop',
    'near_miss', 'overspeed', 'pedestrian_conflict', 'harsh_braking',
  ]

  return Array.from({ length: 12 }, (_, i) => {
    const s = seed + i * 719
    const eventType: SafetyEventType = pick(EVENT_TYPES as readonly SafetyEventType[], rand(s))
    const severity: SafetySeverity = pick(
      ['Low', 'Medium', 'High', 'Critical'] as const,
      rand(s + 1),
    )
    const isProximity = eventType === 'near_miss' || eventType === 'pedestrian_conflict' || eventType === 'vehicle_conflict'
    const hasVehicle  = rand(s + 3) > 0.45 && (eventType === 'near_miss' || eventType === 'vehicle_conflict' || eventType === 'unsafe_lane_change')
    const hasAnpr     = hasVehicle && rand(s + 4) > 0.4

    const sensors: SensorSource[] = pick(SENSOR_COMBOS as readonly SensorSource[][], rand(s + 5))
    const finalSensors: SensorSource[] = hasAnpr && !sensors.includes('ANPR')
      ? [...sensors, 'ANPR']
      : sensors

    const behaviourList = BEHAVIOURS[eventType]
    const behaviour = pick(behaviourList as readonly string[], rand(s + 6))

    return {
      id: `SI-${String(100 + ((seed + i * 271) % 900)).padStart(3, '0')}`,
      busId,
      eventType,
      severity,
      confidence: round(Math.min(0.97, 0.58 + rand(s + 2) * 0.38), 2),
      timestamp: isoTime(Math.round(between(rand(s + 7), 120, 28800))),
      location: pick(LOCATIONS as readonly string[], rand(s + 8)),
      lat: round(between(rand(s + 9), 12.862, 13.139), 5),
      lng: round(between(rand(s + 10), 77.464, 77.784), 5),
      speed: Math.round(between(rand(s + 11), 18, 74)),
      ttc: isProximity ? round(between(rand(s + 12), 0.8, 4.8), 1) : null,
      vehicleNumber: hasAnpr
        ? `${pick(KA_PREFIXES as readonly string[], rand(s + 13))} ${pick(KA_SUFFIXES as readonly string[], rand(s + 14))}`
        : null,
      vehicleType: hasVehicle ? pick(VEHICLE_TYPES as readonly string[], rand(s + 15)) : null,
      behaviour,
      plateConfidence: hasAnpr ? round(Math.min(0.98, 0.74 + rand(s + 16) * 0.22), 2) : null,
      decelerationMs2:
        eventType === 'harsh_braking' || eventType === 'sudden_stop'
          ? round(-(between(rand(s + 17), 3.2, 7.8)), 1)
          : null,
      sensorSources: finalSensors,
      status: STATUSES[i % STATUSES.length],
    }
  }).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

function buildHotspots(seed: number): SafetyHotspot[] {
  return Array.from({ length: 6 }, (_, i) => {
    const s = seed + i * 509
    const count = Math.round(between(rand(s), 3, 18))
    const risk: 'Moderate' | 'High' | 'Critical' =
      count >= 14 ? 'Critical' : count >= 8 ? 'High' : 'Moderate'
    const types: SafetyEventType[] = ['harsh_braking', 'near_miss', 'overspeed', 'pedestrian_conflict', 'unsafe_lane_change']
    return {
      location: pick(LOCATIONS as readonly string[], rand(s + 1)),
      lat: round(between(rand(s + 2), 12.862, 13.139), 5),
      lng: round(between(rand(s + 3), 77.464, 77.784), 5),
      eventCount: count,
      primaryType: pick(types as readonly SafetyEventType[], rand(s + 4)),
      riskLevel: risk,
    }
  }).sort((a, b) => b.eventCount - a.eventCount)
}

function buildTrend(seed: number, baseScore: number): DrivingBehaviourPoint[] {
  return Array.from({ length: 12 }, (_, w) => {
    const s = seed + 800 + w * 53
    const drift = (11 - w) * between(rand(s), 0.4, 1.8)
    const noise = between(rand(s + 20), -1.4, 1.4)
    return {
      week: `W${w + 1}`,
      harshBraking: Math.round(between(rand(s + 1), 2, 16)),
      overspeed:    Math.round(between(rand(s + 2), 1, 10)),
      nearMiss:     Math.round(between(rand(s + 3), 0, 6)),
      safetyScore:  round(Math.max(20, Math.min(100, baseScore + drift + noise)), 1),
    }
  })
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                   */
/* -------------------------------------------------------------------------- */

export function getSafetyData(busId: string): SafetyData {
  const seed = hashId(busId)

  const behaviour = {
    avgSpeedKmh:          round(between(rand(seed + 1), 22, 52), 1),
    maxSpeedKmh:          Math.round(between(rand(seed + 2), 48, 82)),
    harshBrakingCount:    Math.round(between(rand(seed + 3), 1, 12)),
    harshAccelerationCount: Math.round(between(rand(seed + 4), 0, 8)),
    rapidLaneChanges:     Math.round(between(rand(seed + 5), 0, 6)),
    overspeedCount:       Math.round(between(rand(seed + 6), 0, 8)),
    unsafeFollowingCount: Math.round(between(rand(seed + 7), 0, 5)),
    suddenStops:          Math.round(between(rand(seed + 8), 0, 4)),
  }

  const incidents = buildIncidents(seed, busId)
  const nearMissIncidents = incidents.filter((i) => i.eventType === 'near_miss')
  const pedIncidents = incidents.filter((i) => i.eventType === 'pedestrian_conflict')

  const ttcValues = incidents
    .filter((i) => i.ttc !== null)
    .map((i) => i.ttc as number)

  const nearMiss: NearMissStats = {
    countToday:             nearMissIncidents.length + Math.round(between(rand(seed + 20), 0, 3)),
    pedestrianNearMisses:   pedIncidents.length,
    vehicleNearMisses:      nearMissIncidents.length,
    avgTtc:                 ttcValues.length > 0
      ? round(ttcValues.reduce((a, b) => a + b, 0) / ttcValues.length, 1)
      : 2.4,
    minTtc:                 ttcValues.length > 0 ? round(Math.min(...ttcValues), 1) : 1.2,
    highestRiskSeverity:    nearMissIncidents.find((i) => i.severity === 'Critical')?.severity ??
      nearMissIncidents.find((i) => i.severity === 'High')?.severity ?? 'Medium',
  }

  const scoreBreakdown = computeScore(behaviour, nearMiss.countToday, incidents.length)
  const trend = buildTrend(seed, scoreBreakdown.score)
  const hotspots = buildHotspots(seed)

  return { busId, scoreBreakdown, incidents, nearMiss, trend, hotspots, behaviour }
}

/**
 * Produce one incident event for the live feed (useEventFeed producer).
 * Called after mount only, so Math.random() here is safe.
 */
export function produceLiveEvent(index: number): {
  id: string
  eventType: SafetyEventType
  severity: SafetySeverity
  timestamp: string
  location: string
  detail: string
} {
  const LIVE_TYPES: SafetyEventType[] = [
    'harsh_braking', 'overspeed', 'near_miss', 'pedestrian_conflict', 'harsh_braking',
  ]
  const LIVE_DETAILS = [
    'Deceleration: −4.2 m/s²',
    'Speed: 67 km/h in 50 zone',
    'TTC: 1.8 s — vehicle cut in',
    'Pedestrian crossing mid-block',
    'Deceleration: −5.6 m/s²',
  ]
  const i = index % LIVE_TYPES.length
  return {
    id: `SI-L${index + 1}`,
    eventType: LIVE_TYPES[i],
    severity: pick(['Low', 'Medium', 'High'] as const, Math.random()),
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    location: LOCATIONS[index % LOCATIONS.length],
    detail: LIVE_DETAILS[i],
  }
}
