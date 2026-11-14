import { defineConfig } from 'vite';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { strings, t } from './src/i18n.js';
import { SITE, INSTAGRAM, PATHS, LEGAL_PATHS } from './src/site.js';
import { renderLegalPage } from './src/legal-pages.js';

// The page fills its copy in with JavaScript, which many crawlers and AI answer engines never run.
// So the build writes every language out as finished HTML at its own address, with the metadata,
// structured data and machine-readable summaries that search and AI engines read.

// Where the site lives: GitHub Pages serves it from /ribisl-design/ at hofda.github.io (set by the deploy workflow).
const BASE = process.env.BASE_PATH || '/';
const SITE_URL = (process.env.SITE_URL || SITE).replace(/\/$/, '');

const LOCALES = { de: 'de_IT', it: 'it_IT', en: 'en' };
const ITEMS = ['a', 'b', 'c', 'd'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const url = (lang) => `${SITE_URL}/${PATHS[lang]}`;

function jsonLd(lang) {
  const brand = SITE_URL + '/#ribisl';
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': SITE_URL + '/#katrin',
        name: 'Katrin',
        jobTitle: { de: 'Künstlerin', it: 'Artista', en: 'Artist' }[lang],
        worksFor: { '@id': brand },
        sameAs: [INSTAGRAM],
      },
      {
        '@type': 'LocalBusiness',
        '@id': brand,
        name: 'ribisl design',
        url: SITE_URL + '/',
        logo: SITE_URL + '/favicon.svg',
        description: t(lang, 'meta.desc'),
        slogan: t(lang, 's1.tagline'),
        founder: { '@id': SITE_URL + '/#katrin' },
        address: { '@type': 'PostalAddress', addressLocality: 'Bozen / Bolzano', addressRegion: 'Südtirol / Alto Adige', addressCountry: 'IT' },
        areaServed: 'Südtirol / Alto Adige',
        knowsLanguage: ['de', 'it', 'en'],
        sameAs: [INSTAGRAM],
      },
      {
        '@type': 'WebSite',
        '@id': url(lang) + '#website',
        url: url(lang),
        name: 'ribisl design',
        inLanguage: lang,
        publisher: { '@id': brand },
      },
    ],
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function head(lang, fonts = []) {
  const title = esc(t(lang, 'meta.title'));
  const desc = esc(t(lang, 'meta.desc'));
  return [
    '<!--seo-->',
    `<link rel="canonical" href="${url(lang)}" />`,
    ...Object.keys(PATHS).map((l) => `<link rel="alternate" hreflang="${l}" href="${url(l)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${url('de')}" />`,
    // the fonts the first screen needs (text and the wordmark), fetched alongside the CSS instead of after it
    ...fonts.map((f) => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin />`),
    `<link rel="preload" href="${BASE}fabric/yellow.webp" as="image" type="image/webp" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="ribisl design" />',
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${url(lang)}" />`,
    `<meta property="og:locale" content="${LOCALES[lang]}" />`,
    ...Object.keys(LOCALES).filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${LOCALES[l]}" />`),
    '<meta name="twitter:card" content="summary" />',
    `<script type="application/ld+json">${jsonLd(lang)}</script>`,
    // without JavaScript the nine screens simply stack, readable top to bottom
    '<noscript><style>html,body{height:auto;overflow:auto}body{background:#F3EDE2;touch-action:auto}#cloth-background,#cloth,.hud{display:none}#plate{position:static;width:auto;height:auto;transform:none}.screen{position:relative;left:auto;top:auto;width:auto;height:auto;min-height:100vh;opacity:1;overflow:visible;content-visibility:visible}.tag--big .smile-red{opacity:1}</style></noscript>',
    '<!--/seo-->',
  ].filter(Boolean).join('\n  ');
}

// Write one language into the page: copy, labels, metadata. Idempotent, so any language can be made from any other.
function localize(html, lang, fonts) {
  return html
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(t(lang, 'meta.title'))}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(t(lang, 'meta.desc'))}" />`)
    .replace(/\s*<!--seo-->[\s\S]*?<!--\/seo-->/, '')
    .replace('</head>', `  ${head(lang, fonts)}\n</head>`)
    .replace(/<(\w+)(\s[^>]*?\bdata-i18n="([^"]+)"[^>]*)>[^<]*<\/\1>/g, (_, tag, attrs, key) => `<${tag}${attrs}>${esc(t(lang, key))}</${tag}>`)
    .replace(/<[^>]*\bdata-i18n-label="([^"]+)"[^>]*>/g, (tag, key) => tag.replace(/aria-label="[^"]*"/, `aria-label="${esc(t(lang, key))}"`))
    .replace(/<a\b[^>]*\bdata-legal="(imprint|privacy)"[^>]*>/g, (tag, kind) => tag.replace(/href="[^"]*"/, `href="${BASE}${LEGAL_PATHS[lang][kind]}"`))
    .replace(/(<button[^>]*data-lang="(\w+)"[^>]*?)(?: aria-pressed="\w+")?>/g, (_, open, l) => `${open} aria-pressed="${l === lang}">`)
    .replace(/<span id="year">[^<]*<\/span>/, `<span id="year">${new Date().getFullYear()}</span>`)
    // files from public/ are addressed from the root; on a sub-path (GitHub Pages) they need the base in front
    .replace(/([\s"'(])\/(fabric|swatch|pieces|katrin|mediapipe|favicon\.svg)/g, `$1${BASE}$2`);
}

function robots() {
  const welcome = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'];
  return [
    'User-agent: *',
    'Allow: /',
    '',
    '# Search and AI answer engines are welcome to read and cite this site.',
    ...welcome.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const alts = Object.keys(PATHS).map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${url(l)}" />`).join('\n');
  const urls = Object.keys(PATHS).map((l) => `  <url>\n    <loc>${url(l)}</loc>\n    <lastmod>${today}</lastmod>\n${alts}\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

// A plain summary for AI assistants (llmstxt.org), built from the same copy as the page.
function llms() {
  const en = (k) => t('en', k);
  return [
    '# ribisl design',
    '',
    `> ${en('meta.desc')}`,
    '',
    en('s2.p1'),
    '',
    '## Materials',
    ...ITEMS.map((k) => `- **${en(`s3.${k}.h`)}**: ${en(`s3.${k}.p`)}`),
    '',
    '## How a piece is made',
    ...ITEMS.map((k) => `- **${en(`s4.${k}.h`)}**: ${en(`s4.${k}.p`)}`),
    '',
    '## Markets',
    en('s6.p'),
    '',
    '## Courses',
    en('s7.sub'),
    ...ITEMS.map((k) => `- **${en(`s7.${k}.h`)}**: ${en(`s7.${k}.p`)}`),
    '',
    '## Contact',
    `- Instagram: ${INSTAGRAM}`,
    '- Based in Bolzano / Bozen, South Tyrol, Italy',
    '',
    '## Pages',
    `- [Deutsch](${url('de')}): ${strings.de['meta.title']}`,
    `- [Italiano](${url('it')}): ${strings.it['meta.title']}`,
    `- [English](${url('en')}): ${strings.en['meta.title']}`,
    '',
  ].join('\n');
}

function seo() {
  return {
    name: 'ribisl-seo',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url || '').split('?')[0];
        for (const [lang, paths] of Object.entries(LEGAL_PATHS)) {
          for (const [kind, route] of Object.entries(paths)) {
            if (![`${BASE}${route}`, `${BASE}${route}index.html`, `${BASE}${route.slice(0, -1)}`].includes(path)) continue;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(renderLegalPage(lang, kind, {
              base: BASE,
              fontUrl: `${BASE}node_modules/@fontsource-variable/gabarito/files/gabarito-latin-wght-normal.woff2`,
            }));
            return;
          }
        }
        next();
      });
    },
    // the dev server shows the same finished German page the build ships at /
    transformIndexHtml: { order: 'post', handler: (html) => localize(html, 'de') },
    writeBundle({ dir }) {
      const assets = readdirSync(join(dir, 'assets'));
      const fonts = [/^gabarito-latin-wght-normal-.*\.woff2$/, /^outfit-latin-wght-normal-.*\.woff2$/]
        .map((re) => assets.find((f) => re.test(f))).filter(Boolean).map((f) => `${BASE}assets/${f}`);
      const base = readFileSync(join(dir, 'index.html'), 'utf8');
      for (const lang of Object.keys(PATHS)) {
        const out = join(dir, PATHS[lang]);
        mkdirSync(out, { recursive: true });
        writeFileSync(join(out, 'index.html'), localize(base, lang, fonts));
        for (const [kind, route] of Object.entries(LEGAL_PATHS[lang])) {
          const legalOut = join(dir, route);
          mkdirSync(legalOut, { recursive: true });
          writeFileSync(join(legalOut, 'index.html'), renderLegalPage(lang, kind, { base: BASE, fontUrl: fonts[0] }));
        }
      }
      writeFileSync(join(dir, 'robots.txt'), robots());
      writeFileSync(join(dir, 'sitemap.xml'), sitemap());
      writeFileSync(join(dir, 'llms.txt'), llms());
    },
  };
}

export default defineConfig({ base: BASE, plugins: [seo()] });
