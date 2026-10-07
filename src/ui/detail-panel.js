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
  let timetableData = null; // タブ切替用にデータを保持
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
      timetableData = spot.timetable;

      // 方向一覧を取得
      const directions = [...new Set(spot.timetable.map(tt => tt.direction || tt.route))];
      const hasDirections = spot.timetable.some(tt => tt.direction);

      // タブボタン生成
      const dirTabsHTML = directions.length > 1 ? `
        <div id="dir-tabs" style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 10px;">
          ${directions.map((dir, i) => `
            <button class="dir-tab-btn${i === 0 ? ' active' : ''}" data-dir="${dir}"
              style="font-size: 0.75rem; padding: 4px 10px; border-radius: 20px; border: 1px solid var(--border-glass);
                     background: ${i === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.07)'}; color: ${i === 0 ? '#fff' : 'var(--text-muted)'};
                     cursor: pointer; white-space: nowrap;">
              🚌 ${dir}
            </button>
          `).join('')}
        </div>
      ` : '';

      // 最初の方向のコンテンツ
      const firstDir = directions[0];
      const firstEntries = spot.timetable.filter(tt => (tt.direction || tt.route) === firstDir);

      // 時刻を時間帯ごとにグループ化して表示
      const formatTimesGrid = (times) => {
        if (!times || !times.length) return '<span style="color:var(--text-muted);">－</span>';
        // 時間帯ごとにグループ化
        const byHour = {};
        times.forEach(t => {
          const h = t.split(':')[0];
          if (!byHour[h]) byHour[h] = [];
          byHour[h].push(t.split(':')[1]);
        });
        return Object.entries(byHour).map(([h, mins]) =>
          `<span style="display:inline-flex;gap:4px;margin-right:8px;margin-bottom:2px;">
            <span style="color:var(--primary-hover);font-weight:700;min-width:22px;">${h}</span>
            <span>${mins.join(' ')}</span>
          </span>`
        ).join('');
      };

      const renderEntries = (entries) => entries.map(tt => `
        <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: var(--radius-md); margin-bottom: 8px;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--primary-hover); margin-bottom: 8px;">
            🛣 ${tt.route}${tt.direction && tt.direction !== tt.route ? ` → <span style="color:var(--accent)">${tt.direction}</span>` : ''}
          </div>
          <div style="font-size: 0.78rem; margin-bottom: 6px;">
            <div style="color:var(--text-muted); margin-bottom:3px;">${t('bus.weekday')}</div>
            <div style="line-height:1.8; flex-wrap:wrap; display:flex;">
              ${formatTimesGrid(tt.weekday)}
            </div>
          </div>
          ${tt.weekend && tt.weekend.length ? `
          <div style="font-size: 0.78rem; padding-top:6px; border-top:1px solid rgba(255,255,255,0.08);">
            <div style="color:var(--text-muted); margin-bottom:3px;">${t('bus.weekend')}</div>
            <div style="line-height:1.8; flex-wrap:wrap; display:flex;">
              ${formatTimesGrid(tt.weekend)}
            </div>
          </div>` : ''}
        </div>
      `).join('');

      timetableHTML = `
        <div style="margin-top: 14px;">
          <div class="section-title">⏱️ ${t('bus.timetable')}</div>
          ${dirTabsHTML}
          <div id="timetable-content">
            ${renderEntries(firstEntries)}
          </div>
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

  // クーリングシェルター用 特殊表示
  let shelterHTML = '';
  if (spot.category === 'coolingShelter' && spot.details) {
    const d = spot.details;
    const equipList = Array.isArray(d.equipment) && d.equipment.length
      ? d.equipment.map(e => `<li style="margin-bottom:2px;">${e}</li>`).join('')
      : '';

    shelterHTML = `
      <div style="margin-top: 12px; background: rgba(100, 180, 255, 0.12); border: 1px solid rgba(100, 180, 255, 0.5); padding: 14px; border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; font-weight: 700; color: #5bb8f5; margin-bottom: 10px; letter-spacing: 0.05em;">❄️ クーリングシェルター詳細</div>
        ${d.facilityType ? `
          <div style="display: flex; gap: 8px; margin-bottom: 6px; font-size: 0.82rem;">
            <span style="color: var(--text-muted); min-width: 80px;">${t('shelter.facilityType')}</span>
            <span style="font-weight: 600;">${d.facilityType}</span>
          </div>` : ''}
        ${d.openSpace ? `
          <div style="display: flex; gap: 8px; margin-bottom: 6px; font-size: 0.82rem;">
            <span style="color: var(--text-muted); min-width: 80px;">${t('shelter.openSpace')}</span>
            <span>${d.openSpace}</span>
          </div>` : ''}
        ${d.capacity ? `
          <div style="display: flex; gap: 8px; margin-bottom: 6px; font-size: 0.82rem;">
            <span style="color: var(--text-muted); min-width: 80px;">${t('shelter.capacity')}</span>
            <span style="font-weight: 600;">${d.capacity}</span>
          </div>` : ''}
        ${d.openHours ? `
          <div style="display: flex; gap: 8px; margin-bottom: 6px; font-size: 0.82rem;">
            <span style="color: var(--text-muted); min-width: 80px;">${t('shelter.openHours')}</span>
            <span>${d.openHours}</span>
          </div>` : ''}
        ${d.closedDays ? `
          <div style="display: flex; gap: 8px; margin-bottom: 6px; font-size: 0.82rem;">
            <span style="color: var(--text-muted); min-width: 80px;">${t('shelter.closedDays')}</span>
            <span>${d.closedDays}</span>
          </div>` : ''}
        ${d.targetAlert ? `
          <div style="margin-bottom: 8px; padding: 8px; background: rgba(255,200,0,0.15); border-left: 3px solid #f5a623; border-radius: 4px; font-size: 0.8rem;">
            ⚠️ <strong>${t('shelter.targetAlert')}:</strong> ${d.targetAlert}
          </div>` : ''}
        ${equipList ? `
          <div style="margin-top: 4px; font-size: 0.82rem;">
            <div style="color: var(--text-muted); margin-bottom: 4px;">${t('shelter.equipment')}:</div>
            <ul style="margin: 0; padding-left: 18px; color: var(--text-main);">${equipList}</ul>
          </div>` : ''}
      </div>
    `;
  }

  // 指定緊急避難場所用 特殊表示
  let evacuationHTML = '';
  if (spot.category === 'evacuation') {
    const d = spot.details || {};
    const types = Array.isArray(spot.types) ? spot.types : [];
    const typeBadges = types.map(tp => {
      const label = t(`evacuation.${tp}`) || tp;
      return `<span class="badge" style="background: rgba(220, 38, 38, 0.2); border: 1px solid #ef4444; color: #fca5a5; font-size: 0.75rem;">🛡️ ${label}</span>`;
    }).join(' ');

    const equipList = Array.isArray(d.equipment) && d.equipment.length
      ? d.equipment.map(e => `<li style="margin-bottom:2px;">${e}</li>`).join('')
      : '';

    evacuationHTML = `
      <div style="margin-top: 12px; background: rgba(220, 38, 38, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); padding: 14px; border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; font-weight: 700; color: #f87171; margin-bottom: 10px; letter-spacing: 0.05em;">🏃 指定避難所・避難場所情報</div>
        ${types.length ? `
          <div style="margin-bottom: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">${t('evacuation.disasterTypes')}:</div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">${typeBadges}</div>
          </div>` : ''}
        ${spot.capacity ? `
          <div style="display: flex; gap: 8px; margin-bottom: 6px; font-size: 0.82rem;">
            <span style="color: var(--text-muted); min-width: 80px;">${t('evacuation.capacity')}</span>
            <span style="font-weight: 600;">約 ${spot.capacity} 名</span>
          </div>` : ''}
        ${d.facilityType ? `
          <div style="display: flex; gap: 8px; margin-bottom: 6px; font-size: 0.82rem;">
            <span style="color: var(--text-muted); min-width: 80px;">${t('evacuation.facilityType')}</span>
            <span>${d.facilityType}</span>
          </div>` : ''}
        ${spot.note ? `
          <div style="margin-bottom: 6px; font-size: 0.82rem; color: var(--accent);">
            📢 ${spot.note}
          </div>` : ''}
        ${equipList ? `
          <div style="margin-top: 6px; font-size: 0.82rem;">
            <div style="color: var(--text-muted); margin-bottom: 4px;">${t('evacuation.equipment')}:</div>
            <ul style="margin: 0; padding-left: 18px; color: var(--text-main);">${equipList}</ul>
          </div>` : ''}
      </div>
    `;
  }

  // 営業時間
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
    ${shelterHTML}
    ${evacuationHTML}

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

  // 方向タブ切替イベント
  if (timetableData) {
    const dirTabs = document.getElementById('dir-tabs');
    const timetableContent = document.getElementById('timetable-content');
    if (dirTabs && timetableContent) {
      dirTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.dir-tab-btn');
        if (!btn) return;
        const selectedDir = btn.dataset.dir;

        // タブのアクティブ状態を更新
        dirTabs.querySelectorAll('.dir-tab-btn').forEach(b => {
          const isActive = b.dataset.dir === selectedDir;
          b.style.background = isActive ? 'var(--primary)' : 'rgba(255,255,255,0.07)';
          b.style.color = isActive ? '#fff' : 'var(--text-muted)';
        });

        // 選択された方向のエントリを表示
        const entries = timetableData.filter(tt => (tt.direction || tt.route) === selectedDir);

        // 時刻グリッド化ヘルパー
        const fmtGrid = (times) => {
          if (!times || !times.length) return '<span style="color:var(--text-muted);">－</span>';
          const byHour = {};
          times.forEach(t => { const h = t.split(':')[0]; (byHour[h] = byHour[h] || []).push(t.split(':')[1]); });
          return Object.entries(byHour).map(([h, mins]) =>
            `<span style="display:inline-flex;gap:4px;margin-right:8px;margin-bottom:2px;">
              <span style="color:var(--primary-hover);font-weight:700;min-width:22px;">${h}</span>
              <span>${mins.join(' ')}</span>
            </span>`
          ).join('');
        };

        timetableContent.innerHTML = entries.map(tt => `
          <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: var(--radius-md); margin-bottom: 8px;">
            <div style="font-size: 0.82rem; font-weight: 700; color: var(--primary-hover); margin-bottom: 8px;">
              🛣 ${tt.route}${tt.direction && tt.direction !== tt.route ? ` → <span style="color:var(--accent)">${tt.direction}</span>` : ''}
            </div>
            <div style="font-size: 0.78rem; margin-bottom: 6px;">
              <div style="color:var(--text-muted); margin-bottom:3px;">平日ダイヤ</div>
              <div style="line-height:1.8; flex-wrap:wrap; display:flex;">${fmtGrid(tt.weekday)}</div>
            </div>
            ${tt.weekend && tt.weekend.length ? `
            <div style="font-size: 0.78rem; padding-top:6px; border-top:1px solid rgba(255,255,255,0.08);">
              <div style="color:var(--text-muted); margin-bottom:3px;">土休日ダイヤ</div>
              <div style="line-height:1.8; flex-wrap:wrap; display:flex;">${fmtGrid(tt.weekend)}</div>
            </div>` : ''}
          </div>
        `).join('');
      });
    }
  }
}

export function hideDetail() {
  const panel = document.getElementById('detail-panel');
  if (panel) panel.classList.remove('open');
}
