import './index.css';
import { initMap, setCenter } from './map/map';
import { initMarkers, renderMarkers, highlightMarker } from './map/markers';
import { locateUser } from './map/geolocation';
import { loadAllData, getAllSpots } from './data/loader';
import { filterSpots } from './data/filter';
import { initSidebar, renderResultsList } from './ui/sidebar';
import { showDetail } from './ui/detail-panel';
import { showReportForm } from './ui/report-form';
import { showToast } from './ui/toast';
import { setLang, getCurrentLang, updateDOM } from './i18n/i18n';

async function bootstrap() {
  // 1. i18n 初期化
  updateDOM();

  // 2. 地図の初期化
  initMap('map');

  // 3. マーカー初期化
  initMarkers(spot => {
    showDetail(spot);
    setCenter(spot.lat, spot.lng, 16);
  });

  // 4. データロード
  const spots = await loadAllData();

  // 5. 初期描画
  renderMarkers(spots, spot => showDetail(spot));
  
  // 6. サイドバー初期化 & リスト描画
  initSidebar(
    filters => {
      const filtered = filterSpots(getAllSpots(), filters);
      renderMarkers(filtered, spot => showDetail(spot));
      renderResultsList(filtered);
    },
    spot => {
      showDetail(spot);
      highlightMarker(spot.id);
      setCenter(spot.lat, spot.lng, 16);
    }
  );

  renderResultsList(spots);

  // 7. イベントハンドラ設定
  // 現在地
  document.getElementById('loc-btn')?.addEventListener('click', () => {
    locateUser(
      pos => showToast(`現在地を取得しました (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`, 'success'),
      err => showToast(`現在地を取得できませんでした: ${err}`, 'error')
    );
  });

  // 言語切り替え
  document.getElementById('lang-btn')?.addEventListener('click', () => {
    const nextLang = getCurrentLang() === 'ja' ? 'en' : 'ja';
    setLang(nextLang);
    showToast(nextLang === 'ja' ? '日本語に切り替えました' : 'Switched to English', 'info');
  });

  // テーマ切り替え
  document.getElementById('theme-btn')?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
  });

  // 投稿ボタン
  document.getElementById('fab-report-btn')?.addEventListener('click', () => {
    showReportForm(async () => {
      const reloaded = await loadAllData();
      renderMarkers(reloaded, spot => showDetail(spot));
      renderResultsList(reloaded);
    });
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);
