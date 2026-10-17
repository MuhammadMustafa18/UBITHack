import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ViewMode, LayerState, DroneTelemetry, ResourceUnit, TerrainProbeData } from '../types';
import { Compass, Maximize2, RotateCcw } from 'lucide-react';

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
  const [zoomLevel, setZoomLevel] = useState('23.4x');
  const [hoverData, setHoverData] = useState<TerrainProbeData | null>(null);
  const [hoverScreenPos, setHoverScreenPos] = useState<{ x: number; y: number } | null>(null);

  // References to Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const firePerimeterMeshRef = useRef<THREE.Mesh | null>(null);
  const isochroneLinesRef = useRef<THREE.Group | null>(null);
  const droneObjectsRef = useRef<{ [id: string]: THREE.Group }>({});
  const resourceObjectsRef = useRef<{ [id: string]: THREE.Group }>({});
  const animationFrameRef = useRef<number | null>(null);

  // Camera animation state
  const cameraTargetRef = useRef(new THREE.Vector3(0, 15, -10));
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 140, theta: Math.PI / 4, phi: Math.PI / 3.2 });

  useEffect(() => {
    if (!canvasMountRef.current) return;
    const canvasContainer = canvasMountRef.current;
    const width = canvasContainer.clientWidth || 800;
    const height = canvasContainer.clientHeight || 600;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#d9d3c5'); // Natural California daylight haze
    scene.fog = new THREE.FogExp2('#d6cfbf', 0.0022);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2000);
    camera.position.set(70, 85, 110);
    camera.lookAt(0, 10, -10);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    canvasContainer.innerHTML = '';
    canvasContainer.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight('#fef7e8', 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#fff5dd', 2.2);
    sunLight.position.set(120, 160, 90);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Warm wildfire glow light
    const fireGlow = new THREE.PointLight('#ff4400', 3.0, 180);
    fireGlow.position.set(-15, 25, -20);
    scene.add(fireGlow);

    // 5. Build Procedural San Gabriel Mountain Canyon Terrain
    const terrainSize = 240;
    const segments = 160;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const vertexColors: number[] = [];

    // Realistic elevation calculation
    const getTerrainHeight = (x: number, z: number) => {
      // Main canyon ridge (San Gabriel Mountains profile)
      const ridge1 = Math.sin(x * 0.025 + 0.4) * Math.cos(z * 0.02) * 24;
      const ridge2 = Math.sin((x + z) * 0.04) * 12;
      const valley = Math.pow(Math.sin(x * 0.015 - z * 0.01), 2) * -18;
      const microDetail = Math.sin(x * 0.12) * Math.cos(z * 0.12) * 2.2;
      const peak = Math.exp(-((x - 30) ** 2 + (z + 40) ** 2) / 600) * 38; // Mesa Peak (1,892 m)
      return Math.max(0, ridge1 + ridge2 + valley + microDetail + peak + 10);
    };

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const vy = getTerrainHeight(vx, vz);
      posAttr.setY(i, vy);

      // Color based on slope and elevation (Chaparral ochre, conifer dark green, rocky cliffs)
      const normY = vy / 45;
      const isRoad = Math.abs(vz - (Math.sin(vx * 0.05) * 20 - 15)) < 1.8; // Winding canyon road

      if (isRoad) {
        // Canyon Road asphalt
        vertexColors.push(0.35, 0.35, 0.36);
      } else if (normY > 0.65) {
        // High rocky peaks
        vertexColors.push(0.72, 0.68, 0.60);
      } else if (normY > 0.35) {
        // Mixed Conifer forests on north-facing slopes
        if (vz > -10 && Math.sin(vx * 0.2) > 0.1) {
          vertexColors.push(0.28, 0.42, 0.26); // Dark pine
        } else {
          vertexColors.push(0.68, 0.61, 0.48); // Chaparral sand
        }
      } else {
        // Canyon valley floor
        vertexColors.push(0.62, 0.58, 0.47);
      }
    }

    terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: false,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = false;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 6. Conifer Tree Scatter (InstancedMesh for fast performance)
    const treeCount = 650;
    const treeGeo = new THREE.ConeGeometry(1.2, 4.2, 5);
    const treeMat = new THREE.MeshStandardMaterial({ color: '#273f27', roughness: 0.9 });
    const treeInstanced = new THREE.InstancedMesh(treeGeo, treeMat, treeCount);
    const dummy = new THREE.Object3D();

    let validTreeIdx = 0;
    for (let i = 0; i < treeCount; i++) {
      const rx = (Math.random() - 0.5) * 190;
      const rz = (Math.random() - 0.5) * 190;
      const isRoad = Math.abs(rz - (Math.sin(rx * 0.05) * 20 - 15)) < 3.5;
      const isFireCore = (rx + 10) ** 2 + (rz + 15) ** 2 < 450; // trees burned in core
      if (!isRoad && !isFireCore) {
        const ry = getTerrainHeight(rx, rz);
        if (ry > 10 && ry < 42) {
          dummy.position.set(rx, ry + 2, rz);
          const scale = 0.7 + Math.random() * 0.7;
          dummy.scale.set(scale, scale * (0.8 + Math.random() * 0.5), scale);
          dummy.rotation.y = Math.random() * Math.PI;
          dummy.updateMatrix();
          treeInstanced.setMatrixAt(validTreeIdx++, dummy.matrix);
        }
      }
    }
    treeInstanced.instanceMatrix.needsUpdate = true;
    treeInstanced.castShadow = true;
    scene.add(treeInstanced);

    // 7. Active Wildfire Front & Burn Scar Mesh (dNBR)
    const fireGeo = new THREE.RingGeometry(0.1, 38, 48, 16);
    fireGeo.rotateX(-Math.PI / 2);
    const fireMat = new THREE.MeshBasicMaterial({
      color: '#e54010',
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const firePerimeterMesh = new THREE.Mesh(fireGeo, fireMat);
    firePerimeterMesh.position.set(-15, 18, -15);
    scene.add(firePerimeterMesh);
    firePerimeterMeshRef.current = firePerimeterMesh;

    // 8. Isochrone Spread Lines Group (Modeled timeline boundaries)
    const isochroneGroup = new THREE.Group();
    const createIsochronePath = (radius: number, color: string, yOffset: number) => {
      const points: THREE.Vector3[] = [];
      const steps = 60;
      for (let s = 0; s <= steps; s++) {
        const theta = (s / steps) * Math.PI * 2;
        const px = -15 + Math.cos(theta) * radius * (1.1 + Math.sin(theta * 3) * 0.2);
        const pz = -15 + Math.sin(theta) * radius * (0.8 + Math.cos(theta * 2) * 0.15);
        const py = getTerrainHeight(px, pz) + yOffset;
        points.push(new THREE.Vector3(px, py + 0.3, pz));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color, linewidth: 3, transparent: true, opacity: 0.85 });
      return new THREE.Line(lineGeo, lineMat);
    };

    // Aug 14 18:00 line
    const iso1 = createIsochronePath(12, '#ea580c', 0.2);
    // Aug 15 00:00 line
    const iso2 = createIsochronePath(22, '#f59e0b', 0.2);
    // Aug 15 06:00 line
    const iso3 = createIsochronePath(34, '#fbbf24', 0.2);
    // Aug 15 12:00 line
    const iso4 = createIsochronePath(46, '#d97706', 0.2);

    isochroneGroup.add(iso1, iso2, iso3, iso4);
    scene.add(isochroneGroup);
    isochroneLinesRef.current = isochroneGroup;

    // 9. Ignition Point 3D Marker
    const igPoints = [new THREE.Vector3(-28, getTerrainHeight(-28, -8) + 0.5, -8)];
    const igGeo = new THREE.SphereGeometry(1.4, 16, 16);
    const igMat = new THREE.MeshBasicMaterial({ color: '#ff2200' });
    const igMesh = new THREE.Mesh(igGeo, igMat);
    igMesh.position.copy(igPoints[0]);
    scene.add(igMesh);

    // 10. Drone Objects & Billboards
    drones.forEach((drone) => {
      const droneGroup = new THREE.Group();

      // Drone Body (Stylized quadcopter)
      const bodyGeo = new THREE.BoxGeometry(2.0, 0.4, 2.0);
      const bodyMat = new THREE.MeshStandardMaterial({ color: '#18191c', metalness: 0.8, roughness: 0.2 });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      droneGroup.add(bodyMesh);

      // Rotors
      const rotorGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 8);
      const rotorMat = new THREE.MeshBasicMaterial({ color: '#00d4ff', transparent: true, opacity: 0.6 });
      const offsets = [
        [-1.2, 0.3, -1.2],
        [1.2, 0.3, -1.2],
        [-1.2, 0.3, 1.2],
        [1.2, 0.3, 1.2],
      ];
      offsets.forEach(([ox, oy, oz]) => {
        const rotor = new THREE.Mesh(rotorGeo, rotorMat);
        rotor.position.set(ox, oy, oz);
        droneGroup.add(rotor);
      });

      // Altitude lead-line to ground
      const groundY = getTerrainHeight(drone.position.lat, drone.position.lng);
      const leadPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -drone.altitude * 0.02, 0)];
      const leadGeo = new THREE.BufferGeometry().setFromPoints(leadPoints);
      const leadMat = new THREE.LineDashedMaterial({ color: drone.color, dashSize: 1, gapSize: 1 });
      const leadLine = new THREE.Line(leadGeo, leadMat);
      leadLine.computeLineDistances();
      droneGroup.add(leadLine);

      // Orbit Ring
      const orbitRingGeo = new THREE.RingGeometry(18, 18.4, 48);
      orbitRingGeo.rotateX(-Math.PI / 2);
      const orbitMat = new THREE.MeshBasicMaterial({ color: drone.color, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
      const orbitRing = new THREE.Mesh(orbitRingGeo, orbitMat);
      orbitRing.position.y = -drone.altitude * 0.02;
      droneGroup.add(orbitRing);

      // Initial placement
      const droneWorldX = (drone.position.lng + 117.86) * 1200;
      const droneWorldZ = (drone.position.lat - 34.22) * 1200;
      const terrainY = getTerrainHeight(droneWorldX, droneWorldZ);
      droneGroup.position.set(droneWorldX, terrainY + drone.altitude * 0.02, droneWorldZ);

      scene.add(droneGroup);
      droneObjectsRef.current[drone.id] = droneGroup;
    });

    // 11. Resource Units (Engines, Aircraft)
    resources.forEach((res) => {
      const resGroup = new THREE.Group();

      if (res.category === 'AIRCRAFT') {
        // Tanker plane model
        const planeFuselage = new THREE.CylinderGeometry(0.8, 1.2, 6, 8);
        planeFuselage.rotateX(Math.PI / 2);
        const planeMat = new THREE.MeshStandardMaterial({ color: '#f3f4f6', metalness: 0.5 });
        const fuselage = new THREE.Mesh(planeFuselage, planeMat);

        const wingGeo = new THREE.BoxGeometry(11, 0.2, 2.2);
        const wing = new THREE.Mesh(wingGeo, planeMat);
        resGroup.add(fuselage, wing);

        resGroup.position.set((res.position.lng + 117.86) * 1100, 65, (res.position.lat - 34.22) * 1100);
      } else {
        // Ground Fire Engine (Red box truck)
        const engineGeo = new THREE.BoxGeometry(2.4, 1.6, 4.2);
        const engineMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4 });
        const engineMesh = new THREE.Mesh(engineGeo, engineMat);
        resGroup.add(engineMesh);

        const wx = (res.position.lng + 117.86) * 900;
        const wz = (res.position.lat - 34.22) * 900;
        const gy = getTerrainHeight(wx, wz);
        resGroup.position.set(wx, gy + 1, wz);
      }

      scene.add(resGroup);
      resourceObjectsRef.current[res.id] = resGroup;
    });

    // 12. Animation Loop & Tick
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Animate fire glow pulsating
      if (fireGlow) {
        fireGlow.intensity = 2.5 + Math.sin(elapsedTime * 4) * 0.8;
      }

      // Animate active fire perimeter shader pulsing
      if (firePerimeterMeshRef.current) {
        const pulse = 1.0 + Math.sin(elapsedTime * 2.5) * 0.05;
        firePerimeterMeshRef.current.scale.set(pulse, pulse, pulse);
      }

      // Rotate drone props and animate flight
      drones.forEach((d) => {
        const obj = droneObjectsRef.current[d.id];
        if (obj) {
          // Orbit motion around incident
          const orbitSpeed = d.id === 'FT-06' ? 0.2 : 0.15;
          const orbitDist = 22 + parseInt(d.id.slice(-1)) * 4;
          const curAngle = elapsedTime * orbitSpeed + parseInt(d.id.slice(-1));
          const newX = -15 + Math.cos(curAngle) * orbitDist;
          const newZ = -15 + Math.sin(curAngle) * orbitDist;
          const baseHeight = getTerrainHeight(newX, newZ);
          obj.position.x = newX;
          obj.position.z = newZ;
          obj.position.y = baseHeight + d.altitude * 0.02;
          obj.rotation.y = -curAngle + Math.PI / 2;
        }
      });

      // Animate E-45 driving along winding canyon road
      const e45Obj = resourceObjectsRef.current['res-9'];
      if (e45Obj) {
        const roadT = (elapsedTime * 0.06) % 1;
        const rx = -50 + roadT * 100;
        const rz = Math.sin(rx * 0.05) * 20 - 15;
        const ry = getTerrainHeight(rx, rz);
        e45Obj.position.set(rx, ry + 1.2, rz);
        e45Obj.rotation.y = Math.cos(rx * 0.05);
      }

      // Handle Ride-Along Camera tracking
      if (rideAlongActive && selectedDrone && cameraRef.current) {
        const droneMesh = droneObjectsRef.current[selectedDrone.id];
        if (droneMesh) {
          const chaseCamOffset = new THREE.Vector3(0, 6, -18).applyQuaternion(droneMesh.quaternion);
          cameraRef.current.position.lerp(droneMesh.position.clone().add(chaseCamOffset), 0.08);
          cameraRef.current.lookAt(droneMesh.position);
        }
      } else if (rideAlongActive && selectedResource && cameraRef.current) {
        const resMesh = resourceObjectsRef.current[selectedResource.id];
        if (resMesh) {
          const chaseOffset = new THREE.Vector3(0, 10, -22);
          cameraRef.current.position.lerp(resMesh.position.clone().add(chaseOffset), 0.08);
          cameraRef.current.lookAt(resMesh.position);
        }
      } else if (cameraRef.current && !isDraggingRef.current) {
        // Orbit camera positioning
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

    // Resize Handler
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

  // Synchronize dynamic burn scar and isochrones with timelineProgress
  useEffect(() => {
    if (!firePerimeterMeshRef.current || !isochroneLinesRef.current) return;

    // Scale burn scar geometry dynamically with progress
    const fireScale = 0.2 + (timelineProgress / 100) * 1.35;
    firePerimeterMeshRef.current.scale.set(fireScale, fireScale, fireScale);

    // Isochrone lines visibility step
    const lines = isochroneLinesRef.current.children as THREE.Line[];
    lines.forEach((line, idx) => {
      const threshold = [15, 35, 55, 75][idx];
      line.visible = timelineProgress >= threshold;
    });
  }, [timelineProgress]);

  // Camera Orbit / Drag Events
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    if (rideAlongActive) {
      onExitRideAlong();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !terrainMeshRef.current) return;

    // Raycast for Terrain Probe
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
      const elev = Math.round(1100 + p.y * 18);
      const slope = Math.round(18 + Math.abs(Math.sin(p.x * 0.1)) * 14);
      const aspect = p.z > 0 ? 'WSW-facing' : 'ENE-facing';

      setHoverData({
        elevationM: elev,
        slopeDeg: slope,
        aspect,
        burnedTimeAgo: p.x < 0 ? 'Burned Aug 14 at 19:08 · 8 h 52 min ago' : 'Unburned chaparral',
        fuelType: elev > 1350 ? 'Mixed conifer, heavy' : 'Chaparral / scrub',
        coords: `34°18.${Math.abs(Math.round(p.z * 10))}'N 117°58.${Math.abs(Math.round(p.x * 10))}'W`,
      });
      setHoverScreenPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else if (!isDraggingRef.current) {
      setHoverData(null);
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
    const mag = (280 / cameraSphericalRef.current.radius).toFixed(1);
    setZoomLevel(`${mag}x`);
  };

  const toggle2D3D = () => {
    setIs2DMode(!is2DMode);
    if (!is2DMode) {
      // Top down ortho perspective
      cameraSphericalRef.current.phi = 0.05;
      cameraSphericalRef.current.radius = 180;
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
      className="relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden bg-[#d9d3c5]"
    >
      {/* Dedicated Three.js Canvas Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Compass Rose (Top Left) */}
      <div className="absolute top-4 left-4 z-10 flex flex-col items-center pointer-events-none">
        <div className="w-10 h-10 rounded-full border border-[#8f887b] bg-[#e8e3d8]/90 backdrop-blur-sm flex items-center justify-center shadow-md">
          <Compass className="w-6 h-6 text-[#45423b]" />
        </div>
      </div>

      {/* Ride-Along Banner when active */}
      {rideAlongActive && (
        <div className="absolute top-4 left-20 z-20 bg-[#ea580c] text-white px-3 py-1.5 rounded-md shadow-lg flex items-center space-x-2 text-xs font-semibold animate-pulse">
          <span>RIDE-ALONG CAMERA ACTIVE: {selectedDrone?.name || selectedResource?.name}</span>
          <button
            onClick={onExitRideAlong}
            className="bg-black/30 hover:bg-black/50 px-2 py-0.5 rounded text-[11px] ml-2"
          >
            Exit Chase Cam
          </button>
        </div>
      )}

      {/* Mountain Peak Label overlay */}
      <div className="absolute top-[38%] right-[32%] pointer-events-none text-xs font-semibold text-[#302c25] flex items-center space-x-1 drop-shadow">
        <span>▲ Mesa Peak</span>
        <span className="text-[10px] text-[#5c564b] font-normal">1,892 m</span>
      </div>

      {/* Canyon Road Vehicle Tag */}
      <div className="absolute bottom-[44%] left-[42%] pointer-events-none bg-[#b91c1c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
        E-45 Patrol
      </div>

      {/* Terrain Inspection Hover Tooltip (Probe) */}
      {hoverData && hoverScreenPos && (
        <div
          style={{
            left: `${hoverScreenPos.x + 16}px`,
            top: `${hoverScreenPos.y - 40}px`,
          }}
          className="absolute z-30 pointer-events-none bg-[#1d1f24]/92 text-white p-2.5 rounded-lg text-[11px] shadow-2xl border border-white/10 max-w-[260px] backdrop-blur-md"
        >
          <div className="font-semibold text-white flex items-center justify-between">
            <span>{hoverData.elevationM} m · {hoverData.slopeDeg}° slope</span>
            <span className="text-gray-400 text-[10px]">{hoverData.aspect}</span>
          </div>
          <div className="text-[#ea580c] font-medium mt-1">
            {hoverData.burnedTimeAgo}
          </div>
          <div className="text-gray-300 text-[10px] mt-0.5">
            {hoverData.fuelType}
          </div>
          <div className="text-gray-400 text-[10px] font-mono mt-1 border-t border-white/10 pt-1">
            {hoverData.coords}
          </div>
        </div>
      )}

      {/* Viewport Floating Bottom-Right HUD Bar */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center space-x-3 bg-[#e8e3d8]/90 border border-[#b8b0a1] px-2.5 py-1.5 rounded-lg shadow-md text-xs font-medium text-[#2d2e33]">
        {/* Scale indicator */}
        <div className="flex items-center space-x-1.5 pr-2 border-r border-[#cfc8ba] text-[10px] text-[#5c564b]">
          <span>0</span>
          <div className="w-12 h-1 bg-[#45423b]" />
          <span>250 m</span>
        </div>

        {/* 2D / 3D Switcher */}
        <div className="flex bg-[#d4cdbf] rounded p-0.5 text-[11px]">
          <button
            onClick={toggle2D3D}
            className={`px-2 py-0.5 rounded font-bold transition ${
              is2DMode ? 'bg-[#1e1f23] text-white' : 'text-[#565146] hover:text-[#1e1f23]'
            }`}
          >
            2D
          </button>
          <button
            onClick={toggle2D3D}
            className={`px-2 py-0.5 rounded font-bold transition ${
              !is2DMode ? 'bg-[#b91c1c] text-white' : 'text-[#565146] hover:text-[#1e1f23]'
            }`}
          >
            3D
          </button>
        </div>

        {/* Zoom Level Indicator */}
        <div className="font-mono text-xs px-1 text-[#433f37] font-semibold">
          {zoomLevel}
        </div>

        {/* Reset Camera View */}
        <button
          onClick={() => {
            cameraSphericalRef.current = { radius: 140, theta: Math.PI / 4, phi: Math.PI / 3.2 };
            cameraTargetRef.current.set(0, 15, -10);
          }}
          className="p-1 hover:bg-[#d4cdbf] rounded text-[#433f37] transition"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              mountRef.current?.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }}
          className="p-1 hover:bg-[#d4cdbf] rounded text-[#433f37] transition"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
