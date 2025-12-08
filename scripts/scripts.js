/* --------------------------------------------------------------------
   scripts.js — Lógica Principal del Sitio

   Este archivo es el "cerebro" general de la página web.
   Aquí se controlan las funciones que no tienen que ver directamente
   con el audio o video (esas están en scriptsaudio.js).

   Funciones principales que encontrarás aquí:
   1. El "Traductor" (LanguageManager): Cambia los textos entre Español e Inglés.
   2. La Navegación: Controla el menú, el desplazamiento suave (scroll) y el botón "Volver arriba".
   3. Las Pestañas (Tabs): Permite cambiar entre secciones (como en la biografía o videos).
   4. La Galería de Fotos: Abre las imágenes en tamaño grande (Lightbox).
   5. El Menú Móvil: Controla el botón de "hamburguesa" en celulares.
-------------------------------------------------------------------- */

// Esperamos a que toda la estructura de la página (DOM) esté lista antes de empezar.
document.addEventListener('DOMContentLoaded', () => {
  
  // Verificación de seguridad para YouTube: avisa si abres el archivo directamente sin un servidor.
  if (window.location && window.location.protocol === 'file:') {
    console.warn('Aviso: YouTube puede dar errores si abres el archivo directamente. Es mejor usar un servidor local.');
  }

  /* ------------------------------------------------------------------
     I. Herramientas de Ayuda (Helpers)
     Pequeñas funciones que nos sirven para tareas repetitivas.
     ------------------------------------------------------------------*/
  
  // Agrupamos estas herramientas para usarlas fácilmente en cualquier parte
  const utils = {
    isElement(el) { return el && el.nodeType === 1; }, // Verifica si algo es un elemento HTML válido
    safeCall(fn, ...args) { // Ejecuta una función de forma segura (si falla, no rompe la página)
      try { 
        if (typeof fn === 'function') return fn(...args); 
      } catch (e) { 
        console.warn('Error en utils.safeCall', e); 
      } 
    }
  };

  /* ------------------------------------------------------------------
     II. Gestor de Idiomas (LanguageManager)
     Este módulo se encarga de traducir la página.
     Funciona buscando textos en un "diccionario" (translations.js) y
     reemplazándolos en la pantalla.
     ------------------------------------------------------------------*/
  const LanguageManager = (() => {
    const STORAGE_KEY = 'siteLanguage'; // Nombre con el que guardamos la preferencia en el navegador
    const DEFAULT_LANG = 'es'; // Idioma por defecto: Español

    // Cargamos las traducciones desde el archivo translations.js
    const translations = window.SiteTranslations || {};

    const boundElements = new Map(); // Lista de elementos que tienen texto traducible
    const subscribers = new Set();   // Lista de funciones que quieren saber cuándo cambia el idioma
    let currentLang = DEFAULT_LANG;  // Idioma actual

    // Busca una traducción en el diccionario
    function getTranslation(key, lang) {
      const table = translations[lang] || {};
      if (Object.prototype.hasOwnProperty.call(table, key)) return table[key];
      return undefined;
    }

    // Reemplaza marcadores como {nombre} por valores reales en el texto
    function format(template, replacements) {
      if (!template || !replacements) return template;
      return Object.keys(replacements).reduce((acc, token) => acc.replaceAll(`{${token}}`, replacements[token]), template);
    }

    // Recuerda qué elementos de la página necesitan traducción
    function storeBinding(key, entry) {
      if (!key || !entry || !entry.el) return;
      const list = boundElements.get(key) || [];
      if (!list.some(existing => existing.el === entry.el && existing.attr === entry.attr)) {
        list.push(entry);
        boundElements.set(key, list);
      }
    }

    // Busca automáticamente todos los elementos con el atributo 'data-i18n-key'
    function bindInitialElements() {
      document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.dataset.i18nKey;
        if (!key) return;
        const attr = el.dataset.i18nAttr || null; // ¿Traducimos el contenido o un atributo (como el título)?
        const original = attr ? (el.getAttribute(attr) ?? '') : el.innerHTML;
        if (el.dataset && !el.dataset.i18nOriginal) el.dataset.i18nOriginal = original;
        storeBinding(key, { el, attr, original });
      });
    }

    // Aplica la traducción a un elemento específico
    function applyToEntry(entry, key, lang) {
      const { el, attr, original } = entry;
      if (!el) return;
      const translation = lang === DEFAULT_LANG ? undefined : getTranslation(key, lang);
      // Si es el idioma original, usamos el texto original. Si no, buscamos la traducción.
      const value = lang === DEFAULT_LANG ? original : (translation !== undefined ? translation : original);
      
      if (attr) el.setAttribute(attr, value);
      else el.innerHTML = value;
    }

    // Cambia el idioma de toda la página
    function applyLanguage(lang, options = {}) {
      const targetLang = translations[lang] ? lang : DEFAULT_LANG;
      currentLang = targetLang;
      
      // Actualiza todos los textos registrados
      boundElements.forEach((entries, key) => {
        entries.forEach(entry => applyToEntry(entry, key, targetLang));
      });
      
      // Avisa al navegador del cambio (útil para accesibilidad/lectores de pantalla)
      document.documentElement.setAttribute('lang', targetLang);
      
      // Guarda la preferencia del usuario si se solicita
      if (options.persist !== false) {
        try { localStorage.setItem(STORAGE_KEY, targetLang); } catch (e) { /* ignorar error si cookies bloqueadas */ }
      }
      
      // Avisa a otras partes del código que el idioma cambió
      subscribers.forEach(fn => utils.safeCall(fn, targetLang));
    }

    // Inicialización del gestor de idiomas
    function init() {
      bindInitialElements();
      let stored = null;
      try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { stored = null; }
      const initial = stored && translations[stored] ? stored : DEFAULT_LANG;
      applyLanguage(initial, { persist: false });
      return currentLang;
    }

    // Funciones públicas para usar desde fuera
    function setLanguage(lang) { applyLanguage(lang, { persist: true }); }

    function toggleLanguage() {
      const order = ['es', 'en'];
      const nextIndex = (order.indexOf(currentLang) + 1) % order.length;
      setLanguage(order[nextIndex]);
    }

    // Permite registrar manualmente un elemento para traducir
    function register(el, key, attr, options = {}) {
      if (!el || !key) return;
      const attribute = attr || null;
      const original = options.original !== undefined ? options.original : (attribute ? (el.getAttribute(attribute) ?? '') : el.innerHTML);
      storeBinding(key, { el, attr: attribute, original });
      applyToEntry({ el, attr: attribute, original }, key, currentLang);
    }

    // Función rápida para obtener un texto traducido (sin vincularlo a un elemento)
    function t(key, replacements, langOverride) {
      const lang = langOverride || currentLang;
      let template = getTranslation(key, lang);
      if (template === undefined && lang !== DEFAULT_LANG) {
        template = getTranslation(key, DEFAULT_LANG);
      }
      if (template === undefined) return '';
      return format(template, replacements);
    }

    // Permite suscribirse a cambios de idioma
    function onChange(fn) {
      if (typeof fn === 'function') subscribers.add(fn);
    }

    function getLanguage() { return currentLang; }

    return { init, setLanguage, toggleLanguage, register, t, onChange, getLanguage };
  })();

  /* ------------------------------------------------------------------
     III. Navegación y Pestañas (Tabs)
     Controla cómo nos movemos por la página y cambiamos entre vistas.
     ------------------------------------------------------------------*/
  
  const navTabs = document.querySelectorAll('.navbar-tabs a');
  const secciones = document.querySelectorAll('section.seccion');
  const navbar = document.querySelector('.navbar');
  const languageToggleBtn = document.getElementById('language-toggle');

  // Iniciamos el idioma
  let currentLanguage = LanguageManager.init();

  // Configuramos la accesibilidad de la barra de navegación
  if (navbar) {
    const navLabel = navbar.getAttribute('aria-label') || LanguageManager.t('nav.main', null, 'es') || 'Navegación principal';
    navbar.setAttribute('aria-label', navLabel);
    LanguageManager.register(navbar, 'nav.main', 'aria-label', { original: navLabel });
  }

  // Botón "Volver Arriba" (la flechita que aparece al bajar)
  const backToTopBtn = document.getElementById('back-to-top') || (() => {
    // Si no existe en el HTML, lo creamos aquí
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

  // Funciones vacías que se llenarán más adelante
  let updateGalleryAccessibility = () => { };
  let updateGlobalMuteButtonUI = () => { };
  let updateVisitCounterDisplay = () => { };
  let visitCount = null;

  // Actualiza el texto del botón de idioma (ES/EN)
  function updateLanguageToggleButton(lang) {
    if (!languageToggleBtn) return;
    
    const order = ['es', 'en'];
    const nextIndex = (order.indexOf(lang) + 1) % order.length;
    const nextLang = order[nextIndex];

    let labelKey = '';
    let defaultLabel = '';
    let buttonText = '';

    // Si el siguiente es inglés, mostramos "English"
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

  // Evento click para cambiar idioma
  if (languageToggleBtn) {
    languageToggleBtn.addEventListener('click', () => {
      LanguageManager.toggleLanguage();
      try { languageToggleBtn.blur(); } catch (e) { /* quitar foco tras click */ }
    });
  }

  updateLanguageToggleButton(currentLanguage);

  // Cuando cambia el idioma, actualizamos todas las partes de la interfaz
  LanguageManager.onChange(lang => {
    currentLanguage = lang;
    updateLanguageToggleButton(lang);
    updateVisitCounterDisplay();
    updateGalleryAccessibility();
    updateGlobalMuteButtonUI();
  });

  // Comportamiento del botón "Volver Arriba"
  backToTopBtn.addEventListener('click', () => {
    const scrollOptions = { top: 0, behavior: 'smooth' };
    try {
      window.scrollTo(scrollOptions);
    } catch (e) {
      window.scrollTo(0, 0);
    }
    try { backToTopBtn.blur(); } catch (e) { /* ignore */ }
  });

  // Detectar scroll para mostrar/ocultar la barra de navegación y el botón volver arriba
  function updateScrollState() {
    const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    // Si bajamos un poco, la barra de navegación cambia de estilo
    if (scrollY > 36) document.body.classList.add('navbar-scrolled');
    else document.body.classList.remove('navbar-scrolled');
    
    // Si bajamos mucho, aparece el botón de volver arriba
    if (backToTopBtn) {
      if (scrollY > 420) backToTopBtn.classList.add('visible');
      else backToTopBtn.classList.remove('visible');
    }
  }

  // Optimizamos el evento scroll para que no sature el navegador
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

  // Scroll Spy: Resalta en el menú la sección que estamos viendo
  function updateActiveSection() {
    let current = '';
    secciones.forEach(section => {
      const sectionTop = section.offsetTop;
      // Si hemos bajado hasta esta sección (menos un margen)
      if (window.scrollY >= (sectionTop - 300)) {
        current = '#' + section.getAttribute('id');
      }
    });

    navTabs.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === current) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveSection);
  
  // Desplazamiento suave al hacer clic en el menú
  navTabs.forEach(link => link.addEventListener('click', function (e) {
    e.preventDefault();
    const hash = this.getAttribute('href');
    const target = document.querySelector(hash);
    if (target) {
      const headerOffset = 80; // Compensamos la altura del menú fijo
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      
      // Actualizamos la URL sin saltos bruscos
      if (history.pushState) history.pushState(null, null, hash);
    }
  }));

  // Asegura que se abra la pestaña correcta si entramos con un enlace directo (ej: #videos)
  function ensureSectionTabsForHash() {
    if (window.location.hash === '#videos') activateDefaultTab('.video-tabs.tab-menu', '.video-tabs-content');
    if (window.location.hash === '#bio') activateDefaultTab('.bio-tabs.tab-menu', '.bio-tabs-content');
  }

  // Sistema de Pestañas (Tabs) - Reutilizable
  // Funciona como un archivador: muestra un contenido y oculta los demás
  function initTabs(tabMenuSelector, tabContentSelector) {
    const tabMenu = document.querySelector(tabMenuSelector);
    if (!tabMenu) return;
    if (!tabMenu.getAttribute('role')) tabMenu.setAttribute('role', 'tablist');
    const tabs = tabMenu.querySelectorAll('a[data-tab]');
    const tabContent = document.querySelector(tabContentSelector);
    if (!tabContent) return;
    const panes = tabContent.querySelectorAll('.tab-pane');

    // Configuración de accesibilidad (para lectores de pantalla)
    tabs.forEach(t => {
      if (!t.getAttribute('role')) t.setAttribute('role', 'tab');
      if (!t.hasAttribute('aria-selected')) t.setAttribute('aria-selected', t.classList.contains('active') ? 'true' : 'false');
      t.setAttribute('tabindex', t.classList.contains('active') ? '0' : '-1');
    });

    tabs.forEach(tab => tab.addEventListener('click', function (e) {
      e.preventDefault();
      
      // Pausar audios/videos al cambiar de pestaña para que no suenen de fondo
      try { if (window.AudioCore && typeof window.AudioCore.pauseAllMedia === 'function') window.AudioCore.pauseAllMedia(); } catch (_) { }
      
      // Desactivar todas las pestañas
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); t.setAttribute('tabindex', '-1'); });
      
      // Activar la clicada
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
      
      // Mostrar el contenido correspondiente
      const tabName = tab.getAttribute('data-tab');
      panes.forEach(pane => tabName === pane.id ? pane.classList.add('active') : pane.classList.remove('active'));
      
      try { tab.blur(); } catch (e) { /* ignore */ }
    }));

    activateDefaultTab(tabMenuSelector, tabContentSelector);
  }

  // Activa la primera pestaña por defecto si ninguna está activa
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

  // Inicializamos las pestañas de Videos y Biografía
  initTabs('.video-tabs.tab-menu', '.video-tabs-content');
  initTabs('.bio-tabs.tab-menu', '.bio-tabs-content');


  /* ------------------------------------------------------------------
     IV. Galería de Fotos (Lightbox)
     Crea una ventana superpuesta para ver las fotos en grande.
     ------------------------------------------------------------------*/
  
  // Buscamos todas las fotos que deben abrirse en la galería
  const galleryTriggers = Array.from(document.querySelectorAll('.galeria-fotos .foto img, .expandable-photo'));
  
  // Preparamos la información de cada foto (origen, título, descripción)
  const galleryItems = galleryTriggers.map(trigger => {
    const container = trigger.closest('.foto') || trigger.closest('.logro-media-container');
    
    // Función para encontrar el texto descriptivo de la foto
    const getCaption = () => {
      let text = '';
      if (container) {
        // Buscamos en diferentes lugares donde podría estar el texto
        const captionDiv = container.querySelector('.logro-media-caption');
        if (captionDiv) text = captionDiv.textContent.trim();
        
        if (!text) {
          const p = container.querySelector('p');
          if (p && container.classList.contains('foto')) text = p.textContent.trim();
        }
      }
      return text || trigger.getAttribute('alt') || '';
    };
    
    const getAlt = () => trigger.getAttribute('alt') || LanguageManager.t('gallery.defaultAlt') || 'Fotografía';
    // Usamos la imagen de alta calidad (data-full) si existe, si no la normal
    const src = trigger.dataset && trigger.dataset.full ? trigger.dataset.full : trigger.currentSrc || trigger.src;
    
    return { trigger, src, getCaption, getAlt };
  });

  // Si hay fotos, construimos el visor (Lightbox)
  if (galleryItems.length) {
    // Creamos los elementos HTML del visor dinámicamente
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
    mediaImg.className = 'lightbox-img';
    mediaImg.alt = '';
    media.appendChild(mediaImg);

    const captionNode = document.createElement('div');
    captionNode.className = 'photo-lightbox__caption';

    // Botones de control (Cerrar, Anterior, Siguiente)
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

    // Muestra una imagen específica
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

    // Abre el visor
    function openLightbox(index) {
      if (!galleryItems[index]) return;
      lastActiveTrigger = galleryItems[index] ? galleryItems[index].trigger : null;
      showImage(index);
      lightbox.classList.add('active');
      document.body.classList.add('lightbox-open'); // Bloquea el scroll de la página
      lightboxOpen = true;
      requestAnimationFrame(() => {
        try { closeBtn.focus(); } catch (e) { /* ignore */ }
      });
    }

    // Cierra el visor
    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.classList.remove('lightbox-open');
      lightboxOpen = false;
      // Devuelve el foco al elemento que abrió la galería (accesibilidad)
      if (lastActiveTrigger) {
        requestAnimationFrame(() => {
          try { lastActiveTrigger.focus(); } catch (e) { /* ignore */ }
        });
      }
    }

    // Navega entre fotos
    function navigate(delta) {
      if (!lightboxOpen) return;
      const total = galleryItems.length;
      const nextIndex = (currentIndex + delta + total) % total; // Cálculo circular (vuelve al principio)
      showImage(nextIndex);
    }

    // Configura los eventos para cada foto miniatura
    galleryItems.forEach((item, index) => {
      const { trigger } = item;
      trigger.style.cursor = 'zoom-in';
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('tabindex', '0');
      
      // Click para abrir
      trigger.addEventListener('click', event => {
        event.preventDefault();
        openLightbox(index);
      });

      // Teclado (Enter o Espacio) para abrir
      trigger.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(index);
        }
      });
    });

    // Eventos de los botones del visor
    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));
    closeBtn.addEventListener('click', closeLightbox);

    // Cerrar si se hace clic fuera de la imagen
    lightbox.addEventListener('click', event => {
      if (event.target === lightbox) closeLightbox();
    });

    // Teclas rápidas (Escape, Flechas)
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

    // Limpia la imagen al terminar la animación de cierre
    lightbox.addEventListener('transitionend', () => {
      if (!lightboxOpen) {
        mediaImg.src = '';
        captionNode.textContent = '';
      }
    });

    // Actualiza textos de accesibilidad si cambia el idioma
    updateGalleryAccessibility = () => {
      lightbox.setAttribute('aria-label', LanguageManager.t('gallery.dialogLabel') || 'Visor de fotografías');
      closeBtn.setAttribute('aria-label', LanguageManager.t('gallery.close') || 'Cerrar galería');
      prevBtn.setAttribute('aria-label', LanguageManager.t('gallery.prev') || 'Ver foto anterior');
      nextBtn.setAttribute('aria-label', LanguageManager.t('gallery.next') || 'Ver foto siguiente');
    };

    updateGalleryAccessibility();
  }

  /* ------------------------------------------------------------------
     V. Contador de Visitas
     Un contador simple que se guarda en el navegador del usuario.
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
     VI. Botón de Silencio Global (Mute)
     Conecta la interfaz con el sistema de audio (AudioCore).
     ------------------------------------------------------------------*/
  updateGlobalMuteButtonUI = () => {
    try {
      const btn = document.getElementById('global-mute-btn');
      if (!btn) return;
      // Preguntamos al sistema de audio si está silenciado
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
    // Si existe el botón y el sistema de audio, los conectamos
    if (muteBtn && window.AudioCore && typeof window.AudioCore.toggleGlobalMute === 'function') {
      muteBtn.addEventListener('click', function(){ 
        window.AudioCore.toggleGlobalMute(); 
        try{ this.blur(); }catch(e){} 
      });
    }
    // Escuchamos cambios en el estado de silencio
    if (window.AudioCore && typeof window.AudioCore.onMutedChange === 'function') {
      window.AudioCore.onMutedChange(() => updateGlobalMuteButtonUI());
    }
    updateGlobalMuteButtonUI();
  } catch (e) { /* ignore */ }

  /* ------------------------------------------------------------------
     VII. Barra de Progreso de Lectura
     Muestra una barrita en la parte superior indicando cuánto falta leer.
     ------------------------------------------------------------------*/
  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const bar = document.getElementById('scroll-progress');
    if (bar) bar.style.width = scrolled + '%';
  });

  /* ------------------------------------------------------------------
     VIII. Menú Móvil (Hamburguesa)
     Controla la apertura y cierre del menú en pantallas pequeñas.
     ------------------------------------------------------------------*/
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const navbarTabsContainer = document.querySelector('.navbar-tabs');

  if (hamburgerBtn && navbarTabsContainer) {
    hamburgerBtn.addEventListener('click', () => {
      const expanded = hamburgerBtn.getAttribute('aria-expanded') === 'true' || false;
      hamburgerBtn.setAttribute('aria-expanded', !expanded);
      hamburgerBtn.classList.toggle('open');
      navbarTabsContainer.classList.toggle('active');
      
      // Evita que se pueda hacer scroll en el fondo cuando el menú está abierto
      document.body.style.overflow = !expanded ? 'hidden' : ''; 
    });

    // Cierra el menú automáticamente al hacer clic en un enlace
    navbarTabsContainer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerBtn.classList.remove('open');
        navbarTabsContainer.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

});
