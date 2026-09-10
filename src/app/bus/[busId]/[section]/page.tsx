import { notFound } from 'next/navigation'

import { SectionPlaceholder } from '@/components/dashboard/SectionPlaceholder'
import { BusOperationsDashboard } from '@/components/bus-ops/BusOperationsDashboard'
import { RoadHealthDashboard } from '@/components/road-health/RoadHealthDashboard'
import { BUS_SECTIONS, getSection } from '@/lib/bus-sections'

/**
 * One route serves all four sections.
 *
 * They share a shell and, for now, a placeholder body, so four near-identical
 * files would be duplication. When each section gets its real structure, split
 * this into its own directory per slug.
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

  // Road Health and Bus Operations are built; the other two are placeholders.
  const busId = decodeURIComponent(params.busId)
  if (section.slug === 'road-health') return <RoadHealthDashboard busId={busId} />
  if (section.slug === 'bus-operations') return <BusOperationsDashboard busId={busId} />

  return <SectionPlaceholder title={section.label} description={section.description} />
}
