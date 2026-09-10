'use client'

/**
 * Hooks that make the dashboard feel like it is receiving data rather than
 * displaying a snapshot.
 *
 * Every one of them starts from the server-rendered value and only changes
 * AFTER mount. That ordering is the whole trick: the first client render must
 * match the HTML the server sent, or React reports a hydration mismatch — which
 * is exactly what `mock-data.ts` does wrong by calling `Math.random()` at module
 * scope.
 */

import { useEffect, useRef, useState } from 'react'

/** Counts up on an interval, starting at 0. Drives anything time-based. */
export function useTick(intervalMs = 2000): number {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return tick
}

/**
 * A value that wanders around its base, as a live reading does.
 *
 * `amplitude` is the maximum drift in either direction. The walk is clamped to
 * that band so a metric never quietly wanders somewhere implausible over a long
 * session — a random walk left unbounded will.
 */
export function useDrift(base: number, amplitude: number, intervalMs = 3000): number {
  const [value, setValue] = useState(base)
  const baseRef = useRef(base)

  // Follow the base if the caller's data changes (e.g. a different segment).
  useEffect(() => {
    baseRef.current = base
    setValue(base)
  }, [base])

  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => {
        const step = (Math.random() - 0.5) * amplitude * 0.6
        const next = v + step
        const lo = baseRef.current - amplitude
        const hi = baseRef.current + amplitude
        return Math.min(hi, Math.max(lo, next))
      })
    }, intervalMs)
    return () => clearInterval(id)
  }, [amplitude, intervalMs])

  return value
}

/**
 * A counter that climbs by small random increments, as an event count does.
 *
 * Bounded on purpose. An uncapped climb looks fine for a minute and absurd
 * after ten — a "critical defects" count that started at 12 will read 120 if
 * someone leaves the tab open. It rises toward `base * (1 + headroom)` and then
 * holds, and most ticks add nothing so the movement reads as arrivals rather
 * than a metronome.
 */
export function useClimb(base: number, maxStep = 2, intervalMs = 4000, headroom = 0.12): number {
  const [value, setValue] = useState(base)

  useEffect(() => {
    setValue(base)
  }, [base])

  useEffect(() => {
    const ceiling = base + Math.max(1, Math.abs(base) * headroom)
    const id = setInterval(() => {
      setValue((v) => {
        if (v >= ceiling) return v
        // Most ticks are quiet; arrivals are bursty, not metronomic.
        if (Math.random() < 0.45) return v
        return Math.min(ceiling, v + 1 + Math.floor(Math.random() * maxStep))
      })
    }, intervalMs)
    return () => clearInterval(id)
  }, [base, maxStep, intervalMs, headroom])

  return value
}

/**
 * A fixed-length rolling window of readings — the shape a live trace needs.
 * Seeded deterministically so the first paint matches the server.
 */
export function useRollingSeries(
  seed: number[],
  next: () => number,
  intervalMs = 260,
): number[] {
  const [series, setSeries] = useState(seed)

  useEffect(() => {
    const id = setInterval(() => {
      setSeries((s) => [...s.slice(1), next()])
    }, intervalMs)
    return () => clearInterval(id)
    // `next` is a generator the caller keeps stable; re-subscribing on every
    // render would reset the interval continuously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs])

  return series
}

/**
 * Appends items to a capped list on an interval — a feed of arriving events.
 * Returns the newest first.
 */
export function useEventFeed<T>(
  initial: T[],
  produce: (index: number) => T,
  intervalMs = 5200,
  cap = 6,
): { items: T[]; latestKey: number } {
  const [items, setItems] = useState<T[]>(initial)
  const [latestKey, setLatestKey] = useState(0)
  const counter = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      counter.current += 1
      setItems((prev) => [produce(counter.current), ...prev].slice(0, cap))
      setLatestKey(counter.current)
    }, intervalMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, cap])

  return { items, latestKey }
}

/** True only after the component has mounted on the client. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
