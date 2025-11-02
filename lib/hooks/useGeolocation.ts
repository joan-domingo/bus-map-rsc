import { useEffect, useState } from 'react';

interface GeolocationState {
	location: { lat: number; lng: number };
	error: string | null;
	isLoading: boolean;
}

const DEFAULT_LOCATION = { lat: 41.4912314, lng: 2.1403111 }; // Cerdanyola del Vallès

export const useGeolocation = (): GeolocationState => {
	const [location, setLocation] = useState(DEFAULT_LOCATION);
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
			setLocation({ lat: latitude, lng: longitude });
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
