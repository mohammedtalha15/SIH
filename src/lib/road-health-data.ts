/**
 * Road Health data for the bus-level dashboard — BMTC, Bengaluru.
 *
 * Road names, ward names and the coordinate envelope are real Bengaluru values
 * (wards per the Greater Bengaluru Authority's five city corporations); the
 * condition measurements attached to them are synthetic.
 *
 * MVP data: deterministic, derived from a seeded hash of the bus id so every
 * unit gets its own plausible-but-stable figures. Never `Math.random()` at
 * module scope — that is what makes `mock-data.ts` produce hydration
 * mismatches, since the server and client each evaluate the module separately.
 */

/* -------------------------------------------------------------------------- */
/* Seeded generator                                                            */
/* -------------------------------------------------------------------------- */

/** 32-bit integer hash → [0,1). Stable across server and client. */
function rand(seed: number): number {
  let x = (seed + 1) * 2654435761
  x ^= x >>> 15
  x = Math.imul(x, 2246822519)
  x ^= x >>> 13
  return (x >>> 0) / 4294967296
}

/** Turn an arbitrary id into a numeric seed. */
function hashId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const pick = <T,>(arr: readonly T[], r: number): T => arr[Math.floor(r * arr.length) % arr.length]
const between = (r: number, lo: number, hi: number) => lo + r * (hi - lo)
const round = (v: number, dp = 0) => {
  const f = Math.pow(10, dp)
  return Math.round(v * f) / f
}

/* -------------------------------------------------------------------------- */
/* Domain types                                                                */
/* -------------------------------------------------------------------------- */

export const DEFECT_TYPES = [
  'Pothole',
  'Crack',
  'Broken edge',
  'Missing divider',
  'Faded zebra crossing',
  'Damaged signboard',
  'Waterlogging',
  'Open manhole',
] as const
export type DefectType = (typeof DEFECT_TYPES)[number]

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical'
export type DepthClass = 'Shallow' | 'Medium' | 'Deep'
export type DefectStatus =
  | 'New'
  | 'Confirmed'
  | 'Reported'
  | 'Under repair'
  | 'Fixed'
  | 'Reappeared'
export type LanePosition = 'Left' | 'Centre' | 'Right'
export type SurfaceClass = 'Good' | 'Fair' | 'Poor' | 'Critical'

export type Defect = {
  id: string
  type: DefectType
  segmentId: string
  segmentName: string
  lat: number
  lng: number
  /** cm */
  widthCm: number
  lengthCm: number
  /** cm², derived */
  areaCm2: number
  depth: DepthClass
  severity: Severity
  /** 0–1 */
  confidence: number
  /** Total passes that saw it. */
  sightings: number
  /** Distinct units that saw it — corroboration, the field that matters. */
  distinctBuses: number
  firstSeen: string
  lastSeen: string
  status: DefectStatus
  lane: LanePosition
  /** Growth in cm² per week. */
  growthCm2PerWeek: number
  /** Days from first sighting until predicted Critical; null once critical. */
  daysToCritical: number | null
}

export type ScoreBreakdown = {
  base: 100
  densityPenalty: number
  roughnessPenalty: number
  infrastructurePenalty: number
  waterloggingPenalty: number
  score: number
}

export type Segment = {
  id: string
  name: string
  ward: string
  /** Metres. */
  lengthM: number
  defectCount: number
  /** Defects per km. */
  defectDensity: number
  /** Roughness index, IRI-like (m/km). Higher is worse. */
  roughness: number
  avgSeverity: number
  surfaceClass: SurfaceClass
  waterloggingEvents30d: number
  waterloggingDepthCm: number
  missingInfraCount: number
  /** Vehicles per day. */
  trafficExposure: number
  busPassesPerDay: number
  /** Percent worse per week vs. the city median. */
  deteriorationRate: number
  breakdown: ScoreBreakdown
  /** 12 weekly score readings, oldest first. */
  history: number[]
}

/* -------------------------------------------------------------------------- */
/* Road Health Score — a visible formula, not a black box                      */
/* -------------------------------------------------------------------------- */

/**
 * Severity weight applied per defect/km.
 *
 * Tuned against a realistic density range (2–40 defects/km) so a bad road lands
 * in the 20s–30s rather than flooring at zero: at the worst plausible inputs the
 * four penalties sum to roughly 90, which leaves the scale usable across its
 * whole range instead of saturating.
 */
export const SEVERITY_WEIGHT = 0.25
export const ROUGHNESS_WEIGHT = 3.2
export const INFRA_WEIGHT = 2.5
export const WATER_WEIGHT = 1.6

/** Approximate length of Bengaluru's municipal road network, in km. */
export const NETWORK_KM = 14_000

export const SCORE_FORMULA =
  'Score = 100 − (defect density × severity weight) − roughness penalty − missing-infrastructure penalty − waterlogging penalty'

/**
 * The one place the score is computed. Every term is returned alongside the
 * result so the dashboard can show *why* a road scores what it does — asked
 * "why is this road 34?", the answer is on screen.
 */
export function computeScore(input: {
  defectDensity: number
  avgSeverity: number
  roughness: number
  missingInfraCount: number
  waterloggingEvents30d: number
}): ScoreBreakdown {
  const densityPenalty = input.defectDensity * input.avgSeverity * SEVERITY_WEIGHT
  const roughnessPenalty = Math.max(0, input.roughness - 2) * ROUGHNESS_WEIGHT
  const infrastructurePenalty = input.missingInfraCount * INFRA_WEIGHT
  const waterloggingPenalty = input.waterloggingEvents30d * WATER_WEIGHT

  const raw =
    100 - densityPenalty - roughnessPenalty - infrastructurePenalty - waterloggingPenalty

  return {
    base: 100,
    densityPenalty: round(densityPenalty, 1),
    roughnessPenalty: round(roughnessPenalty, 1),
    infrastructurePenalty: round(infrastructurePenalty, 1),
    waterloggingPenalty: round(waterloggingPenalty, 1),
    score: round(Math.max(0, Math.min(100, raw)), 1),
  }
}

export function surfaceClassFor(score: number): SurfaceClass {
  if (score >= 75) return 'Good'
  if (score >= 55) return 'Fair'
  if (score >= 35) return 'Poor'
  return 'Critical'
}

export function severityFor(score: number): Severity {
  if (score >= 75) return 'Low'
  if (score >= 55) return 'Medium'
  if (score >= 35) return 'High'
  return 'Critical'
}

/* -------------------------------------------------------------------------- */
/* Generators                                                                  */
/* -------------------------------------------------------------------------- */

/** Real Bengaluru arterial roads, the kind a BMTC trunk route actually runs on. */
const ROAD_NAMES = [
  'Outer Ring Road',
  'Hosur Road',
  'Bannerghatta Road',
  'Old Airport Road',
  'Sarjapur Road',
  'Magadi Road',
  'Mysore Road',
  'Tumkur Road',
  'Bellary Road',
  'Kanakapura Road',
  'Whitefield Main Road',
  'Old Madras Road',
]

/**
 * Real ward names from the five Greater Bengaluru Authority city corporations,
 * chosen to sit along the arterial roads above.
 */
const WARDS = [
  'Shivajinagar',
  'Domluru',
  'Bellanduru',
  'Marathahalli',
  'HSR Layout',
  'Hebbal',
  'Yeshwanthpura',
  'Whitefield',
  'Kengeri',
  'Bommanahalli',
]

const SEVERITY_SCORE: Record<Severity, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 }

const STATUSES: DefectStatus[] = [
  'Confirmed',
  'New',
  'Reported',
  'Under repair',
  'Confirmed',
  'Reappeared',
  'Fixed',
  'Confirmed',
]

function isoDaysAgo(days: number): string {
  // Fixed reference date keeps SSR and the client in agreement.
  const base = Date.UTC(2026, 8, 10)
  return new Date(base - days * 86_400_000).toISOString().slice(0, 10)
}

function buildSegments(seed: number): Segment[] {
  return Array.from({ length: 10 }, (_, i) => {
    const s = seed + i * 977
    const name = `${ROAD_NAMES[i]} · KM ${round(between(rand(s), 0.4, 14.8), 1)}`
    const lengthM = Math.round(between(rand(s + 1), 50, 100))
    // Density is the real-world quantity (defects per km); the count on a
    // 50–100 m segment follows from it. Generating the count first and dividing
    // produced absurd densities — 17 defects in 50 m is 340/km.
    const defectDensity = round(between(rand(s + 2), 2, 40), 1)
    const defectCount = Math.max(1, Math.round((defectDensity * lengthM) / 1000))
    const roughness = round(between(rand(s + 3), 1.6, 9.2), 1)
    const avgSeverity = round(between(rand(s + 4), 1.2, 3.8), 1)
    const waterloggingEvents30d = Math.round(between(rand(s + 5), 0, 9))
    const missingInfraCount = Math.round(between(rand(s + 6), 0, 5))

    const breakdown = computeScore({
      defectDensity,
      avgSeverity,
      roughness,
      missingInfraCount,
      waterloggingEvents30d,
    })

    // History drifts toward the current score so the trend and the headline agree.
    const history = Array.from({ length: 12 }, (_, w) => {
      const drift = (11 - w) * between(rand(s + 40 + w), 0.3, 1.6)
      const noise = between(rand(s + 60 + w), -1.2, 1.2)
      return round(Math.max(0, Math.min(100, breakdown.score + drift + noise)), 1)
    })

    return {
      id: `SEG-${1000 + ((seed + i * 137) % 8999)}`,
      name,
      ward: pick(WARDS, rand(s + 7)),
      lengthM,
      defectCount,
      defectDensity,
      roughness,
      avgSeverity,
      surfaceClass: surfaceClassFor(breakdown.score),
      waterloggingEvents30d,
      waterloggingDepthCm: Math.round(between(rand(s + 8), 4, 34)),
      missingInfraCount,
      trafficExposure: Math.round(between(rand(s + 9), 2_400, 48_000) / 100) * 100,
      busPassesPerDay: Math.round(between(rand(s + 10), 12, 96)),
      deteriorationRate: round(between(rand(s + 11), -1.4, 6.8), 1),
      breakdown,
      history,
    }
  }).sort((a, b) => a.breakdown.score - b.breakdown.score)
}

function buildDefects(seed: number, segments: Segment[]): Defect[] {
  return Array.from({ length: 14 }, (_, i) => {
    const s = seed + i * 613
    const seg = segments[i % segments.length]
    const widthCm = Math.round(between(rand(s), 12, 140))
    const lengthCm = Math.round(between(rand(s + 1), 15, 210))
    const severity = pick(['Low', 'Medium', 'High', 'Critical'] as const, rand(s + 2))
    const distinctBuses = Math.round(between(rand(s + 3), 1, 9))
    // More corroborating buses ⇒ more total passes; sightings can never be fewer.
    const sightings = distinctBuses + Math.round(between(rand(s + 4), 0, 22))
    const firstSeenDays = Math.round(between(rand(s + 5), 3, 120))

    return {
      id: `DEF-${4000 + ((seed + i * 271) % 5999)}`,
      type: pick(DEFECT_TYPES, rand(s + 6)),
      segmentId: seg.id,
      segmentName: seg.name,
      // Bengaluru's urban extent, roughly Kengeri (SW) to Whitefield/Yelahanka (NE).
      lat: round(between(rand(s + 7), 12.862, 13.139), 5),
      lng: round(between(rand(s + 8), 77.464, 77.784), 5),
      widthCm,
      lengthCm,
      areaCm2: widthCm * lengthCm,
      depth: pick(['Shallow', 'Medium', 'Deep'] as const, rand(s + 9)),
      severity,
      // Corroboration drives confidence: one pass is a guess, many are a fact.
      confidence: round(Math.min(0.99, 0.42 + distinctBuses * 0.07 + rand(s + 10) * 0.12), 2),
      sightings,
      distinctBuses,
      firstSeen: isoDaysAgo(firstSeenDays),
      lastSeen: isoDaysAgo(Math.round(between(rand(s + 11), 0, 3))),
      status: STATUSES[i % STATUSES.length],
      lane: pick(['Left', 'Centre', 'Right'] as const, rand(s + 12)),
      growthCm2PerWeek: Math.round(between(rand(s + 13), 4, 260)),
      daysToCritical:
        severity === 'Critical' ? null : Math.round(between(rand(s + 14), 6, 145)),
    }
  })
}

/* -------------------------------------------------------------------------- */
/* City-wide + trend                                                           */
/* -------------------------------------------------------------------------- */

export type CityStats = {
  kmSurveyed: number
  networkKm: number
  coveragePct: number
  activeDefects: number
  newThisWeek: number
  criticalOpen: number
  avgScore: number
}

export type WardRank = {
  ward: string
  score: number
  defects: number
  segments: number
}

export type TrendPoint = {
  /** Week label, oldest first. */
  week: string
  newDefects: number
  resolved: number
  avgScore: number
}

export type RepairStats = {
  /** Median days a repaired defect stays fixed. */
  durabilityDays: number
  /** Percent of repaired defects that come back. */
  reappearanceRate: number
  repairedTotal: number
  reappeared: number
}

export type RoadHealthData = {
  busId: string
  segments: Segment[]
  defects: Defect[]
  city: CityStats
  wards: WardRank[]
  trend: TrendPoint[]
  repair: RepairStats
  /** Defect counts by type, descending. */
  typeMix: { label: DefectType; value: number }[]
  /** Defect counts by severity. */
  severityMix: { label: Severity; value: number }[]
}

export function getRoadHealthData(busId: string): RoadHealthData {
  const seed = hashId(busId)
  const segments = buildSegments(seed)
  const defects = buildDefects(seed, segments)

  const typeCounts = new Map<DefectType, number>()
  for (const t of DEFECT_TYPES) typeCounts.set(t, 0)
  defects.forEach((d, i) => {
    // Weight the tally so the mix reads like a city, not 14 flat bars.
    typeCounts.set(d.type, (typeCounts.get(d.type) ?? 0) + Math.round(between(rand(seed + i), 6, 74)))
  })

  const severityCounts: Record<Severity, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 }
  defects.forEach((d, i) => {
    severityCounts[d.severity] += Math.round(between(rand(seed + 300 + i), 8, 66))
  })

  const activeDefects = Array.from(typeCounts.values()).reduce((a, b) => a + b, 0)
  const avgScore = round(
    segments.reduce((sum, s) => sum + s.breakdown.score, 0) / segments.length,
    1,
  )

  const trend: TrendPoint[] = Array.from({ length: 12 }, (_, w) => {
    const s = seed + 700 + w
    return {
      week: `W${w + 1}`,
      newDefects: Math.round(between(rand(s), 42, 168)),
      resolved: Math.round(between(rand(s + 50), 18, 132)),
      avgScore: round(
        segments.reduce((sum, seg) => sum + seg.history[w], 0) / segments.length,
        1,
      ),
    }
  })

  const wards: WardRank[] = WARDS.map((ward, i) => {
    const s = seed + 900 + i * 53
    return {
      ward,
      score: round(between(rand(s), 31, 88), 1),
      defects: Math.round(between(rand(s + 1), 40, 420)),
      segments: Math.round(between(rand(s + 2), 12, 140)),
    }
  }).sort((a, b) => a.score - b.score)

  const repairedTotal = Math.round(between(rand(seed + 1201), 120, 420))
  const reappeared = Math.round(repairedTotal * between(rand(seed + 1202), 0.08, 0.31))
  const coveragePct = round(between(rand(seed + 1101), 71, 94), 1)

  return {
    busId,
    segments,
    defects,
    city: {
      // BBMP maintains roughly 14,000 km of city roads. Surveyed km is derived
      // from coverage rather than drawn independently, so the two agree —
      // previously they were separate random draws and could contradict.
      kmSurveyed: round((NETWORK_KM * coveragePct) / 100, 1),
      networkKm: NETWORK_KM,
      coveragePct,
      activeDefects,
      newThisWeek: trend[trend.length - 1].newDefects,
      criticalOpen: severityCounts.Critical,
      avgScore,
    },
    wards,
    trend,
    repair: {
      durabilityDays: Math.round(between(rand(seed + 1203), 90, 420)),
      reappearanceRate: round((reappeared / repairedTotal) * 100, 1),
      repairedTotal,
      reappeared,
    },
    typeMix: Array.from(typeCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value),
    severityMix: (['Critical', 'High', 'Medium', 'Low'] as Severity[]).map((label) => ({
      label,
      value: severityCounts[label],
    })),
  }
}

/* -------------------------------------------------------------------------- */
/* Presentation helpers                                                        */
/* -------------------------------------------------------------------------- */

/** Status colours are reserved roles; each is always paired with a written label. */
export const SEVERITY_COLOR: Record<Severity, string> = {
  Low: 'var(--status-good)',
  Medium: 'var(--status-warning)',
  High: 'var(--status-serious)',
  Critical: 'var(--status-critical)',
}

export const SURFACE_COLOR: Record<SurfaceClass, string> = {
  Good: 'var(--status-good)',
  Fair: 'var(--status-warning)',
  Poor: 'var(--status-serious)',
  Critical: 'var(--status-critical)',
}

export const SEVERITY_RANK = SEVERITY_SCORE

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Confidence tier from corroboration — the "guess vs fact" distinction. */
export function corroborationTier(distinctBuses: number): {
  label: string
  tone: 'good' | 'warning' | 'muted'
} {
  if (distinctBuses >= 4) return { label: 'Confirmed by fleet', tone: 'good' }
  if (distinctBuses >= 2) return { label: 'Corroborated', tone: 'warning' }
  return { label: 'Single sighting', tone: 'muted' }
}
