import type { ReactNode } from 'react'

import { BusDashboardShell } from '@/components/dashboard/BusDashboardShell'
import { BUSES, DEPOTS } from '@/lib/fleet-data'

/**
 * Shell for every section of one unit's dashboard.
 *
 * The unit is resolved here rather than per-section so switching sections keeps
 * the rail and header mounted — only the section body swaps.
 */
export default function BusLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { busId: string }
}) {
  const busId = decodeURIComponent(params.busId)
  const bus = BUSES.find((b) => b.id === busId)
  const depot = bus ? DEPOTS.find((d) => d.id === bus.depotId) : undefined

  // An unknown id still renders the shell: the sections are placeholders, so a
  // stale or hand-typed link should show the structure rather than a 404.
  return (
    <BusDashboardShell
      busId={busId}
      fleetNumber={bus?.fleetNumber ?? busId}
      subtitle={bus ? `${bus.route} · ${depot?.name ?? 'Unassigned depot'}` : 'Unknown unit'}
    >
      {children}
    </BusDashboardShell>
  )
}
