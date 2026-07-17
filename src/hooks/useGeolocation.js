import { useState, useEffect } from 'react';

/**
 * Reusable hook to track live GPS location using Geolocation API
 * @param {PositionOptions} options Geolocation watch settings
 * @returns {{ position: [number, number]|null, error: string|null, permissionDenied: boolean }}
 */
export default function useGeolocation(options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    const successHandler = (pos) => {
      const { latitude, longitude } = pos.coords;
      setPosition([latitude, longitude]);
      setError(null);
      setPermissionDenied(false);
    };

    const errorHandler = (err) => {
      setError(err.message);
      if (err.code === 1) { // GeolocationPositionError.PERMISSION_DENIED
        setPermissionDenied(true);
      }
    };

    // Begin watching coordinates
    const watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, options);

    // Clean up watch monitor on unmount
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [options]);

  return { position, error, permissionDenied };
}
