import { t, getCurrentLang } from '../i18n/i18n';
import { CATEGORIES, ACCESSIBILITY_ATTRS } from '../utils/constants';
import { getAttrIconSVG } from '../utils/icons';
import { getTrustBadgeInfo } from '../utils/scoring';

let currentFilters = {
  categories: Object.keys(CATEGORIES),
  accessibility: [],
  searchQuery: '',
  openNow: false
};

let onFilterChangeCallback = null;
let onSpotSelectCallback = null;

// ボトムシート状態: 'collapsed' (最小化/マップ重視), 'half' (標準), 'expanded' (拡大/一覧重視)
let sheetState = 'half';
let isFilterExpanded = false;

export function initSidebar(onFilterChange, onSpotSelect) {
  onFilterChangeCallback = onFilterChange;
  onSpotSelectCallback = onSpotSelect;

  renderAll();
  setupEventListeners();

  window.addEventListener('languagechange', () => {
    renderAll();
    if (onFilterChangeCallback) onFilterChangeCallback(currentFilters);
  });
}

export function renderAll() {
  renderCategoryButtons();
  renderAccessibilityCheckboxes();
  updateLabels();
}

function updateLabels() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.placeholder = t('app.searchPlaceholder');

  const toggleFilterText = document.getElementById('toggle-filter-text');
  if (toggleFilterText) {
    toggleFilterText.textContent = isFilterExpanded ? `▲ ${t('app.toggleFilter')}` : `▼ ${t('app.toggleFilter')}`;
  }

  const sheetToggleText = document.getElementById('sheet-toggle-text');
  if (sheetToggleText) {
    if (sheetState === 'collapsed') sheetToggleText.textContent = '▲ リスト表示・拡大';
    else if (sheetState === 'half') sheetToggleText.textContent = '▲ 全画面拡大';
    else sheetToggleText.textContent = '▼ 地図を全画面表示';
  }
}

function renderCategoryButtons() {
  const container = document.getElementById('category-grid');
  if (!container) return;

  container.innerHTML = Object.keys(CATEGORIES).map(catKey => {
    const cat = CATEGORIES[catKey];
    const isActive = currentFilters.categories.includes(catKey);
    return `
      <button class="cat-btn ${isActive ? 'active' : ''}" data-cat="${catKey}">
        <span>${cat.icon}</span>
        <span>${t(`categories.${catKey}`)}</span>
      </button>
    `;
  }).join('');
}

function renderAccessibilityCheckboxes() {
  const container = document.getElementById('attr-list');
  if (!container) return;

  container.innerHTML = ACCESSIBILITY_ATTRS.map(attr => `
    <label class="attr-item">
      <input type="checkbox" value="${attr}" ${currentFilters.accessibility.includes(attr) ? 'checked' : ''} />
      <span>${getAttrIconSVG(attr)} ${t(`accessibility.${attr}`)}</span>
    </label>
  `).join('');
}

function setupEventListeners() {
  const sidebar = document.getElementById('sidebar');
  const sheetHandle = document.getElementById('sheet-drag-handle');
  const sheetToggleBtn = document.getElementById('sheet-toggle-btn');
  const toggleFilterBtn = document.getElementById('toggle-filter-btn');
  const filterSection = document.getElementById('filter-section');

  // ボトムシート状態切替 (最小化 ↔ 標準 ↔ 拡大)
  const setSheetState = (state) => {
    sheetState = state;
    if (sidebar) {
      sidebar.classList.remove('state-collapsed', 'state-half', 'state-expanded');
      sidebar.classList.add(`state-${sheetState}`);
    }
    updateLabels();
  };

  if (sheetHandle) {
    sheetHandle.addEventListener('click', () => {
      if (sheetState === 'collapsed') setSheetState('half');
      else if (sheetState === 'half') setSheetState('expanded');
      else setSheetState('collapsed');
    });
  }

  if (sheetToggleBtn) {
    sheetToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sheetState === 'collapsed') setSheetState('half');
      else if (sheetState === 'half') setSheetState('expanded');
      else setSheetState('collapsed');
    });
  }

  // フィルター開閉ボタン
  if (toggleFilterBtn && filterSection) {
    toggleFilterBtn.addEventListener('click', () => {
      isFilterExpanded = !isFilterExpanded;
      if (isFilterExpanded) {
        filterSection.classList.add('expanded');
        // フィルターを開いたらボトムシートも自動的に拡大
        if (sheetState === 'collapsed') setSheetState('half');
      } else {
        filterSection.classList.remove('expanded');
      }
      updateLabels();
    });
  }

  // 検索入力
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      currentFilters.searchQuery = e.target.value;
      if (sheetState === 'collapsed') setSheetState('half');
      if (onFilterChangeCallback) onFilterChangeCallback(currentFilters);
    });
  }

  // カテゴリトグル
  const catContainer = document.getElementById('category-grid');
  if (catContainer) {
    catContainer.addEventListener('click', e => {
      const btn = e.target.closest('.cat-btn');
      if (!btn) return;
      const cat = btn.getAttribute('data-cat');

      if (currentFilters.categories.includes(cat)) {
        currentFilters.categories = currentFilters.categories.filter(c => c !== cat);
      } else {
        currentFilters.categories.push(cat);
      }

      btn.classList.toggle('active');
      if (onFilterChangeCallback) onFilterChangeCallback(currentFilters);
    });
  }

  // バリアフリー属性チェック
  const attrContainer = document.getElementById('attr-list');
  if (attrContainer) {
    attrContainer.addEventListener('change', () => {
      const checkboxes = attrContainer.querySelectorAll('input[type="checkbox"]:checked');
      currentFilters.accessibility = Array.from(checkboxes).map(cb => cb.value);
      if (onFilterChangeCallback) onFilterChangeCallback(currentFilters);
    });
  }

  // 営業中フィルター
  const openNowCb = document.getElementById('open-now-check');
  if (openNowCb) {
    openNowCb.addEventListener('change', e => {
      currentFilters.openNow = e.target.checked;
      if (onFilterChangeCallback) onFilterChangeCallback(currentFilters);
    });
  }
}

export function renderResultsList(spots) {
  const container = document.getElementById('results-list');
  const countEl = document.getElementById('results-count');
  const currentLang = getCurrentLang();

  if (countEl) {
    countEl.textContent = `${spots.length}${t('app.resultsCount')}`;
  }

  if (!container) return;

  if (spots.length === 0) {
    container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted);">${currentLang === 'en' ? 'No spots found' : '該当するスポットが見つかりません'}</div>`;
    return;
  }

  container.innerHTML = spots.map(spot => {
    const catConfig = CATEGORIES[spot.category] || CATEGORIES.facility;
    const trust = getTrustBadgeInfo(spot.trustScore);

    const displayName = currentLang === 'en' && spot.name_en ? spot.name_en : spot.name;
    const displayAddress = currentLang === 'en' && spot.address_en ? spot.address_en : spot.address;

    return `
      <div class="spot-card" data-id="${spot.id}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
          <div class="spot-name">${catConfig.icon} ${displayName}</div>
          <span class="badge ${trust.class}">${trust.icon} ${t(`app.${trust.class === 'trust-high' ? 'official' : 'verified'}`)}</span>
        </div>
        <div class="spot-address">${displayAddress || ''}</div>
        <div class="badge-group">
          ${Object.keys(spot.accessibility || {}).filter(k => spot.accessibility[k]).map(k => `
            <span class="badge">${getAttrIconSVG(k)} ${t(`accessibility.${k}`)}</span>
          `).slice(0, 3).join('')}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.spot-card').forEach(card => {
    card.addEventListener('click', () => {
      const spotId = card.getAttribute('data-id');
      const spot = spots.find(s => s.id === spotId);
      if (spot && onSpotSelectCallback) onSpotSelectCallback(spot);
    });
  });
}
