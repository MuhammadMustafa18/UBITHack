import React, { useState } from 'react';
import { ViewMode, LayerState, DroneTelemetry, ResourceUnit, AirOpsLogEntry } from '../types';
import { 
  Sliders, 
  Wind, 
  Thermometer, 
  Droplets, 
  Activity, 
  Flame, 
  Radio, 
  Plane, 
  Truck, 
  Users, 
  Eye, 
  Video, 
  Crosshair,
  Compass,
  AlertTriangle,
  Info
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
  airOpsLogs: AirOpsLogEntry[];
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
  airOpsLogs,
  onOpenDroneCamera,
  onToggleRideAlong,
  rideAlongActive,
}) => {
  const [activeTab, setActiveTab] = useState<'Layers' | 'Analysis' | 'Evidence' | 'Notes'>('Layers');

  return (
    <aside className="w-80 h-full bg-[#ece8de] border-l border-[#c8c2b5] flex flex-col text-xs text-[#2a2c30] select-none z-20 shadow-lg overflow-y-auto">
      {/* ------------------------------------------- */}
      {/* 1. INCIDENT MODE SIDEBAR */}
      {/* ------------------------------------------- */}
      {currentMode === 'Incident' && (
        <div className="flex flex-col h-full">
          {/* Subtabs: Layers, Analysis, Evidence, Notes */}
          <div className="flex border-b border-[#cfc9bc] bg-[#dfd9cd] text-[11px] font-semibold">
            {(['Layers', 'Analysis', 'Evidence', 'Notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-center transition ${
                  activeTab === tab
                    ? 'bg-[#ece8de] text-[#1a1b1e] border-b-2 border-[#ea580c] shadow-sm font-bold'
                    : 'text-[#686357] hover:text-[#1a1b1e] hover:bg-[#e6e1d6]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-3 space-y-4">
            {/* Layers List with Opacity Sliders */}
            <div className="space-y-1.5 bg-[#f5f2ea] p-2.5 rounded-lg border border-[#d6d0c3] shadow-sm">
              <div className="text-[11px] font-bold text-[#45423b] mb-1.5 flex items-center justify-between">
                <span>ACTIVE MAP LAYERS</span>
                <Sliders className="w-3.5 h-3.5 text-[#736d60]" />
              </div>

              {layers.map((layer) => (
                <div key={layer.id} className="flex items-center justify-between py-1 group">
                  <label className="flex items-center space-x-2 cursor-pointer flex-1 mr-2">
                    <input
                      type="checkbox"
                      checked={layer.enabled}
                      onChange={() => onToggleLayer(layer.id)}
                      className="rounded border-[#a9a293] text-[#ea580c] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className={`text-[11px] ${layer.enabled ? 'font-medium text-[#1e1f23]' : 'text-[#878174]'}`}>
                      {layer.name}
                    </span>
                  </label>

                  {/* Opacity slider */}
                  {layer.enabled && (
                    <div className="flex items-center space-x-1.5 w-24">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={layer.opacity}
                        onChange={(e) => onChangeOpacity(layer.id, parseInt(e.target.value))}
                        className="w-16 h-1 bg-[#cfc9bc] accent-[#ea580c] rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-[#686357] w-6 text-right">
                        {layer.opacity}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Incident Overview Card */}
            <div className="bg-[#f5f2ea] p-3 rounded-lg border border-[#d6d0c3] shadow-sm space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#ded8cb]">
                <h4 className="font-bold text-xs text-[#1e1f23]">Incident Overview</h4>
                <button className="text-[11px] text-[#ea580c] hover:underline font-medium">Edit</button>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#6d685c]">Incident Name</span>
                  <span className="font-semibold text-[#1e1f23]">Ridgeview Incident</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6d685c]">Incident ID</span>
                  <span className="font-mono text-[#1e1f23]">CA-LAC-2024-0176</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6d685c]">Location</span>
                  <span className="text-[#1e1f23]">San Gabriel Mtns, CA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6d685c]">Start (Est.)</span>
                  <span className="text-[#1e1f23]">Aug 14, 2024 14:26</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6d685c]">End</span>
                  <span className="text-[#1e1f23]">Aug 18, 2024 11:20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6d685c]">Total Acres</span>
                  <span className="font-bold text-[#b91c1c]">12,480 acres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6d685c]">Cause (Prelim.)</span>
                  <span className="text-[#1e1f23]">Under Investigation</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[#ded8cb]">
                  <span className="text-[#6d685c]">Analysis Status</span>
                  <span className="flex items-center space-x-1 text-[#059669] font-semibold text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                    <span>In Progress</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Weather & Fire Behavior (at fire front) */}
            <div className="bg-[#f5f2ea] p-3 rounded-lg border border-[#d6d0c3] shadow-sm space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#ded8cb]">
                <h4 className="font-bold text-xs text-[#1e1f23]">Weather & Fire Behavior</h4>
                <span className="text-[10px] text-[#787264] italic">at fire front</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="bg-[#ece8de] p-2 rounded border border-[#dbd5c8]">
                  <div className="flex items-center space-x-1 text-[#6d685c] text-[10px]">
                    <Wind className="w-3 h-3 text-[#ea580c]" />
                    <span>Wind</span>
                  </div>
                  <div className="font-bold text-[#1e1f23] mt-0.5">18 mph</div>
                  <div className="text-[9px] text-[#736d60]">WSW (238°)</div>
                </div>

                <div className="bg-[#ece8de] p-2 rounded border border-[#dbd5c8]">
                  <div className="flex items-center space-x-1 text-[#6d685c] text-[10px]">
                    <Thermometer className="w-3 h-3 text-[#ea580c]" />
                    <span>Temp</span>
                  </div>
                  <div className="font-bold text-[#1e1f23] mt-0.5">30 °C</div>
                  <div className="text-[9px] text-[#736d60]">86 °F</div>
                </div>

                <div className="bg-[#ece8de] p-2 rounded border border-[#dbd5c8]">
                  <div className="flex items-center space-x-1 text-[#6d685c] text-[10px]">
                    <Droplets className="w-3 h-3 text-[#0284c7]" />
                    <span>RH</span>
                  </div>
                  <div className="font-bold text-[#1e1f23] mt-0.5">21%</div>
                  <div className="text-[9px] text-[#b91c1c]">Critical dry</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-[#ded8cb]">
                <div>
                  <div className="text-[10px] text-[#6d685c]">Fuel Moisture</div>
                  <div className="font-bold text-[#b91c1c]">5%</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#6d685c]">ERC</div>
                  <div className="font-bold text-[#ea580c]">80</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#6d685c]">Flame Length</div>
                  <div className="font-bold text-[#1e1f23]">43–70 ft</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------- */}
      {/* 2. DRONES MODE SIDEBAR */}
      {/* ------------------------------------------- */}
      {currentMode === 'Drones' && (
        <div className="p-3 space-y-3.5 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#cfc9bc]">
            <div className="font-bold text-xs text-[#1e1f23] flex items-center space-x-1.5">
              <span>Drone Fleet</span>
              <span className="text-[10px] text-[#686357] font-normal">· 6 of 6 airborne</span>
            </div>
            <span className="flex items-center space-x-1 text-[#059669] font-bold text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-ping" />
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
                      ? 'bg-[#f4ebe1] border-[#ea580c] shadow-sm'
                      : 'bg-[#f5f2ea] border-[#d8d2c4] hover:bg-[#ede8dc]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded ${isSelected ? 'bg-[#ea580c] text-white' : 'bg-[#e2dcce] text-[#5c564b]'}`}>
                      <Crosshair className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-[11px] text-[#1e1f23] flex items-center space-x-1.5">
                        <span>{drone.name}</span>
                        <span className="text-[9px] font-normal text-[#6f695c]">{drone.mission}</span>
                      </div>
                      <div className="text-[10px] text-[#ea580c] font-medium">
                        {drone.task} · <span className="font-mono text-[#454139]">{drone.altitude} ft</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono font-bold text-[#059669]">
                      {drone.battery}%
                    </div>
                    <div className="w-8 h-1 bg-[#d5cfc2] rounded-full overflow-hidden mt-0.5">
                      <div
                        style={{ width: `${drone.battery}%` }}
                        className="h-full bg-[#059669]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Drone Telemetry Card */}
          <div className="bg-[#f5f2ea] p-3 rounded-lg border border-[#d6d0c3] shadow-sm space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#ded8cb]">
              <span className="font-bold text-xs text-[#1e1f23]">{selectedDrone.name}</span>
              <span className="text-[10px] bg-[#dcfce7] text-[#166534] px-1.5 py-0.2 rounded font-semibold uppercase">
                {selectedDrone.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
              <div className="bg-[#ece8de] p-1.5 rounded border border-[#dbd5c8]">
                <div className="text-[9px] text-[#6d685c]">Altitude</div>
                <div className="font-bold text-[#1e1f23] font-mono">{selectedDrone.altitude}</div>
                <div className="text-[8px] text-[#736d60]">ft AGL</div>
              </div>
              <div className="bg-[#ece8de] p-1.5 rounded border border-[#dbd5c8]">
                <div className="text-[9px] text-[#6d685c]">Ground speed</div>
                <div className="font-bold text-[#1e1f23] font-mono">{selectedDrone.speed}</div>
                <div className="text-[8px] text-[#736d60]">kn</div>
              </div>
              <div className="bg-[#ece8de] p-1.5 rounded border border-[#dbd5c8]">
                <div className="text-[9px] text-[#6d685c]">Heading</div>
                <div className="font-bold text-[#1e1f23] font-mono">{selectedDrone.heading}°</div>
                <div className="text-[8px] text-[#736d60]">ESE</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-center pt-1 border-t border-[#ded8cb]">
              <div className="bg-[#ece8de] p-1.5 rounded border border-[#dbd5c8]">
                <div className="text-[9px] text-[#6d685c]">Battery</div>
                <div className="font-bold text-[#059669] font-mono">{selectedDrone.battery}%</div>
                <div className="text-[8px] text-[#736d60]">{selectedDrone.flightTimeEst}</div>
              </div>
              <div className="bg-[#ece8de] p-1.5 rounded border border-[#dbd5c8]">
                <div className="text-[9px] text-[#6d685c]">Link</div>
                <div className="font-bold text-[#1e1f23] font-mono">{selectedDrone.linkDbm}</div>
                <div className="text-[8px] text-[#736d60]">dBm</div>
              </div>
              <div className="bg-[#ece8de] p-1.5 rounded border border-[#dbd5c8]">
                <div className="text-[9px] text-[#6d685c]">Flight time</div>
                <div className="font-bold text-[#1e1f23] font-mono">cycle</div>
                <div className="text-[8px] text-[#736d60]">nominal</div>
              </div>
            </div>

            <div className="text-[10px] space-y-1 text-[#433f37] pt-1">
              <div className="flex justify-between">
                <span className="text-[#736d60]">Aircraft</span>
                <span className="font-medium text-[#1e1f23]">{selectedDrone.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#736d60]">Sensor</span>
                <span className="font-medium text-[#1e1f23]">{selectedDrone.sensor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#736d60]">Position</span>
                <span className="font-mono text-[#1e1f23]">{selectedDrone.position.formatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#736d60]">Gimbal</span>
                <span className="font-mono text-[#1e1f23]">
                  {selectedDrone.gimbal.yaw}° · {selectedDrone.gimbal.pitch}° · {selectedDrone.gimbal.zoom}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-2 border-t border-[#ded8cb]">
              <button
                onClick={onOpenDroneCamera}
                className="flex-1 py-1.5 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded text-xs font-semibold flex items-center justify-center space-x-1 shadow-sm transition"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Full camera view</span>
              </button>

              <button
                onClick={onToggleRideAlong}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition ${
                  rideAlongActive
                    ? 'bg-[#18191c] text-white'
                    : 'bg-[#ded8cb] text-[#332f26] hover:bg-[#d4cdbf]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{rideAlongActive ? 'Leave Cam' : 'Ride along'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------- */}
      {/* 3. RESOURCES MODE SIDEBAR */}
      {/* ------------------------------------------- */}
      {currentMode === 'Resources' && (
        <div className="p-3 space-y-3.5 flex flex-col h-full">
          {/* Top Status & Counters */}
          <div className="flex items-center justify-between pb-2 border-b border-[#cfc9bc]">
            <div className="font-bold text-xs text-[#1e1f23]">
              Resources <span className="text-[10px] font-normal text-[#686357]">· 13 units · 13 active</span>
            </div>
            <span className="flex items-center space-x-1 text-[#059669] font-bold text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-ping" />
              <span>LIVE</span>
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="bg-[#f5f2ea] p-1.5 rounded border border-[#d6d0c3]">
              <div className="font-bold text-xs text-[#1e1f23]">6/6</div>
              <div className="text-[9px] text-[#6d685c]">aircraft up</div>
            </div>
            <div className="bg-[#f5f2ea] p-1.5 rounded border border-[#d6d0c3]">
              <div className="font-bold text-xs text-[#b91c1c]">312k</div>
              <div className="text-[9px] text-[#6d685c]">gal retard...</div>
            </div>
            <div className="bg-[#f5f2ea] p-1.5 rounded border border-[#d6d0c3]">
              <div className="font-bold text-xs text-[#1e1f23]">1,111</div>
              <div className="text-[9px] text-[#6d685c]">chains line</div>
            </div>
            <div className="bg-[#f5f2ea] p-1.5 rounded border border-[#d6d0c3]">
              <div className="font-bold text-xs text-[#1e1f23]">67</div>
              <div className="text-[9px] text-[#6d685c]">personnel</div>
            </div>
          </div>

          {/* Units Categorized List */}
          <div className="space-y-3">
            {(['AIRCRAFT', 'ENGINES & TENDERS', 'CREWS & DOZERS'] as const).map((category) => (
              <div key={category} className="space-y-1">
                <div className="text-[10px] font-bold text-[#686357] uppercase tracking-wider">
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
                              ? 'bg-[#f4ebe1] border-[#ea580c] font-semibold'
                              : 'bg-[#f5f2ea] border-[#d8d2c4] hover:bg-[#ede8dc]'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {category === 'AIRCRAFT' && <Plane className="w-3 h-3 text-[#ea580c]" />}
                            {category === 'ENGINES & TENDERS' && <Truck className="w-3 h-3 text-[#b91c1c]" />}
                            {category === 'CREWS & DOZERS' && <Users className="w-3 h-3 text-[#059669]" />}
                            <div>
                              <div className="text-[#1e1f23]">{unit.name}</div>
                              <div className="text-[9px] text-[#686357]">{unit.statusText}</div>
                            </div>
                          </div>

                          <div className="text-right font-mono text-[10px] text-[#48443b]">
                            {unit.capacity || `${unit.personnel} pers.`}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Unit Details & Ride Along Action */}
          <div className="bg-[#f5f2ea] p-2.5 rounded-lg border border-[#d6d0c3] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#1e1f23]">{selectedResource.name}</span>
              <span className="text-[10px] text-[#ea580c] font-semibold">{selectedResource.division}</span>
            </div>

            <div className="text-[10px] text-[#4d483e] space-y-0.5">
              <div>Agency: <span className="font-medium text-[#1e1f23]">{selectedResource.agency}</span></div>
              <div>Assignment: <span className="font-medium text-[#1e1f23]">{selectedResource.assignment}</span></div>
              <div>Position: <span className="font-mono text-[#1e1f23]">{selectedResource.position.formatted}</span></div>
            </div>

            <div className="flex items-center space-x-2 pt-1 border-t border-[#ded8cb]">
              <button
                onClick={onToggleRideAlong}
                className={`flex-1 py-1 rounded text-xs font-semibold flex items-center justify-center space-x-1 transition ${
                  rideAlongActive
                    ? 'bg-[#18191c] text-white'
                    : 'bg-[#ded8cb] text-[#332f26] hover:bg-[#d4cdbf]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{rideAlongActive ? 'Leave Ride Along' : 'Ride along'}</span>
              </button>

              <button
                onClick={() => {}}
                className="flex-1 py-1 bg-[#ea580c] text-white rounded text-xs font-semibold hover:bg-[#c2410c] transition"
              >
                Overview
              </button>
            </div>
          </div>

          {/* Air Ops Log Drop History */}
          <div className="bg-[#f5f2ea] p-2.5 rounded-lg border border-[#d6d0c3] shadow-sm space-y-1.5">
            <div className="text-[11px] font-bold text-[#1e1f23] flex items-center justify-between">
              <span>Air Ops Log</span>
              <span className="text-[9px] bg-red-600 text-white font-mono px-1 rounded font-bold">99</span>
            </div>

            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {airOpsLogs.map((log) => (
                <div key={log.id} className="text-[10px] flex items-center justify-between py-0.5 border-b border-[#e5dfd3]">
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${log.type === 'retardant' ? 'bg-red-600' : 'bg-blue-500'}`} />
                    <span className="font-mono font-bold text-[#1e1f23]">{log.callsign}</span>
                    <span className="text-[#656054] truncate max-w-[120px]">{log.action}</span>
                  </div>
                  <span className="font-mono text-[#827d71] text-[9px]">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
