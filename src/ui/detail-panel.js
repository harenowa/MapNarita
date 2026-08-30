import { t, getCurrentLang } from '../i18n/i18n';
import { CATEGORIES } from '../utils/constants';
import { getAttrIconSVG } from '../utils/icons';
import { getTrustBadgeInfo } from '../utils/scoring';

export function showDetail(spot) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  const currentLang = getCurrentLang();
  const catConfig = CATEGORIES[spot.category] || CATEGORIES.facility;
  const trust = getTrustBadgeInfo(spot.trustScore);

  const displayName = currentLang === 'en' && spot.name_en ? spot.name_en : spot.name;
  const displayAddress = currentLang === 'en' && spot.address_en ? spot.address_en : spot.address;

  const accItems = Object.keys(spot.accessibility || {})
    .filter(k => spot.accessibility[k])
    .map(k => `
      <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; padding: 4px 0;">
        <span>${getAttrIconSVG(k)}</span>
        <span>${t(`accessibility.${k}`)}</span>
      </div>
    `).join('');

  // バス停用 特殊表示
  let busHTML = '';
  if (spot.category === 'busStop') {
    const operator = currentLang === 'en' && spot.operator_en ? spot.operator_en : spot.operator;
    const routes = spot.details && spot.details.routes ? (currentLang === 'en' && spot.details.routes_en ? spot.details.routes_en : spot.details.routes) : [];

    let rtHTML = '';
    if (spot.rt_status) {
      const rt = spot.rt_status;
      const delayBadge = rt.delayMinutes === 0 
        ? `<span class="badge trust">🟢 ${t('bus.onTime')}</span>`
        : `<span class="badge danger">🟡 ${rt.delayMinutes}${t('bus.delayed')}</span>`;

      rtHTML = `
        <div style="margin-top: 14px; background: rgba(45, 139, 110, 0.15); border: 1px solid var(--primary); padding: 12px; border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary); margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span>🚌 ${t('bus.rtStatus')}</span>
            ${delayBadge}
          </div>
          <div style="font-size: 0.85rem; font-weight: 600;">
            ${t('bus.nextBus')}: <span style="font-size: 1.1rem; color: var(--accent);">${rt.nextBusTime}</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
            ${rt.isBarrierFreeVehicle ? `♿ ${t('bus.barrierFreeVehicle')} | ` : ''} ${t('bus.vehicleNo')}: ${rt.vehicleNumber}
          </div>
        </div>
      `;
    }

    let timetableHTML = '';
    if (spot.timetable && spot.timetable.length > 0) {
      timetableHTML = `
        <div style="margin-top: 14px;">
          <div class="section-title">⏱️ ${t('bus.timetable')}</div>
          ${spot.timetable.map(tt => `
            <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: var(--radius-md); margin-bottom: 8px;">
              <div style="font-size: 0.82rem; font-weight: 700; color: var(--primary-hover); margin-bottom: 4px;">${tt.route}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                <strong style="color: var(--text-main);">${t('bus.weekday')}:</strong> ${tt.weekday ? tt.weekday.join(', ') : '-'}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                <strong style="color: var(--text-main);">${t('bus.weekend')}:</strong> ${tt.weekend ? tt.weekend.join(', ') : '-'}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    busHTML = `
      <div style="margin-top: 12px;">
        <div style="font-size: 0.8rem; color: var(--text-muted);">
          <strong>${t('bus.operator')}:</strong> ${operator || '成田市 / 千葉交通'}
        </div>
        ${routes.length ? `
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
            <strong>${t('bus.routes')}:</strong> ${routes.join(' / ')}
          </div>
        ` : ''}
        ${rtHTML}
        ${timetableHTML}
      </div>
    `;
  }

  let hoursHTML = '';
  if (spot.opening_hours) {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    hoursHTML = `
      <div style="margin-top: 12px;">
        <div class="section-title">🕒 営業時間</div>
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
        <h2 style="font-size: 1.2rem; font-weight: 700; margin-top: 6px;">${displayName}</h2>
      </div>
      <button id="close-detail-btn" class="btn-icon">✕</button>
    </div>

    <div style="margin-bottom: 12px; display: flex; gap: 8px;">
      <span class="badge ${trust.class}">${trust.icon} ${t(`app.${trust.class === 'trust-high' ? 'official' : 'verified'}`)} (${Math.round(spot.trustScore * 100)}%)</span>
      ${spot.source ? `<span class="badge">${spot.source}</span>` : ''}
    </div>

    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
      📍 ${displayAddress || ''}
    </div>

    <div class="section-title">${t('app.accessibility')}</div>
    <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: var(--radius-md); margin-bottom: 16px;">
      ${accItems || '<div style="font-size: 0.8rem; color: var(--text-muted);">詳細情報なし</div>'}
    </div>

    ${busHTML}

    ${spot.details && spot.details.description ? `
      <div class="section-title">概要・特記事項</div>
      <div style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 16px; line-height: 1.5;">
        ${currentLang === 'en' && spot.details.description_en ? spot.details.description_en : spot.details.description}
      </div>
    ` : ''}

    ${hoursHTML}

    <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 8px;">
      <a href="https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}" target="_blank" 
         style="text-decoration: none; text-align: center; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; padding: 12px; border-radius: var(--radius-md); font-weight: 600; font-size: 0.9rem;">
        🧭 ${t('app.directions')}
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
