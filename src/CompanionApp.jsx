import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useGeolocation from './hooks/useGeolocation';
import useMapRouting from './hooks/useMapRouting';

// Inline SVG Icon Helper Components for Zero Dependencies
const RadioIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
  </svg>
);

const WifiIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const PlayIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const VolumeIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const VolumeXIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

// Waypoints for Chennai OMR-ECR route
const WAYPOINTS = [
  [12.9004, 80.2279], // Start OMR
  [12.8795, 80.2272], // OMR - ECR Link Rd corner
  [12.8790, 80.2443], // Link Rd - ECR corner
  [12.8504, 80.2505], // ECR Uthandi
  [12.8256, 80.2483], // AMET University
  [12.7915, 80.2492], // Kovalam Toll Gate
  [12.7845, 80.2450]  // Kovalam Bypass (End)
];

const interpolatePoints = (coords, pointsPerSegment = 100) => {
  const points = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const start = coords[i];
    const end = coords[i + 1];
    for (let j = 0; j < pointsPerSegment; j++) {
      const t = j / pointsPerSegment;
      const lat = start[0] + (end[0] - start[0]) * t;
      const lng = start[1] + (end[1] - start[1]) * t;
      points.push([lat, lng]);
    }
  }
  points.push(coords[coords.length - 1]);
  return points;
};

const ROUTE_COORDS = interpolatePoints(WAYPOINTS, 120);

const getCoordinatesAtIndex = (index) => {
  const idx1 = Math.floor(index);
  const idx2 = Math.min(ROUTE_COORDS.length - 1, idx1 + 1);
  const t = index - idx1;
  const p1 = ROUTE_COORDS[idx1];
  const p2 = ROUTE_COORDS[idx2];
  return [
    p1[0] + (p2[0] - p1[0]) * t,
    p1[1] + (p2[1] - p1[1]) * t
  ];
};

const getBearing = (p1, p2) => {
  const lat1 = (p1[0] * Math.PI) / 180;
  const lng1 = (p1[1] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const lng2 = (p2[1] * Math.PI) / 180;
  const dLng = lng2 - lng1;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
};

// Custom DivIcon for Leaflet Blue Arrow Marker
const createCustomMarker = (bearing) => {
  return L.divIcon({
    html: `<div style="transform: rotate(${bearing}deg); transition: transform 0.1s linear;" class="w-8 h-8 flex items-center justify-center pointer-events-none">
      <span class="w-8 h-8 rounded-full bg-blue-500/25 absolute -inset-0 animate-ping" style="animation-duration: 2s;"></span>
      <div class="w-4.5 h-4.5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg shadow-blue-500/50">
        <svg class="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
          <polygon points="12 2 22 22 12 17 2 22 12 2" />
        </svg>
      </div>
    </div>`,
    className: 'custom-gps-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

export default function CompanionApp() {
  // --- STATE ---
  const [leftAlert, setLeftAlert] = useState('SAFE'); // SAFE, AWARENESS, CRITICAL
  const [rightAlert, setRightAlert] = useState('SAFE'); // SAFE, AWARENESS, CRITICAL
  const [speed, setSpeed] = useState(48); // km/h
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isNetworkMode, setIsNetworkMode] = useState(false);
  
  // Local network settings
  const [piIP, setPiIP] = useState(() => localStorage.getItem('gt_pi_ip') || '192.168.1.100');
  const [piPort, setPiPort] = useState(() => localStorage.getItem('gt_pi_port') || '5000');
  const [espIP, setEspIP] = useState(() => localStorage.getItem('gt_esp_ip') || '192.168.1.105');
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED'); // CONNECTED, CONNECTING, DISCONNECTED
  const [logs, setLogs] = useState([]);
  
  // Map simulation state
  const [routeIndex, setRouteIndex] = useState(0);

  // Live GPS & Routing state
  const [isGpsMode, setIsGpsMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('gps') === 'true';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [destinationName, setDestinationName] = useState('');
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [geocodingError, setGeocodingError] = useState(null);
  const [mockRouteIndex, setMockRouteIndex] = useState(0);
  const [isRouteSimulationActive, setIsRouteSimulationActive] = useState(false);
  const [timeString, setTimeString] = useState('11:18');
  const [mapDistance, setMapDistance] = useState(6.2); // remaining km
  const [mapTime, setMapTime] = useState(12); // remaining minutes
  const [roadScrollY, setRoadScrollY] = useState(0);
  const [currentTurn, setCurrentTurn] = useState({
    type: 'STRAIGHT',
    street: 'Rajiv Gandhi Salai (OMR)',
    distance: 1200, // meters
    instruction: 'Proceed straight on OMR'
  });

  // Animated vehicle coordinates (0 to 120 for 3D perspective scroll)
  const [leftVehicle, setLeftVehicle] = useState({ y: 0, scale: 0, opacity: 0 });
  const [rightVehicle, setRightVehicle] = useState({ y: 0, scale: 0, opacity: 0 });

  // Demo Simulation states
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoTime, setDemoTime] = useState(0); // in milliseconds
  const [activePresetIndex, setActivePresetIndex] = useState(-1);
  const [isDriverMode, setIsDriverMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('driver') === 'true';
  });

  const scrollIntervalRef = useRef(null);
  const networkPollRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Leaflet refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);

  // Modular Geolocation Hook
  const { position: livePosition, error: gpsError, permissionDenied: gpsPermissionDenied } = useGeolocation();

  // Modular OSRM Routing Hook
  const routingResult = useMapRouting(
    isGpsMode ? mapInstance : null,
    isGpsMode ? livePosition : null,
    isGpsMode ? destinationCoords : null
  );

  // Computed active GPS position (moves along OSRM route if simulation is active)
  const activeGpsPosition = (() => {
    if (isGpsMode) {
      if (isRouteSimulationActive && routingResult.routeData) {
        const coords = routingResult.routeData.coordinates;
        if (coords && coords.length > 0) {
          const point = coords[Math.min(coords.length - 1, Math.floor(mockRouteIndex))];
          return [point.lat, point.lng];
        }
      }
      return livePosition;
    }
    return null;
  })();

  // Address search using Nominatim
  const searchDestination = async (query) => {
    if (!query) return;
    setGeocodingLoading(true);
    setGeocodingError(null);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        if (results.length > 0) {
          const { lat, lon, display_name } = results[0];
          const coords = [parseFloat(lat), parseFloat(lon)];
          setDestinationCoords(coords);
          setDestinationName(display_name);
          addLog(`Geocoded: "${display_name.split(',')[0]}" at [${lat.slice(0, 7)}, ${lon.slice(0, 7)}]`, 'success');
        } else {
          setGeocodingError("Address not found.");
          addLog(`Address search returned no results: "${query}"`, 'error');
        }
      } else {
        setGeocodingError("Geocoding service unavailable.");
      }
    } catch (err) {
      setGeocodingError(err.message || "Network error resolving address.");
      addLog(`Geocoding error: ${err.message}`, 'error');
    } finally {
      setGeocodingLoading(false);
    }
  };

  // --- DYNAMIC LAYOUT CALCULATION ---
  const leftState = leftAlert;
  const rightState = rightAlert;
  const isBothCritical = leftState === 'CRITICAL' && rightState === 'CRITICAL';
  
  let mapsHeightClass = 'h-[74%]';
  let camerasLayoutClass = 'flex flex-row gap-3.5 h-[26%] p-3.5';
  let leftCameraSize = 'w-1/2 h-full';
  let rightCameraSize = 'w-1/2 h-full';

  if (isBothCritical) {
    mapsHeightClass = 'h-[16%]';
    camerasLayoutClass = 'flex flex-col gap-3 h-[84%] p-3.5';
    leftCameraSize = 'w-full h-1/2';
    rightCameraSize = 'w-full h-1/2';
  } else if (leftState === 'CRITICAL') {
    mapsHeightClass = 'h-[35%]';
    camerasLayoutClass = 'flex flex-col gap-3 h-[65%] p-3.5';
    leftCameraSize = 'w-full h-[76%]';
    rightCameraSize = 'w-full h-[24%]';
  } else if (rightState === 'CRITICAL') {
    mapsHeightClass = 'h-[35%]';
    camerasLayoutClass = 'flex flex-col gap-3 h-[65%] p-3.5';
    leftCameraSize = 'w-full h-[24%]';
    rightCameraSize = 'w-full h-[76%]';
  } else if (leftState === 'AWARENESS' && rightState === 'SAFE') {
    mapsHeightClass = 'h-[58%]';
    camerasLayoutClass = 'flex flex-col gap-3 h-[42%] p-3.5';
    leftCameraSize = 'w-full h-[66%]';
    rightCameraSize = 'w-full h-[34%]';
  } else if (rightState === 'AWARENESS' && leftState === 'SAFE') {
    mapsHeightClass = 'h-[58%]';
    camerasLayoutClass = 'flex flex-col gap-3 h-[42%] p-3.5';
    leftCameraSize = 'w-full h-[34%]';
    rightCameraSize = 'w-full h-[66%]';
  } else if (leftState === 'AWARENESS' && rightState === 'AWARENESS') {
    mapsHeightClass = 'h-[50%]';
    camerasLayoutClass = 'flex flex-col gap-3 h-[50%] p-3.5';
    leftCameraSize = 'w-full h-1/2';
    rightCameraSize = 'w-full h-1/2';
  }

  // Sync connection status ref to prevent unnecessary effect restarts
  const connectionStatusRef = useRef(connectionStatus);
  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  // Sync routeIndex ref to prevent unnecessary map recreation
  const routeIndexRef = useRef(0);
  useEffect(() => {
    routeIndexRef.current = routeIndex;
  }, [routeIndex]);

  // --- MOCK LOG HELPER ---
  const addLog = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ time, message, type }, ...prev.slice(0, 49)]);
  };

  const getArrivalTime = useCallback((durationMinutes) => {
    if (!durationMinutes) return '';
    const now = new Date();
    now.setMinutes(now.getMinutes() + durationMinutes);
    
    // Format to e.g. "12:04 AM" or "11:18 AM"
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Live clock status bar notch updater
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000); // tick every second for precision
    return () => clearInterval(interval);
  }, []);

  // Save network details
  const saveNetworkConfig = () => {
    localStorage.setItem('gt_pi_ip', piIP);
    localStorage.setItem('gt_pi_port', piPort);
    localStorage.setItem('gt_esp_ip', espIP);
    addLog(`Network configuration saved: Pi=${piIP}:${piPort}, ESP32=${espIP}`, 'success');
  };

  // --- AUDIO ALERTS ---
  const playBeep = useCallback((freq, duration) => {
    if (!isAudioEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext blocked or not supported
    }
  }, [isAudioEnabled]);

  useEffect(() => {
    if (!isAudioEnabled) return;
    
    let audioInterval;

    if (leftAlert === 'CRITICAL' || rightAlert === 'CRITICAL') {
      // Rapid high-pitch double beep for CRITICAL
      audioInterval = setInterval(() => {
        playBeep(880, 0.15);
        setTimeout(() => playBeep(880, 0.15), 180);
      }, 700);
    } else if (leftAlert === 'AWARENESS' || rightAlert === 'AWARENESS') {
      // Slow medium-pitch beep for AWARENESS
      audioInterval = setInterval(() => {
        playBeep(520, 0.2);
      }, 1500);
    }

    return () => {
      if (audioInterval) clearInterval(audioInterval);
    };
  }, [leftAlert, rightAlert, isAudioEnabled, playBeep]);

  // --- DRIVING ANIMATION TIMERS & SCENARIO ENGINE ---
  useEffect(() => {
    const tickRate = 30; // ms
    scrollIntervalRef.current = setInterval(() => {
      // 1. UPDATE SPEED-BASED GEOGRAPHICAL PROGRESS
      if (speed > 0) {
        const pixelDelta = (speed * 0.12);
        setRoadScrollY((prev) => (prev + pixelDelta) % 400);
        
        if (!isGpsMode) {
          // Progress along coords array
          const indexDelta = speed * 0.008;
          setRouteIndex((prev) => {
            const nextIdx = prev + indexDelta;
            if (nextIdx >= ROUTE_COORDS.length - 1) {
              addLog("Destination reached: Kovalam Bypass", "success");
              return 0; // reset to beginning
            }
            return nextIdx;
          });
        } else if (isRouteSimulationActive && routingResult.routeData) {
          // Progress along OSRM route coordinates
          const coords = routingResult.routeData.coordinates;
          if (coords && coords.length > 0) {
            const indexDelta = speed * 0.005;
            setMockRouteIndex((prev) => {
              const nextIdx = prev + indexDelta;
              if (nextIdx >= coords.length - 1) {
                addLog("Destination reached successfully!", "success");
                setIsRouteSimulationActive(false);
                return 0;
              }
              return nextIdx;
            });
          }
        }
      }

      // 2. RUN DEMO DRIVING TIMELINE
      if (isDemoActive) {
        setDemoTime((prevTime) => {
          const nextTime = prevTime + tickRate;
          const seconds = nextTime / 1000;
          
          if (seconds < 6) {
            setLeftAlert('SAFE');
            setRightAlert('SAFE');
            setSpeed(65);
          } else if (seconds < 12) {
            setLeftAlert('AWARENESS');
            setRightAlert('SAFE');
            setSpeed(45);
          } else if (seconds < 17) {
            setLeftAlert('SAFE');
            setRightAlert('SAFE');
            setSpeed(60);
          } else if (seconds < 24) {
            setLeftAlert('CRITICAL');
            setRightAlert('SAFE');
            setSpeed(38);
          } else if (seconds < 29) {
            setLeftAlert('SAFE');
            setRightAlert('SAFE');
            setSpeed(58);
          } else if (seconds < 35) {
            setLeftAlert('SAFE');
            setRightAlert('CRITICAL');
            setSpeed(22);
          } else if (seconds < 42) {
            setLeftAlert('CRITICAL');
            setRightAlert('CRITICAL');
            setSpeed(12);
          } else if (seconds < 48) {
            setLeftAlert('SAFE');
            setRightAlert('SAFE');
            setSpeed(50);
          } else {
            setIsDemoActive(false);
            addLog("Demo drive simulation completed successfully.", "success");
            return 0;
          }
          return nextTime;
        });
      }
    }, tickRate);

    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [speed, isDemoActive, isGpsMode, isRouteSimulationActive, routingResult.routeData]);

  // --- LEAFLET MAP INITIALIZATION ---
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet map instance
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
      keyboard: false
    }).setView(getCoordinatesAtIndex(routeIndexRef.current), 16);

    // Load CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd'
    }).addTo(map);

    // Draw active blue polyline route
    L.polyline(ROUTE_COORDS, {
      color: '#2563eb',
      weight: 6,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Draw RED traffic segment (Link Road junction to ECR Akkarai - indices 140 to 260)
    L.polyline(ROUTE_COORDS.slice(140, 260), {
      color: '#ef4444',
      weight: 6.5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Draw YELLOW traffic segment (ECR South section - indices 400 to 520)
    L.polyline(ROUTE_COORDS.slice(400, 520), {
      color: '#fbbf24',
      weight: 6.5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Draw DESTINATION pin marker
    const destCoords = ROUTE_COORDS[ROUTE_COORDS.length - 1];
    const destIcon = L.divIcon({
      html: `<div class="w-6 h-6 flex items-center justify-center text-rose-500">
        <svg class="w-6 h-6 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      </div>`,
      className: 'dest-gps-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 24]
    });
    L.marker(destCoords, { icon: destIcon }).addTo(map);

    // Create current vehicle location marker
    const currentCoords = getCoordinatesAtIndex(routeIndexRef.current);
    const vehicleMarker = L.marker(currentCoords, { 
      icon: createCustomMarker(0) 
    }).addTo(map);

    mapRef.current = map;
    setMapInstance(map);
    markerRef.current = vehicleMarker;

    addLog("Real Leaflet map initialized with CartoDB Dark Matter tiles.", "success");

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapInstance(null);
        markerRef.current = null;
      }
    };
  }, [isDriverMode]);

  // --- LEAFLET MARKER & CAMERA UPDATE EFFECT ---
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const map = mapRef.current;
    const marker = markerRef.current;

    if (isGpsMode) {
      if (!activeGpsPosition) return;
      marker.setLatLng(activeGpsPosition);
      
      // Calculate rotation bearing during mock drive simulation
      let bearing = 0;
      if (isRouteSimulationActive && routingResult.routeData) {
        const coords = routingResult.routeData.coordinates;
        if (coords && coords.length > 0) {
          const currentIdx = Math.min(coords.length - 1, Math.floor(mockRouteIndex));
          const nextIdx = Math.min(coords.length - 1, currentIdx + 1);
          if (currentIdx !== nextIdx) {
            const currentPt = coords[currentIdx];
            const nextPt = coords[nextIdx];
            bearing = getBearing([currentPt.lat, currentPt.lng], [nextPt.lat, nextPt.lng]);
          }
        }
      }

      marker.setIcon(createCustomMarker(bearing));
      map.setView(activeGpsPosition, map.getZoom(), { animate: true });
    } else {
      // Get current geocoordinates
      const coords = getCoordinatesAtIndex(routeIndex);

      // Get next coordinates to calculate bearing
      const nextIdx = Math.min(ROUTE_COORDS.length - 1, routeIndex + 1);
      const nextCoords = getCoordinatesAtIndex(nextIdx);

      const bearing = getBearing(coords, nextCoords);

      // Update marker position and rotation
      marker.setLatLng(coords);
      marker.setIcon(createCustomMarker(bearing));

      // Lock camera view (pan map center to match truck)
      map.setView(coords, map.getZoom(), { animate: false });
    }
  }, [routeIndex, activeGpsPosition, isGpsMode, isRouteSimulationActive, mockRouteIndex, routingResult.routeData]);

  // --- INVALIDATE MAP SIZE ON HEIGHT CLASS TRANSITIONS ---
  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 500); // 500ms matches Tailwind's duration-500 transitions
      return () => clearTimeout(timer);
    }
  }, [mapsHeightClass]);

  // --- GEOGRAPHICAL ROUTE PROGRESS DISPATCHER (ETA, Guidance) ---
  useEffect(() => {
    if (isGpsMode) return; // Bypass if in Live GPS/Routing mode

    const maxIdx = ROUTE_COORDS.length - 1;
    const progress = routeIndex / maxIdx;

    // Calculate remaining distance in km
    const totalDist = 6.2; // km
    const remainingDist = parseFloat((totalDist * (1 - progress)).toFixed(2));
    setMapDistance(remainingDist);

    // Calculate remaining time
    setMapTime(() => {
      if (remainingDist <= 0.05) return 1;
      return Math.max(1, Math.round(remainingDist * 1.5));
    });

    // Update guidance cues
    if (progress < 0.22) {
      setCurrentTurn({
        type: 'STRAIGHT',
        street: 'Rajiv Gandhi Salai (OMR)',
        distance: Math.round((1.2 * (1 - progress / 0.22)) * 1000)
      });
    } else if (progress < 0.25) {
      setCurrentTurn({
        type: 'LEFT',
        street: 'ECR Link Road',
        distance: Math.round((0.15 * (1 - (progress - 0.22) / 0.03)) * 1000)
      });
    } else if (progress < 0.38) {
      setCurrentTurn({
        type: 'STRAIGHT',
        street: 'ECR Link Road',
        distance: Math.round((0.8 * (1 - (progress - 0.25) / 0.13)) * 1000)
      });
    } else if (progress < 0.42) {
      setCurrentTurn({
        type: 'RIGHT',
        street: 'East Coast Road (ECR)',
        distance: Math.round((0.15 * (1 - (progress - 0.38) / 0.04)) * 1000)
      });
    } else if (progress < 0.65) {
      setCurrentTurn({
        type: 'STRAIGHT',
        street: 'East Coast Road (ECR)',
        distance: Math.round((2.0 * (1 - (progress - 0.42) / 0.23)) * 1000)
      });
    } else if (progress < 0.85) {
      setCurrentTurn({
        type: 'STRAIGHT',
        street: 'Kovalam Toll Plaza',
        distance: Math.round((1.8 * (1 - (progress - 0.65) / 0.20)) * 1000)
      });
    } else {
      setCurrentTurn({
        type: 'ARRIVE',
        street: 'Kovalam Bypass',
        distance: Math.round((0.8 * (1 - (progress - 0.85) / 0.15)) * 1000)
      });
    }
  }, [routeIndex, isGpsMode]);

  // --- LIVE GPS ROUTE DISPATCHER EFFECT ---
  useEffect(() => {
    if (!isGpsMode) return;

    const routeData = routingResult.routeData;
    if (!routeData) {
      setMapDistance(0);
      setMapTime(0);
      setCurrentTurn({
        type: 'STRAIGHT',
        street: destinationName ? destinationName.split(',')[0] : 'Destination',
        distance: 0,
        instruction: 'Proceed to route'
      });
      return;
    }

    const coords = routeData.coordinates;
    const instructionsList = routeData.instructions || [];

    if (isRouteSimulationActive && coords && coords.length > 0) {
      const currentIdx = Math.min(coords.length - 1, Math.floor(mockRouteIndex));
      const totalDist = routingResult.distance || 0;
      const progress = currentIdx / (coords.length - 1);
      const remainingDist = parseFloat((totalDist * (1 - progress)).toFixed(2));
      setMapDistance(remainingDist);

      setMapTime(() => {
        if (remainingDist <= 0.05) return 1;
        return Math.max(1, Math.round(remainingDist * 1.5));
      });

      const nextTurnInst = instructionsList.find(inst => inst.index > currentIdx);
      if (nextTurnInst) {
        const text = nextTurnInst.text.toLowerCase();
        let turnType = 'STRAIGHT';
        if (text.includes('left')) turnType = 'LEFT';
        else if (text.includes('right')) turnType = 'RIGHT';
        else if (text.includes('arrive') || text.includes('destination')) turnType = 'ARRIVE';

        const currentPt = coords[currentIdx];
        const turnPt = coords[nextTurnInst.index];
        const dLat = (turnPt.lat - currentPt.lat) * 111320;
        const dLon = (turnPt.lng - currentPt.lng) * 40075000 * Math.cos((currentPt.lat * Math.PI) / 180) / 360;
        const distMeters = Math.round(Math.sqrt(dLat * dLat + dLon * dLon));

        setCurrentTurn({
          type: turnType,
          street: nextTurnInst.text,
          distance: distMeters,
          instruction: nextTurnInst.text
        });
      } else {
        setCurrentTurn({
          type: 'ARRIVE',
          street: destinationName ? destinationName.split(',')[0] : 'Destination',
          distance: 0,
          instruction: 'You have arrived!'
        });
      }
    } else {
      setMapDistance(routingResult.distance !== null ? routingResult.distance : 0);
      setMapTime(routingResult.eta !== null ? routingResult.eta : 0);

      if (instructionsList.length > 0) {
        const activeStep = instructionsList[0];
        const text = activeStep.text.toLowerCase();
        let turnType = 'STRAIGHT';
        if (text.includes('left')) turnType = 'LEFT';
        else if (text.includes('right')) turnType = 'RIGHT';
        else if (text.includes('arrive') || text.includes('destination')) turnType = 'ARRIVE';

        setCurrentTurn({
          type: turnType,
          street: activeStep.text,
          distance: activeStep.distance,
          instruction: activeStep.text
        });
      } else {
        setCurrentTurn({
          type: 'STRAIGHT',
          street: destinationName ? destinationName.split(',')[0] : 'Destination',
          distance: 0,
          instruction: 'Proceed to route'
        });
      }
    }
  }, [
    routingResult.distance,
    routingResult.eta,
    routingResult.instructions,
    routingResult.routeData,
    isGpsMode,
    isRouteSimulationActive,
    mockRouteIndex,
    destinationName
  ]);

  // --- VEHICLE ANIMATION TICK ---
  useEffect(() => {
    const animationInterval = setInterval(() => {
      // Left Vehicle
      setLeftVehicle((prev) => {
        let newY = prev.y;
        let opacity = prev.opacity;
        
        if (leftAlert === 'SAFE') {
          if (newY > 0) {
            newY += 4; // accelerate past
            if (newY > 120) {
              newY = 0;
              opacity = 0;
            }
          } else {
            opacity = 0;
          }
        } else if (leftAlert === 'AWARENESS') {
          opacity = 1;
          if (newY < 40) newY += 2;
          else if (newY > 40) newY -= 1;
        } else if (leftAlert === 'CRITICAL') {
          opacity = 1;
          if (newY < 80) newY += 3;
          else if (newY > 80) newY -= 0.5;
        }
        
        return { y: newY, scale: 0.2 + 0.8 * (newY / 100), opacity };
      });

      // Right Vehicle
      setRightVehicle((prev) => {
        let newY = prev.y;
        let opacity = prev.opacity;
        
        if (rightAlert === 'SAFE') {
          if (newY > 0) {
            newY += 4; // accelerate past
            if (newY > 120) {
              newY = 0;
              opacity = 0;
            }
          } else {
            opacity = 0;
          }
        } else if (rightAlert === 'AWARENESS') {
          opacity = 1;
          if (newY < 40) newY += 2;
          else if (newY > 40) newY -= 1;
        } else if (rightAlert === 'CRITICAL') {
          opacity = 1;
          if (newY < 80) newY += 3;
          else if (newY > 80) newY -= 0.5;
        }
        
        return { y: newY, scale: 0.2 + 0.8 * (newY / 100), opacity };
      });
    }, 30);

    return () => clearInterval(animationInterval);
  }, [leftAlert, rightAlert]);

  // --- NETWORK HARDWARE INTEGRATION (POLLING) ---
  useEffect(() => {
    if (!isNetworkMode) {
      if (networkPollRef.current) clearInterval(networkPollRef.current);
      setConnectionStatus('DISCONNECTED');
      return;
    }

    addLog(`Attempting local connection to ESP32: http://${espIP}/api/alerts`, 'info');
    setConnectionStatus('CONNECTING');

    let consecutiveFailures = 0;

    networkPollRef.current = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 200); // quick timeout

        const response = await fetch(`http://${espIP}/api/alerts`, { 
          signal: controller.signal,
          mode: 'cors' 
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setLeftAlert(data.left || 'SAFE');
          setRightAlert(data.right || 'SAFE');
          if (data.speed !== undefined) setSpeed(data.speed);
          
          if (connectionStatusRef.current !== 'CONNECTED') {
            setConnectionStatus('CONNECTED');
            addLog('Successfully synced with ESP32 fusion board!', 'success');
          }
          consecutiveFailures = 0;
        } else {
          throw new Error('Non-200 response');
        }
      } catch {
        consecutiveFailures++;
        if (consecutiveFailures >= 5) {
          setConnectionStatus('DISCONNECTED');
          if (consecutiveFailures === 5) {
            addLog('ESP32 connection lost. Activating local simulator fallback.', 'error');
          }
        }
      }
    }, 200);

    return () => {
      if (networkPollRef.current) clearInterval(networkPollRef.current);
    };
  }, [isNetworkMode, espIP]);

  const triggerPreset = (scenario, idx) => {
    setIsDemoActive(false);
    setDemoTime(0);
    setActivePresetIndex(idx);
    addLog(`Triggered Scenario Preset: ${scenario.name}`, 'warning');
    setLeftAlert(scenario.left);
    setRightAlert(scenario.right);
    setSpeed(scenario.speed);
  };

  const presets = [
    { name: 'Clear Highway (Safe)', left: 'SAFE', right: 'SAFE', speed: 65 },
    { name: 'Auto-Rickshaw Left (Aware)', left: 'AWARENESS', right: 'SAFE', speed: 42 },
    { name: 'Motorbike Cut-in Left (Critical)', left: 'CRITICAL', right: 'SAFE', speed: 35 },
    { name: 'Pedestrian Crossing Right (Critical)', left: 'SAFE', right: 'CRITICAL', speed: 20 },
    { name: 'Dual Danger! (Both Critical)', left: 'CRITICAL', right: 'CRITICAL', speed: 15 }
  ];


  const renderSimulatedCamera = (side, alertState) => {
    const isLeft = side === 'left';
    const isCritical = alertState === 'CRITICAL';
    const isAware = alertState === 'AWARENESS';
    
    const label = isLeft ? 'LEFT BLIND-SPOT CAMERA' : 'RIGHT BLIND-SPOT CAMERA';
    const vPos = isLeft ? leftVehicle : rightVehicle;
    const yPos = vPos.y;
    
    // Perspective math coordinates (viewBox 200 x 120)
    // Vanishing Point at x=100, y=30
    let vx = 100;
    let vy = 30 + (120 - 30) * (yPos / 100);
    let vw = 14 + 32 * (yPos / 100);
    let vh = 14 + 32 * (yPos / 100);

    if (isLeft) {
      // Left lane center ends at x=45 at the bottom
      vx = 100 - 55 * (yPos / 100);
    } else {
      // Right lane center ends at x=155 at the bottom
      vx = 100 + 55 * (yPos / 100);
    }

    let vehicleName = 'None';
    let confidence = '';

    if (alertState === 'CRITICAL') {
      if (isLeft) {
        const isCyclist = isDemoActive && (demoTime / 1000 >= 35 && demoTime / 1000 < 42);
        vehicleName = isCyclist ? 'Cyclist' : 'Motorcyclist';
      } else {
        vehicleName = 'Pedestrian';
      }
      confidence = '97.2%';
    } else if (alertState === 'AWARENESS') {
      vehicleName = isLeft ? 'Auto-Rickshaw' : 'Tractor';
      confidence = '91.8%';
    } else if (alertState === 'SAFE' && yPos > 85) {
      vehicleName = isLeft ? 'Auto-Rickshaw' : 'Tractor';
      confidence = 'Passed';
    }

    return (
      <div className={`relative h-full bg-[#07080a] rounded-xl border-2 transition-all duration-500 overflow-hidden flex flex-col justify-end ${
        isCritical 
          ? 'border-red-500 bg-red-950/15 shadow-[inset_0_0_20px_rgba(239,68,68,0.2),0_0_15px_rgba(239,68,68,0.25)]' 
          : isAware 
            ? 'border-amber-500 bg-amber-950/10 shadow-[inset_0_0_15px_rgba(245,158,11,0.15)]' 
            : 'border-neutral-800 opacity-60'
      }`}>
        
        {/* Animated Perspective Camera Viewport */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="none">
            {/* Dark asphalt road background */}
            <polygon points="100,30 -60,120 260,120" fill="#14161b" />
            
            {/* Lane dividers / road edges */}
            <line x1="100" y1="30" x2="-60" y2="120" stroke="#2a2f3a" strokeWidth="1.5" />
            <line x1="100" y1="30" x2="260" y2="120" stroke="#2a2f3a" strokeWidth="1.5" />
            
            {/* Center dashed line scrolling */}
            <line 
              x1="100" y1="30" 
              x2="100" y2="120" 
              stroke="#eab308" 
              strokeWidth="1.2" 
              strokeDasharray="4,8" 
              strokeDashoffset={-roadScrollY * 0.15} 
            />

            {/* Simulated Side Guard Rails */}
            <line 
              x1="100" y1="30" x2={isLeft ? "-80" : "280"} y2="120" 
              stroke="#1e293b" strokeWidth="3" strokeDasharray="3,15"
              strokeDashoffset={isLeft ? -roadScrollY * 0.25 : roadScrollY * 0.25}
            />

            {/* Render Vehicle Vector Object when active */}
            {vPos.opacity > 0 && (
              <g transform={`translate(${vx - vw/2}, ${vy - vh})`} opacity={vPos.opacity}>
                {/* 1. Vehicle Shape */}
                {vehicleName === 'Auto-Rickshaw' && (
                  <g transform={`scale(${vw / 24})`}>
                    <path d="M 4,16 L 4,10 L 8,4 L 16,4 L 20,10 L 20,16 Z" fill="#fbbf24" stroke="#000" strokeWidth="0.8" />
                    <rect x="7" y="5" width="10" height="5" fill="#0f172a" />
                    <circle cx="12" cy="11.5" r="1.5" fill="#fef08a" />
                    <circle cx="6" cy="17.5" r="2.2" fill="#020617" />
                    <circle cx="18" cy="17.5" r="2.2" fill="#020617" />
                    <rect x="5" y="11" width="14" height="2" fill="#334155" />
                  </g>
                )}
                {vehicleName === 'Motorcyclist' && (
                  <g transform={`scale(${vw / 24})`}>
                    <circle cx="6" cy="17.5" r="2.8" fill="#1e293b" stroke="#f87171" strokeWidth="0.8" />
                    <circle cx="18" cy="17.5" r="2.8" fill="#1e293b" stroke="#f87171" strokeWidth="0.8" />
                    <path d="M 6,17.5 L 12,12 L 18,17.5 Z" stroke="#ef4444" strokeWidth="1.6" fill="none" />
                    <circle cx="11.5" cy="6" r="2.2" fill="#ef4444" />
                    <path d="M 11.5,8.2 L 9.5,12.5 L 13.5,12.5 Z" fill="#ef4444" />
                  </g>
                )}
                {vehicleName === 'Tractor' && (
                  <g transform={`scale(${vw / 24})`}>
                    <rect x="10" y="4" width="10" height="9" fill="#22c55e" stroke="#000" strokeWidth="0.6" />
                    <rect x="3" y="7" width="7" height="6" fill="#16a34a" stroke="#000" strokeWidth="0.6" />
                    <circle cx="6.5" cy="16.5" r="2.8" fill="#0f172a" />
                    <circle cx="16" cy="15.5" r="4.2" fill="#0f172a" />
                    <rect x="13" y="1" width="1.5" height="4" fill="#64748b" />
                  </g>
                )}
                {vehicleName === 'Pedestrian' && (
                  <g transform={`scale(${vw / 24})`}>
                    <circle cx="12" cy="4" r="2.2" fill="#f87171" />
                    <path d="M 12,6.2 L 12,13" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 12,12.5 L 8.5,19.5" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M 12,12.5 L 15.5,19.5" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M 12,8 L 7.5,11" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 12,8 L 16.5,10.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                  </g>
                )}
                {vehicleName === 'Cyclist' && (
                  <g transform={`scale(${vw / 24})`}>
                    <circle cx="6" cy="17.5" r="2.2" fill="#0f172a" stroke="#34d399" strokeWidth="0.8" />
                    <circle cx="18" cy="17.5" r="2.2" fill="#0f172a" stroke="#34d399" strokeWidth="0.8" />
                    <path d="M 6,17.5 L 12,17.5 L 15,11.5 L 9,11.5 Z" stroke="#10b981" strokeWidth="1.2" fill="none" />
                    <circle cx="12.5" cy="5" r="1.8" fill="#10b981" />
                    <path d="M 12.5,6.8 L 9.5,11.5 L 11.5,17.5" stroke="#10b981" strokeWidth="1.5" fill="none" />
                  </g>
                )}
                {/* Default Box Fallback */}
                {vehicleName === 'None' && (
                  <rect x="2" y="2" width="20" height="20" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
                )}

                {/* 2. Intelligent Bounding Box Overlay */}
                <rect 
                  x={-2} y={-2} 
                  width={vw + 4} height={vh + 4} 
                  fill="none" 
                  stroke={isCritical ? '#f87171' : isAware ? '#fbbf24' : '#34d399'} 
                  strokeWidth="0.8" 
                  strokeDasharray={isCritical ? 'none' : '1.5,1.5'}
                  className={isCritical ? 'animate-pulse' : ''}
                />
                
                {/* Corner Ticks */}
                <path d="M -2,4 L -2,-2 L 4,-2" fill="none" stroke={isCritical ? '#ef4444' : isAware ? '#fbbf24' : '#10b981'} strokeWidth="1.2" />
                <path d={`M ${vw + 2 - 4}, -2 L ${vw + 2}, -2 L ${vw + 2}, 4`} fill="none" stroke={isCritical ? '#ef4444' : isAware ? '#fbbf24' : '#10b981'} strokeWidth="1.2" />
                <path d={`M -2, ${vh + 2 - 4} L -2, ${vh + 2} L 4, ${vh + 2}`} fill="none" stroke={isCritical ? '#ef4444' : isAware ? '#fbbf24' : '#10b981'} strokeWidth="1.2" />
                <path d={`M ${vw + 2 - 4}, ${vh + 2} L ${vw + 2}, ${vh + 2} L ${vw + 2}, ${vh + 2 - 4}`} fill="none" stroke={isCritical ? '#ef4444' : isAware ? '#fbbf24' : '#10b981'} strokeWidth="1.2" />

                {/* Label Tag */}
                <g transform="translate(-2, -7.5)">
                  <rect x="0" y="0" width={vw + 4} height="6.5" fill={isCritical ? '#ef4444' : isAware ? '#f59e0b' : '#10b981'} rx="0.5" />
                  <text 
                    x={(vw + 4) / 2} y="4.8" 
                    fill="#000000" 
                    fontSize="4.2" 
                    fontWeight="900" 
                    fontFamily="var(--font-mono)" 
                    textAnchor="middle"
                  >
                    {`GT_${side === 'left' ? 'LH' : 'RH'}: ${vehicleName.toUpperCase()} ${confidence ? `// ${confidence}` : ''}`}
                  </text>
                </g>
              </g>
            )}
          </svg>
        </div>

        {isNetworkMode && connectionStatus === 'CONNECTED' ? (
          <img 
            src={`http://${piIP}:${piPort}/video_feed_${side}`} 
            alt={label} 
            className="absolute inset-0 w-full h-full object-cover z-5"
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/35 z-10 pointer-events-none"></div>

        {/* Diagnostic Metadata Overlay */}
        <div className="absolute top-2 left-2.5 z-15 flex flex-col pointer-events-none font-mono text-left">
          <span className={`text-[7.5px] font-black tracking-wider ${
            isCritical ? 'text-red-400' : isAware ? 'text-amber-400' : 'text-neutral-400'
          }`}>
            {label}
          </span>
          <span className="text-[6.5px] text-neutral-600">OV5647 // TELE_WIDE // RAW CSI</span>
        </div>

        <div className="absolute top-2 right-2.5 z-15 font-mono text-[6.5px] text-neutral-600 pointer-events-none">
          {isCritical ? '30 FPS // LOW_LATENCY' : '10 FPS // ECO_STANDBY'}
        </div>

        <div className="p-2 w-full z-15 flex items-center justify-between border-t border-[#1a1d24]/60 font-mono text-[8.5px] bg-neutral-900/80 backdrop-blur-xs select-none">
          <span className="text-neutral-500">STATE:</span>
          <span className={`font-black flex items-center gap-1.5 ${
            isCritical ? 'text-red-400 animate-pulse' : isAware ? 'text-amber-400' : 'text-[#34d399]'
          }`}>
            <span className={`w-1 h-1 rounded-full ${
              isCritical ? 'bg-red-400 animate-ping' : isAware ? 'bg-amber-400 animate-pulse' : 'bg-[#34d399]'
            }`} />
            {alertState}
          </span>
        </div>
      </div>
    );
  };

  const renderPhoneInterface = () => {
    const leftState = leftAlert;
    const rightState = rightAlert;
    const isAnyCritical = leftState === 'CRITICAL' || rightState === 'CRITICAL';
    const isBothCritical = leftState === 'CRITICAL' && rightState === 'CRITICAL';

    return (
      <div className="w-full h-full bg-black flex flex-col relative select-none">
        
        {/* Phone Top Notch / Status Bar */}
        <div className="h-[36px] bg-neutral-950 flex items-center justify-between px-6 z-40 text-neutral-400 font-mono text-[10px]">
          <span>{timeString}</span>
          
          <div className="w-20 h-4.5 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1.5 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 absolute right-3"></span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-black tracking-tighter">5G</span>
            <WifiIcon className="w-3.5 h-3.5" />
            <div className="w-5.5 h-3 border border-neutral-600 rounded-sm p-[1px] flex items-center gap-[1px]">
              <div className="h-full w-[85%] bg-neutral-300 rounded-xs"></div>
            </div>
          </div>
        </div>

        {/* 1. GOOGLE MAPS NAVIGATION MODULE */}
        <div className={`relative w-full transition-all duration-500 overflow-hidden ${mapsHeightClass} border-b border-neutral-950 bg-[#111318]`}>
          
          {/* Real Leaflet Map Container */}
          <div ref={mapContainerRef} className="absolute inset-0 z-0" />

          {/* Map Controls (Right Sidebar Overlay) - Hidden when both critical */}
          {!isBothCritical && (
            <div className="absolute right-3 top-22 z-20 flex flex-col gap-2.5">
              <button className="w-8 h-8 rounded-full bg-neutral-900/90 border border-neutral-800 flex items-center justify-center shadow-md text-red-500 transform rotate-45 cursor-pointer pointer-events-auto">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <polygon points="12 2 19 21 12 17 5 21 12 2" />
                </svg>
              </button>
              {/* GPS Mode Toggle Button */}
              <button 
                onClick={() => {
                  const nextGpsMode = !isGpsMode;
                  setIsGpsMode(nextGpsMode);
                  if (nextGpsMode) {
                    setIsDemoActive(false);
                    setLeftAlert('SAFE');
                    setRightAlert('SAFE');
                    addLog("Live GPS mode activated from driver overlay.", "success");
                  } else {
                    addLog("Pre-recorded drive simulation activated.", "info");
                  }
                }}
                className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer pointer-events-auto ${
                  isGpsMode 
                    ? 'bg-blue-950/90 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/20' 
                    : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title={isGpsMode ? "Switch to Simulator" : "Switch to Live GPS"}
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25M12 3v3m0 12v3m-9-9h3m12 0h3" />
                </svg>
              </button>
              {isDriverMode && (
                <button 
                  onClick={() => {
                    setIsDriverMode(false);
                    const url = new URL(window.location);
                    url.searchParams.set('driver', 'false');
                    window.history.pushState({}, '', url);
                    addLog("Returned to Simulator Mode.", "info");
                  }}
                  className="w-8 h-8 rounded-full bg-neutral-900/90 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white shadow-md active:scale-95 transition-all cursor-pointer pointer-events-auto"
                  title="Configure settings"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Conditional Layout Overlays based on state severity */}
          {isBothCritical ? (
            /* Slim strip for both critical */
            <div className="absolute inset-0 bg-red-950/90 z-25 flex items-center justify-between px-5 font-mono border-b-2 border-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.3)] select-none">
              <div className="flex items-center gap-2.5 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-[10px] font-black tracking-widest text-red-100">DUAL BLIND-SPOT HAZARDS</span>
              </div>
              <div className="text-[9.5px] text-white font-bold bg-black/50 px-2 py-0.5 rounded border border-red-500/40">
                AUTO-DECEL: {speed} KM/H
              </div>
            </div>
          ) : isAnyCritical ? (
            /* Slim Top Guidance banner for any single critical state */
            <>
              <div className="absolute top-0 left-0 right-0 bg-[#070a0e]/95 backdrop-blur-sm border-b border-neutral-800 p-2 z-20 flex items-center justify-between font-sans text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#198754] flex items-center justify-center text-white text-[9px] font-bold">
                    {currentTurn.type === 'LEFT' ? '←' : currentTurn.type === 'RIGHT' ? '→' : currentTurn.type === 'STRAIGHT' ? '↑' : '🏁'}
                  </div>
                  <span className="text-neutral-200 font-extrabold text-[10px]">In {currentTurn.distance}m • {currentTurn.street}</span>
                </div>
                <div className="font-mono text-[9px] font-extrabold bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-400">
                  {speed} KM/H
                </div>
              </div>
              {/* Compact speed limit indicator overlay */}
              <div className="absolute bottom-3 left-3 z-20 w-6.5 h-6.5 rounded-full bg-white border-2 border-red-600 flex items-center justify-center font-mono font-black text-[9px] text-black shadow-md">
                80
              </div>
            </>
          ) : (
            /* Full, prominent overlays during safe/awareness driving */
            <>
              {/* Google Maps guidance header */}
              {(!isGpsMode || routingResult.routeData) && (
                <div className="absolute top-3 left-3 right-3 z-20 transition-all duration-300">
                  <div className="bg-[#0b271b]/95 backdrop-blur-md border border-[#198754]/40 p-3 rounded-xl flex items-center gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
                    <div className="w-9 h-9 rounded-lg bg-[#198754] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                      {currentTurn.type === 'LEFT' ? (
                        <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                      ) : currentTurn.type === 'RIGHT' ? (
                        <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                        </svg>
                      ) : currentTurn.type === 'STRAIGHT' ? (
                        <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                        </svg>
                      ) : (
                        <svg className="w-5.5 h-5.5 text-rose-500 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-grow font-sans">
                      <div className="text-[9.5px] text-[#25c375] font-black uppercase tracking-wider">
                        {currentTurn.type === 'ARRIVE' ? 'Destination' : `In ${currentTurn.distance} meters`}
                      </div>
                      <div className="text-xs font-black truncate text-white leading-tight">{currentTurn.street}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Real GPS Search Bar Overlay in Driver View */}
              {isGpsMode && !routingResult.routeData && (
                <div className="absolute top-3 left-3 right-3 z-30 transition-all duration-300">
                  <div className="bg-[#0e1014]/90 backdrop-blur-md border border-neutral-800 p-2 rounded-xl flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                    <input
                      type="text"
                      placeholder="Search destination (e.g. Gachibowli)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchDestination(searchQuery)}
                      className="flex-grow bg-[#050608] border border-neutral-800 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-neutral-605"
                    />
                    <button
                      onClick={() => searchDestination(searchQuery)}
                      disabled={geocodingLoading}
                      className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center min-w-[28px]"
                    >
                      {geocodingLoading ? (
                        <span className="block w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Google Maps ETA floating bottom panel */}
              <div className="absolute bottom-3 left-3 right-3 z-20 transition-all duration-300">
                <div className="bg-[#0e1014]/90 backdrop-blur-md border border-neutral-800/80 p-2.5 rounded-xl flex items-center justify-between shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-2">
                    <div className="bg-neutral-950 px-2 py-1 rounded border border-neutral-800 flex flex-col items-center justify-center font-mono min-w-[42px]">
                      <span className="text-[12px] font-black text-white leading-none">{speed}</span>
                      <span className="text-[6px] text-neutral-400 tracking-wider mt-0.5">KM/H</span>
                    </div>
                    {/* Speed limit sign */}
                    <div className="w-6.5 h-6.5 rounded-full bg-white border-[1.8px] border-red-600 flex items-center justify-center font-mono font-black text-[9px] text-black shadow-xs">
                      80
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 font-sans">
                    <div className="text-right leading-none">
                      <span className="text-xs font-extrabold text-[#25c375]">{mapTime} min</span>
                      <span className="block text-[7.5px] text-neutral-450 mt-0.5">{mapDistance} km • {getArrivalTime(mapTime)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (isGpsMode) {
                        setDestinationCoords(null);
                        setDestinationName('');
                        setIsRouteSimulationActive(false);
                        setMockRouteIndex(0);
                        addLog("Route navigation cleared.", "info");
                      } else {
                        addLog("Route navigation paused.", "warning");
                      }
                    }}
                    className="w-6.5 h-6.5 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-xs active:scale-90 transition-all cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}

        </div>

        {/* 2. LIVE CAMERA VIEWS CONTAINER */}
        <div className={`transition-all duration-500 bg-neutral-950 ${camerasLayoutClass}`}>
          <div className={`${leftCameraSize} transition-all duration-500`}>
            {renderSimulatedCamera('left', leftAlert)}
          </div>
          <div className={`${rightCameraSize} transition-all duration-500`}>
            {renderSimulatedCamera('right', rightAlert)}
          </div>
        </div>

        {/* Phone bottom home indicator line */}
        <div className="h-[20px] bg-neutral-950 flex items-center justify-center z-40 select-none pb-1">
          <div className="w-28 h-1 bg-neutral-700 rounded-full"></div>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col lg:flex-row antialiased overflow-x-hidden font-sans">
      
      {/* 1. LEFT PANEL: SIMULATION CONTROL DASHBOARD (35% Width) */}
      {!isDriverMode && (
        <div className="w-full lg:w-[35%] bg-[#0e1013] border-r border-[#1e232b] p-6 flex flex-col gap-5 overflow-y-auto max-h-screen relative z-10 shadow-2xl">
          
          <div className="border-b border-[#1e232b] pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-amber-500 font-bold">
                GhostTrack Developer Suite
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Companion App Simulator
            </h1>
            <p className="text-xs text-neutral-400 font-mono mt-1">
              AIS-186 Secondary Driver Detail Layer (v2.2)
            </p>
          </div>

          {/* --- LIVE GPS & REAL ROUTING PANEL --- */}
          <div className="bg-[#13161b] border border-[#1e232b] p-4 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isGpsMode ? 'bg-blue-500 animate-pulse' : 'bg-neutral-600'}`}></span>
                <span className="font-mono text-[11px] font-bold tracking-wider text-neutral-300">LIVE DRIVER GPS MODE</span>
              </div>
              
              <label className="relative inline-flex inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isGpsMode} 
                  onChange={(e) => {
                    setIsGpsMode(e.target.checked);
                    if (e.target.checked) {
                      setIsDemoActive(false);
                      setLeftAlert('SAFE');
                      setRightAlert('SAFE');
                    }
                  }}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-neutral-300 after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2 font-mono text-[9px] text-neutral-400 uppercase tracking-widest">
                  {isGpsMode ? 'LIVE' : 'SIM'}
                </span>
              </label>
            </div>

            {isGpsMode ? (
              <div className="space-y-4 pt-2 border-t border-[#1e232b]">
                {/* GPS Status Info */}
                <div className="bg-[#0e1013] p-2.5 rounded border border-[#1e232b] text-[10px] font-mono space-y-1.5">
                  <div className="text-neutral-500 uppercase tracking-wider">GPS Position:</div>
                  {gpsPermissionDenied ? (
                    <div className="text-red-400 font-bold flex items-center gap-1.5 animate-pulse">
                      <span>⚠️ Permission Denied</span>
                    </div>
                  ) : gpsError ? (
                    <div className="text-amber-500 font-bold flex items-center gap-1.5">
                      <span>⚠️ Error: {gpsError.slice(0, 30)}</span>
                    </div>
                  ) : livePosition ? (
                    <div className="text-emerald-400 font-bold flex items-center justify-between">
                      <span>Lat: {livePosition[0].toFixed(5)}</span>
                      <span>Lng: {livePosition[1].toFixed(5)}</span>
                    </div>
                  ) : (
                    <div className="text-neutral-400 animate-pulse">Acquiring GPS lock...</div>
                  )}
                </div>

                {/* Destination Search Box */}
                <div className="space-y-2 font-mono text-[10px]">
                  <label className="text-neutral-400 uppercase tracking-wider block">Destination Address</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. Kovalam, Chennai" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0e1013] border border-[#1e232b] px-2.5 py-1.5 rounded text-white focus:outline-none focus:border-blue-500 placeholder:text-neutral-600"
                      onKeyDown={(e) => e.key === 'Enter' && searchDestination(searchQuery)}
                    />
                    <button 
                      onClick={() => searchDestination(searchQuery)}
                      disabled={geocodingLoading}
                      className="bg-[#1e232b] border border-neutral-700 hover:bg-neutral-800 text-[10px] px-3.5 rounded text-white transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {geocodingLoading ? '...' : 'Go'}
                    </button>
                  </div>
                  
                  {geocodingError && <div className="text-red-400 text-[9px] font-bold">{geocodingError}</div>}
                  {destinationName && (
                    <div className="text-neutral-400 text-[9px] bg-[#0e1013] p-2 rounded border border-[#1e232b]/80 truncate">
                      Route to: <span className="text-white font-bold">{destinationName.split(',')[0]}</span>
                    </div>
                  )}

                  {/* Quick Shortcuts */}
                  <div className="space-y-1.5 pt-1.5">
                    <span className="text-[9px] text-neutral-500 uppercase tracking-wider">Quick Destinations:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: 'Kovalam Beach', query: 'Kovalam Beach, Tamil Nadu' },
                        { name: 'Marina Beach', query: 'Marina Beach, Chennai' },
                        { name: 'Akkarai Beach', query: 'Akkarai Beach, Chennai' }
                      ].map((shortcut) => (
                        <button
                          key={shortcut.name}
                          onClick={() => {
                            setSearchQuery(shortcut.query);
                            searchDestination(shortcut.query);
                          }}
                          className="bg-[#0e1013] hover:bg-[#1a1d24] border border-[#1e232b] text-neutral-400 hover:text-white px-2 py-1 rounded text-[8.5px] transition-colors cursor-pointer"
                        >
                          {shortcut.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Simulate Drive button */}
                  {routingResult.routeData && (
                    <div className="pt-2 border-t border-[#1e232b]">
                      <button
                        onClick={() => {
                          if (isRouteSimulationActive) {
                            setIsRouteSimulationActive(false);
                            addLog("Route simulation paused.", "warning");
                          } else {
                            setIsRouteSimulationActive(true);
                            setMockRouteIndex(0);
                            addLog("Starting OSRM route drive simulation.", "success");
                          }
                        }}
                        className={`w-full py-1.5 px-3 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer uppercase ${
                          isRouteSimulationActive 
                            ? 'bg-rose-950 text-rose-500 border-rose-600/50 hover:bg-rose-900/30' 
                            : 'bg-blue-600 hover:bg-blue-500 text-white border-transparent shadow-md shadow-blue-600/10'
                        }`}
                      >
                        {isRouteSimulationActive ? '🛑 Stop Simulation' : '🚀 Simulate Route Drive'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Turn-by-Turn Instructions List */}
                {routingResult.instructions && routingResult.instructions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#1e232b]">
                    <div className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider">OSRM ROAD DIRECTIONS:</div>
                    <div className="max-h-[140px] overflow-y-auto space-y-1.5 bg-[#0e1013]/90 border border-[#1e232b] p-2 rounded font-sans text-[9.5px]">
                      {routingResult.instructions.map((step, idx) => (
                        <div key={idx} className="flex gap-2 border-b border-neutral-900/60 pb-1.5 mb-1.5 last:border-0 last:pb-0 last:mb-0 text-neutral-300">
                          <span className="text-[#3b82f6] font-bold">
                            {step.text.toLowerCase().includes('left') ? '←' : step.text.toLowerCase().includes('right') ? '→' : '↑'}
                          </span>
                          <div className="flex-grow">
                            <div>{step.text}</div>
                            <div className="text-[7.5px] text-neutral-500 font-mono mt-0.5">{step.distance} meters</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-2 border-t border-[#1e232b] text-[10.5px] font-mono text-neutral-400 leading-relaxed">
                Tracks user GPS location via browser APIs and draws real road OSRM routes to search queries.
              </div>
            )}
          </div>

          {/* Network Polling Module */}
          <div className={`bg-[#13161b] border border-[#1e232b] p-4 rounded-lg space-y-4 ${isGpsMode ? 'opacity-30 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RadioIcon className="w-4 h-4 text-amber-500" />
                <span className="font-mono text-[11px] font-bold tracking-wider text-neutral-300">TRUCK LOCAL NETWORK</span>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isNetworkMode} 
                  onChange={(e) => {
                    setIsNetworkMode(e.target.checked);
                    if (e.target.checked) setIsDemoActive(false);
                  }}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-neutral-300 after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                <span className="ml-2 font-mono text-[9px] text-neutral-400 uppercase tracking-widest">
                  {isNetworkMode ? 'NET' : 'SIM'}
                </span>
              </label>
            </div>

            {isNetworkMode ? (
              <div className="space-y-3 pt-2 border-t border-[#1e232b] font-mono text-[10px]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-neutral-500 uppercase tracking-wider block">Raspberry Pi IP</label>
                    <input 
                      type="text" 
                      value={piIP} 
                      onChange={(e) => setPiIP(e.target.value)} 
                      className="w-full bg-[#0e1013] border border-[#1e232b] px-2.5 py-1.5 rounded text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-neutral-500 uppercase tracking-wider block">Pi MJPEG Port</label>
                    <input 
                      type="text" 
                      value={piPort} 
                      onChange={(e) => setPiPort(e.target.value)} 
                      className="w-full bg-[#0e1013] border border-[#1e232b] px-2.5 py-1.5 rounded text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-500 uppercase tracking-wider block">ESP32 Dashboard IP (REST API)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={espIP} 
                      onChange={(e) => setEspIP(e.target.value)} 
                      className="w-full bg-[#0e1013] border border-[#1e232b] px-2.5 py-1.5 rounded text-white focus:outline-none focus:border-amber-500"
                    />
                    <button 
                      onClick={saveNetworkConfig}
                      className="bg-[#1e232b] border border-neutral-700 hover:bg-neutral-800 text-[9px] px-3.5 rounded text-white transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#0e1013] p-2.5 rounded border border-[#1e232b] text-[9.5px]">
                  <span className="text-neutral-500">POLLING RADAR:</span>
                  <span className={`font-bold flex items-center gap-1.5 ${
                    connectionStatus === 'CONNECTED' ? 'text-emerald-500' : connectionStatus === 'CONNECTING' ? 'text-amber-400' : 'text-rose-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      connectionStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : connectionStatus === 'CONNECTING' ? 'bg-amber-400 animate-ping' : 'bg-rose-500'
                    }`} />
                    {connectionStatus}
                  </span>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#1e232b] text-[10.5px] font-mono text-neutral-400 leading-relaxed">
                Using local software state controllers. Slide state toggles or start the Demo Drive below to test layout overrides.
              </div>
            )}
          </div>

          {/* --- DEMO DRIVE AUTOMATION MODULE --- */}
          <div className={`bg-[#13161b] border border-[#1e232b] p-4 rounded-lg space-y-4 ${isGpsMode ? 'opacity-30 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isDemoActive ? 'bg-amber-500 animate-pulse' : 'bg-neutral-600'}`}></span>
                <span className="font-mono text-[11px] font-bold tracking-wider text-neutral-300">DEMO DRIVE AUTOMATION</span>
              </div>
              
              <button
                onClick={() => {
                  if (isDemoActive) {
                    setIsDemoActive(false);
                    setDemoTime(0);
                    setLeftAlert('SAFE');
                    setRightAlert('SAFE');
                    setActivePresetIndex(-1);
                    addLog("Demo drive simulation cancelled.", "warning");
                  } else {
                    setIsDemoActive(true);
                    setDemoTime(0);
                    setActivePresetIndex(-1);
                    addLog("Demo drive simulation started. 48-second driving scenario running.", "success");
                  }
                }}
                className={`font-mono text-[9px] font-black tracking-widest px-3 py-1.5 rounded transition-all cursor-pointer uppercase ${
                  isDemoActive 
                    ? 'bg-rose-950 text-rose-500 border border-rose-600/50 hover:bg-rose-900/30' 
                    : 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg shadow-amber-600/20'
                }`}
              >
                {isDemoActive ? 'STOP DEMO' : 'START DEMO DRIVE'}
              </button>
            </div>

            {isDemoActive ? (
              <div className="space-y-3 pt-2 border-t border-[#1e232b]">
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[9px] text-neutral-400">
                    <span>SCENARIO TIMELINE</span>
                    <span>{Math.floor(demoTime / 1000)}s / 48s</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                      style={{ width: `${(demoTime / 48000) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Active Step Indicator */}
                <div className="bg-[#0e1013] p-2.5 rounded border border-[#1e232b] space-y-1.5 font-mono text-[9px]">
                  <div className="text-neutral-500 uppercase tracking-wider">ACTIVE STATE:</div>
                  <div className="text-white font-bold text-[10px] flex items-center justify-between">
                    <span>
                      {demoTime / 1000 < 6 && 'Phase 1: Safe Highway (Cruise)'}
                      {demoTime / 1000 >= 6 && demoTime / 1000 < 12 && 'Phase 2: Auto-Rickshaw Overtaking (LH Aware)'}
                      {demoTime / 1000 >= 12 && demoTime / 1000 < 17 && 'Phase 3: Hazard Resolved (Clear)'}
                      {demoTime / 1000 >= 17 && demoTime / 1000 < 24 && 'Phase 4: Motorbike Cut-In (LH Critical)'}
                      {demoTime / 1000 >= 24 && demoTime / 1000 < 29 && 'Phase 5: Hazard Resolved (Clear)'}
                      {demoTime / 1000 >= 29 && demoTime / 1000 < 35 && 'Phase 6: Pedestrian Crossing (RH Critical)'}
                      {demoTime / 1000 >= 35 && demoTime / 1000 < 42 && 'Phase 7: Cyclist + Pedestrian (Dual Critical)'}
                      {demoTime / 1000 >= 42 && 'Phase 8: Road Cleared (Safe)'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded font-black ${
                      leftAlert === 'CRITICAL' || rightAlert === 'CRITICAL' 
                        ? 'bg-red-950 text-red-500 border border-red-800/40 animate-pulse' 
                        : leftAlert === 'AWARENESS' || rightAlert === 'AWARENESS'
                          ? 'bg-amber-950 text-amber-500 border border-amber-800/40'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                    }`}>
                      {leftAlert === 'CRITICAL' && rightAlert === 'CRITICAL' ? 'DUAL CRITICAL' : leftAlert === 'CRITICAL' ? 'LH CRITICAL' : rightAlert === 'CRITICAL' ? 'RH CRITICAL' : leftAlert === 'AWARENESS' ? 'LH AWARE' : rightAlert === 'AWARENESS' ? 'RH AWARE' : 'SAFE'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#1e232b] text-[10px] font-mono text-neutral-400 leading-relaxed">
                Autonomously cycles through ECR highway hazards to demonstrate layout transformations and auto-resolve logic.
              </div>
            )}
          </div>

          {/* State Overrides */}
          <div className="space-y-4">
            <span className="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">// MANUAL STATE OVERRIDES</span>
            
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg border flex flex-col gap-2.5 bg-[#13161b] ${isNetworkMode || isDemoActive || isGpsMode ? 'opacity-30 pointer-events-none' : 'border-[#1e232b]'}`}>
                <div className="font-mono text-[10px] font-bold text-neutral-400 border-b border-[#1e232b] pb-1 flex justify-between">
                  <span>LEFT STATE</span>
                  <span className={leftAlert === 'CRITICAL' ? 'text-red-500' : leftAlert === 'AWARENESS' ? 'text-amber-500' : 'text-emerald-500'}>{leftAlert}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {['SAFE', 'AWARENESS', 'CRITICAL'].map((s) => (
                    <button
                      key={s}
                      onClick={() => { 
                        setLeftAlert(s); 
                        setActivePresetIndex(-1);
                        addLog(`Override: LEFT state -> ${s}`, s === 'CRITICAL' ? 'error' : s === 'AWARENESS' ? 'warning' : 'info'); 
                      }}
                      className={`font-mono text-[9px] py-1.5 px-2.5 rounded border transition-all cursor-pointer ${
                        leftAlert === s 
                          ? s === 'CRITICAL' ? 'bg-red-950/40 text-red-500 border-red-600 font-bold' : s === 'AWARENESS' ? 'bg-amber-950/40 text-amber-500 border-amber-500 font-bold' : 'bg-emerald-950/40 text-emerald-500 border-emerald-600 font-bold'
                          : 'bg-[#0e1013] border-transparent text-neutral-400 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`p-3 rounded-lg border flex flex-col gap-2.5 bg-[#13161b] ${isNetworkMode || isDemoActive || isGpsMode ? 'opacity-30 pointer-events-none' : 'border-[#1e232b]'}`}>
                <div className="font-mono text-[10px] font-bold text-neutral-400 border-b border-[#1e232b] pb-1 flex justify-between">
                  <span>RIGHT STATE</span>
                  <span className={rightAlert === 'CRITICAL' ? 'text-red-500' : rightAlert === 'AWARENESS' ? 'text-amber-500' : 'text-emerald-500'}>{rightAlert}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {['SAFE', 'AWARENESS', 'CRITICAL'].map((s) => (
                    <button
                      key={s}
                      onClick={() => { 
                        setRightAlert(s); 
                        setActivePresetIndex(-1);
                        addLog(`Override: RIGHT state -> ${s}`, s === 'CRITICAL' ? 'error' : s === 'AWARENESS' ? 'warning' : 'info'); 
                      }}
                      className={`font-mono text-[9px] py-1.5 px-2.5 rounded border transition-all cursor-pointer ${
                        rightAlert === s 
                          ? s === 'CRITICAL' ? 'bg-red-950/40 text-red-500 border-red-600 font-bold' : s === 'AWARENESS' ? 'bg-amber-950/40 text-amber-500 border-amber-500 font-bold' : 'bg-emerald-950/40 text-emerald-500 border-emerald-600 font-bold'
                          : 'bg-[#0e1013] border-transparent text-neutral-400 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preset Macros */}
          <div className="space-y-3">
            <span className="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">// PRESET SCENARIO MACROS</span>
            <div className={`flex flex-col gap-2 ${isNetworkMode || isDemoActive || isGpsMode ? 'opacity-30 pointer-events-none' : ''}`}>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => triggerPreset(p, idx)}
                  className={`w-full p-2.5 rounded-lg text-left text-xs font-mono transition-all flex justify-between items-center group border cursor-pointer ${
                    activePresetIndex === idx 
                      ? 'bg-amber-950/20 border-amber-600/80 text-amber-400 font-bold' 
                      : 'bg-[#13161b] hover:bg-[#1a1d24] border-[#1e232b] hover:border-neutral-700 text-neutral-350'
                  }`}
                >
                  <span className={activePresetIndex === idx ? 'text-amber-400' : 'text-neutral-300 group-hover:text-white'}>{p.name}</span>
                  <PlayIcon className={`w-2.5 h-2.5 ${activePresetIndex === idx ? 'text-amber-400' : 'text-neutral-500 group-hover:text-amber-500 transition-colors'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Speed slider */}
          <div className={`bg-[#13161b] border border-[#1e232b] p-4 rounded-lg space-y-2 ${isDemoActive || isGpsMode ? 'opacity-30 pointer-events-none' : ''}`}>
            <div className="flex justify-between font-mono text-[10px] text-neutral-400">
              <span>SIMULATED TRUCK SPEED</span>
              <span className="text-white font-bold">{speed} km/h</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="110" 
              value={speed} 
              onChange={(e) => {
                const newSpeed = parseInt(e.target.value);
                setSpeed(newSpeed);
                if (newSpeed === 0) addLog('Truck stopped.', 'warning');
              }}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500" 
            />
            <div className="flex justify-between text-[8px] font-mono text-neutral-500">
              <span>0 km/h (STOPPED)</span>
              <span>60 km/h</span>
              <span>110 km/h (MAX)</span>
            </div>
          </div>

          {/* Mute toggle */}
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`flex items-center justify-between border font-mono text-[10.5px] p-3 rounded-lg transition-colors cursor-pointer ${
              isAudioEnabled ? 'bg-amber-950/20 border-amber-600/70 text-amber-500' : 'bg-[#13161b] border-[#1e232b] text-neutral-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {isAudioEnabled ? <VolumeIcon className="w-4 h-4" /> : <VolumeXIcon className="w-4 h-4" />}
              <span>AUDIBLE WARNING BEEPS</span>
            </div>
            <span className="font-bold">{isAudioEnabled ? 'ENABLED' : 'MUTED'}</span>
          </button>

          {/* Driver Mode view switcher */}
          <button
            onClick={() => {
              const nextMode = !isDriverMode;
              setIsDriverMode(nextMode);
              const url = new URL(window.location);
              url.searchParams.set('driver', nextMode ? 'true' : 'false');
              window.history.pushState({}, '', url);
              addLog(`Switched to ${nextMode ? 'Driver Cab Mode (Edge-to-Edge)' : 'Developer Simulator Mode'}`, 'success');
            }}
            className="w-full bg-[#1e232b] hover:bg-neutral-800 border border-neutral-700 p-2.5 rounded-lg text-xs font-mono transition-all text-center text-neutral-300 hover:text-white cursor-pointer"
          >
            {isDriverMode ? 'Show Simulator Controls' : 'Hide Controls (Driver View)'}
          </button>

          {/* Diagnostic Log */}
          <div className="flex-grow flex flex-col min-h-[140px] max-h-[200px] bg-[#07080a] border border-[#1e232b] rounded-lg p-3 overflow-hidden font-mono text-[9px]">
            <div className="border-b border-[#1e232b] pb-1.5 mb-1.5 flex justify-between items-center text-neutral-500">
              <span>DIAGNOSTIC EVENTS</span>
              <button 
                onClick={() => setLogs([])}
                className="hover:text-white flex items-center gap-1 text-[8.5px] bg-[#13161b] px-1.5 py-0.5 rounded border border-[#1e232b] cursor-pointer"
              >
                Clear
              </button>
            </div>
            <div className="overflow-y-auto space-y-1.5 flex-grow pr-1">
              {logs.length === 0 ? (
                <div className="text-neutral-600 text-center pt-8">No current activity...</div>
              ) : (
                logs.map((l, idx) => (
                  <div key={idx} className="flex gap-2 leading-relaxed">
                    <span className="text-neutral-600 flex-shrink-0 select-none">[{l.time}]</span>
                    <span className={
                      l.type === 'error' ? 'text-red-500 font-medium' : l.type === 'warning' ? 'text-amber-500 font-medium' : l.type === 'success' ? 'text-emerald-400 font-medium' : 'text-neutral-350'
                    }>
                      {l.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* 2. RIGHT PANEL: TRUCK CAB VIEW & SMARTPHONE INTERFACE (65% Width) */}
      <div className={`flex-grow bg-[#07080a] flex items-center justify-center relative ${
        isDriverMode ? 'w-full h-screen p-0 m-0 overflow-hidden' : 'p-4 lg:p-8 min-h-[600px] lg:max-h-screen z-10'
      }`}>
        
        {/* Cabin background dashboard frame (only show in simulator mode) */}
        {!isDriverMode && (
          <>
            <div className="absolute inset-0 bg-[#0d0e12] opacity-35 pointer-events-none z-0 overflow-hidden flex flex-col justify-start">
              <div className="h-1/2 w-full bg-gradient-to-b from-[#1b1c24] to-transparent"></div>
              <div className="h-[250px] mt-auto w-full bg-black border-t-4 border-neutral-900 rounded-t-[80px]"></div>
            </div>

            {/* Glowing borders around cabin mount to echo critical peripheral alerts */}
            <div className={`absolute left-0 top-0 bottom-0 w-8 bg-red-600/30 transition-all duration-300 z-5 pointer-events-none blur-md ${
              leftAlert === 'CRITICAL' ? 'opacity-100 animate-pulse' : 'opacity-0'
            }`} />
            <div className={`absolute right-0 top-0 bottom-0 w-8 bg-red-600/30 transition-all duration-300 z-5 pointer-events-none blur-md ${
              rightAlert === 'CRITICAL' ? 'opacity-100 animate-pulse' : 'opacity-0'
            }`} />
          </>
        )}

        {/* Smartphone mockup conditionally wrapped */}
        {isDriverMode ? (
          <div className="w-full h-screen">
            {renderPhoneInterface()}
          </div>
        ) : (
          <div className="relative w-full max-w-[370px] aspect-[9/19] z-10 flex items-center justify-center bg-[#090b0d] p-3.5 rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_8px_#1b2028,0_0_0_12px_#090a0d] border border-neutral-700/30">
            <div className="w-full h-full bg-black rounded-[32px] overflow-hidden flex flex-col relative border border-[#1b2028]/60">
              {renderPhoneInterface()}
            </div>
          </div>
        )}

        {/* Cabin mount specs sticker (only show in simulator mode) */}
        {!isDriverMode && (
          <div className="absolute bottom-6 right-6 font-mono text-[9px] text-neutral-700 border border-neutral-800/80 p-3 bg-neutral-950/80 rounded backdrop-blur-xs select-none pointer-events-none hidden md:block">
            <div>CAB DASHBOARD BRACKET // REV_B</div>
            <div>MOUNT CONFIG: PORTRAIT // 19.5:9</div>
            <div>POWER STATE: TRUCK BUS 24V</div>
          </div>
        )}
      </div>

    </div>
  );
}
