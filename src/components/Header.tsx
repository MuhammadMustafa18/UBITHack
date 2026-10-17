import React, { useState } from 'react';
import { ViewMode } from '../types';
import { 
  Waves, 
  ChevronDown, 
  Calendar, 
  MapPin, 
  Layers, 
  Crosshair, 
  LifeBuoy, 
  Settings, 
  Share2, 
  BarChart2, 
  Eye,
  ShieldCheck,
  Check
} from 'lucide-react';

interface HeaderProps {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  selectedIncident: string;
  onSelectIncident: (inc: string) => void;
}

export const PAKISTAN_INCIDENTS = [
  { name: 'Nowshera & Swat Confluence', province: 'Khyber Pakhtunkhwa', status: 'Super Flood (285k cusecs)' },
  { name: 'Sukkur Barrage & Dadu Basin', province: 'Sindh', status: 'High Inundation Watch' },
  { name: 'Taunsa & Rajanpur Hill Torrents', province: 'South Punjab', status: 'Flash Flood Torrent' },
  { name: 'Charsadda & Kabul River Basin', province: 'Khyber Pakhtunkhwa', status: 'Moderate Surge' },
];

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  selectedIncident,
  onSelectIncident,
}) => {
  const [incidentDropdownOpen, setIncidentDropdownOpen] = useState(false);

  return (
    <header className="h-12 bg-[#131b26] border-b border-[#243347] px-3 flex items-center justify-between text-xs font-medium text-gray-200 select-none z-30 relative shadow-md">
      {/* Brand & Incident Info */}
      <div className="flex items-center space-x-3">
        {/* Logo */}
        <div className="flex items-center space-x-2 font-bold tracking-tight text-sm text-white">
          <div className="w-6 h-6 rounded bg-[#0284c7] flex items-center justify-center text-white shadow-sm ring-1 ring-cyan-400/30">
            <Waves className="w-4 h-4 fill-white" />
          </div>
          <span className="font-extrabold text-white">FloodTrace</span>
          <span className="bg-[#0284c7]/20 border border-[#0284c7]/40 text-[#38bdf8] text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase">
            Pakistan
          </span>
          <span className="text-gray-400 font-normal text-xs ml-1 border-l border-gray-700 pl-2 hidden lg:inline">
            Flood Outbreak & Inundation Forensics
          </span>
        </div>

        <div className="h-4 w-px bg-gray-700 mx-1 hidden sm:block" />

        {/* Incident Selector Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIncidentDropdownOpen(!incidentDropdownOpen)}
            className="flex items-center space-x-1.5 bg-[#1b2636] hover:bg-[#233247] px-2.5 py-1 rounded border border-[#2b3e57] transition text-white font-semibold"
          >
            <span className="text-[#38bdf8] truncate max-w-[200px]">{selectedIncident}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {incidentDropdownOpen && (
            <div className="absolute top-10 left-0 w-72 bg-[#162130] border border-[#2b3e57] rounded-lg shadow-2xl py-1.5 z-50 text-xs">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Select Pakistan Basin / Flood Incident
              </div>
              {PAKISTAN_INCIDENTS.map((inc) => (
                <button
                  key={inc.name}
                  onClick={() => {
                    onSelectIncident(inc.name);
                    setIncidentDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-start justify-between hover:bg-[#1e2e42] transition ${
                    selectedIncident === inc.name ? 'bg-[#1b2c40] text-[#38bdf8]' : 'text-gray-200'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">{inc.name}</div>
                    <div className="text-[10px] text-gray-400">{inc.province}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-medium text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                      {inc.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location & Dates */}
        <div className="hidden xl:flex items-center space-x-3 text-gray-400">
          <div className="flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>KPK & Indus Basin, PK</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Jul 26, 2024 – Jul 30, 2024</span>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center bg-[#0d141e] p-0.5 rounded-lg border border-[#223145]">
        <button
          onClick={() => onSelectMode('Incident')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
            currentMode === 'Incident'
              ? 'bg-[#0284c7] text-white shadow-sm'
              : 'text-gray-300 hover:text-white hover:bg-[#182434]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Hydrology</span>
        </button>

        <button
          onClick={() => onSelectMode('Drones')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
            currentMode === 'Drones'
              ? 'bg-[#0284c7] text-white shadow-sm'
              : 'text-gray-300 hover:text-white hover:bg-[#182434]'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Rescue Drones</span>
          <span className="bg-[#ea580c] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
            6
          </span>
        </button>

        <button
          onClick={() => onSelectMode('Resources')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
            currentMode === 'Resources'
              ? 'bg-[#0284c7] text-white shadow-sm'
              : 'text-gray-300 hover:text-white hover:bg-[#182434]'
          }`}
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Rescue Ops</span>
          <span className="bg-[#10b981] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
            8
          </span>
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center space-x-2 text-gray-300">
        <button className="hidden md:flex items-center space-x-1 px-2 py-1 rounded hover:bg-[#1b2636] transition text-xs">
          <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Layers</span>
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>

        <button className="hidden md:flex items-center space-x-1 px-2 py-1 rounded hover:bg-[#1b2636] transition text-xs">
          <BarChart2 className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Damage Assessment</span>
        </button>

        <button className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded hover:bg-[#1b2636] transition text-xs">
          <Share2 className="w-3.5 h-3.5 text-gray-400" />
          <span>Export NDMA Brief</span>
        </button>

        <div className="h-4 w-px bg-gray-700 mx-0.5" />

        <div className="flex items-center space-x-1 text-[11px] bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/40 font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>LIVE NDMA FEED</span>
        </div>
      </div>
    </header>
  );
};
