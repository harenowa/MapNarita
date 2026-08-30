import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CENTER, DEFAULT_ZOOM } from '../utils/constants';

let mapInstance = null;

export function initMap(containerId) {
  if (mapInstance) return mapInstance;

  mapInstance = L.map(containerId, {
    center: MAP_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: false
  });

  // 国土地理院 淡色地図タイル (GSI Pale)
  const gsiTile = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">国土地理院</a> | NaritaAccessMap',
    maxZoom: 18
  });

  // OSM Fallback Tile
  const osmTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });

  gsiTile.addTo(mapInstance);

  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  return mapInstance;
}

export function getMap() {
  return mapInstance;
}

export function setCenter(lat, lng, zoom = 16) {
  if (mapInstance) {
    mapInstance.setView([lat, lng], zoom, { animate: true });
  }
}
