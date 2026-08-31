// The tab shell owns scroll position: every tab starts at its own top, so
// neither the browser's restore nor a fragment jump should move the page.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// ---------- Theme toggle ----------
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const storedTheme = localStorage.getItem('theme');
if (storedTheme) root.setAttribute('data-theme', storedTheme);

function currentIsDark() {
  const attr = root.getAttribute('data-theme');
  if (attr) return attr === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

themeToggle.addEventListener('click', () => {
  const next = currentIsDark() ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// ---------- Mobile nav toggle ----------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

// ---------- Tab switching (each section fills the viewport) ----------
const tabIds = ['home', 'about', 'experience', 'education', 'work', 'skills'];
const panels = document.querySelectorAll('.tab-panel');
const navAnchors = document.querySelectorAll('.nav-links a[data-nav]');
const dots = document.querySelectorAll('[data-nav-dot]');
const navIndicator = document.getElementById('navIndicator');
// Single source of truth for the nav-collapse breakpoint; must match the
// max-width: 760px query in style.css.
const navIsCollapsed = window.matchMedia('(max-width: 760px)');

function moveIndicator(link) {
  if (!link || navIsCollapsed.matches) return;
  navIndicator.style.left = link.offsetLeft + 'px';
  navIndicator.style.width = link.offsetWidth + 'px';
}

function switchTab(id, updateHash = true) {
  if (!tabIds.includes(id)) id = 'home';

  panels.forEach(p => p.classList.toggle('active', p.id === id));
  navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
  dots.forEach(d => d.classList.toggle('active', d.getAttribute('data-nav-dot') === id));

  const activeLink = document.querySelector(`.nav-links a[href="#${id}"]`);
  moveIndicator(activeLink);

  navLinks.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');

  const activePanel = document.getElementById(id);
  if (activePanel) activePanel.scrollTop = 0;
  window.scrollTo(0, 0);

  if (updateHash && window.location.hash !== '#' + id) {
    history.pushState(null, '', '#' + id);
  }

  triggerReveal(id);
}

document.querySelectorAll('a[data-nav]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(link.getAttribute('href').slice(1));
  });
});

dots.forEach(dot => {
  dot.addEventListener('click', () => switchTab(dot.getAttribute('data-nav-dot')));
});

window.addEventListener('popstate', () => {
  switchTab(window.location.hash.slice(1) || 'home', false);
});

window.addEventListener('resize', () => {
  moveIndicator(document.querySelector('.nav-links a.active'));
});

// keyboard left/right to move between tabs
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const activeId = document.querySelector('.tab-panel.active')?.id;
  const idx = tabIds.indexOf(activeId);
  if (e.key === 'ArrowRight' && idx < tabIds.length - 1) switchTab(tabIds[idx + 1]);
  if (e.key === 'ArrowLeft' && idx > 0) switchTab(tabIds[idx - 1]);
});

// ---------- Reveal animation on tab activation ----------
function triggerReveal(id) {
  const panel = document.getElementById(id);
  if (!panel) return;
  const items = panel.querySelectorAll('.tcard, .edu-card, .card, .skill-card, .soft-skills, .lang-card');
  items.forEach((el, i) => {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = `riseIn 0.45s ease both`;
    el.style.animationDelay = (i * 0.05) + 's';
  });
}

const style = document.createElement('style');
style.textContent = '@keyframes riseIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }';
document.head.appendChild(style);

// ---------- Typing effect ----------
const typingEl = document.getElementById('typing');
const phrasesByLang = {
  en: ['web products.', 'clean interfaces.', 'full-stack apps.', 'better user flows.'],
  no: ['nettprodukter.', 'rene grensesnitt.', 'fullstack-apper.', 'bedre brukerflyt.']
};
let phrases = phrasesByLang.en;
let phraseIndex = 0, charIndex = 0, deleting = false;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function typeLoop() {
  // Respect the OS setting: show one phrase and stop, rather than typing.
  if (reduceMotion.matches) {
    typingEl.textContent = phrases[0];
    return;
  }
  // The typing line only exists on Home. Idle cheaply on the other tabs
  // instead of retyping into a hidden panel forever.
  if (!document.getElementById('home').classList.contains('active')) {
    setTimeout(typeLoop, 400);
    return;
  }
  const current = phrases[phraseIndex];
  if (!deleting) {
    charIndex++;
    typingEl.textContent = current.slice(0, charIndex);
    if (charIndex === current.length) {
      deleting = true;
      setTimeout(typeLoop, 1600);
      return;
    }
  } else {
    charIndex--;
    typingEl.textContent = current.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
    }
  }
  setTimeout(typeLoop, deleting ? 35 : 55);
}
typeLoop();

// ---------- Card spotlight ----------
// The 3D tilt that used to live here was removed: it competed with the
// spotlight for the same hover and animated numbers that never needed it.
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    if (reduceMotion.matches) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
    card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
  });
});

// ---------- Academic timeline accordion ----------
const timelineToggle = document.getElementById('timelineToggle');
const timelinePanel = document.getElementById('timelinePanel');

timelineToggle.addEventListener('click', () => {
  const isOpen = timelineToggle.getAttribute('aria-expanded') === 'true';
  timelineToggle.setAttribute('aria-expanded', String(!isOpen));
  timelinePanel.style.maxHeight = isOpen ? '0px' : timelinePanel.scrollHeight + 'px';
});

// ---------- Language toggle (EN / NO) ----------
// Same pattern as the theme toggle: a stored preference in localStorage,
// [data-i18n] elements keep their original English markup as the fallback,
// and the Norwegian dictionary below only has to carry the translation.
const langToggle = document.getElementById('langToggle');
const langCode = document.getElementById('langCode');
const metaDescriptionEl = document.getElementById('metaDescription');
const enTitle = document.title;
const enMetaDesc = metaDescriptionEl.getAttribute('content');

const i18nEls = document.querySelectorAll('[data-i18n]');
const i18nAriaEls = document.querySelectorAll('[data-i18n-aria]');
const i18nAltEls = document.querySelectorAll('[data-i18n-alt]');
const enCache = new Map();
i18nEls.forEach(el => enCache.set(el, el.innerHTML));
const enAriaCache = new Map();
i18nAriaEls.forEach(el => enAriaCache.set(el, el.getAttribute('aria-label')));
const enAltCache = new Map();
i18nAltEls.forEach(el => enAltCache.set(el, el.getAttribute('alt')));

const NO_META = {
  title: 'Nhat-Huy Nguyen | Portefølje',
  desc: 'Nhat-Huy Nguyen, utvikler med fokus på UX, som for tiden studerer anvendt datateknologi ved OsloMet.'
};

const NO_ARIA = {
  'nav.themeAria': 'Bytt mørk/lys modus',
  'nav.menuAria': 'Åpne/lukk meny',
  'social.linkedin': 'LinkedIn-profil',
  'social.github': 'GitHub-profil',
  'social.email': 'Send meg en e-post',
  'dot.home': 'Gå til Hjem',
  'dot.about': 'Gå til Om meg',
  'dot.experience': 'Gå til Erfaring',
  'dot.education': 'Gå til Utdanning',
  'dot.work': 'Gå til Arbeid',
  'dot.skills': 'Gå til Ferdigheter'
};

const NO_ALT = {
  'about.photoAlt': 'Nhat-Huy i samtale med en rekrutterer på en karrieredag'
};

const NO_TEXT = {
  'nav.home': 'Hjem', 'nav.about': 'Om meg', 'nav.experience': 'Erfaring',
  'nav.education': 'Utdanning', 'nav.work': 'Arbeid', 'nav.skills': 'Ferdigheter',

  'hero.eyebrow': 'Hei, velkommen til porteføljen min',
  'hero.role': 'Student, utvikler og gründer',
  'hero.typingPrefix': 'Jeg bygger',
  'hero.bio': 'Jeg er utvikler og jobber hovedsakelig med <strong>programvareutvikling</strong> og <strong>UX</strong>, for tiden hos <strong>Renow AS</strong>.',
  'cta.work': 'Se arbeidet mitt',
  'cta.resume': 'Se CV-en min',
  'hero.stat.languages': 'Språk jeg snakker',
  'hero.stat.projects': 'Utvalgte prosjekter',
  'hero.stat.semester': 'Semester på OsloMet',

  'about.caption': 'På en karrieredag, snakker teknologi og muligheter.',
  'about.heading': 'Om meg',
  'about.p1': 'Jeg er 21 år, opprinnelig fra Trondheim, og flyttet til Oslo for å studere anvendt datateknologi ved OsloMet. Jeg fikk min første smak av programmering gjennom IT1-faget i siste år på videregående. Siden da har det vært en berg-og-dal-bane, men det virkelige vendepunktet kom da jeg begynte på universitetet og bestemte meg for å ta programmering på alvor.',
  'about.p2': 'Gjennom studiene har jeg utviklet en sterk interesse for programmering, webutvikling og digitale løsninger. Ved siden av studiene jobber jeg hos Renow AS, hvor jeg bidrar med SEO, kundekontakt, markedsføring og tilpasning av digitale løsninger. Jeg motiveres av å lære nye teknologier, løse problemer og bruke det jeg kan i praktiske prosjekter.',

  'exp.heading': 'Arbeidserfaring',
  'exp.sub': 'Organisasjonene og rollene som har formet veien min så langt.',
  'exp.renow.role': 'Markedsansvarlig',
  'exp.renow.date': 'Mai 2026 til nå',
  'loc.oslo': 'Oslo, Norge',
  'exp.renow.desc': 'Kundeidentifisering, marked- og konkurrentanalyse, oppsøkende salg og digitale kampanjer. Analyserer nettsideytelse, SEO og annonseresultater, og bistår med webutvikling og koding for kundeprosjekter.',
  'exp.tag.outreach': 'Kundekontakt',
  'exp.tag.webdev': 'Webutvikling',
  'exp.tag.marketing': 'Markedsføring',

  'exp.oj.role': 'Salgs- og endringsmedarbeider',
  'exp.oj.date': 'Okt 2025 til nå',
  'exp.oj.desc': 'Personlig kundeservice og stilrådgivning innen formelklær, skreddersøm, salg og lagerstyring.',
  'exp.tag.customerservice': 'Kundeservice',
  'exp.tag.tailoring': 'Skreddersøm',
  'exp.tag.sales': 'Salg',

  'exp.mil.role': 'Vakt / militær kjøretøyfører',
  'exp.mil.date': 'Aug 2024 til jun 2025',
  'loc.setermoen': 'Setermoen, Norge',
  'exp.mil.desc': 'Betjente og vedlikeholdt militære kjøretøy under strenge sikkerhetskrav, samt sikkerhetskontroller og adgangskontroll.',
  'exp.tag.security': 'Sikkerhet',
  'exp.tag.operations': 'Drift',
  'exp.tag.teamwork': 'Teamarbeid',

  'exp.earlier.title': 'Tidligere roller',
  'exp.earlier.date': '2022 til 2024',
  'loc.trondheim': 'Trondheim, Norge',
  'exp.earlier.desc': 'Kundeservice, bordservering og lagerstyring, som bygget et grunnlag i kommunikasjon og teamarbeid.',
  'exp.tag.reliability': 'Pålitelighet',

  'exp.cta.text': 'Interessert i hele min erfaring? Ta en titt på min detaljerte CV.',

  'edu.heading': 'Utdanning',
  'edu.sub': 'Min akademiske reise og institusjonene som har formet kunnskapen min.',

  'edu.deg.title': 'Bachelor i anvendt datateknologi',
  'edu.deg.inst': 'OsloMet, storbyuniversitetet ↗',
  'edu.deg.date': '2025 til 2028',
  'edu.deg.desc': 'Design og utvikling av teknologiske løsninger med vekt på brukervennlighet. Lærer å anvende datateknologi på reelle brukerbehov og bygge universelt utformede, inkluderende digitale løsninger.',
  'edu.deg.link': 'Se studieprogrammet ↗',

  'edu.timeline.toggle': 'Studieforløp',

  'edu.y1.h4': '1. år, grunnleggende <em>2025 til 2026</em>',
  'edu.sem1': '1. semester',
  'edu.c.interaction': 'Interaksjonsdesign og prototyping',
  'edu.c.programming': 'Programmering',
  'edu.c.techsociety': 'Teknologi og samfunn',
  'edu.c.webdev': 'Webutvikling og inkluderende design',

  'edu.sem2': '2. semester',
  'edu.c.rapiddev': 'Rask utvikling med skriptspråk',
  'edu.c.databases': 'Databaser',
  'edu.c.webprog': 'Webprogrammering',

  'edu.y2.h4': '2. år, fordypning <em>2026 til 2027</em>',
  'edu.sem3': '3. semester',
  'edu.inprogress': 'Pågår',
  'edu.c.hci': 'Menneske-maskin-interaksjon',
  'edu.c.sysdev': 'Systemutvikling',
  'edu.c.algorithms': 'Algoritmer og datastrukturer',
  'edu.track.programming': 'Programmering-spor',

  'edu.sem4': '4. semester',
  'edu.c.visualization': 'Visualisering',
  'edu.c.testing': 'Testing av programvare',
  'edu.c.os': 'Operativsystemer',

  'edu.y3.h4': '3. år, videregående studier <em>2027 til 2028</em>',
  'edu.sem5': '5. semester',
  'edu.c.datasecurity': 'Datasikkerhet',
  'edu.c.icd': 'Universell IKT-design',
  'edu.c.advspec': 'Videregående fordypningsemner',

  'edu.sem6': '6. semester',
  'edu.c.thesis': 'Bacheloroppgave (20 stp)',
  'edu.c.network': 'Nettverk og skytjenester',
  'edu.c.advprog': 'Videregående programmering',

  'edu.vgs.date': '2021 til 2024',

  'work.heading': 'Utvalgte prosjekter',
  'work.sub': 'Case-studier fra kundearbeid og studiearbeid.',

  'work.c1.title': 'Design rundt behovene til småbedrifter',
  'work.c1.role': 'Web- og forretningsutvikling, markedsansvarlig',
  'work.c1.desc': 'Renow leverer nettsider, synlighet og løpende support til små og mellomstore bedrifter. Jeg jobber med kundeinnsikt, skreddersydde tilbud, prosjektkoordinering, SEO- og analyserammer, og bistår med implementering når teamet trenger ekstra kapasitet.',
  'work.c1.detail': '<strong>Prosess:</strong> lytte, prioritere, bygge, forbedre.',

  'work.c2.title': 'Ett konsept, to flater',
  'work.c2.role': 'Responsiv kampanjedesign',
  'work.c2.desc': 'Oppdraget var å bevare konseptet i Renows sommerkampanje samtidig som det ble tilpasset et mobil-først-format. En desktop-komposisjon kan ikke bare skaleres ned: på en smal skjerm må hierarki, leserekkefølge og bildebalanse bygges opp på nytt.',
  'work.c2.quote': 'Responsiv design er en prioriteringsøvelse: bevar budskapet, og form deretter opplevelsen til konteksten.',

  'work.tag.coursework': 'Studiearbeid',
  'work.c3.title': 'Fullstack medieapplikasjon',
  'work.c3.desc': 'Utviklet frontend-funksjonalitet og koblet den til REST-endepunkter for henting og administrasjon av sanger, filmer og bøker.',
  'work.c3.flow': 'Brukergrensesnitt → fetch-forespørsel → API-kontroller → datalager',

  'work.c4.title': 'Database for sykkelutleie',
  'work.c4.desc': 'Designet en relasjonsmodell for kunder, sykler, stasjoner, låser og utleier, og oversatte relasjonene til SQL-spørringer.',
  'work.c4.flow': 'Kunde → utleie → sykkel → stasjon → lås',

  'skills.heading': 'Ferdigheter og teknologier',
  'skills.cat.lang': 'Språk og rammeverk',
  'skills.cat.data': 'Data og infrastruktur',

  'skills.soft.oop': 'Objektorientert programmering',
  'skills.soft.db': 'Relasjonsdatabaser',
  'skills.soft.fullstack': 'Fullstack-utvikling',
  'skills.soft.problem': 'Problemløsning',
  'skills.soft.team': 'Teamarbeid',

  'skills.langheading': 'Språk jeg snakker',
  'skills.lang.no': 'Norsk',
  'skills.lang.en': 'Engelsk',
  'skills.lang.vi': 'Vietnamesisk'
};

let currentLang = localStorage.getItem('lang') === 'no' ? 'no' : 'en';

function applyLang(lang) {
  currentLang = lang;
  root.lang = lang;
  document.title = lang === 'no' ? NO_META.title : enTitle;
  metaDescriptionEl.setAttribute('content', lang === 'no' ? NO_META.desc : enMetaDesc);

  i18nEls.forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerHTML = (lang === 'no' && NO_TEXT[key] !== undefined) ? NO_TEXT[key] : enCache.get(el);
  });
  i18nAriaEls.forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    el.setAttribute('aria-label', (lang === 'no' && NO_ARIA[key] !== undefined) ? NO_ARIA[key] : enAriaCache.get(el));
  });
  i18nAltEls.forEach(el => {
    const key = el.getAttribute('data-i18n-alt');
    el.setAttribute('alt', (lang === 'no' && NO_ALT[key] !== undefined) ? NO_ALT[key] : enAltCache.get(el));
  });

  langCode.textContent = lang === 'no' ? 'EN' : 'NO';
  langToggle.setAttribute('aria-label', lang === 'no' ? 'Bytt til engelsk' : 'Switch to Norwegian');

  // Restart the typing effect cleanly in the new language rather than
  // finishing the in-flight English/Norwegian phrase mid-word.
  phrases = phrasesByLang[lang];
  phraseIndex = 0; charIndex = 0; deleting = false;
  if (typingEl) typingEl.textContent = '';

  // Link labels change width between languages, so the underline indicator
  // has to be repositioned under the (possibly now wider) active link.
  moveIndicator(document.querySelector('.nav-links a.active'));
}

langToggle.addEventListener('click', () => {
  const next = currentLang === 'no' ? 'en' : 'no';
  localStorage.setItem('lang', next);
  applyLang(next);
});

// ---------- Init ----------
switchTab(window.location.hash.slice(1) || 'home', false);
applyLang(currentLang);
window.addEventListener('load', () => {
  moveIndicator(document.querySelector('.nav-links a.active'));
  window.scrollTo(0, 0);
});
