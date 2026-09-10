import { notFound } from 'next/navigation'

import { SectionPlaceholder } from '@/components/dashboard/SectionPlaceholder'
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

export default function BusSectionPage({ params }: { params: { section: string } }) {
  const section = getSection(params.section)

  // Unknown slug is a genuine 404 — unlike an unknown bus id, there is no
  // meaningful structure to show for a section that does not exist.
  if (!section) notFound()

  return <SectionPlaceholder title={section.label} description={section.description} />
}
