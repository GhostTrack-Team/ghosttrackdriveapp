import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';

/**
 * Reusable Leaflet hook to calculate routes using leaflet-routing-machine and OSRM
 * @param {L.Map|null} map Leaflet Map instance
 * @param {[number, number]|null} startPosition Latitude/Longitude array
 * @param {[number, number]|null} endPosition Latitude/Longitude array
 * @returns {{
 *   routeData: any|null,
 *   instructions: Array<{ text: string, type: string, distance: number }>,
 *   eta: number|null,
 *   distance: number|null,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export default function useMapRouting(map, startPosition, endPosition) {
  const [routeData, setRouteData] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [eta, setEta] = useState(null); // in minutes
  const [distance, setDistance] = useState(null); // in km
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !startPosition || !endPosition) {
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
        } catch {
          // ignore
        }
        routingControlRef.current = null;
      }
      setRouteData(null);
      setInstructions([]);
      setEta(null);
      setDistance(null);
      return;
    }

    setLoading(true);
    setError(null);

    const startLatLng = L.latLng(startPosition[0], startPosition[1]);
    const endLatLng = L.latLng(endPosition[0], endPosition[1]);

    // Clean up previous instance before constructing new routing overlay
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch {
        // ignore
      }
      routingControlRef.current = null;
    }

    try {
      const routingControl = L.Routing.control({
        waypoints: [startLatLng, endLatLng],
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'car'
        }),
        lineOptions: {
          styles: [
            { color: '#2563eb', weight: 6, opacity: 0.8 }, // Bottom glow line
            { color: '#3b82f6', weight: 4.5, opacity: 0.95 } // Top sharp core
          ]
        },
        show: false, // Hide the default light-theme HTML overlay
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true
      }).addTo(map);

      routingControl.on('routesfound', (e) => {
        setLoading(false);
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const route = routes[0];
          setRouteData(route);
          
          // Distance in km (convert from meters)
          const distKm = parseFloat((route.summary.totalDistance / 1000).toFixed(2));
          setDistance(distKm);

          // ETA duration in minutes (convert from seconds)
          const durationMin = Math.round(route.summary.totalTime / 60);
          setEta(durationMin);

          // Parse instructions list
          const steps = route.instructions.map((step) => ({
            text: step.text,
            type: step.type, // Turn type metadata
            distance: Math.round(step.distance)
          }));
          setInstructions(steps);
          setError(null);
        }
      });

      routingControl.on('routingerror', (err) => {
        setLoading(false);
        setError(err.error?.message || "Failed to calculate route on road network.");
      });

      routingControlRef.current = routingControl;

    } catch (err) {
      setLoading(false);
      setError(err.message || "Failed to initialize OSRM routing control.");
    }

    return () => {
      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current);
        } catch {
          // ignore
        }
        routingControlRef.current = null;
      }
    };
  }, [map, startPosition, endPosition]);

  return { routeData, instructions, eta, distance, loading, error };
}
