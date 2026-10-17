import React, { useState } from 'react';
import { ViewMode, LayerState, DroneTelemetry, ResourceUnit, EvacLogEntry } from '../types';
import { 
  Sliders, 
  Waves, 
  CloudRain, 
  Gauge, 
  Activity, 
  Radio, 
  Plane, 
  LifeBuoy, 
  Users, 
  Eye, 
  Video, 
  Crosshair,
  AlertTriangle,
  ShieldCheck,
  Building
} from 'lucide-react';

interface RightSidebarProps {
  currentMode: ViewMode;
  layers: LayerState[];
  onToggleLayer: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  drones: DroneTelemetry[];
  selectedDrone: DroneTelemetry;
  onSelectDrone: (drone: DroneTelemetry) => void;
  resources: ResourceUnit[];
  selectedResource: ResourceUnit;
  onSelectResource: (res: ResourceUnit) => void;
  evacLogs: EvacLogEntry[];
  onOpenDroneCamera: () => void;
  onToggleRideAlong: () => void;
  rideAlongActive: boolean;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  currentMode,
  layers,
  onToggleLayer,
  onChangeOpacity,
  drones,
  selectedDrone,
  onSelectDrone,
  resources,
  selectedResource,
  onSelectResource,
  evacLogs,
  onOpenDroneCamera,
  onToggleRideAlong,
  rideAlongActive,
}) => {
  const [activeTab, setActiveTab] = useState<'Layers' | 'Hydrology' | 'Infrastructure' | 'Relief'>('Layers');

  return (
    <aside className="w-80 h-full bg-[#0d141e] border-l border-[#223145] flex flex-col text-xs text-gray-200 select-none z-20 shadow-xl overflow-y-auto">
      {/* ------------------------------------------- */}
      {/* 1. HYDROLOGICAL INCIDENT MODE */}
      {/* ------------------------------------------- */}
      {currentMode === 'Incident' && (
        <div className="flex flex-col h-full">
          {/* Subtabs */}
          <div className="flex border-b border-[#223145] bg-[#101a28] text-[11px] font-semibold">
            {(['Layers', 'Hydrology', 'Infrastructure', 'Relief'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-center transition ${
                  activeTab === tab
                    ? 'bg-[#0d141e] text-[#38bdf8] border-b-2 border-[#0284c7] font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-[#162232]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-3 space-y-3.5">
            {/* Active Layers with Opacity */}
            <div className="space-y-1.5 bg-[#131c2a] p-2.5 rounded-lg border border-[#26374d] shadow-sm">
              <div className="text-[11px] font-bold text-gray-300 mb-1.5 flex items-center justify-between">
                <span>FLOOD GIS MAP LAYERS</span>
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              </div>

              {layers.map((layer) => (
                <div key={layer.id} className="flex items-center justify-between py-1">
                  <label className="flex items-center space-x-2 cursor-pointer flex-1 mr-2">
                    <input
                      type="checkbox"
                      checked={layer.enabled}
                      onChange={() => onToggleLayer(layer.id)}
                      className="rounded border-gray-600 bg-gray-800 text-[#0284c7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className={`text-[11px] ${layer.enabled ? 'font-medium text-white' : 'text-gray-500'}`}>
                      {layer.name}
                    </span>
                  </label>

                  {layer.enabled && (
                    <div className="flex items-center space-x-1.5 w-24">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={layer.opacity}
                        onChange={(e) => onChangeOpacity(layer.id, parseInt(e.target.value))}
                        className="w-16 h-1 bg-gray-700 accent-[#0284c7] rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-cyan-400 w-6 text-right">
                        {layer.opacity}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pakistan Incident Overview Card */}
            <div className="bg-[#131c2a] p-3 rounded-lg border border-[#26374d] shadow-sm space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#26374d]">
                <h4 className="font-bold text-xs text-white flex items-center space-x-1.5">
                  <Waves className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>Nowshera Basin Flood</span>
                </h4>
                <span className="text-[9px] bg-red-950 text-red-400 border border-red-800/40 px-1.5 py-0.2 rounded font-bold uppercase">
                  RED ALERT
                </span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-400">River Basin</span>
                  <span className="font-semibold text-white">Kabul & Swat Rivers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Province</span>
                  <span className="text-white">Khyber Pakhtunkhwa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Peak Discharge</span>
                  <span className="font-mono font-bold text-red-400">285,000 cusecs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Flood Classification</span>
                  <span className="font-bold text-red-400">SUPER FLOOD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Inundated Area</span>
                  <span className="font-mono text-cyan-300">345 sq km (85k acres)</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[#26374d]">
                  <span className="text-gray-400">Displaced Population</span>
                  <span className="font-mono font-bold text-amber-400">~62,400 citizens</span>
                </div>
              </div>
            </div>

            {/* Hydrological Telemetry at Barrage/River */}
            <div className="bg-[#131c2a] p-3 rounded-lg border border-[#26374d] shadow-sm space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#26374d]">
                <h4 className="font-bold text-xs text-white">Hydrology & Dam Status</h4>
                <span className="text-[10px] text-cyan-400 font-mono">Warsak / Tarbela</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="bg-[#0f1724] p-2 rounded border border-[#202f42]">
                  <div className="flex items-center space-x-1 text-gray-400 text-[10px]">
                    <Gauge className="w-3 h-3 text-[#0284c7]" />
                    <span>Discharge</span>
                  </div>
                  <div className="font-bold text-white mt-0.5 font-mono">285k</div>
                  <div className="text-[9px] text-red-400">cusecs</div>
                </div>

                <div className="bg-[#0f1724] p-2 rounded border border-[#202f42]">
                  <div className="flex items-center space-x-1 text-gray-400 text-[10px]">
                    <Waves className="w-3 h-3 text-[#0284c7]" />
                    <span>Water Level</span>
                  </div>
                  <div className="font-bold text-white mt-0.5 font-mono">16.5 m</div>
                  <div className="text-[9px] text-red-400">+4.2m danger</div>
                </div>

                <div className="bg-[#0f1724] p-2 rounded border border-[#202f42]">
                  <div className="flex items-center space-x-1 text-gray-400 text-[10px]">
                    <CloudRain className="w-3 h-3 text-cyan-400" />
                    <span>24h Rain</span>
                  </div>
                  <div className="font-bold text-white mt-0.5 font-mono">165 mm</div>
                  <div className="text-[9px] text-amber-400">Cloudburst</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-[#26374d]">
                <div>
                  <div className="text-[10px] text-gray-400">Velocity</div>
                  <div className="font-bold text-amber-400 font-mono">2.8 m/s</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400">Spillways</div>
                  <div className="font-bold text-white font-mono">100% Open</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400">Breach Width</div>
                  <div className="font-bold text-red-400 font-mono">65 meters</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------- */}
      {/* 2. RESCUE DRONES MODE */}
      {/* ------------------------------------------- */}
      {currentMode === 'Drones' && (
        <div className="p-3 space-y-3 flex flex-col h-full">
          <div className="flex items-center justify-between pb-2 border-b border-[#223145]">
            <div className="font-bold text-xs text-white flex items-center space-x-1.5">
              <span>Rescue 1122 & NDMA UAVs</span>
              <span className="text-[10px] text-gray-400 font-normal">· 6 active</span>
            </div>
            <span className="flex items-center space-x-1 text-emerald-400 font-bold text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE</span>
            </span>
          </div>

          {/* Drones list */}
          <div className="space-y-1.5">
            {drones.map((drone) => {
              const isSelected = selectedDrone.id === drone.id;
              return (
                <div
                  key={drone.id}
                  onClick={() => onSelectDrone(drone)}
                  className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#18283d] border-[#0284c7] shadow-md'
                      : 'bg-[#131c2a] border-[#26374d] hover:bg-[#192538]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded ${isSelected ? 'bg-[#0284c7] text-white' : 'bg-[#1c2c40] text-cyan-400'}`}>
                      <Crosshair className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-[11px] text-white flex items-center space-x-1.5">
                        <span>{drone.name}</span>
                        <span className="text-[9px] font-mono text-cyan-400">{drone.agency}</span>
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {drone.task} · <span className="font-mono text-white">{drone.altitude} ft</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono font-bold text-emerald-400">
                      {drone.battery}%
                    </div>
                    <div className="w-8 h-1 bg-gray-700 rounded-full overflow-hidden mt-0.5">
                      <div style={{ width: `${drone.battery}%` }} className="h-full bg-emerald-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Drone Telemetry */}
          <div className="bg-[#131c2a] p-3 rounded-lg border border-[#26374d] shadow-sm space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#26374d]">
              <span className="font-bold text-xs text-white">{selectedDrone.name}</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded font-semibold uppercase border border-emerald-800/30">
                {selectedDrone.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
              <div className="bg-[#0f1724] p-1.5 rounded border border-[#202f42]">
                <div className="text-[9px] text-gray-400">Altitude</div>
                <div className="font-bold text-white font-mono">{selectedDrone.altitude}</div>
                <div className="text-[8px] text-gray-400">ft AGL</div>
              </div>
              <div className="bg-[#0f1724] p-1.5 rounded border border-[#202f42]">
                <div className="text-[9px] text-gray-400">Ground speed</div>
                <div className="font-bold text-white font-mono">{selectedDrone.speed}</div>
                <div className="text-[8px] text-gray-400">kn</div>
              </div>
              <div className="bg-[#0f1724] p-1.5 rounded border border-[#202f42]">
                <div className="text-[9px] text-gray-400">Heading</div>
                <div className="font-bold text-white font-mono">{selectedDrone.heading}°</div>
                <div className="text-[8px] text-gray-400">Compass</div>
              </div>
            </div>

            <div className="text-[10px] space-y-1 text-gray-300 pt-1">
              <div className="flex justify-between">
                <span className="text-gray-400">UAV Agency</span>
                <span className="font-semibold text-cyan-400">{selectedDrone.agency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sensor Payload</span>
                <span className="text-white">{selectedDrone.sensor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Target Coordinates</span>
                <span className="font-mono text-cyan-300">{selectedDrone.position.formatted}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-2 border-t border-[#26374d]">
              <button
                onClick={onOpenDroneCamera}
                className="flex-1 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded text-xs font-semibold flex items-center justify-center space-x-1 shadow-sm transition"
              >
                <Video className="w-3.5 h-3.5" />
                <span>FLIR Survivor Feed</span>
              </button>

              <button
                onClick={onToggleRideAlong}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition ${
                  rideAlongActive
                    ? 'bg-red-600 text-white'
                    : 'bg-[#1d2c40] text-gray-200 hover:bg-[#253952]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{rideAlongActive ? 'Exit Cam' : 'Ride along'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------- */}
      {/* 3. RESCUE OPERATIONS MODE */}
      {/* ------------------------------------------- */}
      {currentMode === 'Resources' && (
        <div className="p-3 space-y-3 flex flex-col h-full">
          <div className="flex items-center justify-between pb-2 border-b border-[#223145]">
            <div className="font-bold text-xs text-white">
              Relief & Rescue Fleet <span className="text-[10px] font-normal text-gray-400">· 8 units active</span>
            </div>
            <span className="flex items-center space-x-1 text-emerald-400 font-bold text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>ACTIVE</span>
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="bg-[#131c2a] p-1.5 rounded border border-[#26374d]">
              <div className="font-bold text-xs text-cyan-400">3</div>
              <div className="text-[8px] text-gray-400">Helicopters</div>
            </div>
            <div className="bg-[#131c2a] p-1.5 rounded border border-[#26374d]">
              <div className="font-bold text-xs text-amber-400">18</div>
              <div className="text-[8px] text-gray-400">Rescue Boats</div>
            </div>
            <div className="bg-[#131c2a] p-1.5 rounded border border-[#26374d]">
              <div className="font-bold text-xs text-emerald-400">1,420</div>
              <div className="text-[8px] text-gray-400">Rescued</div>
            </div>
            <div className="bg-[#131c2a] p-1.5 rounded border border-[#26374d]">
              <div className="font-bold text-xs text-white">45</div>
              <div className="text-[8px] text-gray-400">Relief Camps</div>
            </div>
          </div>

          {/* Categorized Fleet */}
          <div className="space-y-3">
            {(['AIRCRAFT', 'BOATS & TEAMS', 'HEAVY ENGINEERING'] as const).map((category) => (
              <div key={category} className="space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {category}
                </div>

                <div className="space-y-1">
                  {resources
                    .filter((r) => r.category === category)
                    .map((unit) => {
                      const isSelected = selectedResource.id === unit.id;
                      return (
                        <div
                          key={unit.id}
                          onClick={() => onSelectResource(unit)}
                          className={`p-1.5 rounded-md border transition cursor-pointer flex items-center justify-between text-[11px] ${
                            isSelected
                              ? 'bg-[#18283d] border-[#0284c7] font-semibold'
                              : 'bg-[#131c2a] border-[#26374d] hover:bg-[#192538]'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {category === 'AIRCRAFT' && <Plane className="w-3 h-3 text-cyan-400" />}
                            {category === 'BOATS & TEAMS' && <LifeBuoy className="w-3 h-3 text-amber-400" />}
                            {category === 'HEAVY ENGINEERING' && <Building className="w-3 h-3 text-emerald-400" />}
                            <div>
                              <div className="text-white">{unit.name}</div>
                              <div className="text-[9px] text-gray-400">{unit.statusText}</div>
                            </div>
                          </div>

                          <div className="text-right font-mono text-[10px] text-cyan-300">
                            {unit.sector}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          {/* Live Evacuation Log */}
          <div className="bg-[#131c2a] p-2.5 rounded-lg border border-[#26374d] shadow-sm space-y-1.5">
            <div className="text-[11px] font-bold text-white flex items-center justify-between">
              <span>Rescue & Evac Log</span>
              <span className="text-[9px] bg-emerald-600 text-white font-mono px-1 rounded font-bold">LIVE</span>
            </div>

            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {evacLogs.map((log) => (
                <div key={log.id} className="text-[10px] flex items-center justify-between py-1 border-b border-[#202f42]">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full ${log.rescuedCount > 0 ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                    <span className="font-mono font-bold text-cyan-300">{log.callsign}</span>
                    <span className="text-gray-300 truncate max-w-[130px]">{log.action}</span>
                  </div>
                  <span className="font-mono text-gray-400 text-[9px]">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
