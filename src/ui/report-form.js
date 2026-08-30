import { t } from '../i18n/i18n';
import { CATEGORIES, ACCESSIBILITY_ATTRS } from '../utils/constants';
import { saveReport } from '../crowdsource/storage';
import { showToast } from './toast';

export function showReportForm(onSuccess) {
  const modal = document.getElementById('report-modal');
  if (!modal) return;

  modal.innerHTML = `
    <div style="
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-glass);
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 500px;
      padding: 24px;
      box-shadow: var(--shadow-main);
      color: var(--text-main);
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 1.1rem; font-weight: 700;">${t('report.title')}</h3>
        <button id="close-modal-btn" class="btn-icon">✕</button>
      </div>

      <form id="report-form" style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${t('report.spotName')}</label>
          <input type="text" id="report-name" required placeholder="${t('report.spotNamePlaceholder')}" 
                 style="width: 100%; padding: 8px 12px; margin-top: 4px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); border-radius: var(--radius-sm); color: var(--text-main);" />
        </div>

        <div>
          <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${t('report.category')}</label>
          <select id="report-category" required style="width: 100%; padding: 8px 12px; margin-top: 4px; background: var(--bg-main); border: 1px solid var(--border-glass); border-radius: var(--radius-sm); color: var(--text-main);">
            ${Object.keys(CATEGORIES).map(k => `<option value="${k}">${t(`categories.${k}`)}</option>`).join('')}
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <label style="font-size: 0.8rem; color: var(--text-muted);">緯度 (Lat)</label>
            <input type="number" step="any" id="report-lat" required value="35.7764" style="width: 100%; padding: 8px; margin-top: 4px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); border-radius: var(--radius-sm); color: var(--text-main);" />
          </div>
          <div>
            <label style="font-size: 0.8rem; color: var(--text-muted);">経度 (Lng)</label>
            <input type="number" step="any" id="report-lng" required value="140.3184" style="width: 100%; padding: 8px; margin-top: 4px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); border-radius: var(--radius-sm); color: var(--text-main);" />
          </div>
        </div>

        <div>
          <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${t('report.accessibilitySelect')}</label>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-top: 6px;">
            ${ACCESSIBILITY_ATTRS.map(attr => `
              <label style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                <input type="checkbox" name="report-acc" value="${attr}" />
                ${t(`accessibility.${attr}`)}
              </label>
            `).join('')}
          </div>
        </div>

        <div>
          <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${t('report.comment')}</label>
          <textarea id="report-comment" rows="2" placeholder="${t('report.commentPlaceholder')}" style="width: 100%; padding: 8px; margin-top: 4px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); border-radius: var(--radius-sm); color: var(--text-main);"></textarea>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button type="button" id="cancel-report-btn" style="flex: 1; padding: 10px; background: transparent; border: 1px solid var(--border-glass); border-radius: var(--radius-md); color: var(--text-main); font-weight: 600;">${t('report.cancel')}</button>
          <button type="submit" style="flex: 1; padding: 10px; background: var(--primary); border: none; border-radius: var(--radius-md); color: white; font-weight: 600;">${t('report.submit')}</button>
        </div>
      </form>
    </div>
  `;

  modal.style.display = 'flex';

  const close = () => { modal.style.display = 'none'; };
  document.getElementById('close-modal-btn')?.addEventListener('click', close);
  document.getElementById('cancel-report-btn')?.addEventListener('click', close);

  document.getElementById('report-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('report-name').value;
    const category = document.getElementById('report-category').value;
    const lat = document.getElementById('report-lat').value;
    const lng = document.getElementById('report-lng').value;
    const comment = document.getElementById('report-comment').value;

    const accBoxes = document.querySelectorAll('input[name="report-acc"]:checked');
    const accessibility = {};
    accBoxes.forEach(cb => { accessibility[cb.value] = true; });

    saveReport({ name, category, lat, lng, comment, accessibility });

    close();
    showToast(t('report.success'), 'success');
    if (onSuccess) onSuccess();
  });
}
