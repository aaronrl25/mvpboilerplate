import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  address?: string;
}

export const locationService = {
  requestPermissions: async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  },

  getCurrentLocation: async (): Promise<LocationData | null> => {
    try {
      const hasPermission = await locationService.requestPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      
      // Reverse geocode to get city/region
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        return {
          latitude,
          longitude,
          city: place.city || undefined,
          region: place.region || undefined,
          country: place.country || undefined,
          address: `${place.name || ''} ${place.street || ''}, ${place.city || ''}`.trim(),
        };
      }

      return { latitude, longitude };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  },

  getDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Haversine formula to calculate distance in km
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
};
