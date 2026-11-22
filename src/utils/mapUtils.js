// Bangalore Ward Coordinates & Mapping Utilities

export const BANGALORE_CENTER = {
  lat: 12.9716,
  lng: 77.5946,
  zoom: 12,
};

export const WARD_COORDINATES = {
  Indiranagar: { lat: 12.9784, lng: 77.6408, ward: "Indiranagar", label: "Indiranagar (Ward 152)" },
  Yelahanka: { lat: 13.1007, lng: 77.5963, ward: "Yelahanka", label: "Yelahanka (Ward 1)" },
  Hebbal: { lat: 13.0358, lng: 77.5970, ward: "Hebbal", label: "Hebbal (Ward 21)" },
  Malleshwaram: { lat: 13.0031, lng: 77.5643, ward: "Malleshwaram", label: "Malleshwaram (Ward 65)" },
  Rajajinagar: { lat: 12.9982, lng: 77.5530, ward: "Rajajinagar", label: "Rajajinagar (Ward 121)" },
  Jayanagar: { lat: 12.9308, lng: 77.5838, ward: "Jayanagar", label: "Jayanagar (Ward 150)" },
  Basavanagudi: { lat: 12.9422, lng: 77.5753, ward: "Basavanagudi", label: "Basavanagudi (Ward 154)" },
  "BTM Layout": { lat: 12.9166, lng: 77.6101, ward: "BTM Layout", label: "BTM Layout (Ward 178)" },
  Koramangala: { lat: 12.9352, lng: 77.6245, ward: "Koramangala", label: "Koramangala (Ward 151)" },
  "HSR Layout": { lat: 12.9121, lng: 77.6446, ward: "HSR Layout", label: "HSR Layout (Ward 142)" },
  Whitefield: { lat: 12.9698, lng: 77.7500, ward: "Whitefield", label: "Whitefield (Ward 84)" },
};

/**
 * Calculates distance between two coordinates in km
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the closest Bengaluru ward to a given coordinate
 */
export function findClosestWard(lat, lng) {
  let closestWard = "Indiranagar";
  let minDistance = Infinity;

  Object.entries(WARD_COORDINATES).forEach(([wardName, coords]) => {
    const dist = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestWard = wardName;
    }
  });

  return closestWard;
}

/**
 * Reverse geocodes coordinates to a human-readable street address
 */
export async function reverseGeocode(lat, lng) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          "Accept-Language": "en",
        },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const road = addr.road || addr.street || addr.pedestrian || addr.footway || addr.suburb || "";
        const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || addr.city_district || "";
        const city = addr.city || addr.town || "Bengaluru";

        const parts = [road, neighbourhood, city].filter(Boolean);
        if (parts.length > 0) {
          return {
            displayName: parts.join(", "),
            road: road,
            neighbourhood: neighbourhood,
            city: city,
            fullAddress: data.display_name,
            matchedWard: findClosestWard(lat, lng),
          };
        }
      }
    }
  } catch (err) {
    // Network or timeout error - fallback smoothly
  }

  // Fallback to closest ward & formatted coordinates
  const ward = findClosestWard(lat, lng);
  return {
    displayName: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (${ward})`,
    road: "",
    neighbourhood: ward,
    city: "Bengaluru",
    fullAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)} near ${ward}`,
    matchedWard: ward,
  };
}

/**
 * Search locations/landmarks using Nominatim with Bengaluru bias
 */
export async function searchLocation(query) {
  if (!query || query.trim().length < 2) return [];

  // Check known wards first for instant results
  const lowerQuery = query.toLowerCase().trim();
  const matchedWards = Object.entries(WARD_COORDINATES)
    .filter(([name]) => name.toLowerCase().includes(lowerQuery))
    .map(([name, coords]) => ({
      name: coords.label,
      lat: coords.lat,
      lng: coords.lng,
      ward: name,
    }));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query + " Bengaluru"
      )}&limit=5&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          "Accept-Language": "en",
        },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const nominatimResults = data.map((item) => ({
        name: item.display_name.split(",").slice(0, 3).join(","),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        ward: findClosestWard(parseFloat(item.lat), parseFloat(item.lon)),
      }));

      // Combine ward matches and Nominatim results without duplicates
      return [...matchedWards, ...nominatimResults].slice(0, 6);
    }
  } catch (err) {
    // Return ward matches if network search fails
  }

  return matchedWards;
}

/**
 * Generates custom SVG HTML for Leaflet DivIcon
 */
export function createCustomMarkerHtml(options = {}) {
  const { color = "#4f46e5", isPulsing = true, label = "" } = options;

  return `
    <div class="custom-map-pin" style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      ${
        isPulsing
          ? `<div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${color}40; animation: marker-pulse 2s infinite ease-out;"></div>`
          : ""
      }
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
        </svg>
      </div>
      ${
        label
          ? `<div style="position: absolute; top: -22px; background: rgba(15,23,42,0.85); color: #fff; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${label}</div>`
          : ""
      }
    </div>
  `;
}
