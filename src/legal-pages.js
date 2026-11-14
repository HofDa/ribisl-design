import { INSTAGRAM, LEGAL_PATHS, PATHS } from './site.js';

// Confirmed by Katrin: publish the city only, with Instagram as the contact channel.
export const LEGAL_OWNER = { name: 'Katrin Unterhofer', city: 'Bozen / Bolzano', country: 'Italia' };
const UPDATED = '2026-11-14';
const GITHUB_PRIVACY = 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement';
const GITHUB_PAGES = 'https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages';
const GARANTE = 'https://www.garanteprivacy.it/';
const link = (href, label) => `<a href="${href}" rel="noreferrer">${label}</a>`;
const instagram = link(INSTAGRAM, '@ribisl_design');

const COPY = {
  de: {
    imprint: 'Impressum', privacy: 'Datenschutz', back: 'Zurück zur Website', languages: 'Sprache',
    updated: 'Stand', owner: 'Verantwortlich für diese Website', contact: 'Kontakt',
    imprintIntro: 'Die private Hobbyseite von ribisl design. Hier zeigt Katrin ihre Näharbeiten und Upcycling-Ideen aus Bozen.',
    privacyIntro: 'Hier steht, welche Daten beim Besuch dieser Website und bei ihren freiwilligen Mitmach-Funktionen verarbeitet werden.',
    imprintSections: [
      ['Über diese Seite', 'Diese Website stellt Katrins Hobby, ihre Arbeiten und Aktivitäten vor. Sie bietet keinen Online-Shop, kein Kundenkonto und keine Bestell- oder Zahlungsfunktion. Fragen zu Stücken, Märkten und Kursen können über Instagram gestellt werden.'],
      ['Gestaltung und Entwicklung', 'Konzept, Design, Umsetzung und Optimierung: Ziofungo (David Hofer).'],
      ['Inhalte und Bilder', 'Die Rechte an Texten, Bildern und Gestaltungen liegen bei den jeweiligen Urheberinnen und Urhebern. Für eine Weiterverwendung außerhalb der gesetzlich erlaubten Fälle bitte vorher nachfragen.'],
    ],
    privacySections: [
      ['Hosting und technische Zugriffsdaten', `Die veröffentlichte Website wird über GitHub Pages bereitgestellt. Dein Browser übermittelt beim Abruf technisch notwendige Daten wie die IP-Adresse und die angeforderte Datei an den Hostingdienst. GitHub protokolliert IP-Adressen zu Sicherheitszwecken. Zweck der Bereitstellung ist eine funktionsfähige und sichere Website; Rechtsgrundlage hierfür ist das berechtigte Interesse nach Art. 6 Abs. 1 lit. f DSGVO. ${link(GITHUB_PAGES, 'Informationen zu GitHub Pages')} · ${link(GITHUB_PRIVACY, 'Datenschutzerklärung von GitHub')}.`],
      ['Speicherung beim Hostingdienst', `GitHub verarbeitet Daten auch außerhalb der EU. Informationen zu Empfängern, internationalen Übermittlungen und den dafür eingesetzten Schutzmaßnahmen stehen in ${link(GITHUB_PRIVACY, 'GitHubs Datenschutzerklärung')}. Die Speicherdauer der technischen Protokolle wird von GitHub festgelegt; diese Website legt dafür keine eigene Frist fest.`],
      ['Sprache, Cookies und Reichweitenmessung', 'Die Website setzt selbst keine Cookies für Werbung oder Analyse und verwendet keine Analyse-Pixel. Sie speichert ausschließlich die gewählte Sprache unter „ribisl-lang“ im localStorage deines Browsers, damit die Seite in dieser Sprache wieder geöffnet werden kann. Dieser Eintrag bleibt bis zum Löschen der Websitedaten bestehen. Er wird nicht an Katrin übertragen. Die Speicherung dient der gewünschten Sprachfunktion (Art. 6 Abs. 1 lit. f DSGVO: benutzerfreundliche Darstellung). Schriftarten, Bilder und die Software für die Anprobe werden vom selben Hostingdienst geladen; es werden keine Google-Fonts- oder Social-Media-Einbettungen abgerufen.'],
      ['Eigene Stofffotos und Hutentwürfe', 'Wenn du ein Stofffoto auswählst, wird es im Browser zum Zuschneiden und Gestalten verarbeitet. Die Website lädt das Foto und deinen Entwurf nicht auf einen Server hoch. Sie bleiben für diese Sitzung im Arbeitsspeicher; ein Neuladen setzt den Entwurf zurück. Erst wenn du ein Bild selbst speicherst oder über das Teilen-Menü weitergibst, entsteht eine Datei beziehungsweise wird sie an die von dir gewählte Anwendung übergeben.'],
      ['Freiwillige Kamera-Anprobe', 'Die Anprobe startet erst nach deinem Klick und deiner Kamerafreigabe. Sie verwendet ein Kamerabild und erkannte Gesichtspositionen, um den Hut auszurichten. Die Verarbeitung erfolgt auf deinem Gerät; Kamerabilder und Gesichtspositionen werden von dieser Website nicht an einen Server geschickt. Der Mikrofonzugriff wird nicht angefordert. Beim Schließen der Anprobe wird der Kamerastream beendet. Eine Aufnahme wird nur auf deinen Wunsch erstellt und nur durch deine eigene Speicher- oder Teilen-Aktion weitergegeben. Die freiwillige Freigabe kannst du durch Schließen der Anprobe und über die Kameraberechtigung im Browser zurücknehmen.'],
      ['Kontakt und Instagram', `Instagram ist hier nur verlinkt, nicht eingebettet. Erst wenn du einem Link folgst, rufst du den externen Dienst auf. Dort gelten die ${link('https://privacycenter.instagram.com/policy/', 'Datenschutzhinweise von Instagram / Meta')}. Wenn du Katrin kontaktierst, werden deine Nachricht, dein Profilname und gegebenenfalls mitgeschickte Angaben zur Beantwortung deiner Anfrage genutzt (Art. 6 Abs. 1 lit. f DSGVO). Nachrichten werden nur so lange benötigt, wie die Anfrage und gegebenenfalls gesetzliche Aufbewahrungspflichten es erfordern; die Speicherung durch Instagram richtet sich zusätzlich nach dessen Regeln.`],
      ['Deine Rechte', `Soweit die gesetzlichen Voraussetzungen erfüllt sind, kannst du Auskunft, Berichtigung, Löschung, Einschränkung und Datenübertragbarkeit verlangen sowie einer Verarbeitung auf Grundlage berechtigter Interessen widersprechen. Eine Einwilligung kannst du mit Wirkung für die Zukunft widerrufen. Wende dich über ${instagram} an Katrin. Du kannst dich außerdem bei einer Datenschutzaufsicht beschweren, insbesondere beim italienischen ${link(GARANTE, 'Garante per la protezione dei dati personali')}.`],
    ],
  },
  it: {
    imprint: 'Note legali', privacy: 'Privacy', back: 'Torna al sito', languages: 'Lingua',
    updated: 'Aggiornamento', owner: 'Responsabile del sito', contact: 'Contatto',
    imprintIntro: 'Il sito personale di ribisl design. Katrin presenta i suoi lavori di cucito e le sue idee di upcycling da Bolzano.',
    privacyIntro: 'Questa pagina spiega quali dati vengono trattati durante la visita del sito e l’uso delle sue funzioni facoltative.',
    imprintSections: [
      ['Informazioni sul sito', 'Il sito presenta l’hobby, i lavori e le attività di Katrin. Non offre un negozio online, account cliente, ordini o pagamenti. Per informazioni su pezzi, mercatini e corsi puoi contattarla su Instagram.'],
      ['Design e sviluppo', 'Ideazione, design, realizzazione e ottimizzazione: Ziofungo (David Hofer).'],
      ['Contenuti e immagini', 'I diritti sui testi, sulle immagini e sugli elementi grafici appartengono ai rispettivi autori. Per riutilizzarli al di fuori dei casi consentiti dalla legge, chiedi prima il permesso.'],
    ],
    privacySections: [
      ['Hosting e dati tecnici', `Il sito pubblicato è ospitato su GitHub Pages. Per caricare le pagine il browser trasmette al servizio di hosting dati tecnici necessari, come l’indirizzo IP e il file richiesto. GitHub registra gli indirizzi IP per motivi di sicurezza. La finalità è fornire un sito funzionante e sicuro; la base giuridica è il legittimo interesse ai sensi dell’art. 6, par. 1, lett. f GDPR. ${link(GITHUB_PAGES, 'Informazioni su GitHub Pages')} · ${link(GITHUB_PRIVACY, 'Informativa privacy di GitHub')}.`],
      ['Conservazione presso il servizio di hosting', `GitHub tratta dati anche fuori dall’UE. I destinatari, i trasferimenti internazionali e le relative garanzie sono descritti nell’${link(GITHUB_PRIVACY, 'informativa di GitHub')}. La durata di conservazione dei log tecnici è stabilita da GitHub; questo sito non imposta un termine autonomo.`],
      ['Lingua, cookie e statistiche', 'Il sito non imposta cookie pubblicitari o di analisi e non usa pixel di tracciamento. Memorizza soltanto la lingua scelta nel localStorage del browser, alla voce “ribisl-lang”, per riaprire il sito nella stessa lingua. La preferenza rimane fino alla cancellazione dei dati del sito e non viene trasmessa a Katrin. Serve alla funzione di lingua richiesta (art. 6, par. 1, lett. f GDPR: presentazione accessibile e pratica). Font, immagini e software per la prova del cappello vengono caricati dallo stesso servizio di hosting, senza richieste a Google Fonts o contenuti social incorporati.'],
      ['Foto dei tessuti e cappelli disegnati', 'Se scegli una foto di un tessuto, il ritaglio e la creazione del cappello avvengono nel browser. Il sito non carica su un server la foto o il disegno. Restano nella memoria della sessione e il disegno viene azzerato ricaricando la pagina. Solo una tua azione di salvataggio o condivisione crea un file o lo passa all’applicazione da te scelta.'],
      ['Prova facoltativa con la fotocamera', 'La prova parte soltanto dopo un tuo clic e l’autorizzazione alla fotocamera. Utilizza l’immagine della fotocamera e le posizioni del viso rilevate per posizionare il cappello. L’elaborazione avviene sul dispositivo: questo sito non invia immagini o posizioni del viso a un server. Non viene richiesto il microfono. Chiudendo la prova viene interrotto il flusso della fotocamera. Una foto viene creata solo su tua richiesta e viene salvata o condivisa solo con una tua azione. Puoi interrompere l’uso chiudendo la prova e revocando il permesso nelle impostazioni del browser.'],
      ['Contatti e Instagram', `Instagram è presente soltanto come collegamento, senza contenuti incorporati. Il servizio esterno viene aperto solo quando segui un link; si applica l’${link('https://privacycenter.instagram.com/policy/', 'informativa di Instagram / Meta')}. Se contatti Katrin, il messaggio, il nome del profilo e le informazioni inviate servono a rispondere alla richiesta (art. 6, par. 1, lett. f GDPR). I messaggi vengono conservati per il tempo necessario alla richiesta e agli eventuali obblighi di legge; la conservazione da parte di Instagram segue inoltre le sue regole.`],
      ['I tuoi diritti', `Nei casi previsti dalla legge puoi chiedere accesso, rettifica, cancellazione, limitazione e portabilità dei dati, nonché opporti al trattamento basato sul legittimo interesse. Puoi revocare il consenso per il futuro. Per contattare Katrin usa ${instagram}. Puoi presentare un reclamo all’autorità di controllo, in particolare al ${link(GARANTE, 'Garante per la protezione dei dati personali')}.`],
    ],
  },
  en: {
    imprint: 'Legal notice', privacy: 'Privacy', back: 'Back to the website', languages: 'Language',
    updated: 'Updated', owner: 'Responsible for this website', contact: 'Contact',
    imprintIntro: 'The personal hobby website of ribisl design. Katrin shares her sewing and upcycling ideas from Bolzano.',
    privacyIntro: 'This notice explains how data is processed when you visit the website or use its optional creative features.',
    imprintSections: [
      ['About this website', 'This site presents Katrin’s hobby, work and activities. It has no online shop, customer accounts, ordering or payment facility. Questions about pieces, markets and courses can be sent through Instagram.'],
      ['Design and development', 'Concept, design, implementation and optimization: Ziofungo (David Hofer).'],
      ['Content and images', 'Rights to texts, images and designs belong to their respective creators. Please ask before reusing them beyond what the law permits.'],
    ],
    privacySections: [
      ['Hosting and technical access data', `The published site is hosted on GitHub Pages. To retrieve a page, your browser sends necessary technical data such as your IP address and the requested file to the hosting service. GitHub logs IP addresses for security. The purpose is to provide a working and secure website, based on legitimate interests under Article 6(1)(f) GDPR. ${link(GITHUB_PAGES, 'About GitHub Pages')} · ${link(GITHUB_PRIVACY, 'GitHub privacy statement')}.`],
      ['Hosting retention and transfers', `GitHub also processes data outside the EU. Recipients, international transfers and the relevant safeguards are described in ${link(GITHUB_PRIVACY, 'GitHub’s privacy statement')}. GitHub determines how long its technical logs are retained; this website does not set a separate retention period for them.`],
      ['Language, cookies and analytics', 'This site sets no advertising or analytics cookies and uses no tracking pixels. It stores only your language choice in your browser’s localStorage under “ribisl-lang”, so the site can reopen in that language. This preference remains until you clear the site’s data and is not sent to Katrin. It supports the requested language feature (Article 6(1)(f) GDPR: convenient presentation). Fonts, images and the try-on software are served by the same hosting service; the site does not fetch Google Fonts or embedded social media.'],
      ['Fabric photos and hat designs', 'If you select a fabric photo, cropping and designing happen in your browser. The site does not upload the photo or design to a server. They stay in memory for the session; reloading resets the design. Only your own save or share action creates a file or passes it to the application you choose.'],
      ['Optional camera try-on', 'Try-on starts only after you click and allow camera access. It uses camera frames and detected face positions to align the hat. Processing takes place on your device: this site does not send camera frames or face positions to a server. Microphone access is not requested. Closing try-on stops the camera stream. A photo is created only at your request, and is saved or shared only through your own action. You can stop the feature by closing it and revoke camera access in your browser settings.'],
      ['Contact and Instagram', `Instagram is linked, not embedded. You open the external service only by following a link; ${link('https://privacycenter.instagram.com/policy/', 'Instagram / Meta’s privacy policy')} then applies. If you contact Katrin, your message, profile name and any details you send are used to answer your enquiry (Article 6(1)(f) GDPR). Messages are kept as needed to handle the enquiry and meet any applicable legal retention requirements; Instagram’s own retention rules also apply.`],
      ['Your rights', `Where the legal conditions apply, you can request access, correction, deletion, restriction and portability, and object to processing based on legitimate interests. You can withdraw consent for the future. Contact Katrin through ${instagram}. You may complain to a supervisory authority, particularly Italy’s ${link(GARANTE, 'Garante per la protezione dei dati personali')}.`],
    ],
  },
};

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderLegalPage(lang, kind, { base = '/', fontUrl = '' } = {}) {
  const copy = COPY[lang];
  const title = copy[kind];
  const sections = copy[kind + 'Sections'];
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,follow">
  <meta name="description" content="${escape(copy[kind + 'Intro'])}">
  <title>${title} · ribisl design</title>
  <link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
  <style>
    ${fontUrl ? `@font-face{font-family:Gabarito;src:url('${fontUrl}') format('woff2');font-style:normal;font-weight:400 900;font-display:swap}` : ''}
    :root{color-scheme:only light;font-family:Gabarito,system-ui,sans-serif;color:#1E181A;background:#F3EDE2;font-size:17px;line-height:1.65}
    *{box-sizing:border-box}body{margin:0;border-top:5px solid #C4122F}a{color:inherit;text-underline-offset:.2em;overflow-wrap:anywhere}a:hover{color:#9E0E26}a:focus-visible{outline:2px solid #C4122F;outline-offset:5px}
    .wrap{max-width:850px;margin:auto;padding:clamp(20px,5vw,64px)}header{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:32px}.brand{font-size:1.5rem;font-weight:750;letter-spacing:-.04em;text-decoration:none}.languages{display:flex;gap:14px}.languages a{padding:8px 2px;font-size:.85rem}.languages [aria-current]{font-weight:750;text-decoration-thickness:2px}
    main{background:#FBF9F4;padding:clamp(22px,5vw,48px);outline:1px dashed #746A67;outline-offset:-9px;box-shadow:3px 4px 0 #1E181A15}h1{font-size:clamp(2.2rem,7vw,3.5rem);line-height:1.05;letter-spacing:-.04em;margin:0 0 20px}h2{font-size:1.18rem;line-height:1.3;margin:30px 0 10px}p{margin:0 0 16px}.intro{font-size:1.1rem}.owner{border-block:1px dashed #AAA09B;padding-block:18px;margin:24px 0}.owner h2{margin-top:0}.owner p{margin:0}.updated{font-size:.82rem;color:#62534F}footer{padding:24px 0;display:flex;flex-wrap:wrap;gap:12px 24px;font-size:.9rem}.back{display:inline-block;margin-top:20px}
    @media(prefers-reduced-motion:no-preference){a{transition:color .15s}}@media print{body{border:0;background:white}.wrap{max-width:none;padding:0}main{outline:0;box-shadow:none;padding:0}header,.back,footer{display:none}}
  </style>
</head>
<body>
  <div class="wrap">
    <header><a class="brand" href="${base}${PATHS[lang]}">ribisl design</a><nav class="languages" aria-label="${copy.languages}">${Object.keys(COPY).map((l) => `<a href="${base}${LEGAL_PATHS[l][kind]}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="page"' : ''}>${l.toUpperCase()}</a>`).join('')}</nav></header>
    <main id="content">
      <h1>${title}</h1>
      <p class="intro">${copy[kind + 'Intro']}</p>
      <section class="owner" aria-labelledby="owner"><h2 id="owner">${copy.owner}</h2><p>${escape(LEGAL_OWNER.name)}<br>${escape(LEGAL_OWNER.city)} · ${escape(LEGAL_OWNER.country)}</p><p>${copy.contact}: ${instagram}</p></section>
      ${sections.map(([heading, body]) => `<section><h2>${heading}</h2><p>${body}</p></section>`).join('\n      ')}
      <p class="updated">${copy.updated}: <time datetime="${UPDATED}">${UPDATED}</time></p>
      <a class="back" href="${base}${PATHS[lang]}#contact">← ${copy.back}</a>
    </main>
    <footer><span>© ${new Date().getFullYear()} ribisl design</span>${['imprint', 'privacy'].map((k) => `<a href="${base}${LEGAL_PATHS[lang][k]}"${k === kind ? ' aria-current="page"' : ''}>${copy[k]}</a>`).join('')}</footer>
  </div>
</body>
</html>`;
}
