import React from 'react';
import { ViewMode } from '../types';
import { 
  Flame, 
  ChevronDown, 
  Calendar, 
  MapPin, 
  Layers, 
  Plane, 
  ShieldAlert, 
  Settings, 
  Share2, 
  BarChart2, 
  Eye,
  Crosshair
} from 'lucide-react';

interface HeaderProps {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  selectedIncident: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  selectedIncident,
}) => {
  return (
    <header className="h-12 bg-[#ded9cf] border-b border-[#c8c2b5] px-3 flex items-center justify-between text-xs font-medium text-[#2d2e33] select-none z-30 relative shadow-sm">
      {/* Brand & Incident Info */}
      <div className="flex items-center space-x-3">
        {/* Logo */}
        <div className="flex items-center space-x-1.5 font-bold tracking-tight text-sm text-[#18191c]">
          <div className="w-6 h-6 rounded bg-[#ea580c] flex items-center justify-center text-white shadow-sm">
            <Flame className="w-4 h-4 fill-white" />
          </div>
          <span>FireTrace</span>
          <span className="text-[#878174] font-normal text-xs ml-1 border-l border-[#c5bfb2] pl-2 hidden sm:inline">
            Wildfire Forensic Analysis
          </span>
        </div>

        <div className="h-4 w-px bg-[#c2bbb0] mx-1" />

        {/* Incident Selector */}
        <button className="flex items-center space-x-1 hover:bg-[#d4cdbf] px-2 py-1 rounded transition text-[#1e1f23] font-semibold">
          <span>{selectedIncident}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#635f56]" />
        </button>

        {/* Location & Dates */}
        <div className="hidden lg:flex items-center space-x-3 text-[#6a665b]">
          <div className="flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-[#888172]" />
            <span>San Gabriel Mountains, CA</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-[#888172]" />
            <span>Aug 14, 2024 – Aug 18, 2024</span>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center bg-[#cec7b9] p-0.5 rounded-md border border-[#bcb4a4]">
        <button
          onClick={() => onSelectMode('Incident')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
            currentMode === 'Incident'
              ? 'bg-[#f4f1ea] text-[#1c1d20] shadow-sm'
              : 'text-[#585348] hover:text-[#1c1d20] hover:bg-[#e1dbcf]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Incident</span>
        </button>

        <button
          onClick={() => onSelectMode('Drones')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
            currentMode === 'Drones'
              ? 'bg-[#f4f1ea] text-[#1c1d20] shadow-sm'
              : 'text-[#585348] hover:text-[#1c1d20] hover:bg-[#e1dbcf]'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Drones</span>
          <span className="bg-[#ea580c] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
            6
          </span>
        </button>

        <button
          onClick={() => onSelectMode('Resources')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
            currentMode === 'Resources'
              ? 'bg-[#f4f1ea] text-[#1c1d20] shadow-sm'
              : 'text-[#585348] hover:text-[#1c1d20] hover:bg-[#e1dbcf]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Resources</span>
          <span className="bg-[#ea580c] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
            6
          </span>
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center space-x-2 text-[#565146]">
        <button className="hidden md:flex items-center space-x-1 px-2 py-1 rounded hover:bg-[#d4cdbf] transition text-xs">
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        <button className="hidden md:flex items-center space-x-1 px-2 py-1 rounded hover:bg-[#d4cdbf] transition text-xs">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Analysis</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        <button className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded hover:bg-[#d4cdbf] transition text-xs">
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        <div className="h-4 w-px bg-[#c2bbb0] mx-0.5" />

        <button className="p-1 rounded hover:bg-[#d4cdbf] text-[#4a463d] transition" title="Settings">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
