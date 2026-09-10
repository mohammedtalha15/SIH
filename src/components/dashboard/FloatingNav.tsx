'use client'

/**
 * FloatingNav — the Overview navbar.
 *
 * A compact centred pill floating over the 3D scene, so the model stays the
 * full-bleed subject of the page. It becomes a traditional side rail on the
 * bus-level dashboard; that screen is not built yet.
 *
 * The glass treatment (translucent surface + blur + saturate + a hairline and
 * an inset top highlight) is what lets it sit this light over the model without
 * losing its own edge — at this opacity the blur is doing most of the work of
 * keeping the text legible.
 */

import { useEffect, useState } from 'react'
import { Bus, LayoutGrid, Map, Settings, SlidersHorizontal } from 'lucide-react'

function LiveClock() {
  // Client-only: the server has no wall clock to match, so rendering a time
  // during SSR guarantees a hydration mismatch.
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Reserve the slot so the pill doesn't jump width when the clock mounts.
  if (!now) return <span className="h-3 w-[3.25rem]" aria-hidden="true" />

  return (
    <span className="whitespace-nowrap text-label font-medium tabular-nums text-ink-secondary">
      {now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })}
    </span>
  )
}

const VIEWS = [
  { key: 'fleet', label: 'Fleet', icon: LayoutGrid },
  { key: 'map', label: 'Map', icon: Map },
] as const

export type ViewKey = (typeof VIEWS)[number]['key']

type FloatingNavProps = {
  view: ViewKey
  onViewChange: (v: ViewKey) => void
}

export function FloatingNav({ view, onViewChange }: FloatingNavProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-3 sm:top-4">
      <nav
        className="pointer-events-auto flex h-9 max-w-full items-center gap-1.5 rounded-full
                   border border-hairline bg-surface/55 pl-2 pr-1.5 shadow-card
                   backdrop-blur-xl backdrop-saturate-150
                   [box-shadow:inset_0_1px_0_0_rgb(255_255_255/0.55),0_1px_2px_0_rgb(11_11_11/0.06)]"
        aria-label="Primary"
      >
        {/* Brand */}
        <span className="flex shrink-0 items-center gap-1.5 pl-0.5">
          <Bus className="h-3.5 w-3.5 text-ink" strokeWidth={2} />
          <span className="hidden truncate text-label font-semibold tracking-tight text-ink sm:block">
            Bus Fleet Intelligence
          </span>
        </span>

        <span className="mx-0.5 h-4 w-px shrink-0 bg-hairline" />

        {/* View switcher */}
        <div className="flex shrink-0 items-center gap-0.5" role="group">
          {VIEWS.map((v) => {
            const Icon = v.icon
            const isActive = v.key === view
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => onViewChange(v.key)}
                aria-pressed={isActive}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-label font-medium
                            transition-colors duration-200 ease-out ${
                              isActive
                                ? 'bg-ink/[0.06] text-ink'
                                : 'text-ink-secondary hover:bg-ink/[0.04] hover:text-ink'
                            }`}
              >
                <Icon className="h-3 w-3" strokeWidth={1.75} />
                {v.label}
              </button>
            )
          })}
        </div>

        <span className="mx-0.5 h-4 w-px shrink-0 bg-hairline" />

        <LiveClock />

        {/* Status: dot + written label, never colour alone */}
        <span className="ml-0.5 flex shrink-0 items-center gap-1 whitespace-nowrap text-label font-medium text-ink-secondary">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-good opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-good" />
          </span>
          <span className="hidden sm:inline">Live</span>
        </span>

        <span className="mx-0.5 h-4 w-px shrink-0 bg-hairline" />

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            title="Filters"
            className="rounded-full p-1 text-ink-secondary transition-colors duration-200 ease-out hover:bg-ink/[0.06] hover:text-ink"
          >
            <SlidersHorizontal className="h-3 w-3" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            title="Settings"
            className="rounded-full p-1 text-ink-secondary transition-colors duration-200 ease-out hover:bg-ink/[0.06] hover:text-ink"
          >
            <Settings className="h-3 w-3" strokeWidth={1.75} />
          </button>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[0.5625rem] font-semibold leading-none text-ink-inverted">
            AR
          </span>
        </div>
      </nav>
    </div>
  )
}
