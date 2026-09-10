'use client'

/**
 * Warehouse Scene Wrapper with Loading State
 * Shows loading screen while warehouse models are being initialized
 */

import { useState, useEffect, Suspense } from 'react'
import { WarehouseScene } from './warehouse-scene'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { usePanelStore } from '@/lib/stores/panelStore'

const WAREHOUSE_LOADING_STEPS = [
  { threshold: 30, label: 'Loading warehouse layout...' },
  { threshold: 60, label: 'Building 3D structures...' },
  { threshold: 85, label: 'Initializing zones...' },
]

export function WarehouseSceneWrapper() {
  const [isReady, setIsReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const { setPanel, closePanel, isOpen } = usePanelStore()

  const handleShowTrucks = () => {
    if (isOpen('truck-list')) {
      closePanel()
    } else {
      setPanel('truck-list')
    }
  }

  const handleShowTrolleys = () => {
    if (isOpen('uld-list')) {
      closePanel()
    } else {
      setPanel('uld-list')
    }
  }

  useEffect(() => {
    // Faster loading for warehouse since it's already optimized
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setIsReady(true)
          return 100
        }
        // Quick progress
        return Math.min(prev + 15, 100)
      })
    }, 200)

    return () => clearInterval(progressInterval)
  }, [])

  if (!isReady) {
    return (
      <LoadingScreen 
        title="Loading Warehouse View"
        progress={progress}
        steps={WAREHOUSE_LOADING_STEPS}
      />
    )
  }

  return (
    <>
      <Suspense fallback={<LoadingScreen title="Loading Warehouse View" progress={50} steps={WAREHOUSE_LOADING_STEPS} />}>
        <WarehouseScene 
          onShowTrucks={handleShowTrucks}
          onShowTrolleys={handleShowTrolleys}
        />
      </Suspense>
      
      {/* Panels are now rendered globally at app level - no duplicates needed here */}
    </>
  )
}
