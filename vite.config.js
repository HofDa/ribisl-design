import { defineConfig } from 'vite';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { strings, t } from './src/i18n/all.js';
import { SITE, INSTAGRAM, PATHS, LEGAL_PATHS } from './src/site.js';
import { renderLegalPage } from './src/legal-pages.js';

const CRITICAL_S1_CSS = ':root{--linen:#f3ede2;--tag:#fbf9f4;--red:#c4122f;--red-deep:#9e0e26;--red-soft:#f5cdd3;--ink:#1e181a;--mat:#3d6a5a;--hair:1px;--mark:"Outfit Variable","Outfit",var(--font);--hand:"Caveat Variable","Caveat",cursive;--font:"Gabarito Variable","Gabarito",ui-rounded,system-ui,sans-serif;--pad:clamp(22px,5vw,84px);--pad-top:max(var(--pad),76px);--pad-bottom:max(var(--pad),104px);--W:100vw;--H:100vh;color-scheme:light only}@media (resolution>=2x){:root{--hair:.5px}}*,:before,:after{box-sizing:border-box}html,body{overscroll-behavior:none;height:100%;margin:0;overflow:hidden}body{background:var(--mat);color:var(--ink);font-family:var(--font);-webkit-font-smoothing:antialiased;text-rendering:optimizelegibility;touch-action:none;font-size:1.0625rem;line-height:1.5}h1,h2,h3,p,ul,ol,dl,dd,figure{margin:0;padding:0}.sr-only{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}.ico{flex:none;width:1.15em;height:1.15em}.smile{color:var(--ink);display:block;overflow:visible}.smile-red{color:var(--red);transform:translate(5px,4px)}#cloth-background,#cloth{pointer-events:none;width:100%;height:100%;display:block;position:fixed;inset:0}#plate{width:calc(var(--W) * 3);height:calc(var(--H) * 3);transform-origin:0 0;will-change:transform;position:fixed;top:0;left:0}.screen{left:calc(var(--c,0) * var(--W));top:calc(var(--r,0) * var(--H));width:var(--W);height:var(--H);padding:var(--pad-top) var(--pad) var(--pad-bottom);overscroll-behavior:contain;touch-action:pan-y;content-visibility:hidden;position:absolute;overflow:hidden auto}.screen.is-rendered,.screen.is-measuring{content-visibility:visible}:root:not(.is-ready) body:not(:has(.screen:target:not(.s1))) .s1{content-visibility:visible;background:#f7ab28 url(/fabric/yellow.webp) 0 0/819px 818px}:root:not(.is-css-ready) .hud{opacity:0;pointer-events:none}.s1{--c:0;--r:0}.s2{--c:0;--r:1}.s3{--c:0;--r:2}.s4{--c:1;--r:2}.s5{--c:2;--r:2}.s6{--c:2;--r:1}.s7{--c:2;--r:0}.s8{--c:1;--r:0}.s9{--c:1;--r:1}.wordmark{width:fit-content;font-family:var(--mark);font-size:clamp(4.6rem,17vw,16.5rem);font-weight:var(--mark-w,200);letter-spacing:-.015em;align-items:flex-end;gap:.12em;margin-left:-.05em;line-height:.8;display:flex}.lede{text-wrap:pretty;max-width:34ch;font-size:clamp(1.15rem,1.55vw,1.5rem);font-weight:420;line-height:1.38}p{text-wrap:pretty}.textlink{text-underline-offset:.24em;text-decoration:underline;text-decoration-thickness:2px;-webkit-text-decoration-color:var(--line,var(--red));text-decoration-color:var(--line,var(--red));font-weight:640;text-decoration-style:dashed;display:inline-block}.label{font:640 .8rem/1.2 var(--font);letter-spacing:.05em;text-transform:uppercase;color:var(--ink);align-items:center;gap:.5em;display:inline-flex;background:var(--tag);outline-offset:-4px;outline:1px dashed #1e181a80;padding:.55em .85em;box-shadow:0 1px #1e181a1f}.tag{aspect-ratio:1;background:var(--tag);outline-offset:-4px;outline:1px dashed #1e181a73;place-items:center;width:3rem;display:grid;box-shadow:0 1px 2px #1e181a29}.tag .smile{width:58%;height:58%}.label--intro{top:var(--pad-top);left:var(--pad);position:absolute}.s1-body{left:var(--pad);right:var(--pad);bottom:var(--pad-bottom);position:absolute}.s1-copy{grid-template-columns:minmax(0,auto) minmax(0,34ch);align-items:start;gap:.6rem clamp(1.5rem,4vw,4rem);max-width:64rem;margin-top:clamp(1.2rem,2.6vw,2.4rem);display:grid}.tagline{letter-spacing:-.025em;width:fit-content;font-size:clamp(1.6rem,2.7vw,2.6rem);font-weight:700;line-height:1}.s1-copy .textlink{grid-column:2}.hint{top:calc(var(--pad-top) + 3.4rem);right:var(--pad);text-align:right;max-width:18ch;font-size:.9rem;font-weight:550;position:absolute}.mark-row{flex-wrap:wrap;align-items:flex-end;gap:.6rem clamp(.8rem,2vw,2rem);display:flex}.bench--jeans{align-items:flex-end;gap:clamp(.8rem,1.6vw,1.6rem);display:flex}.jeans{touch-action:none;cursor:crosshair;filter:drop-shadow(0 3px 2px #1e181a40)drop-shadow(0 14px 18px #1e181a38);width:auto;height:clamp(4.4rem,15vw,14.5rem);margin-bottom:.2rem;display:block;overflow:visible;rotate:3deg}.jeans .hop{transform-box:fill-box;transform-origin:50% 80%}.jeans .cut-guide{fill:none;stroke:#fbf9f4;stroke-width:1.6px;stroke-dasharray:5 4}.jeans .cut-done{fill:none;stroke:#fbf9f4;stroke-width:2px;stroke-dasharray:100;stroke-dashoffset:100px}.jeans .cut-scissors{pointer-events:none}.jeans .hole,.jeans .piece-out{opacity:0}.bench-note{justify-items:start;gap:.45rem;max-width:12rem;margin-bottom:.6rem;display:grid}.cut-btn{font:600 .9rem/1.3 var(--font);color:inherit;text-align:left;-webkit-text-decoration:underline dashed var(--red) 2px;text-decoration:underline dashed var(--red) 2px;text-underline-offset:.25em;cursor:pointer;background:0 0;border:0;padding:0}.cut-done-note{display:none}@media (max-width:900px){.s1-copy{grid-template-columns:1fr}.s1-copy .textlink{grid-column:1}}@media (max-width:600px){:root{--pad-top:68px;--pad-bottom:96px}.hint{display:none}.s1{display:flex;flex-direction:column}.label--intro{position:static;align-self:flex-start}.s1-body{position:static;flex:1;display:flex;flex-direction:column;justify-content:space-evenly;gap:1.2rem;margin-top:.8rem}.mark-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:0 .9rem}.wordmark{grid-column:1/-1;position:relative;z-index:1;font-size:min(31vw,9.5rem)}.bench--jeans{display:contents}.jeans{grid-column:2;grid-row:2;height:min(47vw,220px);margin:-.9rem 0 0;rotate:4deg}.bench-note{grid-column:1;grid-row:2;max-width:none;margin:.6rem 0 0;gap:.6rem}.bench-note .label{font-size:.7rem;line-height:1.3;rotate:-1.5deg}.cut-btn{font-size:.85rem}.s1-copy{margin-top:0}}@media (max-width:600px) and (max-height:700px){:root{--pad-top:64px;--pad-bottom:92px}.wordmark{font-size:min(25vw,9.5rem)}.jeans{height:min(36vw,170px)}.s1-body{gap:.8rem;margin-top:.4rem}}@media (min-width:901px){.s1{display:grid;align-items:center}.s1-body{position:static;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,1fr);column-gap:clamp(2rem,6vw,8rem);row-gap:clamp(1.5rem,3vh,3rem);align-content:center;width:100%;padding-top:2rem}.s1 .mark-row{display:contents}.s1 .wordmark{grid-column:1;grid-row:1;align-self:end;font-size:clamp(8rem,18vw,21rem)}.s1 .bench--jeans{grid-column:2;grid-row:1/3;display:grid;justify-items:center;align-self:center;gap:1.5rem}.s1 .jeans{height:clamp(220px,min(49vh,40vw),620px);margin:0}.s1 .bench-note{max-width:23rem;margin:0;justify-items:center;text-align:center}.s1 .s1-copy{grid-column:1;grid-row:2;grid-template-columns:minmax(0,1fr);margin:0;gap:1.2rem}.s1 .s1-copy .textlink{grid-column:1;justify-self:start}.s1 .tagline{font-size:clamp(1.8rem,3vw,3.2rem)}.s1 .lede{max-width:40ch}.s1 .hint{top:var(--pad-top);max-width:28ch}}@media (min-width:901px) and (max-height:780px){.s1 .jeans{height:min(45vh,40vw)}.s1 .s1-copy{gap:.8rem}}';

const S1_KEYS = ['s1.langs', 's1.cut', 's1.cutBtn', 's1.cutDone', 's1.tagline', 's1.intro', 's1.skip', 's1.hint'];
const pickKeys = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));
const S1_PREPAINT_LANG = `<script>(function(){try{var s=localStorage.getItem('ribisl-lang'),l=s||(navigator.languages||[navigator.language]).map(function(x){return(x||'').slice(0,2)}).find(function(x){return x==='de'||x==='it'||x==='en'})||'de';if(l!=='de'){var t=l==='it'?${JSON.stringify(pickKeys(strings.it, S1_KEYS))}:${JSON.stringify(pickKeys(strings.en, S1_KEYS))};var p=document.querySelector('.s1');document.documentElement.lang=l;document.documentElement.dataset.prepaintLang=l;p.querySelectorAll('[data-i18n]').forEach(function(e){var k=e.getAttribute('data-i18n');if(t[k])e.textContent=t[k]})}}catch(e){}})()</script>`;

function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->\s*/g, (m, offset, str) => {
    const before = str.slice(Math.max(0, offset - 200), offset);
    if (/<script[^>]*>[^<]*$/i.test(before) || /<style[^>]*>[^<]*$/i.test(before)) return m;
    return '';
  });
}

function minifyHtml(html) {
  const held = [];
  const hold = (m) => `\0H${held.push(m) - 1}\0`;
  const structural = 'html|head|meta|link|title|script|style|noscript|body|canvas|main|section|header|footer|nav|aside|div|ul|ol|li|dl|dt|dd|figure|figcaption|p|h[1-6]|svg|br';
  const openOrClose = new RegExp(`(<\\/?(?:${structural})\\b[^>]*>)\\s*\\n\\s*`, 'g');
  const beforeTag = new RegExp(`\\s*\\n\\s*(<\\/?(?:${structural})\\b[^>]*>)`, 'g');
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, hold)
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g, (svg) => hold(svg.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ')))
    .replace(openOrClose, '$1')
    .replace(beforeTag, '$1')
    .replace(/\0H(\d+)\0/g, (_, i) => held[Number(i)]);
}

function inlineCriticalAndDeferCss(html, lang, { gabaritoHref = '', outfitDataUri = '', localeHref = '' } = {}, outDir = 'dist') {
  const cssMatch = html.match(/<link rel="stylesheet" crossorigin href="([^"]*\/assets\/index-[^"]+\.css)">/);
  if (!cssMatch) return html;
  const cssHref = cssMatch[1];
  const cssFile = cssHref.split('/').pop();
  const assetsDir = join(outDir, 'assets');
  let fontFaces = '';
  try {
    const builtCss = readFileSync(join(assetsDir, cssFile), 'utf8');
    const matches = builtCss.match(/@font-face\{[^}]*\}/g) || [];
    fontFaces = matches.filter((f) => /gabarito-latin/.test(f)).join('');
  } catch {}
  if (outfitDataUri) {
    fontFaces += `@font-face{font-family:Outfit Variable;font-style:normal;font-display:swap;font-weight:100 900;src:url(${outfitDataUri}) format("woff2")}`;
  }
  const preloads = [
    gabaritoHref ? `<link rel="preload" href="${gabaritoHref}" as="font" type="font/woff2" crossorigin />` : '',
    `<link rel="preload" href="${BASE}fabric/yellow.webp" as="image" type="image/webp" />`,
    `<link rel="preload" href="${BASE}swatch/denim-160w.webp" as="image" type="image/webp" />`,
  ].filter(Boolean).join('\n  ');
  const localePreload = localeHref ? `\n  <link rel="modulepreload" crossorigin href="${localeHref}">` : '';
  // Remove duplicate preloads from <!--seo--> and put all preloads + critical CSS before <script type="module">
  let out = html
    .replace(/\s*<link rel="preload" href="[^"]*" as="(?:font|image)"[^>]*\/>/g, '')
    .replace(cssMatch[0], `<link rel="preload" as="style" data-async-css crossorigin href="${cssHref}" onload="this.onload=null;this.rel='stylesheet'" />\n  <noscript><link rel="stylesheet" crossorigin href="${cssHref}" /></noscript>`)
    .replace(
      /(\s*)(<script type="module"[^>]*><\/script>)/,
      `$1${preloads}$1<style>${fontFaces}${CRITICAL_S1_CSS.replace(/\/fabric\/yellow\.webp/g, `${BASE}fabric/yellow.webp`)}</style>$1$2${localePreload}`,
    );
  if (lang === 'de') {
    out = out.replace('</main>', `</main>\n  ${S1_PREPAINT_LANG}`);
  }
  return minifyHtml(stripHtmlComments(out));
}

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

const FAQ_BY_LANG = {
  de: [
    ['Wo kann man Stücke von ribisl design kaufen?', 'Es gibt keinen Onlineshop. Alle Upcycling-Einzelstücke entstehen in Handarbeit in Bozen und werden auf lokalen Märkten in Südtirol sowie auf Instagram (@ribisl_design) gezeigt und angefragt.'],
    ['Welche Materialien und Stücke fertigt Katrin Unterhofer?', 'Aus altem Denim, Stoffresten, Seil & Kordel sowie Strick entstehen handgenähte Unikate: Westen, Bauchtaschen / Crossbags, Täschchen, Wendehüte, Körbe und Rucksäcke.'],
    ['Kann man Nähkurse oder einen Marktstand für ein Event buchen?', 'Ja. Katrin bietet Upcycling-Nähkurse (Grundlagen, Auftrennen & neu denken, das erste eigene Stück) an und baut auf Anfrage Stände bei Märkten und Events auf – Anfragen über Instagram (@ribisl_design).'],
    ['In welchen Sprachen ist der Kontakt möglich?', 'Katrin antwortet auf Instagram auf Deutsch, Italienisch und Englisch.'],
  ],
  it: [
    ['Dove si possono acquistare i pezzi di ribisl design?', 'Non c’è uno shop online. Tutti i pezzi unici in upcycling nascono a mano a Bolzano e vengono presentati ai mercatini locali in Alto Adige e su Instagram (@ribisl_design), dove si può scrivere per informazioni.'],
    ['Che materiali e creazioni realizza Katrin Unterhofer?', 'Da vecchi jeans (denim), ritagli di stoffa, corda e maglia nascono pezzi unici cuciti a mano: gilet, marsupi e borse, pochette, cappelli reversibili, cestini e zaini.'],
    ['Si possono prenotare corsi di cucito o uno stand per un evento?', 'Sì. Katrin tiene corsi di cucito creativo e upcycling (basi dell’upcycling, scucire e ripensare, il primo pezzo tuo) ed è disponibile su richiesta per allestire uno stand a mercatini ed eventi tramite Instagram (@ribisl_design).'],
    ['In quali lingue risponde ribisl design?', 'Katrin risponde su Instagram in tedesco, italiano e inglese.'],
  ],
  en: [
    ['Where can I buy ribisl design pieces?', 'There is no online shop. Every one-of-a-kind upcycled piece is handmade in Bolzano, shown at local markets across South Tyrol, and featured on Instagram (@ribisl_design) for inquiries.'],
    ['What materials and pieces does Katrin Unterhofer make?', 'From old denim, fabric scraps, coiled rope and reclaimed knitwear, Katrin sews one-off pieces including vests, belt and crossbody bags, pouches, reversible bucket hats, baskets and backpacks.'],
    ['Can I book a sewing workshop or a market stall for an event?', 'Yes. Katrin runs sewing and upcycling workshops (basics, unpicking & rethinking, making your first piece) and sets up market stalls for events on request via Instagram (@ribisl_design).'],
    ['Which languages can I write in?', 'Katrin replies on Instagram in German, Italian and English.'],
  ],
};

function jsonLd(lang) {
  const brand = SITE_URL + '/#ribisl';
  const katrin = SITE_URL + '/#katrin';
  const ogImg = `${SITE_URL}/og-image.jpg`;
  const courses = ['a', 'b', 'c'].map((k) => ({
    '@type': 'Course',
    name: t(lang, `s7.${k}.h`),
    description: t(lang, `s7.${k}.p`),
    provider: { '@id': brand },
    inLanguage: ['de', 'it', 'en'],
  }));
  const pieceCategories = [
    t(lang, 's5.vests'),
    t(lang, 's5.bags'),
    t(lang, 's5.hats'),
    t(lang, 's5.packs'),
    t(lang, 's3.c.h'),
  ];
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': katrin,
        name: 'Katrin Unterhofer',
        givenName: 'Katrin',
        familyName: 'Unterhofer',
        jobTitle: { de: 'Upcycling-Künstlerin & Schneiderin', it: 'Artista tessile & upcycling', en: 'Upcycling Artist & Maker' }[lang],
        worksFor: { '@id': brand },
        homeLocation: { '@type': 'Place', name: 'Bozen / Bolzano, Südtirol / Alto Adige, Italia' },
        knowsLanguage: ['de', 'it', 'en'],
        sameAs: [INSTAGRAM],
        performerIn: [
          { '@type': 'Event', name: t(lang, 's7.ref1sr'), location: { '@type': 'Place', name: t(lang, 's7.ref1p') } },
          { '@type': 'Event', name: t(lang, 's7.ref2sr'), location: { '@type': 'Place', name: t(lang, 's7.ref2p') } },
          { '@type': 'Event', name: t(lang, 's7.ref3sr'), location: { '@type': 'Place', name: t(lang, 's7.ref3p') } },
        ],
      },
      {
        '@type': 'LocalBusiness',
        '@id': brand,
        name: 'ribisl design',
        url: SITE_URL + '/',
        logo: SITE_URL + '/favicon.svg',
        image: ogImg,
        description: t(lang, 'meta.desc'),
        slogan: t(lang, 's1.tagline'),
        founder: { '@id': katrin },
        address: { '@type': 'PostalAddress', addressLocality: 'Bozen / Bolzano', addressRegion: 'Südtirol / Alto Adige', addressCountry: 'IT' },
        geo: { '@type': 'GeoCoordinates', latitude: 46.4983, longitude: 11.3548 },
        areaServed: ['Bozen', 'Bolzano', 'Brixen', 'Bressanone', 'Südtirol', 'Alto Adige'],
        knowsLanguage: ['de', 'it', 'en'],
        knowsAbout: [t(lang, 's3.a.h'), t(lang, 's3.b.h'), t(lang, 's3.c.h'), t(lang, 's3.d.h'), ...pieceCategories, 'Upcycling'],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: { de: 'Einzelstücke & Nähkurse', it: 'Pezzi unici & corsi di cucito', en: 'One-of-a-kind pieces & sewing courses' }[lang],
          itemListElement: [
            ...pieceCategories.map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Product', name } })),
            ...courses.map((course) => ({ '@type': 'Offer', itemOffered: course })),
          ],
        },
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
      {
        '@type': 'FAQPage',
        '@id': url(lang) + '#faq',
        inLanguage: lang,
        mainEntity: FAQ_BY_LANG[lang].map(([name, text]) => ({
          '@type': 'Question',
          name,
          acceptedAnswer: { '@type': 'Answer', text },
        })),
      },
    ],
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function head(lang, fonts = []) {
  const title = esc(t(lang, 'meta.title'));
  const desc = esc(t(lang, 'meta.desc'));
  const ogImg = `${SITE_URL}/og-image.jpg`;
  const ogAlt = esc(t(lang, 'meta.ogAlt'));
  return [
    '<!--seo-->',
    `<link rel="canonical" href="${url(lang)}" />`,
    ...Object.keys(PATHS).map((l) => `<link rel="alternate" hreflang="${l}" href="${url(l)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${url('de')}" />`,
    // the fonts the first screen needs (text and the wordmark), fetched alongside the CSS instead of after it
    ...fonts.map((f) => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin />`),
    `<link rel="preload" href="${BASE}fabric/yellow.webp" as="image" type="image/webp" />`,
    `<link rel="preload" href="${BASE}swatch/denim-160w.webp" as="image" type="image/webp" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="ribisl design" />',
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${url(lang)}" />`,
    `<meta property="og:image" content="${ogImg}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${ogAlt}" />`,
    `<meta property="og:locale" content="${LOCALES[lang]}" />`,
    ...Object.keys(LOCALES).filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${LOCALES[l]}" />`),
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${ogImg}" />`,
    `<meta name="twitter:image:alt" content="${ogAlt}" />`,
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
    .replace(/<img\b[^>]*\bdata-i18n-alt="([^"]+)"[^>]*>/g, (tag, key) => tag.replace(/(\s)alt="[^"]*"/, `$1alt="${esc(t(lang, key))}"`))
    .replace(/<a\b[^>]*\bdata-legal="(imprint|privacy)"[^>]*>/g, (tag, kind) => tag.replace(/href="[^"]*"/, `href="${BASE}${LEGAL_PATHS[lang][kind]}"`))
    .replace(/(<button[^>]*data-lang="(\w+)"[^>]*?)(?: aria-pressed="\w+")?>/g, (_, open, l) => `${open} aria-pressed="${l === lang}">`)
    .replace(/<span id="year">[^<]*<\/span>/, `<span id="year">${new Date().getFullYear()}</span>`)
    // files from public/ are addressed from the root; on a sub-path (GitHub Pages) they need the base in front
    .replace(/([\s"'(])\/(fabric|swatch|pieces|katrin|mediapipe|favicon\.svg|og-image\.jpg)/g, `$1${BASE}$2`);
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
  const alts = [
    ...Object.keys(PATHS).map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${url(l)}" />`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${url('de')}" />`,
  ].join('\n');
  const urls = Object.keys(PATHS).map((l) => `  <url>\n    <loc>${url(l)}</loc>\n    <lastmod>${today}</lastmod>\n${alts}\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

// A plain summary for AI assistants (llmstxt.org), built from the same copy as the page.
function llms() {
  const en = (k) => t('en', k);
  const processSteps = ['a', 'b', 'e', 'c', 'd'];
  return [
    '# ribisl design',
    '',
    `> ${en('meta.desc')}`,
    '',
    `Created by **Katrin Unterhofer** in Bozen / Bolzano, South Tyrol (Südtirol / Alto Adige), Italy. ${en('s2.p1')}`,
    '',
    '## Handmade One-of-a-Kind Pieces',
    '- **Vests**: Upcycled denim and patterned vests, e.g. floral or appliquéd mushroom designs',
    '- **Bags & pouches**: Handmade belt/crossbody bags and small zip pouches from fabric scraps',
    '- **Reversible bucket hats**: Two-sided sun/rain hats sewn from contrasting textiles (also testable with on-device AR camera try-on and a custom fabric designer on the site)',
    '- **Rope baskets & backpacks**: Coiled-rope stitched baskets and one-off backpacks',
    '- **Availability**: No online shop; every piece exists once and is shown at local markets in and around Bolzano or inquired via Instagram.',
    '',
    '## Materials',
    ...ITEMS.map((k) => `- **${en(`s3.${k}.h`)}**: ${en(`s3.${k}.p`)}`),
    '',
    '## How a piece is made',
    ...processSteps.map((k) => `- **${en(`s4.${k}.h`)}**: ${en(`s4.${k}.p`)}`),
    '',
    '## Markets & Past Events',
    en('s6.p'),
    `- ${en('s7.ref1sr')}`,
    `- ${en('s7.ref2sr')}`,
    `- ${en('s7.ref3sr')}`,
    `- ${en('s7.ref4sr')}`,
    `- Event & market stall bookings: ${en('s7.ask')}`,
    '',
    '## Sewing & Upcycling Courses',
    en('s7.sub'),
    ...ITEMS.map((k) => `- **${en(`s7.${k}.h`)}**: ${en(`s7.${k}.p`)}`),
    '',
    '## Frequently Asked Facts',
    ...FAQ_BY_LANG.en.map(([q, a]) => `- **${q}** ${a}`),
    '',
    '## Contact & Region',
    `- Instagram: ${INSTAGRAM}`,
    '- Base: Bozen / Bolzano, Südtirol / Alto Adige, Italy (serves Bozen, Brixen / Bressanone, and local South Tyrol markets/events)',
    '- Languages spoken: German (Deutsch), Italian (Italiano), English',
    '',
    '## Pages & Legal',
    `- [Deutsch (Start)](${url('de')}): ${strings.de['meta.title']} · [Impressum](${SITE_URL}/${LEGAL_PATHS.de.imprint}) · [Datenschutz](${SITE_URL}/${LEGAL_PATHS.de.privacy})`,
    `- [Italiano](${url('it')}): ${strings.it['meta.title']} · [Note legali](${SITE_URL}/${LEGAL_PATHS.it.imprint}) · [Privacy](${SITE_URL}/${LEGAL_PATHS.it.privacy})`,
    `- [English](${url('en')}): ${strings.en['meta.title']} · [Legal notice](${SITE_URL}/${LEGAL_PATHS.en.imprint}) · [Privacy](${SITE_URL}/${LEGAL_PATHS.en.privacy})`,
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
              fontUrl: `${BASE}src/assets/fonts/gabarito-latin.woff2`,
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
      const gabarito = assets.find((f) => /^gabarito-latin-.*\.woff2$/.test(f));
      const gabaritoHref = gabarito ? `${BASE}assets/${gabarito}` : '';
      const outfitDataUri = `data:font/woff2;base64,${readFileSync('src/assets/fonts/outfit-wordmark.woff2').toString('base64')}`;
      const base = readFileSync(join(dir, 'index.html'), 'utf8');
      for (const lang of Object.keys(PATHS)) {
        const localeChunk = assets.find((f) => new RegExp(`^locale-${lang}-.*\\.js$`).test(f));
        const localeHref = localeChunk ? `${BASE}assets/${localeChunk}` : '';
        const out = join(dir, PATHS[lang]);
        mkdirSync(out, { recursive: true });
        writeFileSync(
          join(out, 'index.html'),
          inlineCriticalAndDeferCss(localize(base, lang, gabaritoHref ? [gabaritoHref] : []), lang, { gabaritoHref, outfitDataUri, localeHref }, dir),
        );
        for (const [kind, route] of Object.entries(LEGAL_PATHS[lang])) {
          const legalOut = join(dir, route);
          mkdirSync(legalOut, { recursive: true });
          writeFileSync(join(legalOut, 'index.html'), renderLegalPage(lang, kind, { base: BASE, fontUrl: gabaritoHref }));
        }
      }
      writeFileSync(join(dir, 'robots.txt'), robots());
      writeFileSync(join(dir, 'sitemap.xml'), sitemap());
      writeFileSync(join(dir, 'llms.txt'), llms());
    },
  };
}

export default defineConfig({ base: BASE, plugins: [seo()] });
