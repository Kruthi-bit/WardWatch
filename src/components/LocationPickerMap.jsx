import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import {
  MapPin,
  Crosshair,
  Search,
  RotateCcw,
  Sparkles,
  Loader2,
  Navigation,
  Check,
} from "lucide-react";
import {
  BANGALORE_CENTER,
  WARD_COORDINATES,
  findClosestWard,
  reverseGeocode,
  searchLocation,
  createCustomMarkerHtml,
} from "../utils/mapUtils";

function LocationPickerMap({
  selectedWard,
  onLocationSelect,
  initialLat,
  initialLng,
  initialAddress,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const [coords, setCoords] = useState(
    initialLat && initialLng
      ? { lat: initialLat, lng: initialLng }
      : { lat: 12.9784, lng: 77.6408 } // Indiranagar default
  );
  const [addressPreview, setAddressPreview] = useState(initialAddress || "");
  const [detectedWard, setDetectedWard] = useState(selectedWard || "Indiranagar");
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Helper to create custom Leaflet DivIcon
  const createPinIcon = (label = "Issue Location") => {
    return L.divIcon({
      className: "custom-leaflet-marker",
      html: createCustomMarkerHtml({
        color: "#4f46e5",
        isPulsing: true,
        label: label,
      }),
      iconSize: [32, 32],
      iconAnchor: [16, 28],
      popupAnchor: [0, -28],
    });
  };

  // Update marker position and reverse geocode
  const updateLocation = useCallback(
    async (lat, lng, fly = true, zoomLevel = null) => {
      setCoords({ lat, lng });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else if (mapInstanceRef.current) {
        const marker = L.marker([lat, lng], {
          draggable: true,
          icon: createPinIcon(),
        }).addTo(mapInstanceRef.current);

        marker.on("dragend", (e) => {
          const newPos = e.target.getLatLng();
          updateLocation(newPos.lat, newPos.lng, false);
        });

        markerRef.current = marker;
      }

      if (circleRef.current && mapInstanceRef.current) {
        circleRef.current.setLatLng([lat, lng]);
      }

      if (fly && mapInstanceRef.current) {
        const zoom = zoomLevel || Math.max(mapInstanceRef.current.getZoom(), 15);
        mapInstanceRef.current.flyTo([lat, lng], zoom, {
          animate: true,
          duration: 0.8,
        });
      }

      // Reverse geocode
      setIsGeocoding(true);
      const geoResult = await reverseGeocode(lat, lng);
      setIsGeocoding(false);

      if (geoResult) {
        setAddressPreview(geoResult.displayName);
        const wardMatch = geoResult.matchedWard || findClosestWard(lat, lng);
        setDetectedWard(wardMatch);

        if (onLocationSelect) {
          onLocationSelect({
            lat: lat,
            lng: lng,
            address: geoResult.displayName,
            fullAddress: geoResult.fullAddress,
            ward: wardMatch,
          });
        }
      }
    },
    [onLocationSelect]
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const initialCenter =
      initialLat && initialLng
        ? [initialLat, initialLng]
        : selectedWard && WARD_COORDINATES[selectedWard]
        ? [WARD_COORDINATES[selectedWard].lat, WARD_COORDINATES[selectedWard].lng]
        : [BANGALORE_CENTER.lat, BANGALORE_CENTER.lng];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Accuracy indicator circle
    const circle = L.circle(initialCenter, {
      radius: 40,
      color: "#6366f1",
      fillColor: "#818cf8",
      fillOpacity: 0.15,
      weight: 1.5,
    }).addTo(map);
    circleRef.current = circle;

    // Initial marker
    const marker = L.marker(initialCenter, {
      draggable: true,
      icon: createPinIcon(),
    }).addTo(map);

    marker.on("dragend", (e) => {
      const newPos = e.target.getLatLng();
      updateLocation(newPos.lat, newPos.lng, false);
    });
    markerRef.current = marker;

    // Click on map to place marker
    map.on("click", (e) => {
      updateLocation(e.latlng.lat, e.latlng.lng, false);
    });

    mapInstanceRef.current = map;

    // Trigger initial geocode
    updateLocation(initialCenter[0], initialCenter[1], false, 14);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync when selectedWard prop changes from parent dropdown
  useEffect(() => {
    if (!selectedWard || !WARD_COORDINATES[selectedWard] || !mapInstanceRef.current) return;

    const target = WARD_COORDINATES[selectedWard];
    // Only pan if currently significantly far from ward center
    const dist = Math.hypot(coords.lat - target.lat, coords.lng - target.lng);
    if (dist > 0.03) {
      updateLocation(target.lat, target.lng, true, 14);
    }
  }, [selectedWard]);

  // Handle GPS location detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        updateLocation(lat, lng, true, 16);
        setIsLocating(false);
      },
      (error) => {
        // Fallback to Indiranagar center if denied/error
        const fallback = WARD_COORDINATES["Indiranagar"];
        updateLocation(fallback.lat, fallback.lng, true, 15);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Search places / landmarks
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchDropdown(true);
    const results = await searchLocation(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectSearchResult = (result) => {
    updateLocation(result.lat, result.lng, true, 16);
    setSearchQuery(result.name);
    setShowSearchDropdown(false);
  };

  // Reset to Bangalore overview
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([BANGALORE_CENTER.lat, BANGALORE_CENTER.lng], 12);
    }
  };

  return (
    <div className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-sm">
      {/* Map Header & Search Bar */}
      <div className="border-b border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <MapPin size={15} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Pinpoint Location on Map
              </p>
              <p className="text-[11px] text-slate-500">
                Click anywhere or drag marker to set exact spot
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={isLocating}
              className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-50"
              title="Detect your current GPS location"
            >
              {isLocating ? (
                <Loader2 size={13} className="animate-spin text-indigo-600" />
              ) : (
                <Crosshair size={13} className="text-indigo-600" />
              )}
              <span>{isLocating ? "Locating..." : "My GPS"}</span>
            </button>

            <button
              type="button"
              onClick={handleResetView}
              className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-100"
              title="Reset to Bangalore view"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Search Landmark Bar */}
        <div className="relative mt-2.5">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length > 2) {
                    handleSearchSubmit();
                  } else {
                    setShowSearchDropdown(false);
                  }
                }}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
                placeholder="Search street, landmark, or ward (e.g. 100 Feet Rd, Indiranagar)..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {isSearching && (
                <Loader2
                  size={12}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-indigo-500"
                />
              )}
            </div>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              Search
            </button>
          </form>

          {/* Search Dropdown Results */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-indigo-50 transition border-b border-slate-100 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-indigo-600 shrink-0" />
                    <span className="font-medium text-slate-800">{item.name}</span>
                  </div>
                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                    {item.ward}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Map Container */}
      <div className="relative h-64 w-full bg-slate-100">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Floating Instruction / Ward Pill */}
        <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-900/85 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold text-white shadow-md">
            <Navigation size={11} className="text-indigo-400" />
            <span>Ward: {detectedWard}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-mono text-slate-700 shadow-md border border-slate-200">
            <span>{coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E</span>
          </div>
        </div>

        {/* Quick Ward Chips Bar at Bottom of Map */}
        <div className="absolute bottom-2 left-2 right-12 z-20 flex gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none">
          {["Indiranagar", "Koramangala", "HSR Layout", "Jayanagar", "BTM Layout", "Whitefield"].map(
            (wName) => (
              <button
                key={wName}
                type="button"
                onClick={() => {
                  const target = WARD_COORDINATES[wName];
                  if (target) {
                    updateLocation(target.lat, target.lng, true, 15);
                  }
                }}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm shadow-sm transition ${
                  detectedWard === wName
                    ? "bg-indigo-600 text-white font-bold"
                    : "bg-white/90 text-slate-700 hover:bg-white border border-slate-200/80"
                }`}
              >
                {wName}
              </button>
            )
          )}
        </div>
      </div>

      {/* Selected Location Details Strip */}
      <div className="flex flex-col gap-1.5 border-t border-slate-200 bg-indigo-50/50 p-3 sm:flex-row sm:items-center sm:justify-between text-xs">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 rounded bg-indigo-100 p-1 text-indigo-700">
            <Check size={12} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">
              {isGeocoding ? (
                <span className="text-indigo-600 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Fetching street address...
                </span>
              ) : (
                addressPreview || "Location selected on map"
              )}
            </p>
            <p className="text-[11px] text-slate-500">
              Auto-mapped to <strong className="text-slate-700">{detectedWard}</strong> ward
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-[11px] bg-indigo-100/70 px-2 py-1 rounded-md shrink-0">
          <Sparkles size={12} />
          <span>Coordinates attached</span>
        </div>
      </div>
    </div>
  );
}

export default LocationPickerMap;
