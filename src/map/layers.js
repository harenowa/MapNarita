import { getMap } from './map';

export function fitToSpots(spots) {
  const map = getMap();
  if (!map || !spots || spots.length === 0) return;

  const bounds = spots.map(s => [s.lat, s.lng]);
  map.fitBounds(bounds, { padding: [50, 50] });
}
