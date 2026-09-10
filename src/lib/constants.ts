// Color constants for zones - matching the Narita warehouse map
export const ZONE_COLORS = {
  import: '#4A9B8A', // Teal/green (輸入エリア)
  export: '#5B9BD5', // Light blue (輸出エリア)
  storage: '#808080', // Gray (倉庫・保管)
  office: '#FFD700', // Gold
  special: '#A0A0A0', // Gray for special facilities
  refrigerator: '#6B7280', // Darker gray for cold storage
} as const

// Building colors
export const BUILDING_COLORS = {
  corrugatedMetal: '#B0B0B0', // Gray walls
  smoothPanel: '#FFFFFF', // White
  loadingDock: '#808080', // Gray
  canopy: '#505050', // Dark gray
  canopyPillar: '#404040', // Dark gray
  window: '#3B82F6', // Blue windows
  wall: '#A0A0A0', // Main wall color
} as const

// Road colors
export const ROAD_COLORS = {
  asphalt: '#3A3A3A', // Dark gray/black
  marking: '#FFFFFF', // White
  outline: '#1E40AF', // Dark blue
  concrete: '#E5E7EB', // Light gray
  truckYard: '#D1D5DB', // Light gray for truck yards
} as const

// Material opacity values
export const OPACITY = {
  zone: 0.85,
  cutawayWall: 0.15,
  transparent: 0.0,
  opaque: 1.0,
} as const

// Camera positions for different view modes
export const CAMERA_POSITIONS = {
  exterior: [150, 120, 150] as [number, number, number], // Isometric view - higher for better overview
  interior: [0, 5, 0] as [number, number, number], // First-person starting position
} as const

// First-person camera settings
export const FIRST_PERSON_SETTINGS = {
  moveSpeed: 5,
  lookSpeed: 0.002,
  height: 1.6, // Human eye height
  minPolarAngle: 0,
  maxPolarAngle: Math.PI,
}

// Alert colors
export const ALERT_COLORS = {
  high: '#EF4444', // Red
  medium: '#F59E0B', // Orange/Yellow
  low: '#3B82F6', // Blue
  background: '#FFFFFF',
  border: '#E5E7EB',
} as const

// Material colors for airport elements
export const MATERIAL_COLORS = {
  runway: '#2A2A2A', // Dark gray/black for runway surface
  runwayMarkings: '#FFFFFF', // White for runway markings
  truckCargo: '#FFA500', // Orange for truck cargo
  buildingYellowEmissive: '#FFD700', // Gold/yellow emissive for terminals
  buildingRedEmissive: '#FF6B6B', // Red emissive for warehouses
} as const

// Taxiway data - positions and dimensions for taxiway segments
export const TAXIWAYS: Array<{ x: number; z: number; width: number; depth: number }> = []

// Color thresholds for image parsing
export const COLOR_THRESHOLDS = {
  background: {
    minR: 200,
    minG: 200,
    minB: 200,
    maxDiff: 30,
  },
  runway: {
    minR: 240,
    minG: 240,
    minB: 240,
  },
  buildingYellow: {
    minR: 200,
    minG: 150,
    maxB: 100,
  },
  buildingRed: {
    minR: 200,
    maxG: 150,
    maxB: 150,
  },
} as const

// Scene configuration for layout generation
export const SCENE_CONFIG = {
  scaleFactor: 0.5,
  minBuildingSize: 5,
  buildingHeight: {
    terminal: 8,
    warehouse: 6,
  },
} as const
