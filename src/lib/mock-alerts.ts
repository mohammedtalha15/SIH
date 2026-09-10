import type { ProblemAlert } from './types'

export const mockAlerts: ProblemAlert[] = [
  {
    id: 'alert-1',
    type: 'delay',
    message: 'Shipment delay: 2 hours',
    severity: 'high',
    timestamp: new Date(),
    position: [-50, 1, 45], // Import area
    zoneId: 'import-area',
  },
  {
    id: 'alert-2',
    type: 'problem',
    message: 'Equipment maintenance',
    severity: 'medium',
    timestamp: new Date(Date.now() - 30 * 60000),
    position: [-60, 1, 35], // Automatic rack
    zoneId: 'automatic-rack',
  },
  {
    id: 'alert-3',
    type: 'delay',
    message: 'Customs clearance pending',
    severity: 'low',
    timestamp: new Date(Date.now() - 60 * 60000),
    position: [50, 1, 0], // Export area
    zoneId: 'export-area',
  },
  {
    id: 'alert-4',
    type: 'problem',
    message: 'Temperature variance',
    severity: 'high',
    timestamp: new Date(Date.now() - 15 * 60000),
    position: [20, 1, -10], // Temperature controlled
    zoneId: 'temperature-controlled',
  },
  {
    id: 'alert-5',
    type: 'warning',
    message: 'CHS area congestion',
    severity: 'medium',
    timestamp: new Date(Date.now() - 45 * 60000),
    position: [75, 1, 10], // CHS build-up
    zoneId: 'chs-buildup',
  },
  {
    id: 'alert-6',
    type: 'delay',
    message: 'AGV route blocked',
    severity: 'low',
    timestamp: new Date(Date.now() - 20 * 60000),
    position: [60, 1, 55], // AGV area
    zoneId: 'agv-area',
  },
]
