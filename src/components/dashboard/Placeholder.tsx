'use client'

/**
 * Placeholder primitives for the bus-level dashboard.
 *
 * These render the SHAPE of a section without inventing any figures. The
 * detailed structure of each of the four sections is still to be specified, so
 * anything that looked like real content here would just have to be thrown away
 * — and worse, would read as working data in a demo.
 */

import type { ReactNode } from 'react'

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/** A reserved region, labelled with what will eventually occupy it. */
export function PlaceholderBlock({
  label,
  hint,
  height = 'md',
  className,
}: {
  label: string
  hint?: string
  height?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const heights = { sm: 'h-24', md: 'h-44', lg: 'h-64' }

  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-hairline-strong',
        'bg-surface-muted/50 px-4 text-center',
        heights[height],
        className,
      )}
    >
      <p className="label-eyebrow">{label}</p>
      {hint && <p className="max-w-xs text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}

/** A card wrapper matching the real dashboard chrome, holding a reserved region. */
export function PlaceholderCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx('card', className)}>
      <header className="card-header">
        <div className="min-w-0">
          <h3 className="card-title">{title}</h3>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      </header>
      <div className="card-body">{children}</div>
    </section>
  )
}

/** The stat-tile row every section is expected to open with. */
export function PlaceholderStatRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card p-5">
          <div className="h-2.5 w-20 rounded-sm bg-surface-sunken" />
          <div className="mt-3 h-7 w-24 rounded-sm bg-surface-sunken" />
          <div className="mt-3 border-t border-hairline pt-3">
            <div className="h-2 w-32 rounded-sm bg-surface-sunken" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Rows of a table that has no columns defined yet. */
export function PlaceholderTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden">
      <div className="flex items-center gap-4 border-b border-hairline px-5 py-2">
        {[28, 20, 16, 12].map((w, i) => (
          <div key={i} className="h-2.5 rounded-sm bg-hairline-strong" style={{ width: `${w}%` }} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-hairline px-5 py-3 last:border-0">
          {[28, 20, 16, 12].map((w, i) => (
            <div
              key={i}
              className="h-2.5 rounded-sm bg-surface-sunken"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
