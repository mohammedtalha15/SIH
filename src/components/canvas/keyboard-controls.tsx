'use client'

import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Keyboard Controller for Warehouse Exterior View
 * WASD controls to move the camera
 */

type KeyboardControlsProps = {
  enabled: boolean
}

export function KeyboardControls({ enabled }: KeyboardControlsProps) {
  const { camera } = useThree()
  const keysPressed = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
  })

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keysPressed.current[key as 'w' | 'a' | 's' | 'd'] = true
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keysPressed.current[key as 'w' | 'a' | 's' | 'd'] = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [enabled])

  useFrame((_, delta) => {
    if (!enabled) return

    const moveSpeed = 100 * delta // Units per second
    const direction = new THREE.Vector3()

    // Calculate movement direction relative to camera's current orientation
    const cameraDirection = new THREE.Vector3()
    camera.getWorldDirection(cameraDirection)
    cameraDirection.y = 0 // Keep movement horizontal
    cameraDirection.normalize()

    const cameraRight = new THREE.Vector3()
    cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0))
    cameraRight.normalize()

    // WASD movement
    if (keysPressed.current.w) {
      direction.add(cameraDirection)
    }
    if (keysPressed.current.s) {
      direction.sub(cameraDirection)
    }
    if (keysPressed.current.a) {
      direction.sub(cameraRight)
    }
    if (keysPressed.current.d) {
      direction.add(cameraRight)
    }

    if (direction.length() > 0) {
      direction.normalize()
      camera.position.x += direction.x * moveSpeed
      camera.position.z += direction.z * moveSpeed
    }
  })

  return null
}
