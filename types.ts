
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
  semiMajorAxis: number; // km
  eccentricity: number; 
  inclination: number; // degrees
  raan: number; // degrees
  argPe: number; // degrees
  meanAnomaly: number; // degrees at epoch
  meanMotion: number; // revs per day (derived from SMA if not provided, or vice versa)
  color: string;
  epoch?: number; // timestamp of TLE epoch
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
  tle1?: string; // TLE Line 1
  tle2?: string; // TLE Line 2
}

export interface SystemMetricPoint {
  time: string;
  value: number;
}

export interface AccessLog {
  id: string;
  ip: string;
  endpoint: string;
  status: number;
  timestamp: string;
  latency: number;
}

export interface AppState {
  currentView: View;
  selectedTargetId: string | null;
  showOrbits: boolean;
  language: Language;
  darkMode: boolean;
  timeMode: TimeMode;
  timeSpeed: number; 
  simulationTime: number; 
}

// --- NEW TYPES FOR UTILITY ---

export interface GroundStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  alt: number; // km
}

export interface GeoPosition {
  lat: number;
  lon: number;
  alt: number;
  velocity: number;
}

export interface PassPrediction {
  stationName: string;
  riseTime: number;
  setTime: number;
  maxElevation: number;
}
