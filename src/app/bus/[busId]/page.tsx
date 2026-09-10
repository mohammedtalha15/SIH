import { redirect } from 'next/navigation'

import { busSectionHref, DEFAULT_SECTION } from '@/lib/bus-sections'

/**
 * A unit has no dashboard of its own — selecting one opens its first section.
 * Per the dashboard structure, that is Road Health.
 */
export default function BusIndexPage({ params }: { params: { busId: string } }) {
  redirect(busSectionHref(decodeURIComponent(params.busId), DEFAULT_SECTION))
}
