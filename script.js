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
const phrases = ['web products.', 'clean interfaces.', 'full-stack apps.', 'better user flows.'];
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

// ---------- Init ----------
switchTab(window.location.hash.slice(1) || 'home', false);
window.addEventListener('load', () => {
  moveIndicator(document.querySelector('.nav-links a.active'));
  window.scrollTo(0, 0);
});
