/**
 * Josef Kellhammer – KFZ-Teilehandel & Meisterwerkstatt
 * Main JavaScript: Animations, Interactions & Form Logic
 */

'use strict';

/* ================================================================
   UTILITY HELPERS
   ================================================================ */

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function easeOutQuad(t) { return t * (2 - t); }
function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

/* ================================================================
   1. NAVBAR — scroll behaviour + active links
   ================================================================ */
(function initNavbar() {
  const navbar = qs('#navbar');
  if (!navbar) return;

  let lastScroll = 0;

  function onScroll() {
    const y = window.scrollY;
    if (y > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  /* Active nav link highlighting via Intersection Observer */
  const sections = qsa('section[id], footer[id]');
  const navLinks  = qsa('.nav-link');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach((s) => sectionObserver.observe(s));
})();

/* ================================================================
   2. MOBILE MENU
   ================================================================ */
(function initMobileMenu() {
  const burger = qs('.burger');
  const menu   = qs('#mobile-menu');
  if (!burger || !menu) return;

  let open = false;

  function toggle() {
    open = !open;
    burger.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  burger.addEventListener('click', toggle);

  // Close on mobile link click
  qsa('.mobile-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (open) toggle();
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (open && !menu.contains(e.target) && !burger.contains(e.target)) {
      toggle();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) toggle();
  });
})();

/* ================================================================
   3. SMOOTH SCROLL (nav links)
   ================================================================ */
(function initSmoothScroll() {
  qsa('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = qs(targetId);
      if (!target) return;

      e.preventDefault();
      const navH   = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76;
      const y      = target.getBoundingClientRect().top + window.scrollY - navH;

      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
})();

/* ================================================================
   4. SCROLL REVEAL (Intersection Observer)
   ================================================================ */
(function initReveal() {
  const items = qsa('.reveal');
  if (!items.length) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  items.forEach((el) => obs.observe(el));
})();

/* ================================================================
   5. ANIMATED STAT COUNTERS
   ================================================================ */
(function initCounters() {
  const counters = qsa('.stat-number[data-target]');
  if (!counters.length) return;

  function animateCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const start    = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedVal = easeOutExpo(progress);
      const current  = Math.round(easedVal * target);

      // Format large numbers with dots (German style)
      el.textContent = current >= 1000
        ? current.toLocaleString('de-DE')
        : current;

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => obs.observe(el));
})();

/* ================================================================
   6. HERO PARALLAX (subtle depth on scroll)
   ================================================================ */
(function initParallax() {
  const heroGrid = qs('.hero-grid');
  const heroGlowL = qs('.hero-glow-left');
  const heroGlowR = qs('.hero-glow-right');
  if (!heroGrid) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (heroGrid)  heroGrid.style.transform  = `translateY(${y * 0.25}px)`;
        if (heroGlowL) heroGlowL.style.transform = `translateY(${y * 0.15}px)`;
        if (heroGlowR) heroGlowR.style.transform = `translateY(${y * 0.10}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ================================================================
   7. SERVICE CARD — 3-D TILT ON HOVER
   ================================================================ */
(function initCardTilt() {
  const cards = qsa('.service-card, .part-card');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const rotX   = -dy * 4;
      const rotY   =  dx * 4;

      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ================================================================
   8. MULTI-STEP BOOKING FORM
   ================================================================ */
(function initBookingForm() {
  const form = qs('#booking-form');
  if (!form) return;

  let currentStep = 1;
  const totalSteps = 4;

  function getStep(n) {
    return qs(`[data-step="${n}"]`, form);
  }

  function getStepDot(n) {
    return qs(`.step-dot[data-step="${n}"]`);
  }

  function getStepLine(n) {
    // Lines are between dots — 3 lines total (after dot 1, 2, 3)
    return qsa('.step-line')[n - 1];
  }

  /* Update progress indicator */
  function updateProgress(step) {
    for (let i = 1; i <= totalSteps; i++) {
      const dot = getStepDot(i);
      if (!dot) continue;
      dot.classList.remove('active', 'completed');
      if (i < step)  dot.classList.add('completed');
      if (i === step) dot.classList.add('active');
    }

    qsa('.step-line').forEach((line, idx) => {
      line.classList.toggle('active', idx + 1 < step);
    });
  }

  /* Show a form step */
  function showStep(n) {
    // Hide all steps
    qsa('.form-step', form).forEach((el) => el.classList.remove('active'));

    const target = getStep(n);
    if (target) target.classList.add('active');

    currentStep = n;
    updateProgress(n);

    // Scroll form into view
    const bookingSec = qs('#termin');
    if (bookingSec) {
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76;
      const y    = bookingSec.getBoundingClientRect().top + window.scrollY - navH - 20;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  /* ── Validation helpers ── */
  function showError(id, msg) {
    const el = qs(`#${id}`);
    if (el) el.textContent = msg;
  }

  function clearError(id) {
    const el = qs(`#${id}`);
    if (el) el.textContent = '';
  }

  function validateStep(step) {
    if (step === 1) {
      clearError('step1-error');
      const selected = qs('input[name="service_type"]:checked', form);
      if (!selected) {
        showError('step1-error', 'Bitte wählen Sie einen Service aus.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      clearError('step2-error');
      const marke       = qs('#marke', form).value.trim();
      const modell      = qs('#modell', form).value.trim();
      const baujahr     = qs('#baujahr', form).value.trim();
      const beschreibung = qs('#beschreibung', form).value.trim();

      if (!marke) {
        showError('step2-error', 'Bitte wählen Sie die Fahrzeugmarke.');
        qs('#marke', form).focus();
        return false;
      }
      if (!modell) {
        showError('step2-error', 'Bitte geben Sie das Fahrzeugmodell an.');
        qs('#modell', form).focus();
        return false;
      }
      if (!baujahr || baujahr < 1980 || baujahr > 2026) {
        showError('step2-error', 'Bitte geben Sie ein gültiges Baujahr an (1980–2026).');
        qs('#baujahr', form).focus();
        return false;
      }
      if (!beschreibung) {
        showError('step2-error', 'Bitte beschreiben Sie kurz das Problem oder die gewünschte Arbeit.');
        qs('#beschreibung', form).focus();
        return false;
      }
      return true;
    }

    if (step === 3) {
      clearError('step3-error');
      const vorname    = qs('#vorname', form).value.trim();
      const nachname   = qs('#nachname', form).value.trim();
      const telefon    = qs('#telefon', form).value.trim();
      const email      = qs('#email', form).value.trim();
      const termin     = qs('#wunschtermin', form).value;

      if (!vorname) {
        showError('step3-error', 'Bitte geben Sie Ihren Vornamen an.');
        qs('#vorname', form).focus();
        return false;
      }
      if (!nachname) {
        showError('step3-error', 'Bitte geben Sie Ihren Nachnamen an.');
        qs('#nachname', form).focus();
        return false;
      }
      if (!telefon) {
        showError('step3-error', 'Bitte geben Sie Ihre Telefonnummer an.');
        qs('#telefon', form).focus();
        return false;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('step3-error', 'Die eingegebene E-Mail-Adresse ist ungültig.');
        qs('#email', form).focus();
        return false;
      }
      if (!termin) {
        showError('step3-error', 'Bitte wählen Sie einen Wunschtermin.');
        qs('#wunschtermin', form).focus();
        return false;
      }

      // Must not be in the past
      const chosen = new Date(termin);
      const today  = new Date();
      today.setHours(0, 0, 0, 0);
      if (chosen < today) {
        showError('step3-error', 'Der gewählte Termin liegt in der Vergangenheit. Bitte wählen Sie ein zukünftiges Datum.');
        qs('#wunschtermin', form).focus();
        return false;
      }
      return true;
    }

    return true;
  }

  /* ── "Weiter" buttons ── */
  qsa('.btn-next', form).forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = parseInt(btn.dataset.next, 10);
      if (validateStep(currentStep)) {
        showStep(next);
      }
    });
  });

  /* ── "Zurück" buttons ── */
  qsa('.btn-back', form).forEach((btn) => {
    btn.addEventListener('click', () => {
      const prev = parseInt(btn.dataset.prev, 10);
      showStep(prev);
    });
  });

  /* ── Form submit ── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    const submitBtn = qs('.btn-submit', form);
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gesendet…';
    }

    /* Build a mailto: URI so the inquiry lands in Josef's inbox */
    const service     = (qs('input[name="service_type"]:checked', form)?.value || '').toUpperCase();
    const marke       = qs('#marke',       form)?.value || '';
    const modell      = qs('#modell',      form)?.value || '';
    const baujahr     = qs('#baujahr',     form)?.value || '';
    const km          = qs('#km',          form)?.value || '';
    const kennzeichen = qs('#kennzeichen', form)?.value || '';
    const beschreibung= qs('#beschreibung',form)?.value || '';
    const vorname     = qs('#vorname',     form)?.value || '';
    const nachname    = qs('#nachname',    form)?.value || '';
    const telefon     = qs('#telefon',     form)?.value || '';
    const email       = qs('#email',       form)?.value || '';
    const termin      = qs('#wunschtermin',form)?.value || '';
    const uhrzeit     = qs('#uhrzeit',     form)?.value || '';
    const nachricht   = qs('#nachricht',   form)?.value || '';

    const subject = encodeURIComponent(`Anfrage: ${service} – ${marke} ${modell} (${baujahr})`);
    const body    = encodeURIComponent(
      `Neue Anfrage über die Website\n` +
      `==============================\n\n` +
      `SERVICE:        ${service}\n\n` +
      `FAHRZEUG\n` +
      `Marke:          ${marke}\n` +
      `Modell:         ${modell}\n` +
      `Baujahr:        ${baujahr}\n` +
      `Kilometerstand: ${km} km\n` +
      `Kennzeichen:    ${kennzeichen}\n\n` +
      `BESCHREIBUNG\n${beschreibung}\n\n` +
      `KONTAKT\n` +
      `Name:           ${vorname} ${nachname}\n` +
      `Telefon:        ${telefon}\n` +
      `E-Mail:         ${email}\n\n` +
      `TERMINWUNSCH\n` +
      `Datum:          ${termin}\n` +
      `Uhrzeit:        ${uhrzeit}\n\n` +
      `NACHRICHT\n${nachricht}`
    );

    /* Open the default mail client with the form data pre-filled */
    window.location.href = `mailto:joe.kellhammer@gmail.com?subject=${subject}&body=${body}`;

    setTimeout(() => { showStep(4); }, 800);
  });

  /* ── Reset form ── */
  const resetBtn = qs('#reset-form');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();

      // Re-enable submit button
      const submitBtn = qs('.btn-submit', form);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Anfrage absenden
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>`;
      }

      showStep(1);
    });
  }

  /* Set min date for appointment picker to today */
  const datePicker = qs('#wunschtermin', form);
  if (datePicker) {
    const today = new Date().toISOString().split('T')[0];
    datePicker.setAttribute('min', today);
  }

  /* Init progress */
  updateProgress(1);
})();

/* ================================================================
   9. FOOTER YEAR
   ================================================================ */
(function setYear() {
  const el = qs('#year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ================================================================
   10. STAGGER CARD REVEALS (service & part cards)
   ================================================================ */
(function initCardStagger() {
  /* Service cards: stagger based on data-index */
  qsa('.service-card[data-index], .part-card[data-index]').forEach((card) => {
    const idx   = parseInt(card.dataset.index, 10) || 0;
    const delay = idx * 0.08;
    card.style.transitionDelay = `${delay}s`;
  });
})();

/* ================================================================
   11. HERO TITLE — character-by-character reveal
   ================================================================ */
(function initHeroReveal() {
  const titleLines = qsa('.hero-title .title-line');
  if (!titleLines.length) return;

  titleLines.forEach((line, lineIdx) => {
    const text = line.textContent;
    line.textContent = '';

    // Wrap each character in a span
    [...text].forEach((char, charIdx) => {
      const span = document.createElement('span');
      span.textContent   = char === ' ' ? ' ' : char;
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(20px) rotateX(-40deg)';
      span.style.transition = `opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)`;
      span.style.transitionDelay = `${0.4 + lineIdx * 0.3 + charIdx * 0.04}s`;
      line.appendChild(span);
    });
  });

  // Trigger reveal after a short delay
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      titleLines.forEach((line) => {
        qsa('span', line).forEach((span) => {
          span.style.opacity   = '1';
          span.style.transform = 'translateY(0) rotateX(0)';
        });
      });
    });
  });
})();

/* ================================================================
   12. SERVICE SELECTION — radio button visual feedback
   ================================================================ */
(function initServiceSelect() {
  const radios = qsa('input[name="service_type"]');
  radios.forEach((radio) => {
    radio.addEventListener('change', () => {
      // Clear error on change
      const err = qs('#step1-error');
      if (err) err.textContent = '';
    });
  });
})();

/* ================================================================
   13. WORKSHOP ITEMS — stagger left-slide
   ================================================================ */
(function initWorkshopStagger() {
  qsa('.workshop-item[data-index]').forEach((item) => {
    const idx   = parseInt(item.dataset.index, 10) || 0;
    const delay = idx * 0.07;
    item.style.transitionDelay = `${delay}s`;
  });
})();

/* ================================================================
   14. KEYBOARD ACCESSIBILITY — Service radio cards
   ================================================================ */
(function initRadioKeyboard() {
  qsa('.service-opt-card').forEach((card) => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const radio = card.closest('.service-opt')?.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
  });
})();

/* ================================================================
   15. GLOW BUTTON — animated box-shadow on btn-primary
   ================================================================ */
(function initGlowButtons() {
  qsa('.btn-primary').forEach((btn) => {
    btn.addEventListener('mouseenter', () => {
      btn.style.animation = 'glowPulse 1.6s ease-in-out infinite';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.animation = '';
    });
  });
})();

/* ================================================================
   16. PREFETCH on hover (performance hint)
   ================================================================ */
(function initPrefetch() {
  if (!('IntersectionObserver' in window)) return;

  const links = qsa('a[href^="#"]');
  links.forEach((link) => {
    link.addEventListener('mouseenter', () => {
      const id     = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        target.getBoundingClientRect();
      }
    }, { once: true });
  });
})();

/* ================================================================
   17. CUSTOM CURSOR GLOW (desktop only)
   ================================================================ */
(function initCursor() {
  // Skip on touch devices
  if (window.matchMedia('(hover: none)').matches) return;

  const glow = qs('#cursor-glow');
  const dot  = qs('#cursor-dot');
  if (!glow || !dot) return;

  // Current rendered position (lerped)
  let glowX = 0, glowY = 0;
  // Target position (raw mouse)
  let targetX = 0, targetY = 0;
  // Dot follows instantly
  let dotX = 0, dotY = 0;

  let visible = false;
  let rafId   = null;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    // Glow lags behind (0.08 = sluggish, premium feel)
    glowX = lerp(glowX, targetX, 0.08);
    glowY = lerp(glowY, targetY, 0.08);

    // Dot snaps nearly instantly
    dotX = lerp(dotX, targetX, 0.45);
    dotY = lerp(dotY, targetY, 0.45);

    glow.style.transform = `translate(calc(${glowX}px - 50%), calc(${glowY}px - 50%))`;
    dot.style.transform  = `translate(calc(${dotX}px  - 50%), calc(${dotY}px  - 50%))`;

    rafId = requestAnimationFrame(tick);
  }

  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;

    if (!visible) {
      visible = true;
      glow.classList.add('visible');
      dot.classList.add('visible');
      // Teleport on first appearance to avoid sweeping in from 0,0
      glowX = dotX = e.clientX;
      glowY = dotY = e.clientY;
      if (!rafId) tick();
    }
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    visible = false;
    glow.classList.remove('visible');
    dot.classList.remove('visible');
  });

  // Expand dot on interactive elements
  const interactive = 'a, button, label, input, select, textarea, .service-card, .part-card, .btn';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactive)) {
      document.body.classList.add('cursor-pointer');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactive)) {
      document.body.classList.remove('cursor-pointer');
    }
  });
})();
