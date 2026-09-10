'use client'

import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { MeshStandardMaterial } from 'three'
import type { ProblemAlert } from '@/lib/types'

type ProblemAlertProps = {
  alert: ProblemAlert
  onClose?: (id: string) => void
}

export function ProblemAlertMarker({ alert, onClose }: ProblemAlertProps) {
  const color = useMemo(() => {
    switch (alert.severity) {
      case 'high':
        return '#EF4444'
      case 'medium':
        return '#F59E0B'
      case 'low':
        return '#3B82F6'
      default:
        return '#6B7280'
    }
  }, [alert.severity])

  const borderColor = '#4A90A4'

  return (
    <group position={alert.position}>
      {/* ピン（下向きの三角形）*/}
      <mesh position={[0, 6, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[1.5, 4, 4]} />
        <meshStandardMaterial color={borderColor} />
      </mesh>
      
      {/* カード */}
      <Html
        position={[0, 14, 0]}
        center
        style={{ pointerEvents: 'auto' }}
      >
        <div
          style={{
            backgroundColor: 'white',
            border: `3px solid ${borderColor}`,
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            width: '100px',
            position: 'relative',
          }}
        >
          {onClose && (
            <button
              onClick={() => onClose(alert.id)}
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#374151',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '10px',
                lineHeight: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          )}
          
          {/* イラスト部分 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: '6px',
          }}>
            <svg width="70" height="60" viewBox="0 0 70 60">
              {/* パレット */}
              <rect x="10" y="45" width="50" height="4" fill="#8B4513" rx="1" />
              <rect x="12" y="49" width="8" height="6" fill="#A0522D" />
              <rect x="31" y="49" width="8" height="6" fill="#A0522D" />
              <rect x="50" y="49" width="8" height="6" fill="#A0522D" />
              
              {/* 下段ボックス */}
              <rect x="12" y="30" width="22" height="15" fill="#F5D77E" stroke="#D4B86A" strokeWidth="1" />
              <rect x="36" y="30" width="22" height="15" fill="#F5D77E" stroke="#D4B86A" strokeWidth="1" />
              
              {/* 上段ボックス */}
              <rect x="18" y="12" width="18" height="18" fill="#F5D77E" stroke="#D4B86A" strokeWidth="1" />
              <rect x="38" y="12" width="18" height="18" fill="#F5D77E" stroke="#D4B86A" strokeWidth="1" />
              
              {/* ボックスのテープライン */}
              <line x1="27" y1="12" x2="27" y2="30" stroke="#D4B86A" strokeWidth="1" />
              <line x1="47" y1="12" x2="47" y2="30" stroke="#D4B86A" strokeWidth="1" />
              <line x1="23" y1="30" x2="23" y2="45" stroke="#D4B86A" strokeWidth="1" />
              <line x1="47" y1="30" x2="47" y2="45" stroke="#D4B86A" strokeWidth="1" />
              
              {/* WiFiシグナル */}
              <g transform="translate(25, 8)">
                <path d="M8 12 A2 2 0 1 1 8.01 12" fill={color} />
                <path d="M4 9 Q8 5 12 9" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M1 6 Q8 0 15 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>
            </svg>
          </div>
          
          {/* 説明文 */}
          <div style={{
            fontSize: '9px',
            color: '#374151',
            textAlign: 'center',
            lineHeight: '1.3',
            fontWeight: '500',
          }}>
            {alert.message}
          </div>
          
          {/* ステータスバー */}
          <div style={{
            marginTop: '4px',
            padding: '2px 6px',
            backgroundColor: color,
            borderRadius: '3px',
            fontSize: '7px',
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}>
            {alert.severity} priority
          </div>
        </div>
      </Html>
    </group>
  )
}
