import React, { useState } from 'react';
import { DroneTelemetry } from '../types';
import { X, Maximize2, ZoomIn, ZoomOut, Radio, Flame, Sparkles } from 'lucide-react';

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
  const [sensorMode, setSensorMode] = useState<'EO' | 'IR'>('IR'); // Default to IR as shown in demo
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(1.0, Math.min(4.0, Number((prev + delta).toFixed(1)))));
  };

  return (
    <div className="absolute top-14 left-16 z-30 w-[420px] rounded-lg overflow-hidden border border-white/20 shadow-2xl bg-black/90 backdrop-blur-md text-white select-none transition-all">
      {/* Top Header Bar inside PIP */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/70 border-b border-white/10 text-xs">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-red-500 font-mono font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
            <span>REC 0:00:01</span>
          </div>
          <span className="text-gray-300 font-mono text-[11px] uppercase tracking-wider font-semibold">
            {drone.callsign}
          </span>
          <span className="text-[10px] bg-white/10 text-gray-300 px-1.5 py-0.2 rounded font-mono">
            {sensorMode === 'EO' ? 'EO · DAY' : 'IR · FLIR 8.5µm'}
          </span>
        </div>

        {/* Sensor Mode Switcher (EO / IR) */}
        <div className="flex items-center space-x-1.5">
          <div className="bg-black/60 p-0.5 rounded border border-white/20 flex text-[10px] font-bold">
            <button
              onClick={() => setSensorMode('EO')}
              className={`px-2 py-0.5 rounded transition ${
                sensorMode === 'EO' ? 'bg-[#ea580c] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              EO
            </button>
            <button
              onClick={() => setSensorMode('IR')}
              className={`px-2 py-0.5 rounded transition ${
                sensorMode === 'IR' ? 'bg-[#ea580c] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              IR
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
          <span className="text-[10px] font-mono text-gray-300 w-6 text-center">{zoomLevel}x</span>
          <button
            onClick={() => handleZoom(0.5)}
            className="p-1 hover:bg-white/10 rounded text-gray-300 transition"
            title="Zoom in"
          >
            <ZoomIn className="w-3 h-3" />
          </button>

          {/* Full view / Close */}
          <button
            onClick={onToggleFullView}
            className="p-1 hover:bg-white/10 rounded text-gray-300 transition"
            title="Expand Fullscreen"
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

      {/* Main Video Viewport simulation */}
      <div className="relative h-[240px] w-full overflow-hidden bg-[#0c0d10] flex items-center justify-center">
        {/* Dynamic Simulated Background (EO vs IR Thermal) */}
        {sensorMode === 'EO' ? (
          // Daylight Optical View
          <div 
            style={{ transform: `scale(${zoomLevel})` }}
            className="w-full h-full bg-cover bg-center transition-transform duration-300 relative flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#605541] via-[#8c7b5d] to-[#b3a890]" />
            {/* Mountain Ridge Silhouettes */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-700 via-stone-800 to-black" />
            {/* Active Fire Core Smoke Plume */}
            <div className="absolute bottom-6 left-12 w-28 h-28 rounded-full bg-orange-600/40 blur-xl animate-pulse" />
            <div className="absolute bottom-10 left-16 w-16 h-16 rounded-full bg-yellow-400/50 blur-lg" />
          </div>
        ) : (
          // FLIR Infrared Thermal Heatmap
          <div 
            style={{ transform: `scale(${zoomLevel})` }}
            className="w-full h-full transition-transform duration-300 relative overflow-hidden bg-gradient-to-br from-[#101525] via-[#241335] to-[#0d0716]"
          >
            {/* Cool terrain ambient background in indigo/purple */}
            <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-violet-950 via-slate-900 to-black" />
            
            {/* Hotspot Wildfire Line (White-Hot / Flame orange / Red gradient) */}
            <div className="absolute bottom-8 left-1/4 w-44 h-16 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-300 blur-md opacity-90 animate-pulse" />
            
            {/* Ultra Hot Spot Marker */}
            <div className="absolute bottom-12 left-1/3 w-8 h-8 rounded-full bg-white blur-[2px] shadow-[0_0_20px_#ffffff]" />
            <div className="absolute bottom-16 left-1/3 text-[10px] font-mono text-yellow-300 bg-black/60 px-1 py-0.5 rounded border border-yellow-400/40">
              {drone.targetSpotTemp} °C
            </div>

            {/* Thermal Noise Grain */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px]" />
          </div>
        )}

        {/* HUD Crosshairs & Reticle Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 font-mono text-[10px] text-emerald-400/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {/* Top Heading Tape */}
          <div className="flex justify-between items-center px-10">
            <span className="text-gray-400">100</span>
            <span className="text-gray-400">110</span>
            <div className="flex flex-col items-center">
              <span className="text-white font-bold text-xs">{drone.heading}°</span>
              <div className="w-1.5 h-1.5 border-b-2 border-emerald-400" />
            </div>
            <span className="text-gray-400">120</span>
            <span className="text-gray-400">130</span>
          </div>

          {/* Center Target Crosshairs with Pitch Ladder */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Crosshair */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="w-full h-px bg-emerald-400/70" />
              <div className="h-full w-px bg-emerald-400/70 absolute" />
              <div className="w-6 h-6 border border-emerald-400/50 rounded-full absolute" />
            </div>
            {/* Pitch scale */}
            <div className="absolute right-14 text-[9px] text-emerald-300">
              <span>{drone.gimbal.pitch}°</span>
            </div>
          </div>

          {/* Left Telemetry HUD */}
          <div className="space-y-0.5">
            <div>ALT <span className="text-white font-bold">{drone.altitude} FT AGL</span></div>
            <div>GS <span className="text-white font-bold">{drone.speed} KT</span></div>
            <div>HDG <span className="text-white font-bold">{drone.heading}°</span></div>
          </div>

          {/* Right Telemetry HUD */}
          <div className="space-y-0.5 text-right self-end absolute right-3 bottom-10">
            <div>BAT <span className="text-white font-bold">{drone.battery}%</span></div>
            <div>LNK <span className="text-white font-bold">{drone.linkDbm} DBM</span></div>
            <div>ZOOM <span className="text-white font-bold">{zoomLevel}x</span></div>
            <div>FOV <span className="text-white font-bold">52°</span></div>
          </div>

          {/* Bottom Coordinate Bar */}
          <div className="flex justify-between items-center border-t border-emerald-500/20 pt-1 text-[9px] text-gray-300">
            <div>SPI <span className="text-emerald-300 font-bold">{drone.position.formatted}</span></div>
            <div>RNG <span className="text-white">1,960 M</span></div>
            <div>ELEV <span className="text-white">1,133 M</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
