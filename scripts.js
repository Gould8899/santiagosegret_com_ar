/* --------------------------------------------------------------------
   scripts.js — versión limpia y reordenada

   Objetivo:
   - Mantener la funcionalidad existente (pestañas, lazy YouTube, un solo
     medio a la vez, controles compactos de audio, contador simple, y un
     guardia CSS runtime para fijar la cabecera) pero con código claro,
     sin duplicados y con comentarios precisos en castellano.

   Regla principal: no cambiar la lógica observable salvo limpiar y
   robustecer pequeñas fragilidades (listeners duplicados, elementos
   muteados, registro dinámico).
-------------------------------------------------------------------- */

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  if (window.location && window.location.protocol === 'file:') {
    console.warn('YouTube requiere origen http/https para validar la reproducción. Serví esta página desde un servidor local o el dominio final para evitar el Error 153.');
  }
  /* ------------------------------------------------------------------
     I.  Helpers / Utilities
     ------------------------------------------------------------------*/
  // Formatear segundos a M:SS
  function formatTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  // Utilidades agrupadas para facilitar reuso y testeo
  const utils = {
    formatTime, // reexporta la función principal
    isElement(el) { return el && el.nodeType === 1; },
    safeCall(fn, ...args) { try { if (typeof fn === 'function') return fn(...args); } catch (e) { console.warn('utils.safeCall error', e); } }
  };

  const LanguageManager = (() => {
    const STORAGE_KEY = 'siteLanguage';
    const DEFAULT_LANG = 'es';

    const translations = window.SiteTranslations || {};

    const boundElements = new Map();
    const subscribers = new Set();
    let currentLang = DEFAULT_LANG;

    function getTranslation(key, lang) {
      const table = translations[lang] || {};
      if (Object.prototype.hasOwnProperty.call(table, key)) return table[key];
      return undefined;
    }

    function format(template, replacements) {
      if (!template || !replacements) return template;
      return Object.keys(replacements).reduce((acc, token) => acc.replaceAll(`{${token}}`, replacements[token]), template);
    }

    function storeBinding(key, entry) {
      if (!key || !entry || !entry.el) return;
      const list = boundElements.get(key) || [];
      if (!list.some(existing => existing.el === entry.el && existing.attr === entry.attr)) {
        list.push(entry);
        boundElements.set(key, list);
      }
    }

    function bindInitialElements() {
      document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.dataset.i18nKey;
        if (!key) return;
        const attr = el.dataset.i18nAttr || null;
        const original = attr ? (el.getAttribute(attr) ?? '') : el.innerHTML;
        if (el.dataset && !el.dataset.i18nOriginal) el.dataset.i18nOriginal = original;
        storeBinding(key, { el, attr, original });
      });
    }

    function applyToEntry(entry, key, lang) {
      const { el, attr, original } = entry;
      if (!el) return;
      const translation = lang === DEFAULT_LANG ? undefined : getTranslation(key, lang);
      const value = lang === DEFAULT_LANG ? original : (translation !== undefined ? translation : original);
      if (attr) el.setAttribute(attr, value);
      else el.innerHTML = value;
    }

    function applyLanguage(lang, options = {}) {
      const targetLang = translations[lang] ? lang : DEFAULT_LANG;
      currentLang = targetLang;
      boundElements.forEach((entries, key) => {
        entries.forEach(entry => applyToEntry(entry, key, targetLang));
      });
      document.documentElement.setAttribute('lang', targetLang);
      if (options.persist !== false) {
        try { localStorage.setItem(STORAGE_KEY, targetLang); } catch (e) { /* ignore */ }
      }
      subscribers.forEach(fn => utils.safeCall(fn, targetLang));
    }

    function init() {
      bindInitialElements();
      let stored = null;
      try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { stored = null; }
      const initial = stored && translations[stored] ? stored : DEFAULT_LANG;
      applyLanguage(initial, { persist: false });
      return currentLang;
    }

    function setLanguage(lang) { applyLanguage(lang, { persist: true }); }

    function toggleLanguage() {
      const order = ['es', 'en'];
      const nextIndex = (order.indexOf(currentLang) + 1) % order.length;
      setLanguage(order[nextIndex]);
    }

    function register(el, key, attr, options = {}) {
      if (!el || !key) return;
      const attribute = attr || null;
      const original = options.original !== undefined ? options.original : (attribute ? (el.getAttribute(attribute) ?? '') : el.innerHTML);
      storeBinding(key, { el, attr: attribute, original });
      applyToEntry({ el, attr: attribute, original }, key, currentLang);
    }

    function t(key, replacements, langOverride) {
      const lang = langOverride || currentLang;
      let template = getTranslation(key, lang);
      if (template === undefined && lang !== DEFAULT_LANG) {
        template = getTranslation(key, DEFAULT_LANG);
      }
      if (template === undefined) return '';
      return format(template, replacements);
    }

    function onChange(fn) {
      if (typeof fn === 'function') subscribers.add(fn);
    }

    function getLanguage() { return currentLang; }

    return { init, setLanguage, toggleLanguage, register, t, onChange, getLanguage };
  })();

  /**
   * initTabs(tabMenuSelector, tabContentSelector)
   * Inicializa un grupo de pestañas accesibles.
   * - tabMenuSelector: selector del contenedor de tabs (role=tablist)
   * - tabContentSelector: selector del contenedor de panes (.tab-pane con id)
   */
  /* ------------------------------------------------------------------
     II. Navegación entre secciones y sistema de pestañas (tabs)
     - showSectionFromHash: muestra la sección correspondiente al hash
     - initTabs / activateDefaultTab: comportamiento accesible y simple
     ------------------------------------------------------------------*/
  const navTabs = document.querySelectorAll('.navbar-tabs.tab-menu a');
  const secciones = document.querySelectorAll('section.seccion');
  const navbar = document.querySelector('.navbar');
  // Nota: la lógica del hero-video está centralizada en scriptsaudio.js
  const mainContent = document.querySelector('main.content');
  const languageToggleBtn = document.getElementById('language-toggle');

  let currentLanguage = LanguageManager.init();

  if (navbar) {
    const navLabel = navbar.getAttribute('aria-label') || LanguageManager.t('nav.main', null, 'es') || 'Navegación principal';
    navbar.setAttribute('aria-label', navLabel);
    LanguageManager.register(navbar, 'nav.main', 'aria-label', { original: navLabel });
  }

  const backToTopBtn = document.getElementById('back-to-top') || (() => {
    const btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.type = 'button';
    const defaultAria = LanguageManager.t('ui.backToTop.aria', null, 'es') || 'Volver al inicio de la página';
    const defaultTitle = LanguageManager.t('ui.backToTop.title', null, 'es') || 'Volver arriba';
    btn.setAttribute('aria-label', defaultAria);
    btn.title = defaultTitle;
    btn.textContent = '↑';
    document.body.appendChild(btn);
    LanguageManager.register(btn, 'ui.backToTop.aria', 'aria-label', { original: defaultAria });
    LanguageManager.register(btn, 'ui.backToTop.title', 'title', { original: defaultTitle });
    return btn;
  })();

  let updateGalleryAccessibility = () => { };
  let updateGlobalMuteButtonUI = () => { };
  let updateVisitCounterDisplay = () => { };
  let visitCount = null;

  function updateLanguageToggleButton(lang) {
    if (!languageToggleBtn) return;
    
    const order = ['es', 'en'];
    const nextIndex = (order.indexOf(lang) + 1) % order.length;
    const nextLang = order[nextIndex];

    let labelKey = '';
    let defaultLabel = '';
    let buttonText = '';

    if (nextLang === 'en') {
      labelKey = 'language.toggle.toEnglish';
      defaultLabel = 'Cambiar idioma a inglés';
      buttonText = 'English';
    } else {
      labelKey = 'language.toggle.toSpanish';
      defaultLabel = 'Cambiar idioma a castellano';
      buttonText = 'Castellano';
    }

    const label = LanguageManager.t(labelKey, null, lang) || defaultLabel;
    languageToggleBtn.textContent = buttonText;
    languageToggleBtn.setAttribute('aria-label', label);
    languageToggleBtn.title = label;
    languageToggleBtn.removeAttribute('aria-pressed');
  }

  if (languageToggleBtn) {
    languageToggleBtn.addEventListener('click', () => {
      LanguageManager.toggleLanguage();
      try { languageToggleBtn.blur(); } catch (e) { /* ignore */ }
    });
  }

  updateLanguageToggleButton(currentLanguage);

  LanguageManager.onChange(lang => {
    currentLanguage = lang;
    updateLanguageToggleButton(lang);
    updateVisitCounterDisplay();
    updateGalleryAccessibility();
    updateGlobalMuteButtonUI();
  });

  backToTopBtn.addEventListener('click', () => {
    const scrollOptions = { top: 0, behavior: 'smooth' };
    try {
      window.scrollTo(scrollOptions);
    } catch (e) {
      window.scrollTo(0, 0);
    }
    try { backToTopBtn.blur(); } catch (e) { /* ignore */ }
  });

  function updateScrollState() {
    const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollY > 36) document.body.classList.add('navbar-scrolled');
    else document.body.classList.remove('navbar-scrolled');
    if (backToTopBtn) {
      if (scrollY > 420) backToTopBtn.classList.add('visible');
      else backToTopBtn.classList.remove('visible');
    }
  }

  let scrollTick = false;
  window.addEventListener('scroll', () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      updateScrollState();
      scrollTick = false;
    });
  }, { passive: true });
  updateScrollState();

  // (observer del hero-video movido a scriptsaudio.js)

  function showSectionFromHash(hash) {
    const hashToShow = hash && hash.startsWith('#') ? hash : '#inicio';
    let found = false;
    secciones.forEach(sec => {
      if ('#' + sec.id === hashToShow) {
        sec.classList.add('active');
        found = true;
      } else {
        sec.classList.remove('active');
      }
    });
    if (!found) {
      secciones.forEach(sec => sec.id === 'inicio' ? sec.classList.add('active') : sec.classList.remove('active'));
    }
    navTabs.forEach(l => l.getAttribute('href') === hashToShow ? l.classList.add('active') : l.classList.remove('active'));
    try { if (window.AudioCore && typeof window.AudioCore.notifySectionChange === 'function') window.AudioCore.notifySectionChange(hashToShow); } catch (e) { /* ignore */ }
  }

  // Inicial: mostrar sección indicada por URL (o inicio)
  showSectionFromHash(window.location.hash);

  // Enlaces del menú: actualizar URL sin scroll y mostrar sección
  navTabs.forEach(link => link.addEventListener('click', function (e) {
    e.preventDefault();
    const hash = this.getAttribute('href');
    if (history && history.pushState) history.pushState(null, '', hash);
    else window.location.hash = hash;
    showSectionFromHash(hash);
    try { this.blur(); } catch (e) { /* ignore */ }
  }));

  // Mantener comportamiento al cambiar hash o usar back/forward
  function ensureSectionTabsForHash() {
    if (window.location.hash === '#videos') activateDefaultTab('.video-tabs.tab-menu', '.video-tabs-content');
    if (window.location.hash === '#bio') activateDefaultTab('.bio-tabs.tab-menu', '.bio-tabs-content');
  }
  window.addEventListener('hashchange', () => { showSectionFromHash(window.location.hash); ensureSectionTabsForHash(); });
  window.addEventListener('popstate', () => { showSectionFromHash(window.location.hash); ensureSectionTabsForHash(); });

  // Sistema de pestañas accesible y simple
  function initTabs(tabMenuSelector, tabContentSelector) {
    const tabMenu = document.querySelector(tabMenuSelector);
    if (!tabMenu) return;
    if (!tabMenu.getAttribute('role')) tabMenu.setAttribute('role', 'tablist');
    const tabs = tabMenu.querySelectorAll('a[data-tab]');
    const tabContent = document.querySelector(tabContentSelector);
    if (!tabContent) return;
    const panes = tabContent.querySelectorAll('.tab-pane');

    // Preparar ARIA/tabindex
    tabs.forEach(t => {
      if (!t.getAttribute('role')) t.setAttribute('role', 'tab');
      if (!t.hasAttribute('aria-selected')) t.setAttribute('aria-selected', t.classList.contains('active') ? 'true' : 'false');
      t.setAttribute('tabindex', t.classList.contains('active') ? '0' : '-1');
    });

    tabs.forEach(tab => tab.addEventListener('click', function (e) {
      e.preventDefault();
      // Al cambiar de pestaña interna, pausar cualquier medio en reproducción
      try { if (window.AudioCore && typeof window.AudioCore.pauseAllMedia === 'function') window.AudioCore.pauseAllMedia(); } catch (_) { }
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); t.setAttribute('tabindex', '-1'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
      const tabName = tab.getAttribute('data-tab');
      panes.forEach(pane => tabName === pane.id ? pane.classList.add('active') : pane.classList.remove('active'));
      try { tab.blur(); } catch (e) { /* ignore */ }
    }));

    activateDefaultTab(tabMenuSelector, tabContentSelector);
  }

  function activateDefaultTab(tabMenuSelector, tabContentSelector) {
    const tabMenu = document.querySelector(tabMenuSelector);
    if (!tabMenu) return;
    const tabs = tabMenu.querySelectorAll('a[data-tab]');
    const tabContent = document.querySelector(tabContentSelector);
    if (!tabContent) return;
    const panes = tabContent.querySelectorAll('.tab-pane');
    tabs.forEach(t => t.classList.remove('active'));
    panes.forEach(p => p.classList.remove('active'));
    if (tabs.length && panes.length) { tabs[0].classList.add('active'); panes[0].classList.add('active'); }
  }

  // Inicializar pestañas principales
  initTabs('.video-tabs.tab-menu', '.video-tabs-content');
  initTabs('.bio-tabs.tab-menu', '.bio-tabs-content');

  /* ------------------------------------------------------------------
     III. (migrado) Lógica de medios está en scriptsaudio.js
     ------------------------------------------------------------------*/

  /* ------------------------------------------------------------------
    IV. Lazy-load optimizado de iframes YouTube
    
    [MOVIDO A scriptsaudio.js]
    Toda la lógica de carga diferida, miniaturas y reproducción de video
    se encuentra ahora centralizada en scriptsaudio.js para mantener
    el orden y proteger la funcionalidad de medios.
    ------------------------------------------------------------------*/

  /* ------------------------------------------------------------------
     V. (migrado) Controles de audio ahora en scriptsaudio.js
     ------------------------------------------------------------------*/

  /* ------------------------------------------------------------------
     VI. Galería de fotos (lightbox interactivo)
     ------------------------------------------------------------------*/
  // Seleccionamos tanto las fotos de la galería principal como las fotos expandibles en bio
  const galleryTriggers = Array.from(document.querySelectorAll('.galeria-fotos .foto img, .expandable-photo'));
  const galleryItems = galleryTriggers.map(trigger => {
    // Intentar encontrar el contenedor y el caption de varias formas
    const container = trigger.closest('.foto') || trigger.closest('.logro-media-container');
    
    const getCaption = () => {
      let text = '';
      if (container) {
        // Prioridad 1: .logro-media-caption (usado en bio)
        const captionDiv = container.querySelector('.logro-media-caption');
        if (captionDiv) text = captionDiv.textContent.trim();
        
        // Prioridad 2: p (usado en galería fotos)
        if (!text) {
          const p = container.querySelector('p');
          if (p && container.classList.contains('foto')) text = p.textContent.trim();
        }
      }
      return text || trigger.getAttribute('alt') || '';
    };
    const getAlt = () => trigger.getAttribute('alt') || LanguageManager.t('gallery.defaultAlt') || 'Fotografía';
    const src = trigger.dataset && trigger.dataset.full ? trigger.dataset.full : trigger.currentSrc || trigger.src;
    return {
      trigger,
      src,
      getCaption,
      getAlt
    };
  });

  if (galleryItems.length) {
    const lightbox = document.createElement('div');
    lightbox.className = 'photo-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', LanguageManager.t('gallery.dialogLabel') || 'Visor de fotografías');
    lightbox.tabIndex = -1;

    const inner = document.createElement('div');
    inner.className = 'photo-lightbox__inner';

    const media = document.createElement('div');
    media.className = 'photo-lightbox__media';

    const mediaImg = document.createElement('img');
    mediaImg.alt = '';
    media.appendChild(mediaImg);

    const captionNode = document.createElement('div');
    captionNode.className = 'photo-lightbox__caption';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'lightbox-close';
  closeBtn.setAttribute('aria-label', LanguageManager.t('gallery.close') || 'Cerrar galería');
    closeBtn.innerHTML = '&times;';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'lightbox-prev';
  prevBtn.setAttribute('aria-label', LanguageManager.t('gallery.prev') || 'Ver foto anterior');
    prevBtn.textContent = '‹';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'lightbox-next';
  nextBtn.setAttribute('aria-label', LanguageManager.t('gallery.next') || 'Ver foto siguiente');
    nextBtn.textContent = '›';

    inner.append(media, captionNode, closeBtn, prevBtn, nextBtn);
    lightbox.appendChild(inner);
    document.body.appendChild(lightbox);

  let currentIndex = 0;
  let lightboxOpen = false;
  let lastActiveTrigger = null;

    function showImage(index) {
      const item = galleryItems[index];
      if (!item) return;
      currentIndex = index;
      const altText = item.getAlt();
      const captionText = item.getCaption();
      mediaImg.src = item.src;
      mediaImg.alt = altText || LanguageManager.t('gallery.defaultAlt') || '';
      captionNode.textContent = captionText || '';
    }

    function openLightbox(index) {
      if (!galleryItems[index]) return;
      lastActiveTrigger = galleryItems[index] ? galleryItems[index].trigger : null;
      showImage(index);
      lightbox.classList.add('active');
      document.body.classList.add('lightbox-open');
      lightboxOpen = true;
      requestAnimationFrame(() => {
        try { closeBtn.focus(); } catch (e) { /* ignore */ }
      });
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.classList.remove('lightbox-open');
      lightboxOpen = false;
      if (lastActiveTrigger) {
        requestAnimationFrame(() => {
          try { lastActiveTrigger.focus(); } catch (e) { /* ignore */ }
        });
      }
    }

    function navigate(delta) {
      if (!lightboxOpen) return;
      const total = galleryItems.length;
      const nextIndex = (currentIndex + delta + total) % total;
      showImage(nextIndex);
    }

    function buildTriggerLabel(item) {
      const captionText = item.getCaption();
      if (captionText) {
        const prefix = LanguageManager.t('gallery.triggerPrefix') || 'Abrir fotografía:';
        return `${prefix} ${captionText}`;
      }
      return LanguageManager.t('gallery.triggerFallback') || 'Abrir fotografía en tamaño completo';
    }

    galleryItems.forEach((item, index) => {
      const { trigger } = item;
      trigger.style.cursor = 'zoom-in';
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('tabindex', '0');
      trigger.setAttribute('aria-label', buildTriggerLabel(item));

      trigger.addEventListener('click', event => {
        event.preventDefault();
        openLightbox(index);
      });

      trigger.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(index);
        }
      });
    });

    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));
    closeBtn.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', event => {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', event => {
      if (!lightboxOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigate(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigate(-1);
      }
    });

    lightbox.addEventListener('transitionend', () => {
      if (!lightboxOpen) {
        mediaImg.src = '';
        captionNode.textContent = '';
      }
    });

    updateGalleryAccessibility = () => {
      lightbox.setAttribute('aria-label', LanguageManager.t('gallery.dialogLabel') || 'Visor de fotografías');
      closeBtn.setAttribute('aria-label', LanguageManager.t('gallery.close') || 'Cerrar galería');
      prevBtn.setAttribute('aria-label', LanguageManager.t('gallery.prev') || 'Ver foto anterior');
      nextBtn.setAttribute('aria-label', LanguageManager.t('gallery.next') || 'Ver foto siguiente');
      galleryItems.forEach(item => {
        const { trigger } = item;
        if (!trigger) return;
        trigger.setAttribute('aria-label', buildTriggerLabel(item));
      });
    };

    updateGalleryAccessibility();
  }

  /* ------------------------------------------------------------------
     VII. Contador simple de visitas (localStorage)
     ------------------------------------------------------------------*/
  visitCount = parseInt(localStorage.getItem('visitCount') || '0', 10);
  visitCount++;
  localStorage.setItem('visitCount', String(visitCount));
  const counter = document.getElementById('visit-counter');
  updateVisitCounterDisplay = () => {
    if (!counter) return;
    const label = LanguageManager.t('counter.label', { count: visitCount }) || `Visitas: ${visitCount}`;
    counter.textContent = label;
  };
  updateVisitCounterDisplay();

  /* ------------------------------------------------------------------
     VIII. Mute global (UI) — núcleo en scriptsaudio.js
     ------------------------------------------------------------------*/
  updateGlobalMuteButtonUI = () => {
    try {
      const btn = document.getElementById('global-mute-btn');
      if (!btn) return;
      const muted = !!(window.AudioCore && window.AudioCore.isMuted && window.AudioCore.isMuted());
      const label = muted ? (LanguageManager.t('globalMute.unmute') || 'Activar todo el audio') : (LanguageManager.t('globalMute.mute') || 'Silenciar todo');
      btn.setAttribute('aria-pressed', String(muted));
      btn.setAttribute('aria-label', label);
      btn.title = label;
      btn.textContent = muted ? '🔇' : '🔈';
    } catch (e) { /* ignore */ }
  };

  try {
    const muteBtn = document.getElementById('global-mute-btn');
    if (muteBtn && window.AudioCore && typeof window.AudioCore.toggleGlobalMute === 'function') {
      muteBtn.addEventListener('click', function(){ window.AudioCore.toggleGlobalMute(); try{ this.blur(); }catch(e){} });
    }
    if (window.AudioCore && typeof window.AudioCore.onMutedChange === 'function') {
      window.AudioCore.onMutedChange(() => updateGlobalMuteButtonUI());
    }
    updateGlobalMuteButtonUI();
  } catch (e) { /* ignore */ }

  // Reproducción/autoplay del hero se maneja desde scriptsaudio.js

});
