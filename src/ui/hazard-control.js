/**
 * ハザードマップ切替UIパネル
 * 地図右上に表示するコントロール
 */
import { HAZARD_LAYERS, toggleHazardLayer, setHazardLayerOpacity } from '../map/hazard-layers';

let panelEl = null;
let isOpen = false;

export function initHazardControl() {
  // コントロールボタンを作成
  const btn = document.createElement('button');
  btn.id = 'hazard-control-btn';
  btn.className = 'btn-icon hazard-btn';
  btn.title = 'ハザードマップを重ねる';
  btn.innerHTML = '🗺️';
  btn.style.cssText = `
    position: absolute;
    bottom: 100px;
    right: 16px;
    z-index: 1000;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--bg-glass);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border-glass);
    font-size: 1.1rem;
    cursor: pointer;
    box-shadow: var(--shadow-main);
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // パネル作成
  panelEl = document.createElement('div');
  panelEl.id = 'hazard-panel';
  panelEl.style.cssText = `
    position: absolute;
    bottom: 148px;
    right: 16px;
    z-index: 1000;
    width: 280px;
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-main);
    padding: 14px;
    display: none;
    flex-direction: column;
    gap: 10px;
  `;

  const title = document.createElement('div');
  title.style.cssText = 'font-size: 0.8rem; font-weight: 700; color: var(--primary-hover); margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;';
  title.innerHTML = `
    <span>🗺️ ハザードマップ重ね表示</span>
    <button id="hazard-panel-close" style="background:none;border:none;color:var(--text-muted);font-size:1rem;cursor:pointer;padding:0 4px;">✕</button>
  `;

  const note = document.createElement('div');
  note.style.cssText = 'font-size: 0.72rem; color: var(--text-muted); line-height: 1.4; padding: 6px 8px; background: rgba(255,200,50,0.1); border-left: 3px solid #f5a623; border-radius: 4px;';
  note.textContent = '⚠️ 出典: 国土地理院「重ねるハザードマップ」。最終確認は成田市公式ハザードマップでご確認ください。';

  const layerList = document.createElement('div');
  layerList.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

  Object.values(HAZARD_LAYERS).forEach(layerDef => {
    const item = document.createElement('div');
    item.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

    const row = document.createElement('div');
    row.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.id = `hazard-toggle-${layerDef.id}`;
    toggle.style.cssText = 'width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary);';

    const label = document.createElement('label');
    label.htmlFor = `hazard-toggle-${layerDef.id}`;
    label.style.cssText = 'font-size: 0.82rem; font-weight: 600; cursor: pointer; flex: 1;';
    label.textContent = layerDef.label;

    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.min = '10';
    opacitySlider.max = '90';
    opacitySlider.value = '60';
    opacitySlider.id = `hazard-opacity-${layerDef.id}`;
    opacitySlider.style.cssText = 'width: 100%; height: 4px; display: none; accent-color: var(--primary);';

    const desc = document.createElement('div');
    desc.style.cssText = 'font-size: 0.7rem; color: var(--text-muted); padding-left: 24px;';
    desc.textContent = layerDef.description;

    toggle.addEventListener('change', () => {
      const show = toggle.checked;
      toggleHazardLayer(layerDef.id, show);
      opacitySlider.style.display = show ? 'block' : 'none';
    });

    opacitySlider.addEventListener('input', () => {
      setHazardLayerOpacity(layerDef.id, parseInt(opacitySlider.value) / 100);
    });

    row.appendChild(toggle);
    row.appendChild(label);
    item.appendChild(row);
    item.appendChild(desc);
    item.appendChild(opacitySlider);
    layerList.appendChild(item);
  });

  panelEl.appendChild(title);
  panelEl.appendChild(note);
  panelEl.appendChild(layerList);

  // ページに追加
  const mapContainer = document.getElementById('map')?.parentElement;
  if (mapContainer) {
    mapContainer.appendChild(btn);
    mapContainer.appendChild(panelEl);
  }

  // ボタンクリックでパネル開閉
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen = !isOpen;
    panelEl.style.display = isOpen ? 'flex' : 'none';
    btn.style.background = isOpen ? 'var(--primary)' : 'var(--bg-glass)';
    btn.style.color = isOpen ? '#fff' : '';
  });

  // 閉じるボタン
  panelEl.querySelector('#hazard-panel-close')?.addEventListener('click', () => {
    isOpen = false;
    panelEl.style.display = 'none';
    btn.style.background = 'var(--bg-glass)';
    btn.style.color = '';
  });

  // 外クリックで閉じる
  document.addEventListener('click', (e) => {
    if (isOpen && !panelEl.contains(e.target) && e.target !== btn) {
      isOpen = false;
      panelEl.style.display = 'none';
      btn.style.background = 'var(--bg-glass)';
      btn.style.color = '';
    }
  });
}
