'use client'

/**
 * Generic Loading Screen Component
 * Used across all views (Airport, Warehouse, Interior)
 */

type LoadingScreenProps = {
  title: string
  progress: number
  steps: Array<{ threshold: number; label: string }>
}

export function LoadingScreen({ title, progress, steps }: LoadingScreenProps) {
  const currentStep = steps.findIndex(step => progress < step.threshold)
  const activeStepIndex = currentStep === -1 ? steps.length - 1 : Math.max(0, currentStep - 1)

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0A0A0A]">
      <div className="text-center max-w-md px-6">
        {/* Spinning Loader */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-belli-orange-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-belli-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 flex items-center justify-center">
              <div className="w-3 h-3 bg-belli-orange-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          {title}
        </h2>
        <p className="text-gray-400 mb-6">
          {steps[activeStepIndex]?.label || 'Loading...'}
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-belli-orange-500 to-belli-red-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
        
        {/* Loading Steps */}
        <div className="mt-6 space-y-2 text-left">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`flex items-center gap-2 text-sm ${
                progress > step.threshold ? 'text-belli-orange-400' : 'text-gray-600'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                progress > step.threshold ? 'bg-belli-orange-500' : 'bg-gray-700'
              }`}></div>
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
