/**
 * SectionPlaceholder — the common scaffold for all four bus-level sections.
 *
 * Deliberately holds no data. It lays out the regions each section is expected
 * to have — summary tiles, visual reporting, detailed data — so the routing and
 * the shell can be reviewed now, and each section's real structure can drop into
 * a known frame once specified.
 */

import {
  PlaceholderBlock,
  PlaceholderCard,
  PlaceholderStatRow,
  PlaceholderTable,
} from './Placeholder'

type SectionPlaceholderProps = {
  title: string
  description: string
}

export function SectionPlaceholder({ title, description }: SectionPlaceholderProps) {
  return (
    <div className="mx-auto w-full max-w-[90rem] px-4 py-5 sm:px-6 sm:py-6">
      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
          <span className="badge">Placeholder</span>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>
      </header>

      {/* 1 — summary metrics */}
      <section aria-label="Summary metrics" className="mb-4">
        <PlaceholderStatRow />
      </section>

      {/* 2 — visual reporting */}
      <section aria-label="Visual reporting" className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <PlaceholderCard
          title="Primary trend"
          subtitle="Reserved for this section's main time series"
          className="xl:col-span-2"
        >
          <PlaceholderBlock label="Chart region" hint="Structure to be specified." height="lg" />
        </PlaceholderCard>

        <PlaceholderCard title="Breakdown" subtitle="Reserved for a categorical breakdown">
          <PlaceholderBlock label="Chart region" hint="Structure to be specified." height="lg" />
        </PlaceholderCard>
      </section>

      {/* 3 — detailed data */}
      <section aria-label="Detailed data">
        <PlaceholderCard title="Detailed records" subtitle="Reserved for this section's table">
          <div className="-mx-5 -mb-5">
            <PlaceholderTable />
          </div>
        </PlaceholderCard>
      </section>
    </div>
  )
}
