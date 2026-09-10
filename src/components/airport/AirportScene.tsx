'use client'

/**
 * Airport Scene Wrapper - Linus's Terminal View
 * Displays the full airport layout with 3D buildings, runways, and animated planes
 * Shows loading screen until buildings are fully rendered
 */

import dynamic from 'next/dynamic'
import { useState, useEffect, createContext } from 'react'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

// Context for communicating when airport is ready
type AirportLoadingContextType = {
  setAirportReady: () => void
}

export const AirportLoadingContext = createContext<AirportLoadingContextType>({
  setAirportReady: () => {},
})

// Dynamically import Linus's Scene component with no SSR
const LinusScene = dynamic(
  () => import('./Scene').then(mod => mod.Scene),
  { ssr: false }
)

const AIRPORT_LOADING_STEPS = [
  { threshold: 20, label: 'Loading airport layout...' },
  { threshold: 50, label: 'Extracting building shapes...' },
  { threshold: 80, label: 'Rendering 3D models...' },
]

export function AirportScene() {
  const [isReady, setIsReady] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Progress animation that slows down near completion
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          // Stay at 90% until we get the ready signal
          return 90
        }
        // Gradual progress increase
        const increment = prev < 30 ? 10 : prev < 60 ? 8 : 5
        return Math.min(prev + increment, 90)
      })
    }, 400)

    return () => clearInterval(progressInterval)
  }, [])

  const setAirportReady = () => {
    console.log('Airport buildings loaded and rendered!')
    setProgress(100)
    // Small delay for smooth transition
    setTimeout(() => setIsReady(true), 300)
  }

  return (
    <AirportLoadingContext.Provider value={{ setAirportReady }}>
      <div className="w-full h-full relative">
        {/* Always render the scene but keep it hidden until ready */}
        <div className={`w-full h-full ${isReady ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
          <LinusScene />
        </div>
        
        {/* Show loading screen until ready */}
        {!isReady && (
          <div className="absolute inset-0 z-50">
            <LoadingScreen 
              title="Loading Airport Terminal"
              progress={progress}
              steps={AIRPORT_LOADING_STEPS}
            />
          </div>
        )}
      </div>
    </AirportLoadingContext.Provider>
  )
}
