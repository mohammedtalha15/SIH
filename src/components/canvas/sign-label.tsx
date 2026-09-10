'use client'

import { Html } from '@react-three/drei'

interface SignLabelProps {
  position: [number, number, number]
  text: string
  subtext?: string
  color?: string
  isLarge?: boolean
  onClick?: () => void
}

export function SignLabel({ 
  position, 
  text, 
  subtext,
  color = '#6B7280',
  isLarge = false,
  onClick
}: SignLabelProps) {
  return (
    <group position={position}>
      {/* Support pole */}
      <mesh position={[0, -4, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 8, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Label card - clickable if onClick provided */}
      <Html
        center
        style={{ pointerEvents: onClick ? 'auto' : 'none' }}
      >
        <div
          onClick={onClick}
          style={{
            backgroundColor: color,
            color: 'white',
            padding: isLarge ? '8px 16px' : '6px 14px',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: isLarge ? '13px' : '11px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            transform: 'skewX(-5deg)',
            minWidth: isLarge ? '100px' : '80px',
            textAlign: 'center',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (onClick) {
              e.currentTarget.style.transform = 'skewX(-5deg) scale(1.05)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (onClick) {
              e.currentTarget.style.transform = 'skewX(-5deg) scale(1)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
            }
          }}
        >
          <div>{text}</div>
          {subtext && (
            <div style={{ 
              fontSize: isLarge ? '10px' : '9px', 
              marginTop: '2px', 
              opacity: 0.9,
              fontWeight: 600
            }}>
              {subtext}
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}
