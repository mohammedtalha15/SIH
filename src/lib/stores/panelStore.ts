/**
 * Unified Panel State Store
 * Ensures only one panel/detail tab is open at a time across the entire application
 */

import { create } from 'zustand'

export type PanelType = 
  | 'flight-details'
  | 'truck-details'
  | 'uld-details'
  | 'flight-list-arrivals'
  | 'flight-list-departures'
  | 'truck-list'
  | 'uld-list'
  | null

interface PanelState {
  currentPanel: PanelType
  setPanel: (panel: PanelType) => void
  closePanel: () => void
  isOpen: (panel: PanelType) => boolean
}

export const usePanelStore = create<PanelState>((set, get) => ({
  currentPanel: null,
  
  setPanel: (panel: PanelType) => {
    set({ currentPanel: panel })
  },
  
  closePanel: () => {
    set({ currentPanel: null })
  },
  
  isOpen: (panel: PanelType) => {
    return get().currentPanel === panel
  },
}))
