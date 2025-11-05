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

    const translations = {
      es: {
        'nav.main': 'Navegación principal',
        'language.toggle.toEnglish': 'Cambiar idioma a inglés',
  'language.toggle.toSpanish': 'Cambiar idioma a castellano',
        'ui.backToTop.aria': 'Volver al inicio de la página',
        'ui.backToTop.title': 'Volver arriba',
        'theme.toggle.toDark': 'Cambiar a modo oscuro',
        'theme.toggle.toLight': 'Cambiar a modo claro',
        'theme.toggle.hint': 'Clic para cambiar el modo de color. Mantener Shift para volver al modo del sistema.',
        'gallery.dialogLabel': 'Visor de fotografías',
        'gallery.close': 'Cerrar galería',
        'gallery.prev': 'Ver foto anterior',
        'gallery.next': 'Ver foto siguiente',
        'gallery.triggerPrefix': 'Abrir fotografía:',
        'gallery.triggerFallback': 'Abrir fotografía en tamaño completo',
  'gallery.defaultAlt': 'Fotografía',
  'counter.label': 'Visitas: {count}',
  'globalMute.mute': 'Silenciar todo',
  'globalMute.unmute': 'Activar todo el audio'
      },
      en: {
        'meta.title': 'Santiago Segret - Musician',
        'meta.description': 'Santiago Segret, musician and bandoneon player. Discover his biography, videos, sheet music, and more.',
        'skip.toContent': 'Skip to content',
        'nav.home': 'Home',
        'nav.videos': 'Videos',
        'nav.awards': 'Awards',
        'nav.bio': 'Bio',
        'nav.photos': 'Photos',
        'nav.contact': 'Contact',
        'nav.rupulo': 'Rúpulo',
  'nav.languageToggle': 'Castellano',
        'nav.main': 'Main navigation',
        'language.toggle.toEnglish': 'Switch site to English',
  'language.toggle.toSpanish': 'Switch site to Castellano',
        'hero.subtitle': 'musician, bandoneonist',
        'hero.videoFallback': 'Your browser does not support the video element. You can download the file from the server.',
        'tabs.bandoneon': 'Bandoneón',
  'tabs.experimentos': 'Experiments',
        'tabs.bach': 'Bach',
        'tabs.patio': 'Patio',
        'tabs.dsq': 'DSQ',
        'tabs.piano': 'Works / games / piano',
  'videos.missing': 'Video coming soon.',
        'videos.bandoneon.1': 'Transcribed from Roberto Di Filippo\'s version.',
        'videos.bandoneon.2': 'Snapshots of maestro Julio Pane.',
        'videos.bandoneon.3': 'Arrangement by Máximo Mori with Roberto Di Filippo as the inevitable reference.',
        'videos.bandoneon.4': 'One of the many great arrangements by Néstor Marconi.',
        'videos.bandoneon.5': 'An original arrangement on music by the Ábalos Brothers.',
        'videos.bandoneon.6': 'A classic arranged by Bernardo Fingas.',
        'videos.bandoneon.7': 'Arrangement by Máximo Mori with Di Filippo as reference.',
        'videos.bandoneon.8': 'Transcribing Pedro Laurenz.',
        'videos.bandoneon.9': 'Selection of folk music for solo bandoneon.',
        'videos.bandoneon.10': 'Piazzolla arrangement recorded at Planta 16.',
        'videos.bandoneon.11': 'More Piazzolla for solo bandoneon.',
        'videos.bandoneon.12': 'Arrangement by Máximo Mori, Di Filippo as the reference version.',
        'videos.bandoneon.13': 'More Piazzolla for solo bandoneon.',
    'videos.bandoneon.14': 'Arrangements and more Piazzolla for solo bandoneon.',
    'videos.bandoneon.15': 'Arrangement by Máximo Mori.',
        'videos.bach.1': 'Bach\'s Invention No. 8 for two voices.',
        'videos.bach.2': 'The 15 two-voice inventions by Bach on bandoneon.',
        'videos.bach.3': 'Several pieces from the Anna Magdalena Bach Notebook.',
        'videos.bach.4': 'Playing the piano.',
        'videos.bach.5': 'Recorded in Panama.',
        'videos.bach.6': 'One of Bach\'s four duets on piano.',
        'videos.patio.1': 'With Patio.',
        'videos.patio.2': 'With Patio and Nadia Larsher.',
        'videos.patio.3': 'A zamba with the trio Patio.',
        'videos.dsq.1': '“Líquido 2” at the former Kirchner Cultural Center.',
        'videos.dsq.2': 'Concert featuring the music of Piazzolla.',
        'videos.dsq.3': '“Tanguera” by Mariano Mores, at Virasoro.',
        'videos.dsq.4': '“Canción 4” at the former Kirchner Cultural Center.',
  'videos.dsq.5': 'With the Diego Schissi Quinteto and Aca Seca at Café Vinilo.',
  'videos.experimentos.1': 'Vocal composition for 20 voices.',
  'videos.experimentos.2': 'String quartet recorded by Santiago Segret.',
  'videos.experimentos.3': '"Libro de Bucles".',
  'videos.experimentos.4': 'A homemade musical piece.',
  'videos.experimentos.5': 'Piano sonata created for the composition degree at UNA.',
  'videos.experimentos.6': 'String quartet with bandoneon.',
  'videos.experimentos.7': 'A song of mine for piano.',
  'videos.experimentos.8': 'Studying Thelonious Monk.',
  'videos.experimentos.9': 'Chopin\'s Prelude No. 16.',
  'videos.experimentos.10': 'Chopin\'s Étude No. 1.',
  'videos.experimentos.11': 'Chopin\'s Prelude No. 3.',
  'videos.experimentos.12': 'Playing the piano.',
  'videos.experimentos.13': 'Recorded in Panama.',
  'videos.experimentos.14': 'One of maestro Bach\'s four duets on piano.',
        'bio.tabs.now': 'Now',
        'bio.tabs.training': 'Training',
        'bio.tabs.beginnings': 'Beginnings',
        'bio.now.title': 'Now',
  'bio.now.item1': 'Private bandoneon lessons, online and in person.',
        'bio.now.item2': 'Bandoneon professor at the <strong>“Astor Piazzolla” Conservatory</strong> in Buenos Aires since 2018.',
        'bio.now.item3': 'Bandoneon professor at the <strong>National University of San Martín</strong> since 2013.',
        'bio.now.item4': 'Member of the trio <strong>Patio</strong>, with Andrés Pilar and Juan Quintero, since 2013.',
        'bio.now.item5': 'Professor and assistant conductor of the <strong>UNA Tango Orchestra</strong>, led by Ariel Pirotti since 2010.',
        'bio.now.item6': 'Member of the <strong>Diego Schissi Quinteto</strong> since 2009.',
  'bio.now.item7': 'Developer and creator of the sheet music catalog <a href="https://rupulo-ediciones.web.app" target="_blank" rel="noopener noreferrer"><strong>https://rupulo-ediciones.web.app</strong></a> since 2012.',
        'bio.training.title': 'Training',
        'bio.training.item1': 'In 2005 he completed the program of the Emilio Balcarce Tango Orchestra School alongside masters such as Victor Lavallén, Raúl Garello, Lidia Borda, José Colángelo, and Néstor Marconi.',
        'bio.training.caption1': 'Photo with Emilio Balcarce at the Pantheon in Rome.',
  'bio.training.item2': 'He has also shared recordings and stages with Leopoldo Federico, Raúl Garello, Victor Lavallén, Vitillo Ábalos, Hilda Herrera, Stefano Bollani, Susana Rinaldi, Nadia Larcher, Luna Monti, Naty Peluso, Pablo Estigarribia, Amelita Baltar, Jorge Fandermole, Rafael Villazón, Nacho Vidal, Marcelo Moguilevsky, Hernán Segret, Victor Villadangos, Mariana Rewersky, Guillermo Rubino, Ismael Grossman, Juan Pablo Navarro, Mono Fontana.',
        'bio.training.item3': 'In 2019 he graduated with a degree in <strong>Music Arts with a concentration in Composition at UNA</strong>.',
        'bio.training.caption2': '“Fragmento de Libro de Bucles” – Final project of the degree.',
        'bio.training.item4': 'From 2013 to 2015 he was part of the Buenos Aires City Tango Orchestra, then conducted by Raúl Garello, Néstor Marconi, and Carlos Cuacci.',
        'bio.training.caption3': 'At the Usina del Arte with the Buenos Aires City Tango Orchestra.',
        'bio.training.item5': 'He completed the educational program led by Hilda Herrera called CIMAP: Creators and Performers of Argentine Music on Piano.',
        'bio.training.item6': 'Throughout his adolescence and youth he studied bandoneon with Pablo Mainetti, Julio Pane, Mariano “Paya” Cigna, Federico Pereiro, and with Carlos Lazzari at age 18.',
        'bio.training.item7': 'In those years he visited more than 20 countries with the Tango Orchestra School, Érica Di Salvo\'s Orchestra, the Diego Schissi Quintet, the trio Patio, and others.',
        'bio.beginnings.title': 'Beginnings',
        'bio.beginnings.item1': 'Santiago Segret was born on May 5, 1988 in Illinois and has lived in Buenos Aires since he was four. As a child he played on his grandfather Horacio\'s upright piano in Almagro, sang with his mother, and kept rhythm on the bombo with his father. He began playing bandoneon at seven with Osvaldo “El Marinero” Montes.',
        'bio.beginnings.caption1': 'Playing “Caminito” and photo with Marinero Montes.',
        'bio.beginnings.item2': 'Around age ten he took piano lessons with Liliana Campos. At fifteen he opened for Javier Malosetti at La Trastienda performing Piazzolla solos.',
        'bio.beginnings.caption2': 'Recordings from La Trastienda: “Mi Refugio” and “La Familia”, audio by Raúl Monti.',
        'bio.beginnings.audio1': '<strong>Mi Refugio:</strong>',
        'bio.beginnings.audio2': '<strong>La Familia:</strong>',
        'audio.unsupported': 'Your browser does not support the audio element.',
        'audio.miRefugio.control': 'Audio controls for “Mi Refugio”.',
        'audio.miRefugio.play': 'Play',
        'audio.miRefugio.volume': 'Volume',
        'audio.laFamilia.control': 'Audio controls for “La Familia”.',
        'audio.laFamilia.play': 'Play',
        'audio.laFamilia.volume': 'Volume',
        'awards.title': 'Awards',
        'awards.2024': '<strong>Latin Grammy</strong> for Best Tango Album — <a href="https://open.spotify.com/album/2wabWzvHxIp7DoiYoW5waK?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>Apiazolado</em></a>, with the Diego Schissi Quinteto.',
        'awards.2023': '<strong>Premio Gardel</strong> for Best Folklore Album — <a href="https://open.spotify.com/album/64wnAObYHWcXusn5A8fXcl" target="_blank" rel="noopener noreferrer"><em>Patio Vol. 2</em></a>, by Juan Quintero, Andrés Pilar, and Santiago Segret.',
        'awards.2018a': '<strong>Premio Gardel</strong> for Best Folklore Album — <a href="https://open.spotify.com/album/5OePvXFX4ztMM9tTXud1uk?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>Patio Vol. 1</em></a>, by Juan Quintero, Andrés Pilar, and Santiago Segret.',
        'awards.2016a': '<strong>Premio Gardel</strong> in the Tango Instrumental Orchestra category — <a href="https://open.spotify.com/album/474RxN2GuitD351hsAPNbn?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>Timba</em></a>, with the Diego Schissi Quinteto.',
        'awards.2016b': '<strong>Premio Gardel</strong> for Best Tango Album — <a href="https://open.spotify.com/intl-es/album/2PTXTj8Vr7IEmr80c7e5rJ?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>El rejunte</em></a>, by the UNA Tango Orchestra.',
        'awards.2013': '<strong>Premio Gardel</strong> for Best Tango Album — <a href="https://open.spotify.com/intl-es/album/4lkkdErHecpciBcNUEgLHh?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>Tipas y Tipos (En Vivo en Café Vinilo)</em></a>, with the Diego Schissi Quinteto.',
        'photos.1.alt': 'With Marinero Montes',
        'photos.1.caption': 'With Marinero Montes.',
        'photos.2.alt': 'As a child at Goyo Barja\'s house',
        'photos.2.caption': 'As a child at Goyo Barja\'s house.',
        'photos.3.alt': 'With Emilio Balcarce at the Pantheon in Rome',
        'photos.3.caption': 'With Emilio Balcarce at the Pantheon in Rome.',
        'photos.4.alt': 'Andrés and Vitillo',
        'photos.4.caption': 'With Andrés Pilar and Vitillo Ábalos.',
        'photos.5.alt': 'Pablo Estigarribia and Marco Antonio Fernández',
        'photos.5.caption': 'With Pablo Estigarribia and Marco Antonio Fernández in Rome.',
        'photos.6.alt': 'With Leopoldo Federico',
        'photos.6.caption': 'With Leopoldo Federico.',
        'photos.7.alt': 'With Andrés Pilar',
        'photos.7.caption': 'With Andrés Pilar.',
        'photos.8.alt': 'At Virasoro',
        'photos.8.caption': 'At Virasoro with Rubino, Schissi, Grossman, and Navarro.',
        'photos.9.alt': 'With Fandermole',
        'photos.9.caption': 'With Jorge Fandermole and Tiqui Cantero in La Rioja.',
        'photos.10.alt': 'With Federico Pereiro and Marco Antonio Fernández',
        'photos.10.caption': 'With Federico Pereiro and Marco Antonio Fernández at the Orchestra School.',
        'photos.11.alt': 'Pane Lautaro',
        'photos.11.caption': 'With Julio Pane and Lautaro Greco.',
        'photos.12.alt': 'With Furman, Quintanilla, and Amerise',
        'photos.12.caption': 'With Furman, Quintanilla, and Amerise, accompanying Morena Albert.',
        'photos.13.alt': 'With Evgeny Kissin\'s mother',
        'photos.13.caption': 'With Evgeny Kissin\'s mother at the doors of Teatro Colón.',
        'photos.14.alt': 'With Patio',
        'photos.14.caption': 'With Patio in Rosario.',
        'photos.15.alt': 'With Louise Cole',
        'photos.15.caption': 'With Louise Cole.',
        'photos.16.alt': 'With Mariana Rewersky and company',
        'photos.16.caption': 'With Mariana Rewersky, Victor Villadangos, David Akerman, and Paula Castro.',
        'photos.17.alt': 'At Rafael Villazón\'s place',
        'photos.17.caption': 'At Rafael Villazón\'s place.',
        'photos.18.alt': 'Juan and Luna',
        'photos.18.caption': 'With Juan Quintero and Luna Monti.',
        'photos.19.alt': 'With Aca Seca',
        'photos.19.caption': 'With Aca Seca.',
        'photos.20.alt': 'With Mono Fontana',
        'photos.20.caption': 'With Mono Fontana.',
        'photos.21.alt': 'Palestrini and Baltazar Estol',
        'photos.21.caption': 'With Sergio Palestrini and Baltazar Estol.',
        'photos.22.alt': 'Diego Schissi Quintet with Bollani',
        'photos.22.caption': 'Diego Schissi Quintet with Bollani.',
        'contact.title': 'Contact',
        'contact.email': '<strong>Email:</strong> <a href="mailto:ssegret@gmail.com" class="contacto-link">ssegret@gmail.com</a>',
        'contact.phone': '<strong>Phone:</strong> <a href="tel:+541149890559" class="contacto-link">+54 11 4989-0559</a>',
        'contact.youtube': '<strong>YouTube:</strong> <a href="https://www.youtube.com/@SantiagoSegret" target="_blank" rel="noopener noreferrer" class="contacto-link">Visit channel</a>',
        'rupulo.title': 'Rúpulo Editions',
  'rupulo.description': '<strong>Rúpulo Ediciones</strong> is Santiago Segret\'s sheet music catalog. Transcriptions, arrangements, compositions, copies, inventions, exercises, primarily oriented toward the bandoneon and tango, while also reaching other areas of music and pedagogy.',
        'rupulo.visit': '<strong>Visit catalog:</strong> <a href="https://rupulo-ediciones.web.app" target="_blank" rel="noopener noreferrer">rupulo-ediciones.web.app</a>',
        'ui.backToTop.aria': 'Scroll back to the top',
        'ui.backToTop.title': 'Back to top',
        'theme.toggle.toDark': 'Switch to dark mode',
        'theme.toggle.toLight': 'Switch to light mode',
        'theme.toggle.hint': 'Click to change color mode. Hold Shift to return to the system mode.',
        'gallery.dialogLabel': 'Photo viewer',
        'gallery.close': 'Close gallery',
        'gallery.prev': 'View previous photo',
        'gallery.next': 'View next photo',
        'gallery.triggerPrefix': 'Open photo:',
        'gallery.triggerFallback': 'Open photo in full size',
        'gallery.defaultAlt': 'Photograph',
        'counter.label': 'Visits: {count}',
        'globalMute.mute': 'Mute all audio',
        'globalMute.unmute': 'Unmute all audio'
      }
    };

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
      document.documentElement.setAttribute('lang', targetLang === 'en' ? 'en' : 'es');
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

    function toggleLanguage() { setLanguage(currentLang === 'es' ? 'en' : 'es'); }

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
  const heroVideo = document.querySelector('.hero-video');
  const mainContent = document.querySelector('main.content');
  const languageToggleBtn = document.getElementById('language-toggle');

  document.body.classList.add('theme-dark');
  document.body.setAttribute('data-theme', 'dark');

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
    const labelKey = lang === 'es' ? 'language.toggle.toEnglish' : 'language.toggle.toSpanish';
  const label = LanguageManager.t(labelKey, null, lang) || (lang === 'es' ? 'Cambiar idioma a inglés' : 'Switch site to Castellano');
  languageToggleBtn.textContent = lang === 'es' ? 'English' : 'Castellano';
    languageToggleBtn.setAttribute('aria-label', label);
    languageToggleBtn.title = label;
    languageToggleBtn.setAttribute('aria-pressed', String(lang === 'en'));
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

  if (heroVideo) {
    try {
      const heroObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            try { heroVideo.pause(); } catch (e) { /* ignore */ }
          }
        });
      }, { threshold: 0.3 });
      heroObserver.observe(heroVideo);
    } catch (e) { /* ignore observer errors */ }
  }

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
    if (heroVideo && hashToShow !== '#inicio') {
      try { heroVideo.pause(); } catch (e) { /* ignore */ }
    }
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
     III. MediaManager central (HTML audio/video)
     - registra audio/video, evita listeners duplicados,
     - cuando un elemento entra en 'play' pausa los demás.
     ------------------------------------------------------------------*/
  /**
   * MediaManager
   * - htmlMedias: Set de elementos audio/video gestionados
   * - registerHtmlMedia(el): registra el elemento y evita listeners duplicados
   * - pauseAllExcept(except): pausa todos los demás medios HTML
   */
  const MediaManager = {
    htmlMedias: new Set(),
    _listeners: new WeakMap(),
    registerHtmlMedia(el) {
      if (!el || typeof el.addEventListener !== 'function') return;
      if (this.htmlMedias.has(el)) return; // idempotente
      this.htmlMedias.add(el);
      const onPlay = () => {
        try {
          this.pauseAllExcept(el);
          try {
            if (YouTubeManager && typeof YouTubeManager.notifyHtmlMediaPlay === 'function') {
              YouTubeManager.notifyHtmlMediaPlay();
            }
          } catch (e) { /* ignore YouTube sync errors */ }
          /* además pausar el hero video si existe y no es el que acaba de iniciar */
          try {
            const hero = document.querySelector('.hero-video');
            if (hero && hero !== el && !hero.paused) {
              hero.pause();
            }
          } catch (e) { /* ignore hero pause errors */ }
        } catch (e) { /* ignore */ }
      };
      el.addEventListener('play', onPlay);
      try { this._listeners.set(el, onPlay); } catch (e) { /* ignore */ }
    },
    pauseAllExcept(except) {
      this.htmlMedias.forEach(m => { if (m !== except) try { if (!m.paused) m.pause(); } catch (e) { /* ignore */ } });
    },
    pauseAllHtmlMedia() { this.htmlMedias.forEach(m => { try { if (!m.paused) m.pause(); } catch (e) { /* ignore */ } }); }
  };

  const YouTubeManager = (() => {
    const players = new Map(); // iframe -> player
    const pending = new Set();
    let apiRequested = false;
    let apiReady = false;
    let globalMuted = false;

    function ensureApi() {
      if (window.YT && typeof window.YT.Player === 'function') {
        apiReady = true;
        return;
      }
      if (apiRequested) return;
      apiRequested = true;
      if (!document.getElementById('youtube-iframe-api')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.id = 'youtube-iframe-api';
        const container = document.head || document.body || document.documentElement;
        if (container) container.appendChild(tag);
      }
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
      apiReady = true;
      pending.forEach(iframe => {
        try { createPlayer(iframe); } catch (e) { /* ignore */ }
      });
      pending.clear();
      if (typeof previousReady === 'function') {
        try { previousReady(); } catch (e) { /* ignore */ }
      }
    };

    function applyMuteState(player) {
      if (!player || typeof player.mute !== 'function' || typeof player.unMute !== 'function') return;
      try {
        if (globalMuted) player.mute();
        else player.unMute();
      } catch (e) { /* ignore mute errors */ }
    }

    function handleStateChange(event) {
      if (!event || typeof event.data === 'undefined' || !event.target || typeof YT === 'undefined') return;
      const player = event.target;
      if (event.data === YT.PlayerState.PLAYING) {
        pauseAllExcept(player);
        try { MediaManager.pauseAllHtmlMedia(); } catch (e) { /* ignore */ }
      }
    }

    function createPlayer(iframe) {
      if (!iframe || players.has(iframe)) return;
      if (!window.YT || typeof window.YT.Player !== 'function') {
        pending.add(iframe);
        ensureApi();
        return;
      }
      const player = new YT.Player(iframe, {
        events: {
          onReady: () => applyMuteState(player),
          onStateChange: handleStateChange
        }
      });
      players.set(iframe, player);
      pending.delete(iframe);
      applyMuteState(player);
    }

    function pauseAllExcept(activePlayer) {
      players.forEach(player => {
        if (activePlayer && player === activePlayer) return;
        try { player.pauseVideo(); } catch (e) { /* ignore pause errors */ }
      });
    }

    function pauseAll() { pauseAllExcept(null); }

    return {
      registerIframe(iframe) {
        if (!iframe) return;
        if (players.has(iframe) || pending.has(iframe)) return;
        if (window.YT && typeof window.YT.Player === 'function') {
          createPlayer(iframe);
        } else {
          pending.add(iframe);
          ensureApi();
        }
      },
      notifyHtmlMediaPlay() {
        pauseAll();
      },
      pauseAllExcept,
      pauseAll,
      setGlobalMuted(muted) {
        globalMuted = !!muted;
        players.forEach(player => applyMuteState(player));
      }
    };
  })();

  // Registrar los media ya presentes
  document.querySelectorAll('audio, video').forEach(el => MediaManager.registerHtmlMedia(el));

  // Listener global en captura: si cualquier medio comienza a reproducirse, pausar el hero video.
  try {
    document.addEventListener('play', function (e) {
      try {
        const target = e && e.target;
        if (!target) return;
        const hero = document.querySelector('.hero-video');
        if (hero && target !== hero && !hero.paused) {
          try { hero.pause(); } catch (err) { /* ignore */ }
        }
      } catch (err) { /* ignore */ }
    }, true);
  } catch (e) { /* ignore */ }

  // Registrar dinámicamente los media que se añadan después
  try {
    const mediaObserver = new MutationObserver(muts => {
      muts.forEach(m => {
        (m.addedNodes || []).forEach(node => {
          try {
            if (!node || node.nodeType !== 1) return;
            const el = node;
            if (el.matches && (el.matches('audio') || el.matches('video'))) MediaManager.registerHtmlMedia(el);
            const nested = el.querySelectorAll && el.querySelectorAll('audio, video');
            if (nested && nested.length) nested.forEach(x => MediaManager.registerHtmlMedia(x));
          } catch (e) { /* ignore node errors */ }
        });
      });
    });
    mediaObserver.observe(document.documentElement || document.body, { childList: true, subtree: true });
  } catch (e) { /* non-critical */ }

  /* ------------------------------------------------------------------
    IV. Lazy-load sencillo de iframes YouTube (si los hay)
    - carga el src cuando el iframe entra en viewport para mejorar tiempos
    ------------------------------------------------------------------*/
  const lazyVideos = document.querySelectorAll('iframe.lazy-video');

  function buildEmbedUrl(rawSrc) {
    if (!rawSrc) return null;
    try {
      const url = new URL(rawSrc);
      const isFileProtocol = window.location && window.location.protocol === 'file:';
      if (!isFileProtocol) {
        const origin = window.location && window.location.origin;
        if (origin && origin !== 'null' && !url.searchParams.has('origin')) {
          url.searchParams.set('origin', origin);
        }
      }
      if (!url.searchParams.has('rel')) url.searchParams.set('rel', '0');
      if (!url.searchParams.has('modestbranding')) url.searchParams.set('modestbranding', '1');
      if (!url.searchParams.has('playsinline')) url.searchParams.set('playsinline', '1');
      if (!url.searchParams.has('enablejsapi')) url.searchParams.set('enablejsapi', '1');
      return url.toString();
    } catch (error) {
      console.warn('buildEmbedUrl error', error);
      return rawSrc;
    }
  }

  function loadIframe(iframe) {
    if (!iframe || !iframe.dataset || !iframe.dataset.src) return;
    const finalSrc = buildEmbedUrl(iframe.dataset.src);
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.src = finalSrc || iframe.dataset.src;
    iframe.removeAttribute('data-src');
    try {
      if (YouTubeManager && typeof YouTubeManager.registerIframe === 'function') {
        YouTubeManager.registerIframe(iframe);
      }
    } catch (e) { /* ignore YouTube registration errors */ }
  }

  if ('IntersectionObserver' in window) {
    const iframeObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        loadIframe(entry.target);
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '120px 0px' });
    lazyVideos.forEach(iframe => iframeObserver.observe(iframe));
  } else {
    lazyVideos.forEach(iframe => loadIframe(iframe));
  }

  /* ------------------------------------------------------------------
     V. Controles compactos de audio (UI personalizado)
     - play/pause, progreso, tiempo, volumen
     - se registran con MediaManager para respetar "un solo medio"
     ------------------------------------------------------------------*/
  /**
   * setupCompactAudioControls(audioId, rootId)
   * - Conecta la UI compacta de audio con el elemento <audio> real.
   * - Mantiene el texto del botón en sincronía y registra el audio en MediaManager.
   */
  function setupCompactAudioControls(audioId, rootId) {
    const audio = document.getElementById(audioId);
    const root = document.getElementById(rootId);
    if (!audio || !root) return;

    const playBtn = root.querySelector('.compact-play');
    const progress = root.querySelector('.compact-progress');
    const timeLabel = root.querySelector('.compact-time');
    const volume = root.querySelector('.compact-volume');

    // Registrar en MediaManager
    try { MediaManager.registerHtmlMedia(audio); } catch (e) { /* ignore */ }

    // Metadata: duración
    audio.addEventListener('loadedmetadata', () => { if (progress) progress.max = audio.duration; });

    // Play/pause desde UI
    if (playBtn) playBtn.addEventListener('click', () => {
      if (audio.paused) { try { MediaManager.pauseAllExcept(audio); } catch (e) { /* ignore */ } audio.play(); playBtn.textContent = '⏸'; }
      else { audio.pause(); playBtn.textContent = '▶'; }
    });

    // Actualización de progreso y tiempo
    audio.addEventListener('timeupdate', () => {
      if (progress && !progress.dragging) progress.value = audio.currentTime;
      if (timeLabel) timeLabel.textContent = utils.formatTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => { if (playBtn) playBtn.textContent = '▶'; if (progress) progress.value = 0; if (timeLabel) timeLabel.textContent = utils.formatTime(0); });

    // Sincronizar botón con cambios de reproducción hechos fuera del UI
    audio.addEventListener('play', () => { if (playBtn) playBtn.textContent = '⏸'; });
    audio.addEventListener('pause', () => { if (playBtn && !audio.ended) playBtn.textContent = '▶'; });

    // Barra de progreso (input + change)
    if (progress) {
      progress.addEventListener('input', () => { progress.dragging = true; if (timeLabel) timeLabel.textContent = utils.formatTime(progress.value); });
      progress.addEventListener('change', () => { audio.currentTime = parseFloat(progress.value); progress.dragging = false; });
    }

    // Volumen
    if (volume) { volume.addEventListener('input', () => { audio.volume = parseFloat(volume.value); }); audio.volume = parseFloat(volume.value || 1); }

    // Inicializar etiquetas/estado
    if (timeLabel) timeLabel.textContent = utils.formatTime(0);
    if (playBtn) playBtn.textContent = audio.paused ? '▶' : '⏸';
  }

  // Enlazar controles compactos existentes
  setupCompactAudioControls('audio-mi-refugio', 'compact-mi-refugio');
  setupCompactAudioControls('audio-la-familia', 'compact-la-familia');

  /* ------------------------------------------------------------------
     VI. Galería de fotos (lightbox interactivo)
     ------------------------------------------------------------------*/
  const galleryTriggers = Array.from(document.querySelectorAll('.galeria-fotos .foto img'));
  const galleryItems = galleryTriggers.map(trigger => {
    const container = trigger.closest('.foto');
    const captionEl = container ? container.querySelector('p') : null;
    const getCaption = () => {
      const text = captionEl ? captionEl.textContent.trim() : '';
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
     VIII. Guardia runtime CSS para fijar navbar/pestañas (si algún script
     intenta modificarlo en runtime)
     ------------------------------------------------------------------*/
  // ----------------- Global mute control -----------------
  // Estado persistente de mute global
  const GLOBAL_MUTE_KEY = 'siteGlobalMuted';
  let globalMuted = !!JSON.parse(localStorage.getItem(GLOBAL_MUTE_KEY) || 'false');

  updateGlobalMuteButtonUI = () => {
    try {
      const btn = document.getElementById('global-mute-btn');
      if (!btn) return;
      const label = globalMuted ? (LanguageManager.t('globalMute.unmute') || 'Activar todo el audio') : (LanguageManager.t('globalMute.mute') || 'Silenciar todo');
      btn.setAttribute('aria-pressed', String(globalMuted));
      btn.setAttribute('aria-label', label);
      btn.title = label;
      btn.textContent = globalMuted ? '🔇' : '🔈';
    } catch (e) { /* ignore */ }
  };

  function setGlobalMuted(mute, options) {
    const initial = options && options.initial;
    globalMuted = !!mute;
    localStorage.setItem(GLOBAL_MUTE_KEY, JSON.stringify(globalMuted));
    // mutear/desmutear todos los medios HTML registrados
    try {
      MediaManager.htmlMedias.forEach(m => {
        try {
          // Si es la inicialización, mantener muted en elementos autoplay
          // para evitar conflictos con políticas del navegador.
          if (!globalMuted && initial && m.hasAttribute && m.hasAttribute('autoplay')) {
            m.muted = true;
          } else {
            m.muted = globalMuted;
          }
        } catch (e) { /* ignore */ }
      });
    } catch (e) { /* ignore */ }
    updateGlobalMuteButtonUI();
    try {
      if (typeof YouTubeManager !== 'undefined' && YouTubeManager && typeof YouTubeManager.setGlobalMuted === 'function') {
        YouTubeManager.setGlobalMuted(globalMuted);
        if (globalMuted && typeof YouTubeManager.pauseAll === 'function') {
          YouTubeManager.pauseAll();
        }
      }
    } catch (e) { /* ignore youtube mute sync */ }
  }

  // Toggle desde el botón
  function toggleGlobalMute() { setGlobalMuted(!globalMuted, { initial: false }); }

  // Aplicar estado inicial una vez DOM cargado (marcar initial=true para respetar autoplay)
  setGlobalMuted(globalMuted, { initial: true });

  // Vincular el botón si existe (se inserta desde index.html)
  try {
    const muteBtn = document.getElementById('global-mute-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', function () { toggleGlobalMute(); try { this.blur(); } catch (e) { } });
    }
    // Asegurar que nuevos elementos media respeten el estado global al registrarse
    const origRegister = MediaManager.registerHtmlMedia.bind(MediaManager);
    MediaManager.registerHtmlMedia = function (el) {
      origRegister(el);
      try { if (el && typeof el.setAttribute === 'function') el.muted = globalMuted; } catch (e) { /* ignore */ }
    };
  } catch (e) { /* ignore */ }

  // Intento mejor esfuerzo: reproducir el hero video al cargar la página.
  try {
    const hero = document.querySelector('.hero-video');
    if (hero) {
      // asegurar que el hero arranque muted
      try { hero.muted = true; } catch (e) { /* ignore */ }
      const p = hero.play();
      if (p && typeof p.then === 'function') {
        p.catch(() => { /* reproducción bloqueada por política, no forzamos */ });
      }
    }
  } catch (e) { /* ignore hero play errors */ }

});
