'use client'

/**
 * BusDashboardShell — the traditional rail + workspace frame for a single unit.
 *
 * Lives in a client component because the mobile drawer needs state and the
 * sidebar reads the active section from the pathname; the route files stay
 * server components that just resolve params and pass them in.
 */

import { useState, type ReactNode } from 'react'
import { PanelLeft } from 'lucide-react'

import { BusSidebar } from './BusSidebar'

type BusDashboardShellProps = {
  busId: string
  fleetNumber: string
  subtitle?: string
  children: ReactNode
}

export function BusDashboardShell({
  busId,
  fleetNumber,
  subtitle,
  children,
}: BusDashboardShellProps) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <BusSidebar
        busId={busId}
        fleetNumber={fleetNumber}
        subtitle={subtitle}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile-only bar to reach the rail; the rail is always visible on lg+ */}
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-hairline bg-surface px-3 lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="rounded-md p-1.5 text-ink-secondary hover:bg-surface-muted hover:text-ink"
            aria-label="Open navigation"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <span className="truncate text-sm font-semibold tabular-nums text-ink">{fleetNumber}</span>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
