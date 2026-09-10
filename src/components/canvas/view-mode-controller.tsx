'use client'

import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { FIRST_PERSON_SETTINGS } from '@/lib/constants'
import { cargoBuilding8, cargoBuilding7 } from '@/lib/warehouse-data'
import type { ViewMode as ViewModeType } from '@/lib/types'

type ViewModeControllerProps = {
  viewMode: { viewMode: ViewModeType }
  targetBuildingId?: string | null
}

export function ViewModeController({ viewMode, targetBuildingId }: ViewModeControllerProps) {
  const { camera } = useThree()

  useEffect(() => {
    if (viewMode.viewMode === 'exterior') {
      // Isometric view - 真上から見下ろすアングル
      camera.position.set(50, 200, 180)
      camera.lookAt(50, 0, 0)
    } else if (viewMode.viewMode === 'interior') {
      // First-person view
      if (targetBuildingId === 'building-8') {
        const [bx, , bz] = cargoBuilding8.position
        camera.position.set(bx, FIRST_PERSON_SETTINGS.height, bz)
      } else if (targetBuildingId === 'building-7') {
        const [bx, , bz] = cargoBuilding7.position
        camera.position.set(bx, FIRST_PERSON_SETTINGS.height, bz)
      } else {
        const [bx, , bz] = cargoBuilding8.position
        camera.position.set(bx, FIRST_PERSON_SETTINGS.height, bz)
      }
      camera.rotation.set(0, 0, 0)
    }
  }, [viewMode.viewMode, targetBuildingId, camera])

  return null
}
