'use client'

/**
 * SceneLoadingOverlay — covers the canvas until the 3D assets are actually ready.
 *
 * `next/dynamic`'s `loading` fallback only spans the chunk download. The scene
 * keeps loading after that (drei's `Environment` pulls an HDR over the network),
 * and during that window the canvas is mounted but paints nothing — so without
 * this the reader stares at an empty page for several seconds and assumes it
 * broke. The parent passes `visible`, cleared when the scene commits its first
 * frame; `useProgress` only fills in a percentage when one is available.
 *
 * Must be imported with `ssr: false` — it pulls in drei, and therefore three.
 */

import { useProgress } from '@react-three/drei'

export function SceneLoadingOverlay({ visible }: { visible: boolean }) {
  // Visibility is driven by the scene's own ready signal, not by `active`:
  // the LoadingManager is idle during the gap before the first asset request,
  // so keying the overlay on it would uncover an empty canvas.
  const { progress } = useProgress()

  if (!visible) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-canvas"
      role="status"
      aria-live="polite"
    >
      <div className="w-56 text-center">
        <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-hairline-strong border-t-ink" />
        <p className="text-sm font-medium text-ink">Bus Fleet Intelligence System</p>
        <p className="mt-1 text-xs text-ink-muted">Loading the city model</p>

        {/* Track + fill, hairline-thin so it stays quiet */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-sm bg-surface-sunken">
          <div
            className="h-full rounded-sm bg-ink transition-[width] duration-200 ease-out"
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
        {/* Percentage only — `item` is a raw asset filename, meaningless to an operator. */}
        <p className="mt-1.5 text-label tabular-nums text-ink-muted">{Math.round(progress)}%</p>
      </div>
    </div>
  )
}
