import React, { useState, useEffect, useRef } from 'react';
import { ViewMode, LayerState, DroneTelemetry, ResourceUnit } from './types';
import { 
  INITIAL_LAYERS, 
  KEY_EVENTS, 
  DRONE_FLEET, 
  RESOURCE_UNITS, 
  AIR_OPS_LOG 
} from './data/mockIncidentData';
import { Header } from './components/Header';
import { Map3DViewport } from './components/Map3DViewport';
import { RightSidebar } from './components/RightSidebar';
import { BottomTimeline } from './components/BottomTimeline';
import { DronePipFeed } from './components/DronePipFeed';

export function App() {
  const [currentMode, setCurrentMode] = useState<ViewMode>('Incident');
  const [layers, setLayers] = useState<LayerState[]>(INITIAL_LAYERS);
  const [timelineProgress, setTimelineProgress] = useState<number>(38); // Starts around Aug 15 04:00 as seen in video
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Selected entities (defaulting to FT-06 and E-45 as featured in video)
  const [selectedDrone, setSelectedDrone] = useState<DroneTelemetry>(DRONE_FLEET[5]); // FT-06 Wren
  const [selectedResource, setSelectedResource] = useState<ResourceUnit>(RESOURCE_UNITS[8]); // E-45 Type 1 Engine
  const [dronePipOpen, setDronePipOpen] = useState<boolean>(false);
  const [rideAlongActive, setRideAlongActive] = useState<boolean>(false);

  // Layer toggling handlers
  const handleToggleLayer = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    );
  };

  const handleChangeOpacity = (id: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  };

  // Automatically open PIP feed when switching to Drones mode
  const handleSelectMode = (mode: ViewMode) => {
    setCurrentMode(mode);
    if (mode === 'Drones') {
      setDronePipOpen(true);
    }
  };

  // Timeline Animation Loop
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const updateTimeline = (now: number) => {
      if (isPlaying) {
        const delta = (now - lastTimeRef.current) / 1000;
        setTimelineProgress((prev) => {
          const next = prev + delta * 2.5 * playbackSpeed;
          if (next >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return next;
        });
      }
      lastTimeRef.current = now;
      requestRef.current = requestAnimationFrame(updateTimeline);
    };

    requestRef.current = requestAnimationFrame(updateTimeline);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, playbackSpeed]);

  // Compute realistic current timestamp string from 0-100 progress
  const getCurrentTimeString = (prog: number): string => {
    const startMs = new Date('2024-08-14T06:00:00Z').getTime();
    const endMs = new Date('2024-08-18T12:00:00Z').getTime();
    const curMs = startMs + (endMs - startMs) * (prog / 100);
    const date = new Date(curMs);

    const monthNames = ['Aug'];
    const month = monthNames[0];
    const day = date.getUTCDate();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    return `${month} ${day}, ${hours}:${minutes}`;
  };

  // Keyboard controls (Space to Play/Pause, Arrow keys to Seek)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowRight') {
        setTimelineProgress((p) => Math.min(100, p + 5));
      } else if (e.code === 'ArrowLeft') {
        setTimelineProgress((p) => Math.max(0, p - 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#18191c]">
      {/* Top Header Bar */}
      <Header
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        selectedIncident="Ridgeview Incident"
      />

      {/* Main Workspace (3D Viewport + Right Sidebar) */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* 3D Map Viewport */}
        <div className="flex-1 relative h-full">
          <Map3DViewport
            currentMode={currentMode}
            layers={layers}
            timelineProgress={timelineProgress}
            selectedDrone={selectedDrone}
            onSelectDrone={(d) => {
              setSelectedDrone(d);
              setDronePipOpen(true);
            }}
            selectedResource={selectedResource}
            onSelectResource={(r) => {
              setSelectedResource(r);
            }}
            drones={DRONE_FLEET}
            resources={RESOURCE_UNITS}
            rideAlongActive={rideAlongActive}
            onExitRideAlong={() => setRideAlongActive(false)}
          />

          {/* Picture-In-Picture Drone Camera Feed */}
          {dronePipOpen && (
            <DronePipFeed
              drone={selectedDrone}
              onClose={() => setDronePipOpen(false)}
              onToggleFullView={() => setRideAlongActive(!rideAlongActive)}
            />
          )}
        </div>

        {/* Right Sidebar */}
        <RightSidebar
          currentMode={currentMode}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          onChangeOpacity={handleChangeOpacity}
          drones={DRONE_FLEET}
          selectedDrone={selectedDrone}
          onSelectDrone={(d) => {
            setSelectedDrone(d);
            setDronePipOpen(true);
          }}
          resources={RESOURCE_UNITS}
          selectedResource={selectedResource}
          onSelectResource={(r) => setSelectedResource(r)}
          airOpsLogs={AIR_OPS_LOG}
          onOpenDroneCamera={() => setDronePipOpen(true)}
          onToggleRideAlong={() => setRideAlongActive(!rideAlongActive)}
          rideAlongActive={rideAlongActive}
        />
      </div>

      {/* Bottom Timeline & Analytics Panel */}
      <BottomTimeline
        currentMode={currentMode}
        progress={timelineProgress}
        onSeek={(val) => setTimelineProgress(val)}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        speed={playbackSpeed}
        onChangeSpeed={(spd) => setPlaybackSpeed(spd)}
        keyEvents={KEY_EVENTS}
        selectedDrone={selectedDrone}
        currentTimeString={getCurrentTimeString(timelineProgress)}
      />
    </div>
  );
}

export default App;
