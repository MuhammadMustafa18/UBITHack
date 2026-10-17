import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ViewMode, LayerState, DroneTelemetry, ResourceUnit, FloodProbeData } from '../types';
import { Compass, Maximize2, RotateCcw, Waves, AlertTriangle } from 'lucide-react';

interface Map3DViewportProps {
  currentMode: ViewMode;
  layers: LayerState[];
  timelineProgress: number; // 0 to 100
  selectedDrone: DroneTelemetry | null;
  onSelectDrone: (drone: DroneTelemetry) => void;
  selectedResource: ResourceUnit | null;
  onSelectResource: (res: ResourceUnit) => void;
  drones: DroneTelemetry[];
  resources: ResourceUnit[];
  rideAlongActive: boolean;
  onExitRideAlong: () => void;
}

export const Map3DViewport: React.FC<Map3DViewportProps> = ({
  currentMode,
  layers,
  timelineProgress,
  selectedDrone,
  onSelectDrone,
  selectedResource,
  onSelectResource,
  drones,
  resources,
  rideAlongActive,
  onExitRideAlong,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const [is2DMode, setIs2DMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState('18.2x');
  const [floodProbe, setFloodProbe] = useState<FloodProbeData | null>(null);
  const [hoverScreenPos, setHoverScreenPos] = useState<{ x: number; y: number } | null>(null);

  // References to Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const floodWaterMeshRef = useRef<THREE.Mesh | null>(null);
  const droneObjectsRef = useRef<{ [id: string]: THREE.Group }>({});
  const resourceObjectsRef = useRef<{ [id: string]: THREE.Group }>({});
  const animationFrameRef = useRef<number | null>(null);

  // Camera animation state
  const cameraTargetRef = useRef(new THREE.Vector3(0, 10, -5));
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 135, theta: Math.PI / 3.8, phi: Math.PI / 3.4 });

  useEffect(() => {
    if (!canvasMountRef.current) return;
    const canvasContainer = canvasMountRef.current;
    const width = canvasContainer.clientWidth || 800;
    const height = canvasContainer.clientHeight || 600;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#94a3b8'); // Monsoonal cloudy daylight haze
    scene.fog = new THREE.FogExp2('#94a3b8', 0.0028);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2000);
    camera.position.set(65, 75, 105);
    camera.lookAt(0, 8, -5);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    canvasContainer.innerHTML = '';
    canvasContainer.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Monsoon Lighting
    const ambientLight = new THREE.AmbientLight('#cbd5e1', 1.2);
    scene.add(ambientLight);

    const monsoonSun = new THREE.DirectionalLight('#f1f5f9', 1.9);
    monsoonSun.position.set(90, 140, 70);
    monsoonSun.castShadow = true;
    monsoonSun.shadow.mapSize.width = 2048;
    monsoonSun.shadow.mapSize.height = 2048;
    monsoonSun.shadow.camera.near = 10;
    monsoonSun.shadow.camera.far = 400;
    monsoonSun.shadow.bias = -0.0005;
    scene.add(monsoonSun);

    // 5. Build Pakistan River Basin Topography (Nowshera / Kabul-Swat Basin)
    const terrainSize = 250;
    const segments = 160;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const vertexColors: number[] = [];

    // Realistically carve river channel, floodplains, and surrounding foothills
    const getTerrainHeight = (x: number, z: number) => {
      // Swat/Kabul winding river path: z ≈ sin(x * 0.04) * 22
      const riverCenterZ = Math.sin(x * 0.04) * 24;
      const distFromRiver = Math.abs(z - riverCenterZ);

      // Deep riverbed channel
      let elevation = 0;
      if (distFromRiver < 14) {
        // Riverbed lowest channel
        elevation = 3 + (distFromRiver / 14) * 5;
      } else if (distFromRiver < 42) {
        // Floodplain agricultural basin (vulnerable to inundation)
        elevation = 8 + Math.sin(x * 0.06) * 1.5 + (distFromRiver - 14) * 0.25;
      } else {
        // Surrounding foothills & ridges (Cherat / Malakand foothills)
        const hillProfile = (distFromRiver - 42) * 0.65;
        const mountainNoise = Math.sin(x * 0.08 + z * 0.05) * 6 + Math.cos(x * 0.03) * 14;
        elevation = 15 + hillProfile + mountainNoise;
      }

      return Math.max(2, elevation);
    };

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const vy = getTerrainHeight(vx, vz);
      posAttr.setY(i, vy);

      // Color coding: Silt/soil, agricultural green fields, mountain stone, paved roads
      const riverCenterZ = Math.sin(vx * 0.04) * 24;
      const distFromRiver = Math.abs(vz - riverCenterZ);
      const isGTRoad = Math.abs(vz - (riverCenterZ + 24)) < 2.2; // GT Road highway along basin

      if (isGTRoad) {
        // N-5 / GT Road highway
        vertexColors.push(0.28, 0.30, 0.34);
      } else if (distFromRiver < 16) {
        // Riverbed wet clay & sand banks
        vertexColors.push(0.48, 0.44, 0.38);
      } else if (distFromRiver < 45) {
        // Alluvial agricultural fields (sugarcane / wheat / maize)
        const isPatch = (Math.sin(vx * 0.15) * Math.cos(vz * 0.15)) > 0;
        if (isPatch) {
          vertexColors.push(0.38, 0.48, 0.32); // Green crops
        } else {
          vertexColors.push(0.55, 0.50, 0.42); // Wet fertile silt
        }
      } else {
        // Rocky arid foothills
        vertexColors.push(0.58, 0.54, 0.48);
      }
    }

    terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.08,
      flatShading: false,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = false;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 6. Dynamic Flood Water Inundation Surface (Rises dynamically with discharge!)
    const waterGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, 64, 64);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: '#0284c7', // Swollen monsoonal river blue
      transparent: true,
      opacity: 0.82,
      roughness: 0.15,
      metalness: 0.25,
      depthWrite: false,
    });
    const floodWaterMesh = new THREE.Mesh(waterGeo, waterMat);
    floodWaterMesh.position.y = 7.5; // Baseline water elevation
    scene.add(floodWaterMesh);
    floodWaterMeshRef.current = floodWaterMesh;

    // 7. 3D Levees / Flood Protection Ring Bund & Breach Site
    const bundPoints: THREE.Vector3[] = [];
    for (let bx = -70; bx <= 70; bx += 4) {
      const bz = Math.sin(bx * 0.04) * 24 + 18; // Bund wall along south bank
      const by = getTerrainHeight(bx, bz);
      bundPoints.push(new THREE.Vector3(bx, by + 1.2, bz));
    }
    const bundGeo = new THREE.BufferGeometry().setFromPoints(bundPoints);
    const bundMat = new THREE.LineBasicMaterial({ color: '#f59e0b', linewidth: 4 });
    const bundLine = new THREE.Line(bundGeo, bundMat);
    scene.add(bundLine);

    // Breach Site Emitter marker (Nowshera Western Ring Bund)
    const breachMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 0.8, 16),
      new THREE.MeshBasicMaterial({ color: '#ef4444' })
    );
    breachMesh.position.set(-15, 11, 24);
    scene.add(breachMesh);

    // 8. Nowshera GT Road Bridge across River Channel
    const bridgeGroup = new THREE.Group();
    const bridgeDeck = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.8, 38),
      new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.7 })
    );
    bridgeDeck.position.set(20, 14, 0);
    bridgeGroup.add(bridgeDeck);

    // Bridge Piers
    for (let pz = -12; pz <= 12; pz += 12) {
      const pier = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.4, 12, 8),
        new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8 })
      );
      pier.position.set(20, 8, pz);
      bridgeGroup.add(pier);
    }
    scene.add(bridgeGroup);

    // 9. Village Clusters / Residential Dwellings on the Plain
    const villageGroup = new THREE.Group();
    const houseGeo = new THREE.BoxGeometry(2.5, 2.2, 2.5);
    const houseMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.6 });
    const roofGeo = new THREE.ConeGeometry(2.2, 1.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.5 });

    const houseCoords = [
      [-12, 28], [-18, 32], [-22, 26], [8, 26], [14, 30], [28, 28], [-35, 34], [-40, 28]
    ];

    houseCoords.forEach(([hx, hz]) => {
      const hy = getTerrainHeight(hx, hz);
      const house = new THREE.Mesh(houseGeo, houseMat);
      house.position.set(hx, hy + 1.1, hz);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(hx, hy + 2.8, hz);
      villageGroup.add(house, roof);
    });
    scene.add(villageGroup);

    // 10. Rescue 1122 & NDMA Drones
    drones.forEach((drone) => {
      const droneGroup = new THREE.Group();

      // Drone Body (Cyan/White Rescue UAV styling)
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.4, 2.0),
        new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.8, roughness: 0.2 })
      );
      droneGroup.add(body);

      // Rotors
      const rotorGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.08, 8);
      const rotorMat = new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.7 });
      const offsets = [[-1.2, 0.3, -1.2], [1.2, 0.3, -1.2], [-1.2, 0.3, 1.2], [1.2, 0.3, 1.2]];
      offsets.forEach(([ox, oy, oz]) => {
        const rotor = new THREE.Mesh(rotorGeo, rotorMat);
        rotor.position.set(ox, oy, oz);
        droneGroup.add(rotor);
      });

      // Orbit Ring on ground/water
      const orbitRing = new THREE.Mesh(
        new THREE.RingGeometry(16, 16.5, 48),
        new THREE.MeshBasicMaterial({ color: drone.color, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
      );
      orbitRing.rotateX(-Math.PI / 2);
      orbitRing.position.y = -drone.altitude * 0.015;
      droneGroup.add(orbitRing);

      const droneX = (drone.position.lng - 71.97) * 1800;
      const droneZ = (drone.position.lat - 34.01) * 1800;
      const baseAlt = getTerrainHeight(droneX, droneZ);
      droneGroup.position.set(droneX, baseAlt + drone.altitude * 0.015, droneZ);

      scene.add(droneGroup);
      droneObjectsRef.current[drone.id] = droneGroup;
    });

    // 11. Pak Army Aviation Mi-17 & Navy Zodiac Boats
    resources.forEach((res) => {
      const resGroup = new THREE.Group();

      if (res.category === 'AIRCRAFT') {
        // Mi-17 Heavy Helicopter model
        const heloBody = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2, 1.4, 7, 8),
          new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.6 })
        );
        heloBody.rotateX(Math.PI / 2);

        // Main Rotor Blades
        const mainRotor = new THREE.Mesh(
          new THREE.BoxGeometry(14, 0.05, 0.8),
          new THREE.MeshBasicMaterial({ color: '#0f172a' })
        );
        mainRotor.position.y = 1.6;
        resGroup.add(heloBody, mainRotor);

        resGroup.position.set(-18, 28, 30); // Hovering over submerged school roof
      } else if (res.category === 'BOATS & TEAMS') {
        // Zodiac Rescue Boat (Inflatable black pontoon + orange floor)
        const boatHull = new THREE.Mesh(
          new THREE.TorusGeometry(1.8, 0.45, 8, 16),
          new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 })
        );
        boatHull.rotateX(Math.PI / 2);
        const boatFloor = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 0.1, 3.2),
          new THREE.MeshStandardMaterial({ color: '#ea580c' })
        );
        resGroup.add(boatHull, boatFloor);
        resGroup.position.set(8, 12, 28);
      }

      scene.add(resGroup);
      resourceObjectsRef.current[res.id] = resGroup;
    });

    // 12. Animation loop
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Dynamic water ripple & flow motion
      if (floodWaterMeshRef.current) {
        floodWaterMeshRef.current.position.y += Math.sin(elapsedTime * 2) * 0.005;
      }

      // Animate drone flight orbits
      drones.forEach((d) => {
        const obj = droneObjectsRef.current[d.id];
        if (obj) {
          const orbitSpeed = d.id === 'UAV-02' ? 0.25 : 0.18;
          const orbitDist = 20 + parseInt(d.id.slice(-1)) * 3;
          const curAngle = elapsedTime * orbitSpeed + parseInt(d.id.slice(-1));
          const nx = -10 + Math.cos(curAngle) * orbitDist;
          const nz = 18 + Math.sin(curAngle) * orbitDist;
          const gh = getTerrainHeight(nx, nz);
          obj.position.x = nx;
          obj.position.z = nz;
          obj.position.y = Math.max(14, gh) + d.altitude * 0.015;
          obj.rotation.y = -curAngle + Math.PI / 2;
        }
      });

      // Animate Navy Zodiac navigating flooded street
      const boatObj = resourceObjectsRef.current['res-4'];
      if (boatObj && floodWaterMeshRef.current) {
        const boatT = elapsedTime * 0.3;
        boatObj.position.x = Math.sin(boatT) * 18;
        boatObj.position.z = 26 + Math.cos(boatT * 0.5) * 8;
        boatObj.position.y = floodWaterMeshRef.current.position.y + 0.1;
      }

      // Camera Ride-along tracking
      if (rideAlongActive && selectedDrone && cameraRef.current) {
        const dMesh = droneObjectsRef.current[selectedDrone.id];
        if (dMesh) {
          const chaseOffset = new THREE.Vector3(0, 5, -16).applyQuaternion(dMesh.quaternion);
          cameraRef.current.position.lerp(dMesh.position.clone().add(chaseOffset), 0.08);
          cameraRef.current.lookAt(dMesh.position);
        }
      } else if (rideAlongActive && selectedResource && cameraRef.current) {
        const rMesh = resourceObjectsRef.current[selectedResource.id];
        if (rMesh) {
          const chaseOffset = new THREE.Vector3(0, 8, -20);
          cameraRef.current.position.lerp(rMesh.position.clone().add(chaseOffset), 0.08);
          cameraRef.current.lookAt(rMesh.position);
        }
      } else if (cameraRef.current && !isDraggingRef.current) {
        // Orbit camera view
        const { radius, theta, phi } = cameraSphericalRef.current;
        const cx = cameraTargetRef.current.x + radius * Math.sin(phi) * Math.sin(theta);
        const cy = cameraTargetRef.current.y + radius * Math.cos(phi);
        const cz = cameraTargetRef.current.z + radius * Math.sin(phi) * Math.cos(theta);

        cameraRef.current.position.lerp(new THREE.Vector3(cx, cy, cz), 0.05);
        cameraRef.current.lookAt(cameraTargetRef.current);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize
    const handleResize = () => {
      if (!canvasMountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = canvasMountRef.current.clientWidth;
      const h = canvasMountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (canvasContainer && renderer.domElement && canvasContainer.contains(renderer.domElement)) {
        canvasContainer.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [drones, resources]);

  // Synchronize dynamic flood water level with timelineProgress
  useEffect(() => {
    if (!floodWaterMeshRef.current) return;
    // Water level rises from normal river gauge (5.5m) to Super Flood crest (16.5m)
    const waterLevel = 5.5 + (timelineProgress / 100) * 11.0;
    floodWaterMeshRef.current.position.y = waterLevel;

    // Dynamically update water material opacity & color depth
    const mat = floodWaterMeshRef.current.material as THREE.MeshStandardMaterial;
    if (mat) {
      if (timelineProgress > 50) {
        // Super flood dangerous turbid silt water
        mat.color.set('#0369a1');
        mat.opacity = 0.88;
      } else {
        mat.color.set('#0284c7');
        mat.opacity = 0.78;
      }
    }
  }, [timelineProgress]);

  // Mouse Controls & Flood Depth Probe
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    if (rideAlongActive) {
      onExitRideAlong();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !terrainMeshRef.current || !floodWaterMeshRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObject(terrainMeshRef.current);

    if (intersects.length > 0 && !isDraggingRef.current) {
      const p = intersects[0].point;
      const groundElev = Math.round(270 + p.y * 3.5);
      const currentWaterY = floodWaterMeshRef.current.position.y;
      const depth = Math.max(0, Number(((currentWaterY - p.y) * 1.2).toFixed(1)));

      let status: FloodProbeData['inundationStatus'] = 'Safe (Dry)';
      let evac = 'Normal Monitoring';
      let risk = 'High Ground Foothills';

      if (depth > 3.5) {
        status = 'Critical Torrent';
        evac = 'MANDATORY AIR-EVACUATION (Red Alert)';
        risk = 'Nowshera Residential Sector B (Rooftops submerged)';
      } else if (depth > 1.2) {
        status = 'Severe Submergence';
        evac = 'URGENT RESCUE 1122 BOAT EVAC';
        risk = 'GT Road Corridor & Agricultural land';
      } else if (depth > 0) {
        status = 'Moderate Inundation';
        evac = 'Vehicular Transit Closed';
        risk = 'Low-lying bund perimeter';
      }

      setFloodProbe({
        groundElevationM: groundElev,
        waterDepthM: depth,
        waterVelocityMs: depth > 0 ? Number((1.2 + depth * 0.45).toFixed(1)) : 0,
        inundationStatus: status,
        infrastructureRisk: risk,
        evacuationStatus: evac,
        coords: `34°00.${Math.abs(Math.round(p.z * 10))}'N 71°58.${Math.abs(Math.round(p.x * 10))}'E`,
      });
      setHoverScreenPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else if (!isDraggingRef.current) {
      setFloodProbe(null);
    }

    // Camera Orbiting
    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraSphericalRef.current.theta -= deltaX * 0.005;
      cameraSphericalRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.05, cameraSphericalRef.current.phi - deltaY * 0.005)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraSphericalRef.current.radius = Math.max(
      25,
      Math.min(260, cameraSphericalRef.current.radius + e.deltaY * 0.1)
    );
    const mag = (260 / cameraSphericalRef.current.radius).toFixed(1);
    setZoomLevel(`${mag}x`);
  };

  const toggle2D3D = () => {
    setIs2DMode(!is2DMode);
    if (!is2DMode) {
      // Top down ortho perspective
      cameraSphericalRef.current.phi = 0.05;
      cameraSphericalRef.current.radius = 175;
    } else {
      // 3D Oblique perspective
      cameraSphericalRef.current.phi = Math.PI / 3.4;
      cameraSphericalRef.current.radius = 135;
    }
  };

  return (
    <div
      ref={mountRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden bg-[#1e293b]"
    >
      {/* Three.js Isolated Canvas Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Compass Rose */}
      <div className="absolute top-4 left-4 z-10 flex flex-col items-center pointer-events-none">
        <div className="w-10 h-10 rounded-full border border-cyan-500/30 bg-[#0f172a]/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Compass className="w-6 h-6 text-cyan-400" />
        </div>
      </div>

      {/* Ride-Along Active Banner */}
      {rideAlongActive && (
        <div className="absolute top-4 left-20 z-20 bg-[#0284c7] text-white px-3 py-1.5 rounded-md shadow-lg flex items-center space-x-2 text-xs font-semibold animate-pulse border border-cyan-300/40">
          <span>RESCUE CHASE CAMERA: {selectedDrone?.name || selectedResource?.name}</span>
          <button
            onClick={onExitRideAlong}
            className="bg-black/40 hover:bg-black/60 px-2 py-0.5 rounded text-[11px] ml-2"
          >
            Exit Cam
          </button>
        </div>
      )}

      {/* Basin Landmarks Overlay */}
      <div className="absolute top-[32%] right-[28%] pointer-events-none text-xs font-bold text-white flex items-center space-x-1 drop-shadow-md">
        <span className="text-cyan-400">▲</span>
        <span>Nowshera Bypass Bridge (GT Road)</span>
      </div>

      {/* Breach Site Floating Indicator */}
      <div className="absolute bottom-[46%] left-[36%] pointer-events-none bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg animate-bounce flex items-center space-x-1">
        <AlertTriangle className="w-3 h-3" />
        <span>Western Ring Bund Breach (2.8 m/s)</span>
      </div>

      {/* Interactive Flood Depth Probe Tooltip */}
      {floodProbe && hoverScreenPos && (
        <div
          style={{
            left: `${hoverScreenPos.x + 16}px`,
            top: `${hoverScreenPos.y - 45}px`,
          }}
          className="absolute z-30 pointer-events-none bg-[#0b1320]/95 text-white p-3 rounded-lg text-[11px] shadow-2xl border border-cyan-500/30 max-w-[280px] backdrop-blur-md"
        >
          <div className="font-bold text-cyan-400 flex items-center justify-between pb-1 border-b border-gray-700/60">
            <span>{floodProbe.inundationStatus}</span>
            <span className="font-mono text-white text-[10px]">{floodProbe.waterDepthM > 0 ? `${floodProbe.waterDepthM}m Depth` : 'Dry'}</span>
          </div>

          <div className="space-y-1 mt-1.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-gray-400">Ground Elevation</span>
              <span className="font-mono text-white font-semibold">{floodProbe.groundElevationM} m MSL</span>
            </div>
            {floodProbe.waterDepthM > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Flow Velocity</span>
                <span className="font-mono text-amber-400 font-semibold">{floodProbe.waterVelocityMs} m/s</span>
              </div>
            )}
            <div className="text-gray-300 text-[10px] pt-1">
              {floodProbe.infrastructureRisk}
            </div>
            <div className={`font-semibold pt-1 ${floodProbe.waterDepthM > 1.5 ? 'text-red-400' : 'text-emerald-400'}`}>
              {floodProbe.evacuationStatus}
            </div>
          </div>

          <div className="text-gray-400 text-[9px] font-mono mt-1.5 border-t border-gray-700/60 pt-1">
            {floodProbe.coords}
          </div>
        </div>
      )}

      {/* Viewport Floating Bottom-Right Controls */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center space-x-3 bg-[#0f172a]/90 border border-[#334155] px-2.5 py-1.5 rounded-lg shadow-xl text-xs font-medium text-white backdrop-blur-md">
        {/* Scale */}
        <div className="flex items-center space-x-1.5 pr-2 border-r border-[#334155] text-[10px] text-gray-400">
          <span>0</span>
          <div className="w-12 h-1 bg-cyan-500" />
          <span>500 m</span>
        </div>

        {/* 2D / 3D Mode */}
        <div className="flex bg-[#1e293b] rounded p-0.5 text-[11px]">
          <button
            onClick={toggle2D3D}
            className={`px-2 py-0.5 rounded font-bold transition ${
              is2DMode ? 'bg-[#0284c7] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            2D
          </button>
          <button
            onClick={toggle2D3D}
            className={`px-2 py-0.5 rounded font-bold transition ${
              !is2DMode ? 'bg-[#0284c7] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            3D
          </button>
        </div>

        {/* Zoom */}
        <div className="font-mono text-xs px-1 text-cyan-400 font-semibold">
          {zoomLevel}
        </div>

        {/* Reset Camera */}
        <button
          onClick={() => {
            cameraSphericalRef.current = { radius: 135, theta: Math.PI / 3.8, phi: Math.PI / 3.4 };
            cameraTargetRef.current.set(0, 10, -5);
          }}
          className="p-1 hover:bg-[#1e293b] rounded text-gray-400 hover:text-white transition"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              mountRef.current?.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }}
          className="p-1 hover:bg-[#1e293b] rounded text-gray-400 hover:text-white transition"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
