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
const tabIds = ['about', 'experience', 'education', 'work', 'skills', 'contact'];
const panels = document.querySelectorAll('.tab-panel');
const navAnchors = document.querySelectorAll('[data-nav]');
const dots = document.querySelectorAll('[data-nav-dot]');
const navIndicator = document.getElementById('navIndicator');

function moveIndicator(link) {
  if (!link || window.innerWidth <= 640) return;
  navIndicator.style.left = link.offsetLeft + 'px';
  navIndicator.style.width = link.offsetWidth + 'px';
}

function switchTab(id, updateHash = true) {
  if (!tabIds.includes(id)) id = 'about';

  panels.forEach(p => p.classList.toggle('active', p.id === id));
  navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
  dots.forEach(d => d.classList.toggle('active', d.getAttribute('data-nav-dot') === id));

  const activeLink = document.querySelector(`.nav-links a[href="#${id}"]`);
  moveIndicator(activeLink);

  navLinks.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');

  const activePanel = document.getElementById(id);
  if (activePanel) activePanel.scrollTop = 0;

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
  switchTab(window.location.hash.slice(1) || 'about', false);
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

function typeLoop() {
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

// ---------- Count-up stats ----------
function animateStats(container) {
  container.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const duration = 1100;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  });
}
animateStats(document.getElementById('about'));

// ---------- Card tilt + spotlight ----------
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mx', x + 'px');
    card.style.setProperty('--my', y + 'px');
    const rotateY = ((x / rect.width) - 0.5) * 6;
    const rotateX = ((y / rect.height) - 0.5) * -6;
    card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// ---------- Academic timeline accordion ----------
const timelineToggle = document.getElementById('timelineToggle');
const timelinePanel = document.getElementById('timelinePanel');

timelineToggle.addEventListener('click', () => {
  const isOpen = timelineToggle.getAttribute('aria-expanded') === 'true';
  timelineToggle.setAttribute('aria-expanded', String(!isOpen));
  timelinePanel.style.maxHeight = isOpen ? '0px' : timelinePanel.scrollHeight + 'px';
});

// ---------- Contact form (mailto handoff, no backend) ----------
const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = contactForm.name.value.trim();
  const email = contactForm.email.value.trim();
  const message = contactForm.message.value.trim();

  const subject = encodeURIComponent(`Portfolio contact from ${name}`);
  const body = encodeURIComponent(`${message}\n\n${name} (${email})`);
  window.location.href = `mailto:2005nhathuy@gmail.com?subject=${subject}&body=${body}`;

  formNote.textContent = 'Opening your email client...';
  contactForm.reset();
});

// ---------- Init ----------
switchTab(window.location.hash.slice(1) || 'about', false);
window.addEventListener('load', () => moveIndicator(document.querySelector('.nav-links a.active')));
