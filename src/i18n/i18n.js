import ja from './ja.json';
import en from './en.json';

const translations = { ja, en };
let currentLang = localStorage.getItem('narita_map_lang') || (navigator.language.startsWith('ja') ? 'ja' : 'en');

export function getCurrentLang() {
  return currentLang;
}

export function setLang(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('narita_map_lang', lang);
    updateDOM();
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
  }
}

export function t(key, params = {}) {
  const keys = key.split('.');
  let result = translations[currentLang];
  
  for (const k of keys) {
    if (result && result[k] !== undefined) {
      result = result[k];
    } else {
      // Fallback to Japanese if translation missing
      let fallback = translations['ja'];
      for (const fk of keys) {
        if (fallback && fallback[fk] !== undefined) {
          fallback = fallback[fk];
        } else {
          return key;
        }
      }
      return fallback;
    }
  }

  if (typeof result === 'string') {
    Object.keys(params).forEach(param => {
      result = result.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
    });
  }

  return result;
}

export function updateDOM() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      el.placeholder = t(key);
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      el.title = t(key);
    }
  });
}
