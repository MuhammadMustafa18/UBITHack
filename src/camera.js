import * as Cesium from 'cesium';

/**
 * Camera presets for notable disaster response locations in Pakistan.
 * Default: fly to Nowshera / Kabul & Swat River Confluence, KP.
 */
export const CAMERA_PRESETS = {
  pakistan: {
    destination: Cesium.Cartesian3.fromDegrees(71.985, 34.015, 7500),
    orientation: {
      heading: Cesium.Math.toRadians(350),
      pitch: Cesium.Math.toRadians(-28),
      roll: 0.0,
    },
  },
  nowshera: {
    destination: Cesium.Cartesian3.fromDegrees(71.985, 34.015, 6000),
    orientation: {
      heading: Cesium.Math.toRadians(340),
      pitch: Cesium.Math.toRadians(-30),
      roll: 0.0,
    },
  },
  sukkur: {
    destination: Cesium.Cartesian3.fromDegrees(68.857, 27.705, 12000),
    orientation: {
      heading: Cesium.Math.toRadians(15),
      pitch: Cesium.Math.toRadians(-40),
      roll: 0.0,
    },
  },
  taunsa: {
    destination: Cesium.Cartesian3.fromDegrees(70.848, 30.704, 15000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: 0.0,
    },
  },
  tarbela: {
    destination: Cesium.Cartesian3.fromDegrees(72.701, 34.143, 9000),
    orientation: {
      heading: Cesium.Math.toRadians(45),
      pitch: Cesium.Math.toRadians(-30),
      roll: 0.0,
    },
  },
  austin: {
    destination: Cesium.Cartesian3.fromDegrees(71.985, 34.015, 7500),
    orientation: {
      heading: Cesium.Math.toRadians(350),
      pitch: Cesium.Math.toRadians(-28),
      roll: 0.0,
    },
  },
};

/**
 * Fly the camera to a preset location with a smooth animation.
 */
export function flyToPreset(viewer, presetName, duration = 3.0) {
  const preset = CAMERA_PRESETS[presetName] || CAMERA_PRESETS.pakistan;
  if (!preset) return;

  viewer.camera.flyTo({
    destination: preset.destination,
    orientation: preset.orientation,
    duration,
    easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
  });
}

/**
 * Set camera to Pakistan on load with a cinematic fly-in.
 * @returns {Function} Cancels the pending or active startup flight.
 */
export function flyToPakistan(viewer) {
  // Start from national high altitude, then smoothly glide into Kabul & Indus Basin
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(69.345, 30.375, 750000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-85),
      roll: 0.0,
    },
  });

  const timer = setTimeout(() => {
    if (viewer.isDestroyed()) return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(71.985, 34.015, 8500),
      orientation: {
        heading: Cesium.Math.toRadians(350),
        pitch: Cesium.Math.toRadians(-30),
        roll: 0.0,
      },
      duration: 3.5,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    });
  }, 350);
  return () => {
    clearTimeout(timer);
    if (!viewer.isDestroyed()) viewer.camera.cancelFlight();
  };
}

export { flyToPakistan as flyToAustin };
