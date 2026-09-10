'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect, useState } from 'react'
import { FIRST_PERSON_SETTINGS } from '@/lib/constants'
import * as THREE from 'three'

type FirstPersonControllerProps = {
  enabled: boolean
}

export function FirstPersonController({ enabled }: FirstPersonControllerProps) {
  const { camera, gl } = useThree()
  const moveForward = useRef(false)
  const moveBackward = useRef(false)
  const moveLeft = useRef(false)
  const moveRight = useRef(false)
  const rotateLeft = useRef(false)
  const rotateRight = useRef(false)
  const [isActive, setIsActive] = useState(false)
  
  // マウスドラッグ用
  const isDragging = useRef(false)
  const previousMousePosition = useRef({ x: 0, y: 0 })
  const yaw = useRef(0) // 水平回転
  const pitch = useRef(0) // 垂直回転
  const fov = useRef(60) // ズーム用FOV

  // 初期向きを設定
  useEffect(() => {
    if (enabled) {
      camera.rotation.set(0, 0, 0)
      yaw.current = 0
      pitch.current = 0
      setIsActive(true)
    } else {
      setIsActive(false)
    }
  }, [enabled, camera])

  // マウスイベント
  useEffect(() => {
    if (!enabled) return

    const canvas = gl.domElement

    const handleMouseDown = (event: MouseEvent) => {
      isDragging.current = true
      previousMousePosition.current = { x: event.clientX, y: event.clientY }
    }

    const handleMouseUp = () => {
      isDragging.current = false
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging.current) return

      const deltaX = event.clientX - previousMousePosition.current.x
      const deltaY = event.clientY - previousMousePosition.current.y

      // 感度調整
      const sensitivity = 0.003

      yaw.current -= deltaX * sensitivity
      pitch.current -= deltaY * sensitivity

      // 垂直方向の制限（上下90度まで）
      pitch.current = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch.current))

      previousMousePosition.current = { x: event.clientX, y: event.clientY }
    }

    // スクロールで左右回転
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const sensitivity = 0.002
      yaw.current -= event.deltaX * sensitivity
      yaw.current -= event.deltaY * sensitivity * 0.5
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [enabled, gl])

  // キーボードイベント
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        event.preventDefault()
      }
      
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveForward.current = true
          break
        case 'KeyS':
        case 'ArrowDown':
          moveBackward.current = true
          break
        case 'KeyA':
          moveLeft.current = true
          break
        case 'KeyD':
          moveRight.current = true
          break
        case 'ArrowLeft':
          rotateLeft.current = true
          break
        case 'ArrowRight':
          rotateRight.current = true
          break
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveForward.current = false
          break
        case 'KeyS':
        case 'ArrowDown':
          moveBackward.current = false
          break
        case 'KeyA':
          moveLeft.current = false
          break
        case 'KeyD':
          moveRight.current = false
          break
        case 'ArrowLeft':
          rotateLeft.current = false
          break
        case 'ArrowRight':
          rotateRight.current = false
          break
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
    if (!enabled || !isActive) return

    const moveSpeed = FIRST_PERSON_SETTINGS.moveSpeed * 15
    const rotateSpeed = 2.0

    // キーボードでの回転
    if (rotateLeft.current) {
      yaw.current += rotateSpeed * delta
    }
    if (rotateRight.current) {
      yaw.current -= rotateSpeed * delta
    }

    // カメラの向きを更新
    const euler = new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ')
    camera.quaternion.setFromEuler(euler)

    // 移動方向を計算
    const direction = new THREE.Vector3()
    
    if (moveForward.current) direction.z = -1
    if (moveBackward.current) direction.z = 1
    if (moveLeft.current) direction.x = -1
    if (moveRight.current) direction.x = 1

    if (direction.length() > 0) {
      direction.normalize()
      
      // yaw角度のみで移動方向を計算（pitchを無視して水平移動）
      const moveQuaternion = new THREE.Quaternion()
      moveQuaternion.setFromEuler(new THREE.Euler(0, yaw.current, 0, 'YXZ'))
      direction.applyQuaternion(moveQuaternion)
      
      camera.position.x += direction.x * moveSpeed * delta
      camera.position.z += direction.z * moveSpeed * delta
    }

    // 高さを固定
    camera.position.y = FIRST_PERSON_SETTINGS.height

    // 移動範囲を制限
    const inBuilding8 = camera.position.x >= -105 && camera.position.x <= 105 && 
                        camera.position.z >= -95 && camera.position.z <= 95
    const inBuilding7 = camera.position.x >= 165 && camera.position.x <= 275 && 
                        camera.position.z >= -90 && camera.position.z <= 50

    if (!inBuilding8 && !inBuilding7) {
      if (camera.position.x < 135) {
        camera.position.x = Math.max(-105, Math.min(105, camera.position.x))
        camera.position.z = Math.max(-95, Math.min(95, camera.position.z))
      } else {
        camera.position.x = Math.max(165, Math.min(275, camera.position.x))
        camera.position.z = Math.max(-90, Math.min(50, camera.position.z))
      }
    }
  })

  return null
}
