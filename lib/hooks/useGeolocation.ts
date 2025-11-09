import { useEffect, useState } from 'react';

interface GeolocationState {
	location: { lat: number; lng: number };
	error: string | null;
	isLoading: boolean;
}

interface CachedLocation {
	lat: number;
	lng: number;
	timestamp: number;
}

const DEFAULT_LOCATION = { lat: 41.4912314, lng: 2.1403111 }; // Cerdanyola del Vallès
const STORAGE_KEY = 'bus-map-last-location';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Loads the last known location from localStorage if it exists and is not expired
 */
function loadCachedLocation(): { lat: number; lng: number } | null {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const cached = localStorage.getItem(STORAGE_KEY);
		if (!cached) {
			return null;
		}

		const parsed: CachedLocation = JSON.parse(cached);
		const age = Date.now() - parsed.timestamp;

		// Use cached location if it's less than 24 hours old
		if (age < CACHE_EXPIRY_MS && parsed.lat && parsed.lng) {
			return { lat: parsed.lat, lng: parsed.lng };
		}

		// Cache expired, remove it
		localStorage.removeItem(STORAGE_KEY);
		return null;
	} catch (error) {
		// Invalid cached data, remove it
		console.warn('Failed to load cached location:', error);
		localStorage.removeItem(STORAGE_KEY);
		return null;
	}
}

/**
 * Saves the current location to localStorage with a timestamp
 */
function saveCachedLocation(location: { lat: number; lng: number }): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		const cached: CachedLocation = {
			...location,
			timestamp: Date.now(),
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
	} catch (error) {
		// localStorage might be full or unavailable, fail silently
		console.warn('Failed to save cached location:', error);
	}
}

export const useGeolocation = (): GeolocationState => {
	// Initialize with cached location if available, otherwise use default
	const cachedLocation = loadCachedLocation();
	const [location, setLocation] = useState(
		cachedLocation ?? DEFAULT_LOCATION,
	);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!navigator.geolocation) {
			setError('Geolocation is not supported by this browser');
			setIsLoading(false);
			return;
		}

		const options: PositionOptions = {
			enableHighAccuracy: false, // Use network/cell towers instead of GPS for speed
			timeout: 3000, // Reduce timeout to 3 seconds
			maximumAge: 600000, // Accept cached location up to 10 minutes old
		};

		const handleSuccess = (position: GeolocationPosition) => {
			const { latitude, longitude } = position.coords;
			const newLocation = { lat: latitude, lng: longitude };
			setLocation(newLocation);
			saveCachedLocation(newLocation); // Save to localStorage
			setError(null);
			setIsLoading(false);
		};

		const handleError = (error: GeolocationPositionError) => {
			let errorMessage = 'Unable to retrieve your location';

			switch (error.code) {
				case error.PERMISSION_DENIED:
					errorMessage = 'Location access denied by user';
					break;
				case error.POSITION_UNAVAILABLE:
					errorMessage = 'Location information unavailable';
					break;
				case error.TIMEOUT:
					errorMessage = 'Location request timed out';
					break;
			}

			console.error('Geolocation error:', errorMessage);
			setError(errorMessage);
			setIsLoading(false);
		};

		// If we have a cached location, we can show it immediately
		// but still fetch fresh location in the background
		if (cachedLocation) {
			setIsLoading(false);
		}

		// Get initial position
		navigator.geolocation.getCurrentPosition(
			handleSuccess,
			handleError,
			options,
		);

		// Watch position changes
		const watchId = navigator.geolocation.watchPosition(
			handleSuccess,
			handleError,
			options,
		);

		return () => {
			navigator.geolocation.clearWatch(watchId);
		};
	}, []);

	return { location, error, isLoading };
};
