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
  targetSpotTemp: number; // °C
}

export interface ResourceUnit {
  id: string;
  name: string;
  category: 'AIRCRAFT' | 'ENGINES & TENDERS' | 'CREWS & DOZERS';
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
  division?: string;
}

export interface AirOpsLogEntry {
  id: string;
  callsign: string;
  action: string;
  volume: string;
  type: 'retardant' | 'water';
  division: string;
  coords: string;
  time: string;
}

export interface KeyEvent {
  id: string;
  title: string;
  timestamp: string; // "Aug 14, 14:26"
  timeValue: number; // normalized 0 to 100 on scrubber
  type: 'ignition' | 'growth' | 'spot' | 'ridge' | 'containment';
  color: string;
  description: string;
  areaAcres: number;
}

export interface TerrainProbeData {
  elevationM: number;
  slopeDeg: number;
  aspect: string;
  burnedTimeAgo: string;
  fuelType: string;
  coords: string;
}
