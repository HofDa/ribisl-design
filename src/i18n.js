// Runtime copy loader: each locale lives in its own chunk so visitors only download the language they read.
export const LANGS = ['de', 'it', 'en'];

const LOADERS = {
  de: () => import('./i18n/locale-de.js'),
  it: () => import('./i18n/locale-it.js'),
  en: () => import('./i18n/locale-en.js'),
};

export const strings = {};

export async function loadLang(lang) {
  const code = LANGS.includes(lang) ? lang : 'de';
  if (!strings[code]) {
    const mod = await LOADERS[code]();
    strings[code] = mod.default;
  }
  return strings[code];
}

export function t(lang, key, vars = {}) {
  let s = strings[lang]?.[key] ?? strings.de?.[key] ?? key;
  for (const [k, v] of Object.entries(vars)) if (v != null) s = s.replaceAll(`{${k}}`, v);
  return s;
}

export function detectLang() {
  // a language's own address wins; the root page falls back to the visitor's choice or browser
  const m = location.pathname.match(/\/(it|en)\/(index\.html)?$/);
  if (m) return m[1];
  try {
    const saved = localStorage.getItem('ribisl-lang');
    if (LANGS.includes(saved)) return saved;
  } catch {}
  for (const l of navigator.languages || [navigator.language]) {
    const code = (l || '').slice(0, 2).toLowerCase();
    if (LANGS.includes(code)) return code;
  }
  return 'de';
}
