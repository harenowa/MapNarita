/**
 * ハザードマップオーバーレイ管理モジュール
 * 国土地理院「重ねるハザードマップ」タイルを使用
 * https://disaportal.gsi.go.jp/
 */
import L from 'leaflet';
import { getMap } from './map';

// 国土地理院 重ねるハザードマップ タイル定義
export const HAZARD_LAYERS = {
  flood: {
    id: 'flood',
    label: '🌊 洪水浸水想定',
    labelEn: 'Flood Hazard',
    url: 'https://disaportal.gsi.go.jp/data/raster/01_flood_l2_shinsuishin_kuni_data/{z}/{x}/{y}.png',
    opacity: 0.6,
    maxZoom: 17,
    attribution: '国土交通省 洪水浸水想定区域',
    description: '河川が氾濫した場合の浸水深（想定最大規模）'
  },
  sediment: {
    id: 'sediment',
    label: '⛰️ 土砂災害警戒区域',
    labelEn: 'Landslide Hazard',
    url: 'https://disaportal.gsi.go.jp/data/raster/05_dosekiryu_keikaikuiki/{z}/{x}/{y}.png',
    opacity: 0.6,
    maxZoom: 17,
    attribution: '都道府県 土砂災害警戒区域',
    description: '土石流・地すべり・急傾斜地の崩壊が発生した場合に危険が及ぶ区域'
  },
  tsunami: {
    id: 'tsunami',
    label: '🌊 津波浸水想定',
    labelEn: 'Tsunami Hazard',
    url: 'https://disaportal.gsi.go.jp/data/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png',
    opacity: 0.6,
    maxZoom: 17,
    attribution: '都道府県 津波浸水想定',
    description: '津波が発生した場合の浸水深（想定最大規模）'
  },
  storm: {
    id: 'storm',
    label: '🌪️ 高潮浸水想定',
    labelEn: 'Storm Surge Hazard',
    url: 'https://disaportal.gsi.go.jp/data/raster/03_takashio_l2_shinsuishin_data/{z}/{x}/{y}.png',
    opacity: 0.6,
    maxZoom: 17,
    attribution: '都道府県 高潮浸水想定区域',
    description: '台風等による高潮が発生した場合の浸水深（想定最大規模）'
  }
};

// 現在アクティブなレイヤーのMap
const activeLayers = new Map(); // id -> L.TileLayer

/**
 * ハザードマップレイヤーの表示/非表示を切替
 * @param {string} layerId 
 * @param {boolean} show 
 */
export function toggleHazardLayer(layerId, show) {
  const map = getMap();
  if (!map) return;

  const layerDef = HAZARD_LAYERS[layerId];
  if (!layerDef) return;

  if (show) {
    if (!activeLayers.has(layerId)) {
      const tileLayer = L.tileLayer(layerDef.url, {
        opacity: layerDef.opacity,
        maxZoom: layerDef.maxZoom,
        attribution: layerDef.attribution,
        // エラータイルは透明に
        errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      });
      tileLayer.addTo(map);
      // ハザードレイヤーはマーカーより下に
      tileLayer.setZIndex(200);
      activeLayers.set(layerId, tileLayer);
    }
  } else {
    if (activeLayers.has(layerId)) {
      activeLayers.get(layerId).removeFrom(map);
      activeLayers.delete(layerId);
    }
  }
}

/**
 * 特定レイヤーの透明度を変更
 */
export function setHazardLayerOpacity(layerId, opacity) {
  if (activeLayers.has(layerId)) {
    activeLayers.get(layerId).setOpacity(opacity);
  }
}

/**
 * アクティブなレイヤーIDセットを返す
 */
export function getActiveHazardLayers() {
  return new Set(activeLayers.keys());
}

/**
 * 全ハザードレイヤーを削除
 */
export function clearAllHazardLayers() {
  const map = getMap();
  if (!map) return;
  activeLayers.forEach(layer => layer.removeFrom(map));
  activeLayers.clear();
}
