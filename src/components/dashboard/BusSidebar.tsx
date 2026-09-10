'use client'

/**
 * BusSidebar — the bus-level dashboard's navigation.
 *
 * Per the dashboard structure, the Overview's floating pill becomes a
 * traditional side rail once you drill into a unit. Fixed rail from `lg` up, an
 * off-canvas drawer below it.
 *
 * The active section comes from the URL rather than local state, so a deep link
 * and a click land in the same place.
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, ArrowLeft, Bus, Route, ShieldCheck, X, type LucideIcon } from 'lucide-react'

import { BUS_SECTIONS, busSectionHref, type BusSectionSlug } from '@/lib/bus-sections'

const SECTION_ICONS: Record<BusSectionSlug, LucideIcon> = {
  'road-health': Route,
  'bus-operations': Bus,
  'safety-intelligence': ShieldCheck,
  'traffic-intelligence': Activity,
}

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ')
}

type BusSidebarProps = {
  busId: string
  /** Display label for the unit — falls back to the route id when unknown. */
  fleetNumber: string
  subtitle?: string
  open: boolean
  onClose: () => void
}

export function BusSidebar({ busId, fleetNumber, subtitle, open, onClose }: BusSidebarProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/20 lg:hidden animate-in fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-hairline bg-surface',
          'transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0 animate-in slide-in-left' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Bus dashboard sections"
      >
        {/* Back to the Overview */}
        <div className="flex h-12 shrink-0 items-center gap-1 border-b border-hairline px-2">
          <Link
            href="/"
            className="inline-flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-label
                       font-medium uppercase text-ink-muted transition-colors duration-200 ease-out
                       hover:bg-surface-muted hover:text-ink"
          >
            <ArrowLeft className="h-3 w-3" strokeWidth={2} />
            Overview
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-muted hover:bg-surface-muted hover:text-ink lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Unit identity */}
        <div className="flex shrink-0 items-center gap-2.5 border-b border-hairline px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink">
            <Bus className="h-4 w-4 text-ink-inverted" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tabular-nums tracking-tight text-ink">
              {fleetNumber}
            </span>
            <span className="block truncate text-label text-ink-muted">
              {subtitle ?? 'Unit dashboard'}
            </span>
          </span>
        </div>

        {/* Sections */}
        <nav className="flex-1 overflow-y-auto p-2">
          <p className="label-eyebrow px-2 pb-1.5 pt-1">Sections</p>
          <ul className="space-y-0.5">
            {BUS_SECTIONS.map((section) => {
              const Icon = SECTION_ICONS[section.slug]
              const href = busSectionHref(busId, section.slug)
              const isActive = pathname === href

              return (
                <li key={section.slug}>
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onClose}
                    className={cx(
                      'flex items-center gap-2.5 rounded-md px-2 py-2 text-sm',
                      'transition-colors duration-200 ease-out',
                      isActive
                        ? 'bg-surface-sunken font-medium text-ink'
                        : 'text-ink-secondary hover:bg-surface-muted hover:text-ink',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{section.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Utility */}
        <div className="border-t border-hairline p-2">
          <p className="px-2 py-1 text-label text-ink-muted">
            Section contents are placeholders pending spec.
          </p>
        </div>
      </aside>
    </>
  )
}

/** Re-exported so the layout header can badge the active section with the same icon. */
export { SECTION_ICONS }
