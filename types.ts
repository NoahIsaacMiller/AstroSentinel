
export enum Language {
  EN = 'EN',
  CN = 'CN',
  JP = 'JP',
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  SYSTEM = 'SYSTEM',
  TARGETS = 'TARGETS',
  ALERTS = 'ALERTS',
  CONTROL = 'CONTROL',
}

export enum TimeMode {
  REALTIME = 'REALTIME',
  SIMULATION = 'SIMULATION',
}

export enum TargetType {
  SATELLITE = 'SATELLITE',
  DEBRIS = 'DEBRIS',
  ASTEROID = 'ASTEROID',
  STATION = 'STATION',
}

export interface OrbitalElements {
  semiMajorAxis: number; // a (km or normalized units)
  eccentricity: number; // e
  inclination: number; // i (degrees)
  raan: number; // Longitude of Ascending Node (degrees)
  argPe: number; // Argument of Perigee (degrees)
  meanAnomaly: number; // M0 (degrees at epoch)
  period: number; // derived or explicit, used for speed
  color: string;
}

export interface SpaceTarget {
  id: string;
  name: string;
  type: TargetType;
  orbit: OrbitalElements;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lastUpdate: string;
  description?: string;
  group?: string;
}

export interface AppState {
  currentView: View;
  selectedTargetId: string | null;
  showOrbits: boolean;
  language: Language;
  darkMode: boolean;
  timeMode: TimeMode;
  timeSpeed: number; // Multiplier (1x, 10x, etc.)
  simulationTime: number; // Timestamp
}
