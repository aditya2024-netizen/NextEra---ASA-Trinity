import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Check, 
  X, 
  Building2, 
  Crosshair, 
  Search, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { INDIAN_CITIES_PRESETS } from '../data/seedData';

interface MapAddressPickerProps {
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
  initialDistance?: number;
  onSelectLocation: (location: {
    address: string;
    latitude: number;
    longitude: number;
    distanceKm: number;
  }) => void;
  onClose?: () => void;
  inline?: boolean;
}

// Reference Hospital coordinates (Central AIIMS Hub in New Delhi)
const HOSPITAL_BASE_LAT = 28.5672;
const HOSPITAL_BASE_LNG = 77.2100;

// Haversine distance formula in km
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Extended Indian Localities & Landmarks fallback dictionary for instant offline lookup
const EXTENDED_INDIAN_PLACES = [
  { name: 'Connaught Place, Central Delhi', city: 'New Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'AIIMS Ansari Nagar, New Delhi', city: 'New Delhi', lat: 28.5672, lng: 77.2100 },
  { name: 'Saket, South Delhi', city: 'New Delhi', lat: 28.5245, lng: 77.2066 },
  { name: 'Dwarka Sector 10, New Delhi', city: 'New Delhi', lat: 28.5823, lng: 77.0500 },
  { name: 'Rohini Sector 13, North West Delhi', city: 'New Delhi', lat: 28.7166, lng: 77.1166 },
  { name: 'Lajpat Nagar 4, South Delhi', city: 'New Delhi', lat: 28.5677, lng: 77.2433 },
  { name: 'Sector 62, Noida, Uttar Pradesh', city: 'Noida', lat: 28.6280, lng: 77.3649 },
  { name: 'Cyber City, DLF Phase 2, Gurugram, Haryana', city: 'Gurugram', lat: 28.4900, lng: 77.0880 },
  { name: 'Sector 14, Old Railway Road, Gurugram, Haryana', city: 'Gurugram', lat: 28.4715, lng: 77.0390 },
  { name: 'Indirapuram, Ghaziabad, Uttar Pradesh', city: 'Ghaziabad', lat: 28.6415, lng: 77.3714 },
  { name: 'Bandra West, Hill Road, Mumbai, Maharashtra', city: 'Mumbai', lat: 19.0596, lng: 72.8295 },
  { name: 'Andheri East, MIDC, Mumbai, Maharashtra', city: 'Mumbai', lat: 19.1136, lng: 72.8697 },
  { name: 'Powai, Hiranandani Gardens, Mumbai, Maharashtra', city: 'Mumbai', lat: 19.1176, lng: 72.9060 },
  { name: 'Thane West, Majiwada, Maharashtra', city: 'Thane', lat: 19.2183, lng: 72.9781 },
  { name: 'Jayanagar 4th Block, Bengaluru, Karnataka', city: 'Bengaluru', lat: 12.9299, lng: 77.5824 },
  { name: 'Indiranagar 100 Feet Rd, Bengaluru, Karnataka', city: 'Bengaluru', lat: 12.9719, lng: 77.6412 },
  { name: 'Whitefield, ITPL Main Rd, Bengaluru, Karnataka', city: 'Bengaluru', lat: 12.9698, lng: 77.7499 },
  { name: 'Electronic City Phase 1, Hosur Rd, Bengaluru', city: 'Bengaluru', lat: 12.8452, lng: 77.6602 },
  { name: 'Banjara Hills Road No 1, Hyderabad, Telangana', city: 'Hyderabad', lat: 17.4156, lng: 78.4357 },
  { name: 'Gachibowli, Financial District, Hyderabad, Telangana', city: 'Hyderabad', lat: 17.4401, lng: 78.3489 },
  { name: 'Hitec City, Madhapur, Hyderabad, Telangana', city: 'Hyderabad', lat: 17.4483, lng: 78.3748 },
  { name: 'Anna Nagar West, Chennai, Tamil Nadu', city: 'Chennai', lat: 13.0878, lng: 80.2088 },
  { name: 'T. Nagar, Usman Road, Chennai, Tamil Nadu', city: 'Chennai', lat: 13.0418, lng: 80.2341 },
  { name: 'Adyar, Gandhi Nagar, Chennai, Tamil Nadu', city: 'Chennai', lat: 13.0012, lng: 80.2565 },
  { name: 'Salt Lake Sector 5, Kolkata, West Bengal', city: 'Kolkata', lat: 22.5804, lng: 88.4378 },
  { name: 'Park Street, Kolkata, West Bengal', city: 'Kolkata', lat: 22.5535, lng: 88.3524 },
  { name: 'Kothrud, Paud Road, Pune, Maharashtra', city: 'Pune', lat: 18.5074, lng: 73.8077 },
  { name: 'Hinjawadi Phase 1, Pune, Maharashtra', city: 'Pune', lat: 18.5913, lng: 73.7389 },
  { name: 'Satellite Road, Ahmedabad, Gujarat', city: 'Ahmedabad', lat: 23.0300, lng: 72.5178 },
  { name: 'Hazratganj, MG Marg, Lucknow, Uttar Pradesh', city: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Gomti Nagar, Vibhuti Khand, Lucknow, Uttar Pradesh', city: 'Lucknow', lat: 26.8654, lng: 81.0028 },
  { name: 'Malviya Nagar, Calgiri Marg, Jaipur, Rajasthan', city: 'Jaipur', lat: 26.8530, lng: 75.8052 },
  { name: 'Vaishali Nagar, Amrapali Marg, Jaipur, Rajasthan', city: 'Jaipur', lat: 26.9038, lng: 75.7441 },
  { name: 'Sector 17 Plaza, Chandigarh, Punjab', city: 'Chandigarh', lat: 30.7415, lng: 76.7797 },
  { name: 'Marine Drive, Ernakulam, Kochi, Kerala', city: 'Kochi', lat: 9.9816, lng: 76.2767 },
  { name: 'Kakkanad, Infopark, Kochi, Kerala', city: 'Kochi', lat: 10.0159, lng: 76.3639 },
];

export const MapAddressPicker: React.FC<MapAddressPickerProps> = ({
  initialAddress = '',
  initialLat = 28.6139,
  initialLng = 77.2090,
  initialDistance = 15,
  onSelectLocation,
  onClose,
  inline = false,
}) => {
  const [lat, setLat] = useState<number>(initialLat || 28.6139);
  const [lng, setLng] = useState<number>(initialLng || 77.2090);
  const [addressText, setAddressText] = useState<string>(
    initialAddress || 'Connaught Place, New Delhi, Delhi 110001'
  );
  const [distanceKm, setDistanceKm] = useState<number>(initialDistance || 15);
  const [selectedCity, setSelectedCity] = useState<string>('New Delhi');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Address search bar state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Array<{
    display_name: string;
    lat: number;
    lng: number;
  }>>([]);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      try {
        const L = (await import('leaflet')).default;

        // Add Leaflet CSS if not already injected
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // Create Leaflet map instance centered on current coords
        const map = L.map(mapContainerRef.current).setView([lat, lng], 13);
        mapInstanceRef.current = map;

        // OpenStreetMap standard tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        // Custom Hospital Base Marker
        const hospitalIcon = L.divIcon({
          className: 'hospital-marker',
          html: `<div style="background-color: #EF4444; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2.5px solid white; font-weight: bold; font-size: 16px;">🏥</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        L.marker([HOSPITAL_BASE_LAT, HOSPITAL_BASE_LNG], { icon: hospitalIcon })
          .addTo(map)
          .bindPopup('<b>CareTrack Outpatient Hospital Center</b><br>AIIMS / Central Reference Hub');

        // Custom Patient Location Marker (Draggable)
        const patientIcon = L.divIcon({
          className: 'patient-marker',
          html: `<div style="background-color: #2563EB; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(37,99,235,0.45); border: 3px solid white; font-weight: bold; font-size: 18px;">📍</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        const marker = L.marker([lat, lng], {
          draggable: true,
          icon: patientIcon,
        }).addTo(map);
        markerRef.current = marker;

        // Handle Map Click
        map.on('click', (e: any) => {
          const newLat = Number(e.latlng.lat.toFixed(4));
          const newLng = Number(e.latlng.lng.toFixed(4));
          updatePosition(newLat, newLng);
        });

        // Handle Marker Drag
        marker.on('dragend', (e: any) => {
          const position = e.target.getLatLng();
          const newLat = Number(position.lat.toFixed(4));
          const newLng = Number(position.lng.toFixed(4));
          updatePosition(newLat, newLng);
        });

        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 250);
      } catch (err) {
        console.error('Error initializing map:', err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const updatePosition = (newLat: number, newLng: number, customAddress?: string) => {
    setLat(newLat);
    setLng(newLng);

    // Calculate real distance to hospital
    const dist = calculateHaversineKm(HOSPITAL_BASE_LAT, HOSPITAL_BASE_LNG, newLat, newLng);
    setDistanceKm(dist > 0 ? dist : 4);

    if (customAddress) {
      setAddressText(customAddress);
    } else {
      // Find nearest preset city / locality or approximate
      const matchLocality = EXTENDED_INDIAN_PLACES.find(
        p => Math.abs(p.lat - newLat) < 0.05 && Math.abs(p.lng - newLng) < 0.05
      );
      const matchCity = INDIAN_CITIES_PRESETS.find(
        c => Math.abs(c.lat - newLat) < 0.6 && Math.abs(c.lng - newLng) < 0.6
      );

      if (matchLocality) {
        setAddressText(matchLocality.name);
        setSelectedCity(matchLocality.city);
      } else if (matchCity) {
        setAddressText(`${matchCity.locality}, ${matchCity.city}, ${matchCity.state}`);
        setSelectedCity(matchCity.city);
      } else {
        setAddressText(`Sector ${Math.floor(newLat * 4) % 40 + 1}, Pinpoint Coords: ${newLat}°N, ${newLng}°E, India`);
      }
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
    }
  };

  // Perform geocoding when typing in the search/address bar
  const performGeocodeSearch = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setSearchFeedback(null);

    const cleanQuery = query.trim().toLowerCase();

    // 1. First check local comprehensive Indian database for instant zero-latency match
    const localMatches = EXTENDED_INDIAN_PLACES.filter(p => 
      p.name.toLowerCase().includes(cleanQuery) || 
      p.city.toLowerCase().includes(cleanQuery)
    ).map(p => ({
      display_name: p.name,
      lat: p.lat,
      lng: p.lng,
    }));

    const cityMatches = INDIAN_CITIES_PRESETS.filter(c =>
      c.city.toLowerCase().includes(cleanQuery) ||
      c.state.toLowerCase().includes(cleanQuery) ||
      c.locality.toLowerCase().includes(cleanQuery)
    ).map(c => ({
      display_name: `${c.locality}, ${c.city}, ${c.state}`,
      lat: c.lat,
      lng: c.lng,
    }));

    const combinedLocal = [...localMatches, ...cityMatches];

    try {
      // 2. Fetch live geocoding results from OpenStreetMap Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + ', India'
        )}&countrycodes=in&limit=6&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en-IN,en;q=0.9',
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const liveResults = data.map((item: any) => ({
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));

          setSearchResults(liveResults);
          setShowDropdown(true);
          setIsSearching(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Live geocoding network notice, using local offline lookup:', err);
    }

    // Fallback to local Indian matches if OSM fails or returns empty
    if (combinedLocal.length > 0) {
      setSearchResults(combinedLocal.slice(0, 6));
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setSearchFeedback(`No exact coordinates found for "${query}". You can click directly on the map.`);
    }

    setIsSearching(false);
  };

  // Handle typing in the Address Search Bar
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performGeocodeSearch(val);
      }, 350);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // Handle selecting a located address result
  const handleSelectSearchResult = (result: { display_name: string; lat: number; lng: number }) => {
    const roundedLat = Number(result.lat.toFixed(4));
    const roundedLng = Number(result.lng.toFixed(4));

    updatePosition(roundedLat, roundedLng, result.display_name);
    setSearchQuery(result.display_name);
    setShowDropdown(false);

    // Fly map smoothly to location
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([roundedLat, roundedLng], 14, { duration: 1.2 });
    }

    const dist = calculateHaversineKm(HOSPITAL_BASE_LAT, HOSPITAL_BASE_LNG, roundedLat, roundedLng);
    setSearchFeedback(`Located: ${result.display_name.split(',')[0]} (${dist} km from Hospital)`);
  };

  // Direct Enter Key or "Locate" Button Trigger
  const handleDirectLocate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if we have results ready
    if (searchResults.length > 0) {
      handleSelectSearchResult(searchResults[0]);
    } else {
      performGeocodeSearch(searchQuery).then(() => {
        if (searchResults.length > 0) {
          handleSelectSearchResult(searchResults[0]);
        }
      });
    }
  };

  const handleCitySelect = (cityPreset: typeof INDIAN_CITIES_PRESETS[0]) => {
    setSelectedCity(cityPreset.city);
    const fullAddr = `${cityPreset.locality}, ${cityPreset.city}, ${cityPreset.state}`;
    setAddressText(fullAddr);
    setSearchQuery(fullAddr);
    setLat(cityPreset.lat);
    setLng(cityPreset.lng);
    setDistanceKm(cityPreset.distance);
    setShowDropdown(false);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([cityPreset.lat, cityPreset.lng], 13, { duration: 1.2 });
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([cityPreset.lat, cityPreset.lng]);
    }
    setSearchFeedback(`Calibrated: ${cityPreset.city} Clinic Region (${cityPreset.distance} km from Hospital)`);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLat = Number(pos.coords.latitude.toFixed(4));
        const userLng = Number(pos.coords.longitude.toFixed(4));
        updatePosition(userLat, userLng);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([userLat, userLng], 14, { duration: 1 });
        }
        setSearchFeedback(`Located via Device GPS (${userLat}°N, ${userLng}°E)`);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation denied or unavailable', err);
      }
    );
  };

  const handleConfirm = () => {
    onSelectLocation({
      address: addressText,
      latitude: lat,
      longitude: lng,
      distanceKm,
    });
    if (onClose) onClose();
  };

  const content = (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Patient Geolocation & Address Locator
            </h3>
            <p className="text-xs text-slate-500">
              Type an address to automatically fly the map, calculate distance, and calibrate clinic outreach
            </p>
          </div>
        </div>
        {onClose && !inline && (
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* TOP ACTIVE ADDRESS SEARCH BAR (Locates place as user types) */}
      <div className="p-3 bg-blue-50/70 border-b border-blue-100 relative z-20">
        <form onSubmit={handleDirectLocate} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              placeholder="Type Indian address, street, locality or landmark (e.g. Saket New Delhi, Bandra Mumbai, Jayanagar Bengaluru)..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 shadow-xs font-medium"
            />
            <Search className="w-4 h-4 text-blue-600 absolute left-3 top-2.5 sm:top-3" />
            
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowDropdown(false);
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-xs flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-60"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>Locate Place</span>
              </>
            )}
          </button>
        </form>

        {/* Live Search Suggestions Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95">
            <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Matching Places in India:</span>
              <span className="text-[10px] text-blue-600">Click to Fly Map & Pin</span>
            </div>
            {searchResults.map((res, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSearchResult(res)}
                className="w-full px-3.5 py-2 text-left hover:bg-blue-50 text-xs text-slate-800 flex items-center gap-2.5 transition-colors group"
              >
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 group-hover:text-blue-700" />
                <span className="truncate flex-1 font-medium">{res.display_name}</span>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {res.lat.toFixed(2)}°N, {res.lng.toFixed(2)}°E
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Search Feedback pill */}
        {searchFeedback && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-800 bg-blue-100/80 px-2.5 py-1 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{searchFeedback}</span>
          </div>
        )}
      </div>

      {/* City Presets Bar */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-thin">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Building2 className="w-3.5 h-3.5 text-blue-600" /> Quick Hubs:
        </span>
        {INDIAN_CITIES_PRESETS.map((preset) => (
          <button
            key={preset.city}
            type="button"
            onClick={() => handleCitySelect(preset)}
            className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
              selectedCity === preset.city
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {preset.city} ({preset.distance} km)
          </button>
        ))}
      </div>

      {/* Map Display */}
      <div className="relative flex-1 min-h-[300px] w-full bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full min-h-[320px] z-0" />
        
        {/* Map Top-Right Action: Device GPS */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="bg-white px-3 py-1.5 rounded-lg shadow-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            title="Locate via device GPS"
          >
            <Crosshair className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Locating GPS...' : 'My Device GPS'}
          </button>
        </div>

        {/* Map Bottom Legend */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-lg shadow-md border border-slate-200 text-xs space-y-1 text-slate-700">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            <span>Hospital Base: AIIMS Central Clinic</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
            <span>Patient Marker: ({lat}, {lng})</span>
          </div>
        </div>
      </div>

      {/* Address Text & Distance Result Box */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Final Selected Patient Address / Locality
            </label>
            <div className="relative">
              <input
                type="text"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                placeholder="Enter street, locality, city, pincode"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 font-medium"
              />
              <MapPin className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Calculated Clinic Distance
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-slate-900"
                />
                <Navigation className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <span className="text-xs font-bold text-slate-700">km</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span>Target: {lat}° N, {lng}° E</span>
          </div>

          <div className="flex items-center gap-2">
            {onClose && !inline && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              Apply Address & Distance ({distanceKm} km)
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (inline) {
    return <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col">
        {content}
      </div>
    </div>
  );
};
