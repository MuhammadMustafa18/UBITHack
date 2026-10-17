export type ViewMode = 'Incident' | 'Drones' | 'Resources';

export interface LayerState {
  id: string;
  name: string;
  enabled: boolean;
  opacity: number; // 0 to 100
  color?: string;
  icon?: string;
}

export interface DroneTelemetry {
  id: string;
  name: string;
  type: string;
  agency: 'Rescue 1122' | 'NDMA' | 'PDMA' | 'Pakistan Army';
  callsign: string;
  mission: string;
  task: string;
  altitude: number; // ft AGL
  speed: number; // kn
  heading: number; // degrees
  battery: number; // %
  linkDbm: number; // dBm
  flightTimeEst: string;
  sensor: string;
  position: {
    lat: number;
    lng: number;
    formatted: string;
  };
  gimbal: {
    yaw: number;
    pitch: number;
    zoom: string;
  };
  status: 'active' | 'orbit' | 'survey' | 'patrol' | 'relay';
  color: string;
  targetTemp: number; // °C (e.g. human body 37.2°C vs water 21°C)
  survivorsDetected?: number;
}

export interface ResourceUnit {
  id: string;
  name: string;
  category: 'AIRCRAFT' | 'BOATS & TEAMS' | 'HEAVY ENGINEERING';
  subType: string;
  statusText: string;
  statusType: 'inbound' | 'final' | 'dropping' | 'reload' | 'protect' | 'patrol' | 'hold';
  capacity?: string;
  personnel?: number;
  speed?: number;
  agency?: string;
  assignment?: string;
  position: {
    lat: number;
    lng: number;
    formatted: string;
  };
  sector?: string;
}

export interface EvacLogEntry {
  id: string;
  callsign: string;
  action: string;
  rescuedCount: number;
  type: 'airlift' | 'boat' | 'ration' | 'bund';
  sector: string;
  coords: string;
  time: string;
}

export interface KeyEvent {
  id: string;
  title: string;
  timestamp: string; // "Jul 26, 06:00"
  timeValue: number; // 0 to 100 on scrubber
  type: 'alert' | 'surge' | 'breach' | 'crest' | 'recession';
  color: string;
  description: string;
  dischargeCusecs: number;
  inundatedSqKm: number;
}

export interface FloodProbeData {
  groundElevationM: number;
  waterDepthM: number;
  waterVelocityMs: number;
  inundationStatus: 'Safe (Dry)' | 'Moderate Inundation' | 'Severe Submergence' | 'Critical Torrent';
  infrastructureRisk: string;
  evacuationStatus: string;
  coords: string;
}
