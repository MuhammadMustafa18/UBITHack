// GeoJSON FeatureCollection of 3D Building Extrusions (inspired by cartesiancs/map3d)
// Provides physical 3D building meshes with real heights (meters) along Pakistan flood basins

export const PAKISTAN_3D_BUILDINGS: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    // --- NOWSHERA BASIN 3D BUILDINGS ---
    // 1. Govt Degree College Nowshera (Evac Shelter & Rooftop Rescue site)
    {
      type: 'Feature',
      properties: {
        name: 'Govt Degree College Nowshera',
        height: 22,
        min_height: 0,
        type: 'education',
        critical: true,
        floors: 5,
        survivors: 142,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [71.9715, 34.0120],
            [71.9735, 34.0120],
            [71.9735, 34.0105],
            [71.9715, 34.0105],
            [71.9715, 34.0120],
          ],
        ],
      },
    },
    // 2. DHQ Hospital Nowshera (Critical Medical Infrastructure)
    {
      type: 'Feature',
      properties: {
        name: 'District Headquarter Hospital (DHQ)',
        height: 28,
        min_height: 0,
        type: 'hospital',
        critical: true,
        floors: 6,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [71.9790, 34.0185],
            [71.9815, 34.0185],
            [71.9815, 34.0168],
            [71.9790, 34.0168],
            [71.9790, 34.0185],
          ],
        ],
      },
    },
    // 3. WAPDA 132kV Grid Station
    {
      type: 'Feature',
      properties: {
        name: 'WAPDA 132kV Primary Grid Station',
        height: 14,
        min_height: 0,
        type: 'utility',
        critical: true,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [71.9870, 34.0155],
            [71.9895, 34.0155],
            [71.9895, 34.0140],
            [71.9870, 34.0140],
            [71.9870, 34.0155],
          ],
        ],
      },
    },
    // 4. Nowshera Cantonment Commercial Plaza
    {
      type: 'Feature',
      properties: {
        name: 'Cantt Commercial Plaza',
        height: 18,
        min_height: 0,
        type: 'commercial',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [71.9745, 34.0090],
            [71.9770, 34.0090],
            [71.9770, 34.0075],
            [71.9745, 34.0075],
            [71.9745, 34.0090],
          ],
        ],
      },
    },
    // 5. Residential Block A (Shobra City)
    {
      type: 'Feature',
      properties: {
        name: 'Shobra City Block A',
        height: 12,
        min_height: 0,
        type: 'residential',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [71.9685, 34.0080],
            [71.9710, 34.0080],
            [71.9710, 34.0065],
            [71.9685, 34.0065],
            [71.9685, 34.0080],
          ],
        ],
      },
    },
    // 6. Residential Block B (Near Riverbank)
    {
      type: 'Feature',
      properties: {
        name: 'Riverside Residential Block B',
        height: 10,
        min_height: 0,
        type: 'residential',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [71.9720, 34.0060],
            [71.9745, 34.0060],
            [71.9745, 34.0045],
            [71.9720, 34.0045],
            [71.9720, 34.0060],
          ],
        ],
      },
    },
    // 7. Mohalla Kalan Riverside Homes (High Submergence Risk)
    {
      type: 'Feature',
      properties: {
        name: 'Mohalla Kalan Cluster',
        height: 8,
        min_height: 0,
        type: 'residential',
        survivors: 38,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [71.9765, 34.0040],
            [71.9790, 34.0040],
            [71.9790, 34.0025],
            [71.9765, 34.0025],
            [71.9765, 34.0040],
          ],
        ],
      },
    },
    // 8. Rescue 1122 Central Station Nowshera
    {
      type: 'Feature',
      properties: {
        name: 'Rescue 1122 Central Emergency Station',
        height: 16,
        min_height: 0,
        type: 'emergency',
        critical: true,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [71.9820, 34.0110],
            [71.9840, 34.0110],
            [71.9840, 34.0095],
            [71.9820, 34.0095],
            [71.9820, 34.0110],
          ],
        ],
      },
    },

    // --- SUKKUR BARRAGE COMPLEX (SINDH) ---
    {
      type: 'Feature',
      properties: {
        name: 'Sukkur Barrage Control Tower Complex',
        height: 24,
        min_height: 0,
        type: 'infrastructure',
        critical: true,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [68.8525, 27.6985],
            [68.8555, 27.6985],
            [68.8555, 27.6965],
            [68.8525, 27.6965],
            [68.8525, 27.6985],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Sukkur Civil Hospital Complex',
        height: 22,
        min_height: 0,
        type: 'hospital',
        critical: true,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [68.8480, 27.7050],
            [68.8510, 27.7050],
            [68.8510, 27.7030],
            [68.8480, 27.7030],
            [68.8480, 27.7050],
          ],
        ],
      },
    },

    // --- TAUNSA BARRAGE (PUNJAB) ---
    {
      type: 'Feature',
      properties: {
        name: 'Taunsa Barrage Gate House & Irrigation HQ',
        height: 20,
        min_height: 0,
        type: 'infrastructure',
        critical: true,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [70.8480, 30.7075],
            [70.8510, 30.7075],
            [70.8510, 30.7055],
            [70.8480, 30.7055],
            [70.8480, 30.7075],
          ],
        ],
      },
    },
  ],
};
