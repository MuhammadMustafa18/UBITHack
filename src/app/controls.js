import { catalogControlServices } from './catalog.js';
import { StyleManager } from '../ui/composition.js';
import { flyToAustin } from '../camera.js';
import { t } from '../i18n/index.js';
import { FloodSimulationEngine } from '../simulation/floodEngine.js';
import { SimulationBarUI } from '../simulation/simulationBar.js';
import { GoogleMapsUI } from '../ui/googleMapsUI.js';

/** Construct the existing controls and camera presentation. */
export function createApplicationControls({
  scene: { viewer, mapStackController, operations },
  loaderStatus,
  Controls = StyleManager,
  services,
  catalog,
  placeSearch,
  defer,
}) {
  // Initialize the style manager (post-processing, HUD, locations, share links)
  const styleManager = new Controls(viewer, {
    services: {
      ...services,
      ...operations.surface.controlServices,
      searchAndFlyTo: operations.searchAndFlyTo,
      fetchRegionalBrief: (...args) =>
        operations.requests.regional.getBrief(...args),
      ...catalogControlServices(catalog),
    },
    requestServices: operations.requests,
    mapStackController,
    placeSearch,
  });
  defer(() => styleManager.orbitController.stop());
  defer(() => styleManager.hud.destroy());
  defer(() => styleManager.dispose());

  // Initialize FloodTrace Pakistan Disaster Simulation Engine & UI
  const floodSimulationEngine = new FloodSimulationEngine(viewer);
  const simulationBarUI = new SimulationBarUI(floodSimulationEngine);

  // Initialize Google Maps Light Theme UI overlay
  const googleMapsUI = new GoogleMapsUI({
    viewer,
    navigation: styleManager._navigation,
    simulationBarUI,
    floodEngine: floodSimulationEngine,
    styleManager,
    catalog,
  });

  const simBtn = document.getElementById('sim-disaster-btn');
  if (simBtn) {
    simBtn.addEventListener('click', () => {
      simulationBarUI.toggle();
    });
  }
  defer(() => floodSimulationEngine.exit());

  // Weather & cockpit GPU passes stripped for lightweight, high-performance execution
  const weatherEffects = null;
  const cockpitCloudEffects = null;

  // If no share link state, do default fly-to Pakistan
  if (!styleManager.hasShareState) {
    loaderStatus.textContent = t('Navigating to Pakistan (Indus Basin)...');
    defer(flyToAustin(viewer));
  } else {
    loaderStatus.textContent = t('Restoring shared view...');
  }

  return {
    styleManager,
    weatherEffects,
    cockpitCloudEffects,
    floodSimulationEngine,
    simulationBarUI,
    googleMapsUI,
  };
}
