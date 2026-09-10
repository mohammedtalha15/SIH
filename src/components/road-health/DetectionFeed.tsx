'use client'

/**
 * DetectionFeed — the unit's forward camera, looping, with the live inference
 * stream beside it.
 *
 * First thing on the Road Health screen: the raw evidence everything else on
 * the page is derived from. Only the front camera is shown — it is the view the
 * road-surface model actually runs on.
 *
 * Playback stops when the card scrolls out of view; decoding video off-screen
 * costs frames everywhere else on the page.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Camera, Maximize2, Minimize2, Pause, Play, VideoOff } from 'lucide-react'

import { DEFECT_TYPES, type DefectType } from '@/lib/road-health-data'
import { useEventFeed, useRollingSeries, useTick } from '@/lib/use-live'

const FRONT_CAMERA = {
  label: 'Forward road',
  position: 'Front · centre',
  src: '/t1_output.mp4',
}

const LANES = ['Left', 'Centre', 'Right'] as const

type Detection = {
  id: number
  type: DefectType
  confidence: number
  lane: string
  /** Seconds since it arrived, at render time. */
  age: number
}

/** Seeded so the first paint matches the server; live values arrive after mount. */
const SEED_DETECTIONS: Detection[] = [
  { id: 0, type: 'Pothole', confidence: 0.91, lane: 'Centre', age: 2 },
  { id: -1, type: 'Crack', confidence: 0.84, lane: 'Left', age: 9 },
  { id: -2, type: 'Faded zebra crossing', confidence: 0.77, lane: 'Right', age: 17 },
]

const SEED_TRACE = [
  0.31, 0.44, 0.38, 0.52, 0.41, 0.36, 0.62, 0.48, 0.35, 0.4, 0.55, 0.43,
  0.33, 0.47, 0.59, 0.42, 0.37, 0.5, 0.45, 0.34, 0.58, 0.4, 0.36, 0.49,
]

/** A scrolling IMU trace — the vertical-acceleration signal roughness comes from. */
function ImuTrace({ values }: { values: number[] }) {
  const W = 220
  const H = 40
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - v * H
    return `${x.toFixed(1)} ${y.toFixed(1)}`
  })
  const peak = Math.max(...values)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-10 w-full" role="img" aria-label="Live IMU vertical acceleration">
      <line x1="0" x2={W} y1={H / 2} y2={H / 2} stroke="var(--grid)" strokeWidth="1" />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={peak > 0.72 ? 'var(--status-critical)' : 'var(--series-1)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DetectionFeed() {
  const [playing, setPlaying] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [inView, setInView] = useState(true)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const tick = useTick(1000)

  // A new detection every few seconds, newest first.
  const produce = useCallback(
    (i: number): Detection => ({
      id: i,
      type: DEFECT_TYPES[Math.floor(Math.random() * DEFECT_TYPES.length)],
      confidence: 0.62 + Math.random() * 0.36,
      lane: LANES[Math.floor(Math.random() * LANES.length)],
      age: 0,
    }),
    [],
  )
  const { items: detections, latestKey } = useEventFeed(SEED_DETECTIONS, produce, 4200, 5)

  const nextSample = useCallback(() => {
    // Mostly small vibration with the occasional jolt — what a bus IMU sees.
    const jolt = Math.random() < 0.12
    return jolt ? 0.7 + Math.random() * 0.28 : 0.28 + Math.random() * 0.3
  }, [])
  const trace = useRollingSeries(SEED_TRACE, nextSample, 240)

  const framesAnalysed = useMemo(() => 184_320 + tick * 30, [tick])

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.1,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // A video that can't be decoded fires no error in some browsers — it just
  // sits at readyState 0 forever. Give up after a while and say so, rather
  // than showing a spinner that never resolves.
  useEffect(() => {
    const id = setTimeout(() => {
      const v = videoRef.current
      if (v && v.readyState === 0) setFailed(true)
    }, 12_000)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (playing && inView) {
      // Autoplay may still be refused; muted + playsInline makes it allowed in
      // practice, and a rejected promise must not surface as an unhandled error.
      void v.play().catch(() => setPlaying(false))
    } else {
      v.pause()
    }
  }, [playing, inView])

  const isLive = playing && inView && ready

  return (
    <div ref={containerRef} className="card overflow-hidden">
      <header className="card-header">
        <div className="min-w-0">
          <h2 className="card-title flex items-center gap-2">
            <Camera className="h-3.5 w-3.5 text-ink-muted" strokeWidth={1.75} />
            Forward camera
          </h2>
          <p className="card-subtitle">Edge inference runs on this stream</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-pressed={playing}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium
                       text-ink-secondary transition-colors duration-200 ease-out
                       hover:bg-surface-muted hover:text-ink"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            title={expanded ? 'Collapse' : 'Expand'}
            className="rounded-md p-1.5 text-ink-secondary transition-colors duration-200 ease-out
                       hover:bg-surface-muted hover:text-ink"
          >
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      <div className="card-body">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {/* The stream */}
          <div
            className="relative overflow-hidden rounded-md border border-hairline bg-ink lg:min-w-0 lg:flex-1"
            style={{ height: expanded ? '34rem' : '23rem' }}
          >
            <video
              ref={videoRef}
              src={FRONT_CAMERA.src}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
              autoPlay
              preload="auto"
              onCanPlay={() => {
                setReady(true)
                setFailed(false)
              }}
              onError={() => setFailed(true)}
            />

            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink px-6">
                {failed ? (
                  <div className="max-w-xs text-center">
                    <VideoOff className="mx-auto mb-2 h-5 w-5 text-white/40" strokeWidth={1.75} />
                    <p className="text-xs font-medium text-white/85">Feed cannot be decoded</p>
                    <p className="mt-1 text-label leading-relaxed text-white/50">
                      This browser has no decoder for the clip. The file is H.264/MP4, which every
                      mainstream browser supports.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                    <p className="text-label text-white/70">Buffering feed</p>
                  </div>
                )}
              </div>
            )}

            {/* Camera HUD */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-md border border-white/15 bg-black/55 px-2 py-1 text-label font-medium text-white backdrop-blur-sm">
                  {FRONT_CAMERA.label}
                  <span className="ml-1.5 text-white/60">{FRONT_CAMERA.position}</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-md border border-white/15 bg-black/55 px-2 py-1 text-label font-medium text-white backdrop-blur-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    {isLive && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-critical opacity-70" />
                    )}
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-critical" />
                  </span>
                  {isLive ? 'REC' : 'PAUSED'}
                </span>
              </div>

              <span className="flex w-fit items-center gap-2 rounded-md border border-white/15 bg-black/55 px-2 py-1 text-label text-white/80 backdrop-blur-sm">
                <span className="tabular-nums">{framesAnalysed.toLocaleString('en-GB')}</span>
                frames analysed
                <span className="text-white/35">·</span>
                <span className="tabular-nums">30 fps</span>
              </span>
            </div>
          </div>

          {/* Live inference stream */}
          <div className="flex flex-col gap-3 lg:w-64 lg:shrink-0">
            <div className="rounded-md border border-hairline bg-surface-muted/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="label-eyebrow">IMU · vertical accel</p>
                <Activity className="h-3 w-3 text-ink-muted" strokeWidth={1.75} />
              </div>
              <ImuTrace values={trace} />
              <p className="text-label tabular-nums text-ink-muted">
                {(trace[trace.length - 1] * 12).toFixed(2)} m/s² · sampling 100 Hz
              </p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col rounded-md border border-hairline">
              <div className="flex items-center justify-between gap-2 border-b border-hairline px-3 py-2">
                <p className="label-eyebrow">Live detections</p>
                <span className="flex items-center gap-1.5 text-label text-ink-muted">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-good opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-good" />
                  </span>
                  streaming
                </span>
              </div>

              <ul className="min-h-0 flex-1 divide-y divide-hairline overflow-y-auto">
                {detections.map((d) => (
                  <li
                    key={d.id}
                    className={`px-3 py-2 ${d.id === latestKey ? 'animate-in fade-in bg-surface-muted' : ''}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-xs font-medium text-ink">{d.type}</span>
                      <span className="shrink-0 text-label font-semibold tabular-nums text-ink">
                        {(d.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-label text-ink-muted">
                      {d.lane} lane
                      {d.id === latestKey && <span className="ml-1.5 text-ink-secondary">just now</span>}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
