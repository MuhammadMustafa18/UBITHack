import React, { useState } from 'react';
import { ViewMode, KeyEvent, DroneTelemetry } from '../types';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  ChevronDown, 
  Plus, 
  Waves, 
  AlertTriangle, 
  LifeBuoy
} from 'lucide-react';

interface BottomTimelineProps {
  currentMode: ViewMode;
  progress: number; // 0 to 100
  onSeek: (value: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onChangeSpeed: (spd: number) => void;
  keyEvents: KeyEvent[];
  selectedDrone: DroneTelemetry;
  currentTimeString: string;
}

export const BottomTimeline: React.FC<BottomTimelineProps> = ({
  currentMode,
  progress,
  onSeek,
  isPlaying,
  onTogglePlay,
  speed,
  onChangeSpeed,
  keyEvents,
  selectedDrone,
  currentTimeString,
}) => {
  const [speedDropdownOpen, setSpeedDropdownOpen] = useState(false);

  // Time ticks
  const timelineTicks = [
    { label: 'Jul 26', sub: '06:00', pos: 0 },
    { label: '', sub: '12:00', pos: 10 },
    { label: '', sub: '18:00', pos: 20 },
    { label: 'Jul 27', sub: '00:00', pos: 30 },
    { label: '', sub: '06:00', pos: 40 },
    { label: '', sub: '12:00', pos: 50 },
    { label: '', sub: '18:00', pos: 60 },
    { label: 'Jul 28', sub: '00:00', pos: 70 },
    { label: '', sub: '12:00', pos: 80 },
    { label: 'Jul 29', sub: '00:00', pos: 90 },
    { label: 'Jul 30', sub: '12:00', pos: 100 },
  ];

  return (
    <div className="h-48 bg-[#0b121b] border-t border-[#223145] flex flex-col select-none z-20 shadow-2xl">
      {/* 1. TOP SCRUBBER BAR */}
      <div className="h-10 bg-[#0f1724] border-b border-[#223145] px-3 flex items-center space-x-3 text-xs">
        {/* Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onSeek(Math.max(0, progress - 10))}
            className="p-1 rounded hover:bg-[#1a2638] text-gray-300 transition"
            title="Step backward"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-7 h-7 rounded bg-[#0284c7] text-white flex items-center justify-center hover:bg-[#0369a1] transition shadow-md"
            title={isPlaying ? 'Pause' : 'Play timeline'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <button
            onClick={() => onSeek(Math.min(100, progress + 10))}
            className="p-1 rounded hover:bg-[#1a2638] text-gray-300 transition"
            title="Step forward"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="relative ml-1">
            <button
              onClick={() => setSpeedDropdownOpen(!speedDropdownOpen)}
              className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-[#172334] hover:bg-[#1f2f45] text-cyan-300 font-mono text-[11px] font-semibold border border-[#2b3e57]"
            >
              <span>{speed}x</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {speedDropdownOpen && (
              <div className="absolute bottom-8 left-0 bg-[#162232] border border-[#2b3e57] rounded shadow-lg py-1 z-50 text-[11px] font-mono">
                {[1, 2, 5, 10].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onChangeSpeed(s);
                      setSpeedDropdownOpen(false);
                    }}
                    className={`block w-full px-3 py-1 text-left hover:bg-[#0284c7] hover:text-white ${
                      speed === s ? 'font-bold text-[#38bdf8]' : 'text-gray-300'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Timeline Scrubber Track */}
        <div className="flex-1 relative flex flex-col justify-center px-2">
          {/* Active Scrubber Bubble Tag */}
          <div
            style={{ left: `calc(${progress}% - 40px)` }}
            className="absolute -top-3.5 pointer-events-none z-30 transition-all duration-75"
          >
            <span className="bg-[#0284c7] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap border border-cyan-400/40">
              {currentTimeString}
            </span>
          </div>

          {/* Scrubber slider track */}
          <div className="relative w-full h-2 bg-[#1b283a] rounded-full overflow-hidden cursor-pointer border border-[#283b52]">
            <div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-[#0284c7] via-[#38bdf8] to-[#ef4444]"
            />
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="absolute inset-0 opacity-0 w-full cursor-pointer z-20"
          />

          {/* Key Event Markers on track */}
          <div className="absolute inset-x-2 top-0.5 pointer-events-none flex justify-between">
            {keyEvents.map((evt) => (
              <div
                key={evt.id}
                style={{ left: `${evt.timeValue}%` }}
                className="absolute -top-2 flex flex-col items-center"
              >
                <div
                  style={{ backgroundColor: evt.color }}
                  className="w-2.5 h-2.5 rounded-full border border-white shadow-md animate-pulse"
                />
              </div>
            ))}
          </div>

          {/* Date & Hour tick labels */}
          <div className="flex justify-between items-center text-[9px] font-mono text-gray-400 mt-1 pointer-events-none">
            {timelineTicks.map((tick, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="font-semibold text-gray-200">{tick.label}</span>
                <span>{tick.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Timestamp Range */}
        <div className="text-[10px] font-mono text-gray-400 hidden sm:block whitespace-nowrap pl-2 border-l border-[#243347]">
          Monsoon Surge (Jul 26 – Jul 30)
        </div>
      </div>

      {/* 2. BOTTOM ANALYTICS GRAPHS & KEY EVENTS */}
      <div className="flex-1 flex overflow-hidden p-2 space-x-2">
        {/* CHARTS CONTAINER (3 Synchronized Metrics) */}
        <div className="flex-1 grid grid-cols-3 gap-2">
          {/* CHART 1 */}
          <div className="bg-[#101926] rounded-lg p-2 border border-[#223145] flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-300">
              <span>
                {currentMode === 'Incident' && 'River Inundation Area'}
                {currentMode === 'Drones' && 'UAV Flight Altitude'}
                {currentMode === 'Resources' && 'Total Civilians Rescued'}
              </span>
              <span className="font-mono text-cyan-400">
                {currentMode === 'Incident' && `${Math.round(18 + (progress / 100) * 327)} sq km`}
                {currentMode === 'Drones' && `${selectedDrone.altitude} ft`}
                {currentMode === 'Resources' && `${Math.round((progress / 100) * 1420)} rescued`}
              </span>
            </div>

            {/* Dynamic SVG Area Chart */}
            <div className="relative h-16 w-full mt-1">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="floodGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 38 Q 25 35, 45 22 T 75 10 L 100 14 L 100 40 L 0 40 Z"
                  fill="url(#floodGrad1)"
                />
                <path
                  d="M 0 38 Q 25 35, 45 22 T 75 10 L 100 14"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
                <line
                  x1={progress}
                  y1="0"
                  x2={progress}
                  y2="40"
                  stroke="#f43f5e"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
              </svg>
            </div>

            <div className="flex justify-between text-[8px] font-mono text-gray-500 border-t border-[#1b2738] pt-0.5">
              <span>Jul 26</span>
              <span>Jul 27</span>
              <span>Jul 28 (Peak)</span>
              <span>Jul 29</span>
              <span>Jul 30</span>
            </div>
          </div>

          {/* CHART 2 */}
          <div className="bg-[#101926] rounded-lg p-2 border border-[#223145] flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-300">
              <span>
                {currentMode === 'Incident' && 'Discharge Rate (Cusecs)'}
                {currentMode === 'Drones' && 'Stranded Survivor Heatspots'}
                {currentMode === 'Resources' && 'Ration Deliveries'}
              </span>
              <span className="font-mono text-amber-400">
                {currentMode === 'Incident' && `${Math.round(65 + (progress / 100) * 220)}k cusecs`}
                {currentMode === 'Drones' && `${selectedDrone.survivorsDetected || 4} survivors`}
                {currentMode === 'Resources' && '3,450 packs'}
              </span>
            </div>

            <div className="relative h-16 w-full mt-1">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <path
                  d="M 0 36 L 20 32 L 45 18 L 70 6 L 85 16 L 100 28"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                />
                <circle
                  cx={progress}
                  cy="16"
                  r="2.5"
                  fill="#f59e0b"
                />
                <line
                  x1={progress}
                  y1="0"
                  x2={progress}
                  y2="40"
                  stroke="#f43f5e"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
              </svg>
            </div>

            <div className="flex justify-between text-[8px] font-mono text-gray-500 border-t border-[#1b2738] pt-0.5">
              <span>65k</span>
              <span>140k</span>
              <span>285k (Super Flood)</span>
            </div>
          </div>

          {/* CHART 3 */}
          <div className="bg-[#101926] rounded-lg p-2 border border-[#223145] flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-300">
              <span>
                {currentMode === 'Incident' && 'Flood Inundation Depth (m)'}
                {currentMode === 'Drones' && 'UAV Battery Discharge'}
                {currentMode === 'Resources' && 'Emergency Bund Built'}
              </span>
              <span className="font-mono text-red-400">
                {currentMode === 'Incident' && `${(1.2 + (progress / 100) * 5.4).toFixed(1)} m depth`}
                {currentMode === 'Drones' && `${selectedDrone.battery}%`}
                {currentMode === 'Resources' && '1,850 meters'}
              </span>
            </div>

            <div className="relative h-16 w-full mt-1">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <path
                  d="M 0 38 Q 30 35, 55 18 T 85 8 L 100 12 L 100 40 L 0 40 Z"
                  fill="#ef4444"
                  fillOpacity="0.18"
                />
                <path
                  d="M 0 38 Q 30 35, 55 18 T 85 8 L 100 12"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                />
                <line
                  x1={progress}
                  y1="0"
                  x2={progress}
                  y2="40"
                  stroke="#f43f5e"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
              </svg>
            </div>

            <div className="flex justify-between text-[8px] font-mono text-gray-500 border-t border-[#1b2738] pt-0.5">
              <span>0 m</span>
              <span>2.5 m</span>
              <span>6.6 m Peak</span>
            </div>
          </div>
        </div>

        {/* KEY FLOOD MILESTONES CARD */}
        <div className="w-72 bg-[#101926] rounded-lg p-2 border border-[#223145] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 border-b border-[#223145]">
            <span className="font-bold text-[11px] text-white flex items-center space-x-1">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span>Flood Milestones</span>
            </span>
            <span className="text-[9px] bg-red-950 text-red-400 font-bold px-1.5 py-0.2 rounded border border-red-800/40">
              NDMA
            </span>
          </div>

          <div className="space-y-1 my-1 overflow-y-auto max-h-24 pr-1">
            {keyEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => onSeek(evt.timeValue)}
                className="flex items-center justify-between p-1 rounded hover:bg-[#1a2638] cursor-pointer transition text-[10px]"
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <span
                    style={{ backgroundColor: evt.color }}
                    className="w-2 h-2 rounded-full flex-shrink-0"
                  />
                  <span className="font-medium text-white truncate">{evt.title}</span>
                </div>
                <span className="font-mono text-cyan-400 text-[9px] flex-shrink-0 ml-1">
                  {evt.timestamp}
                </span>
              </div>
            ))}
          </div>

          <div className="text-[9px] text-gray-300 bg-[#0d141e] p-1.5 rounded border border-[#223145] truncate">
            {keyEvents.find((e) => Math.abs(e.timeValue - progress) < 14)?.description || 'River monitoring sensors streaming real-time cusecs.'}
          </div>
        </div>
      </div>
    </div>
  );
};
