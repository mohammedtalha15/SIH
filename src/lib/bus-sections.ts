/**
 * The four sections of the bus-level dashboard.
 *
 * Single source of truth for the side nav, the route segment, and the section
 * page header — so adding a section means editing this list only, and an
 * unknown slug can be rejected rather than rendering an empty shell.
 *
 * The detailed structure of each section is still to be specified; the pages
 * are deliberately placeholders until then.
 */

export const BUS_SECTIONS = [
  {
    slug: 'road-health',
    label: 'Road Health',
    description: 'Surface condition, defects and segment history observed by this unit.',
  },
  {
    slug: 'bus-operations',
    label: 'Bus Operations',
    description: 'Route adherence, schedule, utilisation and vehicle telemetry.',
  },
  {
    slug: 'safety-intelligence',
    label: 'Safety Intelligence',
    description: 'Driving behaviour, incidents and near-miss detection.',
  },
  {
    slug: 'traffic-intelligence',
    label: 'Traffic Intelligence',
    description: 'Congestion, flow and travel-time contribution along the route.',
  },
] as const

export type BusSectionSlug = (typeof BUS_SECTIONS)[number]['slug']
export type BusSection = (typeof BUS_SECTIONS)[number]

/** The section a bus opens on, per the dashboard structure. */
export const DEFAULT_SECTION: BusSectionSlug = 'road-health'

export function getSection(slug: string): BusSection | undefined {
  return BUS_SECTIONS.find((s) => s.slug === slug)
}

export function busSectionHref(busId: string, slug: BusSectionSlug = DEFAULT_SECTION): string {
  return `/bus/${encodeURIComponent(busId)}/${slug}`
}
