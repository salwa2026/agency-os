/* ============================================================
   NA MEDIA AGENCY — Main JavaScript
   ============================================================ */

/* --- Navbar scroll behavior --- */
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* --- Mobile menu --- */
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu    = document.querySelector('.mobile-menu');
const mobileClose   = document.querySelector('.mobile-menu-close');

const openMenu = () => {
  mobileMenu?.classList.add('open');
  document.body.style.overflow = 'hidden';
  mobileMenuBtn?.setAttribute('aria-expanded', 'true');
};
const closeMenu = () => {
  mobileMenu?.classList.remove('open');
  document.body.style.overflow = '';
  mobileMenuBtn?.setAttribute('aria-expanded', 'false');
};

mobileMenuBtn?.addEventListener('click', openMenu);
mobileClose?.addEventListener('click', closeMenu);
document.querySelectorAll('.mobile-nav-link').forEach(l => l.addEventListener('click', closeMenu));

/* --- Scroll reveal (IntersectionObserver) --- */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* --- Counter animation --- */
function animateCounter(el, target, duration = 1800) {
  const isFloat = !Number.isInteger(target);
  const start   = performance.now();
  const tick    = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
    const v = target * e;
    el.textContent = isFloat ? v.toFixed(1) : Math.floor(v);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target, parseFloat(e.target.dataset.count));
      counterObs.unobserve(e.target);
    }
  });
}, { threshold: 0.6 });

document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));

/* --- FAQ accordion --- */
document.querySelectorAll('.faq-question').forEach(q => {
  q.addEventListener('click', () => {
    const item   = q.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

/* --- Active nav link --- */
const page = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(l => {
  const href = l.getAttribute('href') || '';
  if (href === page || (page === '' && href === 'index.html')) l.classList.add('active');
});

/* --- Contact form redirect --- */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.form-submit');
    if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }
    setTimeout(() => { window.location.href = 'merci.html'; }, 600);
  });
}

/* --- Marquee pause on hover (accessibility) --- */
document.querySelectorAll('.marquee-wrapper').forEach(wrapper => {
  wrapper.addEventListener('mouseenter', () => {
    wrapper.querySelector('.marquee-track')?.style.setProperty('animation-play-state','paused');
  });
  wrapper.addEventListener('mouseleave', () => {
    wrapper.querySelector('.marquee-track')?.style.setProperty('animation-play-state','running');
  });
});

/* --- Contact form → API backend (with fallback redirect) --- */
const contactFormAdv = document.getElementById('contactForm');
if (contactFormAdv) {
  contactFormAdv.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactFormAdv.querySelector('.form-submit');
    const originalText = btn?.innerHTML || 'Envoyer';
    if (btn) { btn.disabled = true; btn.innerHTML = 'Envoi en cours…'; }

    const data = Object.fromEntries(new FormData(contactFormAdv));

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        window.location.href = (window.location.pathname.includes('/blog/') ? '../' : '') + 'merci.html';
      } else {
        throw new Error('Server error');
      }
    } catch {
      // Fallback: redirect anyway (static hosting without backend)
      window.location.href = (window.location.pathname.includes('/blog/') ? '../' : '') + 'merci.html';
    }
  });
}

/* --- Smooth anchor scroll --- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = target.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: offset, behavior: 'smooth' });
  });
});
