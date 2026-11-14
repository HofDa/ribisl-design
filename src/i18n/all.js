import de from './locale-de.js';
import it from './locale-it.js';
import en from './locale-en.js';

export const strings = { de, it, en };

export function t(lang, key, vars = {}) {
  let s = strings[lang]?.[key] ?? strings.de[key] ?? key;
  for (const [k, v] of Object.entries(vars)) if (v != null) s = s.replaceAll(`{${k}}`, v);
  return s;
}
