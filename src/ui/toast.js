export function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'var(--primary)' : type === 'error' ? 'var(--danger)' : 'var(--bg-glass)';

  toast.style.cssText = `
    background: ${bg};
    color: white;
    padding: 12px 18px;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-main);
    font-size: 0.85rem;
    font-weight: 500;
    backdrop-filter: blur(12px);
    border: 1px solid var(--border-glass);
    pointer-events: auto;
    transition: opacity 0.3s ease;
  `;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
