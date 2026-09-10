'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState, useEffect } from 'react'
import { CargoMenu } from '@/components/ui/cargo-menu'
import { WarehouseLayoutPanel } from '@/components/ui/warehouse-layout'
import { TourGuide, TourButton } from '@/components/ui/tour-guide'
import { WarehouseInventoryProvider } from '@/lib/warehouse-inventory'
import { warehouses } from '@/lib/mock-data'

const WarehouseScene = dynamic(
  () => import('@/components/canvas/warehouse-scene').then(mod => ({ default: mod.WarehouseScene })),
  { ssr: false }
)

function LiveClock() {
  const [time, setTime] = useState<Date | null>(null)
  
  useEffect(() => {
    setTime(new Date())
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  
  if (!time) return null
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }
  
  return (
    <div className="text-right">
      <p className="text-xs text-ana-dark/60">{formatDate(time)}</p>
      <p className="text-lg font-mono font-semibold text-ana-blue tabular-nums">
        {formatTime(time)}
      </p>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-ana-sky to-white">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-ana-blue border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-ana-dark font-medium">Loading 3D Cargo Management System...</p>
      </div>
    </div>
  )
}

export default function Home() {
  const [showCargoMenu, setShowCargoMenu] = useState(false)
  const [activeWarehouseLayout, setActiveWarehouseLayout] = useState<string | null>(null)
  const [showTour, setShowTour] = useState(false)
  
  const activeWarehouse = activeWarehouseLayout 
    ? warehouses.find(w => w.id === activeWarehouseLayout) 
    : null
  
  return (
    <WarehouseInventoryProvider>
      <main className="relative w-full h-screen overflow-hidden">
        <header className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm border-b border-ana-soft-gray">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ana-blue flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h1 className="text-ana-dark font-semibold text-lg">3D Cargo Management System</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <TourButton onClick={() => setShowTour(true)} />
              
              <div id="warehouse-buttons" className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setActiveWarehouseLayout('warehouse-1')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white hover:shadow-sm group"
                >
                  <div className="w-6 h-6 rounded-md bg-ana-blue/10 group-hover:bg-ana-blue flex items-center justify-center transition-colors">
                    <svg className="w-3.5 h-3.5 text-ana-blue group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Warehouse 1</span>
                </button>
                
                <button
                  onClick={() => setActiveWarehouseLayout('warehouse-2')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white hover:shadow-sm group"
                >
                  <div className="w-6 h-6 rounded-md bg-ana-blue/10 group-hover:bg-ana-blue flex items-center justify-center transition-colors">
                    <svg className="w-3.5 h-3.5 text-ana-blue group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Warehouse 2</span>
                </button>
              </div>
              
              <button
                id="cargo-tracking-btn"
                onClick={() => setShowCargoMenu(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-ana-blue to-ana-light-blue text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Cargo Tracking
              </button>
            </div>
            
            <div id="live-status" className="flex items-center gap-6">
              <LiveClock />
              
              <div className="h-10 w-px bg-ana-soft-gray" />
              
              <div className="text-right">
                <p className="text-xs text-ana-dark/60">Live Status</p>
                <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Operational
                </p>
              </div>
            </div>
          </div>
        </header>

        <Suspense fallback={<LoadingFallback />}>
          <div className="canvas-container">
            <WarehouseScene onOpenWarehouseLayout={setActiveWarehouseLayout} />
          </div>
        </Suspense>

        <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-ana-soft-gray">
          <p className="text-xs text-ana-dark/80">
            <span className="font-semibold text-ana-blue">Controls:</span> Drag to rotate • Scroll to zoom • Click warehouse for layout
          </p>
        </div>
        
        <CargoMenu isOpen={showCargoMenu} onClose={() => setShowCargoMenu(false)} />
        
        {activeWarehouse && (
          <WarehouseLayoutPanel 
            data={activeWarehouse} 
            onClose={() => setActiveWarehouseLayout(null)} 
          />
        )}
        
        <TourGuide isOpen={showTour} onClose={() => setShowTour(false)} />
      </main>
    </WarehouseInventoryProvider>
  )
}
