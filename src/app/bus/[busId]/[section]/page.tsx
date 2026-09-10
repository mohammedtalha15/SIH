import { notFound } from 'next/navigation'

import { BusOperationsDashboard } from '@/components/bus-ops/BusOperationsDashboard'
import { RoadHealthDashboard } from '@/components/road-health/RoadHealthDashboard'
import { SafetyIntelligenceDashboard } from '@/components/safety/SafetyIntelligenceDashboard'
import { TrafficIntelligenceDashboard } from '@/components/traffic/TrafficIntelligenceDashboard'
import { BUS_SECTIONS, getSection } from '@/lib/bus-sections'

/**
 * One route serves all four sections.
 *
 * Each slug now resolves directly to its own dashboard component; there is no
 * longer a placeholder fallback since all four known slugs are covered. An
 * unknown slug is rejected by notFound() before the slug checks run.
 */
export function generateStaticParams() {
  return BUS_SECTIONS.map((s) => ({ section: s.slug }))
}

export default function BusSectionPage({
  params,
}: {
  params: { busId: string; section: string }
}) {
  const section = getSection(params.section)

  // Unknown slug is a genuine 404 — unlike an unknown bus id, there is no
  // meaningful structure to show for a section that does not exist.
  if (!section) notFound()

  const busId = decodeURIComponent(params.busId)
  if (section.slug === 'road-health')          return <RoadHealthDashboard busId={busId} />
  if (section.slug === 'bus-operations')       return <BusOperationsDashboard busId={busId} />
  if (section.slug === 'safety-intelligence')  return <SafetyIntelligenceDashboard busId={busId} />
  if (section.slug === 'traffic-intelligence') return <TrafficIntelligenceDashboard busId={busId} />
}
