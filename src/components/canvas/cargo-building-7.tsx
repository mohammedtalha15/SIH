'use client'

import { BuildingExterior } from './building-exterior'
import { cargoBuilding7 } from '@/lib/warehouse-data'
import type { ViewMode } from '@/lib/types'

type CargoBuilding7Props = {
  viewMode: ViewMode
  onClick?: (buildingId: string) => void
}

export function CargoBuilding7({ viewMode, onClick }: CargoBuilding7Props) {
  return <BuildingExterior building={cargoBuilding7} viewMode={viewMode} onClick={onClick} />
}
