'use client'

import { useState, useEffect } from 'react'

type TourStep = {
  id: string
  title: string
  description: string
  target: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to 3D Cargo Management! 👋',
    description: 'This interactive system lets you visualize and manage air cargo operations in real-time. Let\'s take a quick tour!',
    target: 'center',
    position: 'center',
  },
  {
    id: 'warehouses',
    title: '3D Warehouse View 🏭',
    description: 'The 3D scene shows two cargo warehouses. You can rotate the view by dragging, zoom with scroll, and click on any warehouse to see its layout.',
    target: 'canvas',
    position: 'center',
  },
  {
    id: 'warehouse-buttons',
    title: 'Quick Warehouse Access 📦',
    description: 'Click these buttons to instantly open the layout view of each warehouse. You can see rack positions, stored packages, and drag-drop cargo between racks.',
    target: '#warehouse-buttons',
    position: 'bottom',
  },
  {
    id: 'cargo-tracking',
    title: 'Cargo Tracking 📋',
    description: 'Track all packages in the system! Filter by status (On Truck, In Warehouse, On ULD) and search by AWB number, description, or destination.',
    target: '#cargo-tracking-btn',
    position: 'bottom',
  },
  {
    id: 'trucks',
    title: 'Incoming Trucks 🚛',
    description: 'Watch trucks arrive and unload cargo at the front of the warehouses. Click any truck to see its manifest and unloading progress in real-time.',
    target: 'canvas',
    position: 'center',
  },
  {
    id: 'uld',
    title: 'ULD Transporters ✈️',
    description: 'ULD (Unit Load Device) transporters wait at the back of warehouses. When enough packages accumulate, they load cargo for aircraft departure.',
    target: 'canvas',
    position: 'center',
  },
  {
    id: 'live-status',
    title: 'Live Status 🟢',
    description: 'The system shows real-time date/time and operational status. All animations and data updates happen live!',
    target: '#live-status',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 🎉',
    description: 'Start exploring by clicking on warehouses, trucks, or ULDs. Open the Cargo Tracking panel to see all packages. Enjoy managing your cargo!',
    target: 'center',
    position: 'center',
  },
]

export function TourGuide({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  
  const step = tourSteps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === tourSteps.length - 1
  const progress = ((currentStep + 1) / tourSteps.length) * 100
  
  useEffect(() => {
    if (!isOpen) return
    
    if (step.target === 'center' || step.target === 'canvas') {
      setTargetRect(null)
      return
    }
    
    const element = document.querySelector(step.target)
    if (element) {
      setTargetRect(element.getBoundingClientRect())
    }
  }, [isOpen, currentStep, step.target])
  
  if (!isOpen) return null
  
  const handleNext = () => {
    if (isLastStep) {
      onClose()
      setCurrentStep(0)
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }
  
  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }
  
  const handleSkip = () => {
    onClose()
    setCurrentStep(0)
  }
  
  const getTooltipStyle = (): React.CSSProperties => {
    const tooltipWidth = 384
    const tooltipHeight = 220
    const margin = 16
    
    if (!targetRect || step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }
    
    const padding = 16
    let top: number | undefined
    let left: number | undefined
    
    switch (step.position) {
      case 'bottom':
        top = targetRect.bottom + padding
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        break
      case 'top':
        top = targetRect.top - tooltipHeight - padding
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        break
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
        left = targetRect.left - tooltipWidth - padding
        break
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
        left = targetRect.right + padding
        break
    }
    
    if (left !== undefined) {
      left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin))
    }
    if (top !== undefined) {
      top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin))
    }
    
    return {
      top: top !== undefined ? `${top}px` : undefined,
      left: left !== undefined ? `${left}px` : undefined,
    }
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop - no blur to keep 3D scene visible */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Highlight cutout for target element */}
      {targetRect && (
        <div 
          className="absolute border-4 border-ana-blue rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] animate-pulse"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}
      
      {/* Animated pointer hand */}
      {targetRect && (
        <div 
          className="absolute z-[102] pointer-events-none"
          style={{
            top: `${targetRect.top + targetRect.height / 2 + 15}px`,
            left: `${targetRect.left + targetRect.width / 2 + 15}px`,
          }}
        >
          <div className="relative animate-[tap_1s_ease-in-out_infinite]">
            <svg className="w-10 h-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" viewBox="0 0 24 24" fill="none">
              <path 
                d="M13.5 3C14.33 3 15 3.67 15 4.5V11.09L17.5 12.5C18.27 12.96 18.58 13.93 18.21 14.74L16.59 18.5C16.05 19.76 14.81 20.5 13.44 20.5H8C6.34 20.5 5 19.16 5 17.5V12C5 10.9 5.9 10 7 10H8V4.5C8 3.67 8.67 3 9.5 3C10.33 3 11 3.67 11 4.5V10H12V4.5C12 3.67 12.67 3 13.5 3Z" 
                fill="white"
                stroke="#00467F"
                strokeWidth="1.5"
              />
              <path 
                d="M9.5 4.5V10M13.5 4.5V11" 
                stroke="#0072CE"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full border-2 border-ana-blue bg-ana-blue/20 animate-ping" />
          </div>
        </div>
      )}
      
      {/* Tooltip */}
      <div 
        className="absolute z-[101] w-96 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={getTooltipStyle()}
      >
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-ana-blue to-ana-light-blue transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 font-medium">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
            <button 
              onClick={handleSkip}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip tour
            </button>
          </div>
          
          <h3 className="text-lg font-bold text-ana-dark mb-2">{step.title}</h3>
          
          <p className="text-sm text-gray-600 leading-relaxed mb-5">{step.description}</p>
          
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isFirstStep 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            
            <div className="flex items-center gap-1.5">
              {tourSteps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentStep 
                      ? 'bg-ana-blue w-4' 
                      : i < currentStep 
                        ? 'bg-ana-blue/50' 
                        : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 bg-ana-blue text-white rounded-lg text-sm font-medium hover:bg-ana-blue/90 transition-colors"
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TourButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 group overflow-hidden"
      title="Take a quick tour"
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      <div className="relative">
        <svg className="w-4 h-4 animate-[wiggle_1s_ease-in-out_infinite]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L13.09 8.26L19 7L14.74 11.26L21 12L14.74 12.74L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12.74L3 12L9.26 11.26L5 7L10.91 8.26L12 2Z" />
        </svg>
      </div>
      
      <span className="relative">Tour</span>
    </button>
  )
}
