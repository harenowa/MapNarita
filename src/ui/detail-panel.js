import { t } from '../i18n/i18n';
import { CATEGORIES } from '../utils/constants';
import { getAttrIconSVG } from '../utils/icons';
import { getTrustBadgeInfo } from '../utils/scoring';

export function showDetail(spot) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  const catConfig = CATEGORIES[spot.category] || CATEGORIES.facility;
  const trust = getTrustBadgeInfo(spot.trustScore);

  const accItems = Object.keys(spot.accessibility || {})
    .filter(k => spot.accessibility[k])
    .map(k => `
      <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; padding: 4px 0;">
        <span>${getAttrIconSVG(k)}</span>
        <span>${t(`accessibility.${k}`)}</span>
      </div>
    `).join('');

  let hoursHTML = '';
  if (spot.opening_hours) {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    hoursHTML = `
      <div style="margin-top: 12px;">
        <div class="section-title">営業時間</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">
          ${days.map(d => `
            <div style="display: flex; justify-content: space-between; padding: 2px 0;">
              <span>${t(`days.${d}`)}</span>
              <span>${(spot.opening_hours[d] && spot.opening_hours[d].length) ? spot.opening_hours[d].join(', ') : '定休日'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
      <div>
        <span class="badge primary">${catConfig.icon} ${t(`categories.${spot.category}`)}</span>
        <h2 style="font-size: 1.2rem; font-weight: 700; margin-top: 6px;">${spot.name}</h2>
      </div>
      <button id="close-detail-btn" class="btn-icon">✕</button>
    </div>

    <div style="margin-bottom: 12px; display: flex; gap: 8px;">
      <span class="badge ${trust.class}">${trust.icon} ${trust.label} (${Math.round(spot.trustScore * 100)}%)</span>
      ${spot.source ? `<span class="badge">${spot.source}</span>` : ''}
    </div>

    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
      📍 ${spot.address || ''}
    </div>

    <div class="section-title">バリアフリー設備・対応</div>
    <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: var(--radius-md); margin-bottom: 16px;">
      ${accItems || '<div style="font-size: 0.8rem; color: var(--text-muted);">詳細情報なし</div>'}
    </div>

    ${spot.details && spot.details.description ? `
      <div class="section-title">概要・特記事項</div>
      <div style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 16px; line-height: 1.5;">
        ${spot.details.description}
      </div>
    ` : ''}

    ${hoursHTML}

    <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 8px;">
      <a href="https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}" target="_blank" 
         style="text-decoration: none; text-align: center; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; padding: 12px; border-radius: var(--radius-md); font-weight: 600; font-size: 0.9rem;">
        🧭 Google Mapsでナビ開始
      </a>
    </div>
  `;

  panel.classList.add('open');

  document.getElementById('close-detail-btn')?.addEventListener('click', hideDetail);
}

export function hideDetail() {
  const panel = document.getElementById('detail-panel');
  if (panel) panel.classList.remove('open');
}
