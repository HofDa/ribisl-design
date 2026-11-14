// Facts shared by the page and the build. SITE is a placeholder until the domain is confirmed (see PRODUCT.md);
// a build can override it with the SITE_URL environment variable (the GitHub Pages build does).
export const SITE = 'https://ribisl.design';
export const INSTAGRAM = 'https://www.instagram.com/ribisl_design/';
export const HANDLE = '@ribisl_design';

// Every language has its own address, so search engines can index and link each one.
// Relative to where the site is served from (its base path: "/" locally, "/ribisl-design/" on GitHub Pages).
export const PATHS = { de: '', it: 'it/', en: 'en/' };

export const LEGAL_PATHS = {
  de: { imprint: 'impressum/', privacy: 'datenschutz/' },
  it: { imprint: 'it/note-legali/', privacy: 'it/privacy/' },
  en: { imprint: 'en/legal-notice/', privacy: 'en/privacy/' },
};
