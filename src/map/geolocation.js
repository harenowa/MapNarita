import L from 'leaflet';
import { getMap, setCenter } from './map';

let locationMarker = null;
let watchId = null;

export function locateUser(onLocationFound, onError) {
  const map = getMap();
  if (!map) return;

  if (!navigator.geolocation) {
    if (onError) onError('Geolocation not supported');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;

      if (!locationMarker) {
        const pulseIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div style="
              width: 18px;
              height: 18px;
              background: #3B82F6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 0 12px #3B82F6;
            "></div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });

        locationMarker = L.marker([latitude, longitude], { icon: pulseIcon }).addTo(map);
      } else {
        locationMarker.setLatLng([latitude, longitude]);
      }

      setCenter(latitude, longitude, 16);
      if (onLocationFound) onLocationFound({ lat: latitude, lng: longitude });
    },
    err => {
      if (onError) onError(err.message);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
