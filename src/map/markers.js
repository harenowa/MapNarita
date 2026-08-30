import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { getMap } from './map';
import { CATEGORIES } from '../utils/constants';

let clusterGroup = null;
const markerMap = new Map();

export function initMarkers(onSpotClick) {
  const map = getMap();
  if (!map) return;

  clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 40
  });

  map.addLayer(clusterGroup);

  return clusterGroup;
}

export function renderMarkers(spots, onSpotClick) {
  if (!clusterGroup) return;

  clusterGroup.clearLayers();
  markerMap.clear();

  spots.forEach(spot => {
    const catConfig = CATEGORIES[spot.category] || CATEGORIES.facility;

    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          background: ${catConfig.color};
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          border: 2px solid white;
          color: white;
        ">
          ${catConfig.icon}
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const marker = L.marker([spot.lat, spot.lng], { icon: customIcon });

    marker.on('click', () => {
      if (onSpotClick) onSpotClick(spot);
    });

    clusterGroup.addLayer(marker);
    markerMap.set(spot.id, marker);
  });
}

export function highlightMarker(spotId) {
  const marker = markerMap.get(spotId);
  if (marker && clusterGroup) {
    clusterGroup.zoomToShowLayer(marker, () => {
      marker.openPopup();
    });
  }
}
