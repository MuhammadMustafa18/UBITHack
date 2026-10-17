import React, { useState } from 'react';
import { DroneTelemetry } from '../types';
import { X, Maximize2, ZoomIn, ZoomOut, Users, Sparkles, AlertCircle } from 'lucide-react';

interface DronePipFeedProps {
  drone: DroneTelemetry;
  onClose: () => void;
  onToggleFullView: () => void;
}

export const DronePipFeed: React.FC<DronePipFeedProps> = ({
  drone,
  onClose,
  onToggleFullView,
}) => {
  const [sensorMode, setSensorMode] = useState<'EO' | 'IR'>('IR');
  const [zoomLevel, setZoomLevel] = useState(1.5);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(1.0, Math.min(4.0, Number((prev + delta).toFixed(1)))));
  };

  return (
    <div className="absolute top-14 left-16 z-30 w-[440px] rounded-lg overflow-hidden border border-cyan-500/40 shadow-2xl bg-black/95 backdrop-blur-md text-white select-none transition-all">
      {/* Top Header Bar inside PIP */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0b1320] border-b border-gray-800 text-xs">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-red-500 font-mono font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
            <span>REC LIVE</span>
          </div>
          <span className="text-cyan-400 font-mono text-[11px] uppercase tracking-wider font-bold">
            {drone.callsign}
          </span>
          <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded font-mono border border-cyan-800/40">
            {drone.agency}
          </span>
        </div>

        {/* Sensor Mode Switcher (EO / IR Thermal) */}
        <div className="flex items-center space-x-1.5">
          <div className="bg-black/60 p-0.5 rounded border border-gray-700 flex text-[10px] font-bold">
            <button
              onClick={() => setSensorMode('EO')}
              className={`px-2 py-0.5 rounded transition ${
                sensorMode === 'EO' ? 'bg-[#0284c7] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              EO DAY
            </button>
            <button
              onClick={() => setSensorMode('IR')}
              className={`px-2 py-0.5 rounded transition ${
                sensorMode === 'IR' ? 'bg-[#ea580c] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              IR FLIR
            </button>
          </div>

          {/* Zoom controls */}
          <button
            onClick={() => handleZoom(-0.5)}
            className="p-1 hover:bg-white/10 rounded text-gray-300 transition"
            title="Zoom out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-mono text-cyan-300 w-6 text-center">{zoomLevel}x</span>
          <button
            onClick={() => handleZoom(0.5)}
            className="p-1 hover:bg-white/10 rounded text-gray-300 transition"
            title="Zoom in"
          >
            <ZoomIn className="w-3 h-3" />
          </button>

          {/* Expand & Close */}
          <button
            onClick={onToggleFullView}
            className="p-1 hover:bg-white/10 rounded text-gray-300 transition"
            title="Full view"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-500/30 text-gray-400 hover:text-red-400 rounded transition"
            title="Close feed"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Viewport Simulation */}
      <div className="relative h-[245px] w-full overflow-hidden bg-[#070b12] flex items-center justify-center">
        {sensorMode === 'EO' ? (
          // Daylight Optical Flood Feed
          <div 
            style={{ transform: `scale(${zoomLevel})` }}
            className="w-full h-full bg-cover bg-center transition-transform duration-300 relative flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#2a3848] via-[#485b70] to-[#64748b]" />
            {/* Raging flood river water channel */}
            <div className="absolute inset-x-0 bottom-4 h-36 bg-[#0369a1]/80 blur-sm animate-pulse" />
            {/* Submerged buildings silhouette */}
            <div className="absolute bottom-12 left-1/3 w-16 h-12 bg-[#1e293b] border-t-2 border-red-500" />
            <div className="absolute bottom-16 left-1/3 text-[9px] bg-red-600 text-white px-1 rounded font-bold">
              Submerged Roof
            </div>
          </div>
        ) : (
          // FLIR Thermal Body Heat Detection Feed
          <div 
            style={{ transform: `scale(${zoomLevel})` }}
            className="w-full h-full transition-transform duration-300 relative overflow-hidden bg-gradient-to-br from-[#050b14] via-[#0d1b2a] to-[#140b24]"
          >
            {/* Cold floodwaters in deep dark navy/indigo (21°C) */}
            <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-blue-950 via-slate-950 to-black" />
            
            {/* Cold River Current Flow */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-blue-900/30 blur-md" />

            {/* Submerged Building Roof Outline */}
            <div className="absolute bottom-14 left-1/3 w-28 h-14 border border-cyan-500/50 bg-slate-800/60 rounded" />

            {/* SURVIVORS: Glowing 37°C Human Body Heat Signatures (White-Hot / Amber) */}
            <div className="absolute bottom-20 left-[38%] flex space-x-2 items-center">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="relative flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_#ffffff] animate-ping opacity-90" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-300 absolute top-0.5" />
                </div>
              ))}
            </div>

            {/* AI Body Heat Detection Box */}
            <div className="absolute bottom-16 left-[36%] border-2 border-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300 font-bold flex items-center space-x-1 shadow-lg">
              <Users className="w-3 h-3 text-emerald-400" />
              <span>SURVIVORS (4) · 37.2°C</span>
            </div>

            {/* Thermal Sensor Noise */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:5px_5px]" />
          </div>
        )}

        {/* HUD Crosshair & Tactical Telemetry Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 font-mono text-[10px] text-cyan-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {/* Top Heading Tape */}
          <div className="flex justify-between items-center px-12">
            <span className="text-gray-500">180</span>
            <span className="text-gray-500">190</span>
            <div className="flex flex-col items-center">
              <span className="text-white font-bold text-xs">{drone.heading}°</span>
              <div className="w-1.5 h-1.5 border-b-2 border-cyan-400" />
            </div>
            <span className="text-gray-500">200</span>
            <span className="text-gray-500">210</span>
          </div>

          {/* Center Crosshair & Gimbal Pitch */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="w-full h-px bg-cyan-400/70" />
              <div className="h-full w-px bg-cyan-400/70 absolute" />
              <div className="w-6 h-6 border border-cyan-400/50 rounded-full absolute" />
            </div>
            <div className="absolute right-14 text-[9px] text-cyan-300 font-mono">
              {drone.gimbal.pitch}° PITCH
            </div>
          </div>

          {/* Left Telemetry */}
          <div className="space-y-0.5">
            <div>ALT <span className="text-white font-bold">{drone.altitude} FT AGL</span></div>
            <div>GS <span className="text-white font-bold">{drone.speed} KT</span></div>
            <div>HDG <span className="text-white font-bold">{drone.heading}°</span></div>
          </div>

          {/* Right Telemetry */}
          <div className="space-y-0.5 text-right self-end absolute right-3 bottom-10">
            <div>BAT <span className="text-emerald-400 font-bold">{drone.battery}%</span></div>
            <div>LNK <span className="text-white font-bold">{drone.linkDbm} DBM</span></div>
            <div>ZOOM <span className="text-cyan-300 font-bold">{zoomLevel}x</span></div>
            <div>FLIR <span className="text-amber-400 font-bold">8-14 µm</span></div>
          </div>

          {/* Bottom Coordinates & Water Temperature */}
          <div className="flex justify-between items-center border-t border-cyan-500/30 pt-1 text-[9px] text-gray-300">
            <div>SPI <span className="text-cyan-300 font-bold">{drone.position.formatted}</span></div>
            <div>WATER TEMP <span className="text-blue-300 font-bold">{drone.targetTemp} °C</span></div>
            <div>ELEV <span className="text-white">284 M</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
