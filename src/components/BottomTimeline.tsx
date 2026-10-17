import React, { useState } from 'react';
import { ViewMode, KeyEvent, DroneTelemetry } from '../types';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  ChevronDown, 
  Plus, 
  Flame, 
  AlertTriangle, 
  Flag,
  TrendingUp,
  Activity
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
    { label: 'Aug 14', sub: '06:00', pos: 0 },
    { label: '', sub: '12:00', pos: 8 },
    { label: '', sub: '18:00', pos: 16 },
    { label: 'Aug 15', sub: '00:00', pos: 25 },
    { label: '', sub: '06:00', pos: 33 },
    { label: '', sub: '12:00', pos: 41 },
    { label: '', sub: '18:00', pos: 50 },
    { label: 'Aug 16', sub: '00:00', pos: 58 },
    { label: '', sub: '06:00', pos: 64 },
    { label: '', sub: '12:00', pos: 70 },
    { label: '', sub: '18:00', pos: 76 },
    { label: 'Aug 17', sub: '00:00', pos: 82 },
    { label: '', sub: '06:00', pos: 88 },
    { label: '', sub: '12:00', pos: 92 },
    { label: '', sub: '18:00', pos: 96 },
    { label: 'Aug 18', sub: '12:00', pos: 100 },
  ];

  return (
    <div className="h-48 bg-[#ded9cf] border-t border-[#c8c2b5] flex flex-col select-none z-20 shadow-md">
      {/* 1. TOP SCRUBBER BAR */}
      <div className="h-10 bg-[#e6e1d6] border-b border-[#cfc8ba] px-3 flex items-center space-x-3 text-xs">
        {/* Playback Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onSeek(Math.max(0, progress - 10))}
            className="p-1 rounded hover:bg-[#d8d2c4] text-[#423f37] transition"
            title="Step backward"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-7 h-7 rounded bg-[#202226] text-white flex items-center justify-center hover:bg-black transition shadow-sm"
            title={isPlaying ? 'Pause' : 'Play timeline'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <button
            onClick={() => onSeek(Math.min(100, progress + 10))}
            className="p-1 rounded hover:bg-[#d8d2c4] text-[#423f37] transition"
            title="Step forward"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="relative ml-1">
            <button
              onClick={() => setSpeedDropdownOpen(!speedDropdownOpen)}
              className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-[#dad3c4] hover:bg-[#cec6b5] text-[#2c2a25] font-mono text-[11px] font-semibold border border-[#beb6a4]"
            >
              <span>{speed}x</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {speedDropdownOpen && (
              <div className="absolute bottom-8 left-0 bg-[#f4f1ea] border border-[#c8c2b5] rounded shadow-lg py-1 z-50 text-[11px] font-mono">
                {[1, 2, 5, 10].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onChangeSpeed(s);
                      setSpeedDropdownOpen(false);
                    }}
                    className={`block w-full px-3 py-1 text-left hover:bg-[#ea580c] hover:text-white ${
                      speed === s ? 'font-bold text-[#ea580c]' : 'text-[#302e28]'
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
            <span className="bg-[#212327] text-white text-[10px] font-mono font-semibold px-2 py-0.5 rounded shadow-md whitespace-nowrap border border-white/20">
              {currentTimeString}
            </span>
          </div>

          {/* Scrubber slider track */}
          <div className="relative w-full h-2 bg-[#cec7b8] rounded-full overflow-hidden cursor-pointer">
            <div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#ef4444]"
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

          {/* Key event indicator dots along scrubber */}
          <div className="absolute inset-x-2 top-0.5 pointer-events-none flex justify-between">
            {keyEvents.map((evt) => (
              <div
                key={evt.id}
                style={{ left: `${evt.timeValue}%` }}
                className="absolute -top-2 flex flex-col items-center"
              >
                <div
                  style={{ backgroundColor: evt.color }}
                  className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                />
              </div>
            ))}
          </div>

          {/* Date & Hour tick labels */}
          <div className="flex justify-between items-center text-[9px] font-mono text-[#787265] mt-1 pointer-events-none">
            {timelineTicks.map((tick, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="font-semibold text-[#48443b]">{tick.label}</span>
                <span>{tick.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Timestamp Range */}
        <div className="text-[10px] font-mono text-[#6c675a] hidden sm:block whitespace-nowrap pl-2 border-l border-[#cfc8ba]">
          Aug 14, 14:00 – Aug 18, 12:00
        </div>
      </div>

      {/* 2. BOTTOM ANALYTICS GRAPHS & KEY EVENTS SPLIT */}
      <div className="flex-1 flex overflow-hidden p-2 space-x-2">
        {/* CHARTS CONTAINER (3 synchronized metrics) */}
        <div className="flex-1 grid grid-cols-3 gap-2">
          {/* CHART 1 */}
          <div className="bg-[#ece7dd] rounded-lg p-2 border border-[#d1cbbe] flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#45423b]">
              <span>
                {currentMode === 'Incident' && 'Fire Area (acres)'}
                {currentMode === 'Drones' && 'Altitude (ft AGL)'}
                {currentMode === 'Resources' && 'Retardant Dropped (gal)'}
              </span>
              <span className="font-mono text-[#ea580c]">
                {currentMode === 'Incident' && `${Math.round((progress / 100) * 12480).toLocaleString()} ac`}
                {currentMode === 'Drones' && `${selectedDrone.altitude} ft`}
                {currentMode === 'Resources' && `${Math.round((progress / 100) * 312).toLocaleString()}k gal`}
              </span>
            </div>

            {/* Simulated Dynamic SVG Area Chart */}
            <div className="relative h-16 w-full mt-1">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 38 Q 20 35, 40 28 T 80 12 L 100 8 L 100 40 L 0 40 Z"
                  fill="url(#chartGrad1)"
                />
                <path
                  d="M 0 38 Q 20 35, 40 28 T 80 12 L 100 8"
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="1.5"
                />
                {/* Vertical scrubber line indicator */}
                <line
                  x1={progress}
                  y1="0"
                  x2={progress}
                  y2="40"
                  stroke="#202226"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
              </svg>
            </div>

            <div className="flex justify-between text-[8px] font-mono text-[#7a7466] border-t border-[#ded8cb] pt-0.5">
              <span>Aug 14</span>
              <span>Aug 15</span>
              <span>Aug 16</span>
              <span>Aug 17</span>
              <span>Aug 18</span>
            </div>
          </div>

          {/* CHART 2 */}
          <div className="bg-[#ece7dd] rounded-lg p-2 border border-[#d1cbbe] flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#45423b]">
              <span>
                {currentMode === 'Incident' && 'Rate of Spread (chains/hr)'}
                {currentMode === 'Drones' && 'Max Temperature in View (°C)'}
                {currentMode === 'Resources' && 'Fire Line Built (chains)'}
              </span>
              <span className="font-mono text-[#b91c1c]">
                {currentMode === 'Incident' && '32 ch/hr'}
                {currentMode === 'Drones' && `${selectedDrone.targetSpotTemp} °C`}
                {currentMode === 'Resources' && `${Math.round((progress / 100) * 1111)} chains`}
              </span>
            </div>

            {/* Dynamic Rate of Spread Peaks */}
            <div className="relative h-16 w-full mt-1">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <path
                  d="M 0 38 L 15 38 L 22 10 L 30 18 L 45 35 L 60 14 L 75 32 L 100 38"
                  fill="none"
                  stroke="#b91c1c"
                  strokeWidth="1.5"
                />
                {/* Current scrubber mark */}
                <circle
                  cx={progress}
                  cy="20"
                  r="2.5"
                  fill="#b91c1c"
                />
                <line
                  x1={progress}
                  y1="0"
                  x2={progress}
                  y2="40"
                  stroke="#202226"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
              </svg>
            </div>

            <div className="flex justify-between text-[8px] font-mono text-[#7a7466] border-t border-[#ded8cb] pt-0.5">
              <span>0 ch/hr</span>
              <span>20</span>
              <span>40 ch/hr peak</span>
            </div>
          </div>

          {/* CHART 3 */}
          <div className="bg-[#ece7dd] rounded-lg p-2 border border-[#d1cbbe] flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#45423b]">
              <span>
                {currentMode === 'Incident' && 'Elevation Profile (selected path)'}
                {currentMode === 'Drones' && 'Battery Discharge (%)'}
                {currentMode === 'Resources' && 'Personnel Assigned'}
              </span>
              <span className="font-mono text-[#2563eb]">
                {currentMode === 'Incident' && '1,892 m (Mesa Peak)'}
                {currentMode === 'Drones' && `${selectedDrone.battery}%`}
                {currentMode === 'Resources' && '67 personnel'}
              </span>
            </div>

            {/* Elevation topography curve */}
            <div className="relative h-16 w-full mt-1">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <path
                  d="M 0 34 Q 25 30, 45 16 T 85 8 L 100 12 L 100 40 L 0 40 Z"
                  fill="#3b82f6"
                  fillOpacity="0.15"
                />
                <path
                  d="M 0 34 Q 25 30, 45 16 T 85 8 L 100 12"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="1.5"
                />
                <line
                  x1={progress}
                  y1="0"
                  x2={progress}
                  y2="40"
                  stroke="#202226"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
              </svg>
            </div>

            <div className="flex justify-between text-[8px] font-mono text-[#7a7466] border-t border-[#ded8cb] pt-0.5">
              <span>900 m</span>
              <span>5 km</span>
              <span>10 km</span>
              <span>15 km</span>
            </div>
          </div>
        </div>

        {/* KEY EVENTS SIDE CARD */}
        <div className="w-72 bg-[#ece7dd] rounded-lg p-2 border border-[#d1cbbe] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 border-b border-[#ded8cb]">
            <span className="font-bold text-[11px] text-[#2c2a25]">Key Events</span>
            <button className="flex items-center space-x-0.5 text-[10px] text-[#ea580c] font-semibold hover:underline">
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-1 my-1 overflow-y-auto max-h-24 pr-1">
            {keyEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => onSeek(evt.timeValue)}
                className="flex items-center justify-between p-1 rounded hover:bg-[#e0dad0] cursor-pointer transition text-[10px]"
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <span
                    style={{ backgroundColor: evt.color }}
                    className="w-2 h-2 rounded-full flex-shrink-0"
                  />
                  <span className="font-medium text-[#1e1f23] truncate">{evt.title}</span>
                </div>
                <span className="font-mono text-[#7a7466] text-[9px] flex-shrink-0 ml-1">
                  {evt.timestamp}
                </span>
              </div>
            ))}
          </div>

          <div className="text-[9px] text-[#736d60] bg-[#e4ded4] p-1 rounded border border-[#d6d0c4] truncate">
            {keyEvents.find((e) => Math.abs(e.timeValue - progress) < 12)?.description || 'Timeline advancing through incident log.'}
          </div>
        </div>
      </div>
    </div>
  );
};
