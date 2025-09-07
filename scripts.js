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

  // Marcar aria-label de la navbar si falta (mejora accesibilidad)
  const navbar = document.querySelector('.navbar');
  if (navbar && !navbar.getAttribute('aria-label')) {
    navbar.setAttribute('aria-label', 'Navegación principal');
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
  const ytPlayers = []; // lista de reproductores YouTube inicializados (si se usan)

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
      const onPlay = () => { try { if (el.muted) return; this.pauseAllExcept(el); /* pausar también reproductores de YouTube controlados */ ytPlayers.forEach(p => { try { if (p && typeof p.pauseVideo === 'function') p.pauseVideo(); } catch (e) { /* ignore */ } }); } catch (e) { /* ignore */ } };
      el.addEventListener('play', onPlay);
      try { this._listeners.set(el, onPlay); } catch (e) { /* ignore */ }
    },
    pauseAllExcept(except) {
      this.htmlMedias.forEach(m => { if (m !== except) try { if (!m.paused) m.pause(); } catch (e) { /* ignore */ } });
    },
    pauseAllHtmlMedia() { this.htmlMedias.forEach(m => { try { if (!m.paused) m.pause(); } catch (e) { /* ignore */ } }); }
  };

  // Registrar los media ya presentes
  document.querySelectorAll('audio, video').forEach(el => MediaManager.registerHtmlMedia(el));

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
     IV. Lazy-load y control de iframes YouTube (si los hay)
     - añadimos enablejsapi=1 a los embed de YouTube al cargar
     - registramos players con la API cuando esté disponible
     ------------------------------------------------------------------*/
  const lazyVideos = document.querySelectorAll('iframe.lazy-video');
  let pendingIframes = [];

  /**
   * initYTPlayer(iframe)
   * - Inicializa un reproductor YT via YT.Player si la API está lista.
   * - Si no lo está, pone el iframe en pendingIframes para procesarlo luego.
   */
  function initYTPlayer(iframe) {
    if (window.YT && window.YT.Player && iframe.src) {
      try {
        const playerTarget = iframe.id || iframe;
        const player = new YT.Player(playerTarget, {
          events: {
            'onStateChange': function (event) {
              if (event.data === YT.PlayerState.PLAYING) {
                try { MediaManager.pauseAllHtmlMedia(); } catch (e) { /* ignore */ }
                // pausar otros YT players controlados
                ytPlayers.forEach(p => { try { const pf = p && typeof p.getIframe === 'function' && p.getIframe(); if (p && pf && pf !== iframe) p.pauseVideo(); } catch (e) { /* ignore */ } });
              }
            }
          }
        });
        // evitar duplicados
        if (!ytPlayers.includes(player)) ytPlayers.push(player);
      } catch (e) { /* ignore init errors */ }
    } else {
      pendingIframes.push(iframe);
    }
  }

  function processPendingIframes() {
    if (window.YT && window.YT.Player) {
      pendingIframes.forEach(iframe => initYTPlayer(iframe));
      pendingIframes = [];
    }
  }

  // Observer para lazy-load de iframes
  const iframeObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const iframe = entry.target;
      if (iframe.dataset && iframe.dataset.src) {
        let src = iframe.dataset.src;
        if (src.includes('youtube.com/embed') && !src.includes('enablejsapi=1')) src += (src.includes('?') ? '&enablejsapi=1' : '?enablejsapi=1');
        iframe.src = src;
        iframe.removeAttribute('data-src');
        // asegurar que el iframe tenga un id (YT.Player a veces lo requiere)
        if (!iframe.id) iframe.id = 'yt-iframe-' + Math.random().toString(36).slice(2, 9);
        initYTPlayer(iframe);
        processPendingIframes();
      }
      obs.unobserve(iframe);
    });
  });
  lazyVideos.forEach(v => iframeObserver.observe(v));

  // Integrar con la carga asíncrona de la API de YouTube
  if (typeof window.onYouTubeIframeAPIReady === 'function') {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { prev(); processPendingIframes(); };
  } else {
    window.onYouTubeIframeAPIReady = processPendingIframes;
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
     VI. Contador simple de visitas (localStorage)
     ------------------------------------------------------------------*/
  let visitCount = parseInt(localStorage.getItem('visitCount') || '0', 10);
  visitCount++;
  localStorage.setItem('visitCount', String(visitCount));
  const counter = document.getElementById('visit-counter');
  if (counter) counter.textContent = `Visitas: ${visitCount}`;

  /* ------------------------------------------------------------------
     VII. Guardia runtime CSS para fijar navbar/pestañas (si algún script
     intenta modificarlo en runtime)
     ------------------------------------------------------------------*/
  (function enforceFixedHeaderCSS() {
    try {
      const cssId = '__fixed_header_guard__';
      const cssText = `
        /* Authoritative header/tab fixes (injected at runtime) */
        .navbar { position: fixed !important; top: 0 !important; left: 50% !important; transform: translateX(-50%) !important; width: var(--site-width) !important; max-width: var(--site-width) !important; z-index: 1200 !important; transition: none !important; }
        .video-tabs.video-tabs-dynamic, .bio-tabs.bio-tabs-dynamic { position: fixed !important; top: var(--navbar-height) !important; left: 50% !important; transform: translateX(-50%) !important; width: var(--site-width) !important; max-width: var(--site-width) !important; z-index: 1150 !important; transition: none !important; }
        .tab-menu-secondary { position: fixed !important; top: calc(var(--navbar-height) + var(--primary-tabs-height)) !important; left: 50% !important; transform: translateX(-50%) !important; width: var(--site-width) !important; max-width: var(--site-width) !important; z-index: 1140 !important; transition: none !important; }
      `;
      function ensureStyle() {
        if (!document.getElementById(cssId)) {
          const s = document.createElement('style'); s.id = cssId; s.type = 'text/css'; s.appendChild(document.createTextNode(cssText)); document.head.appendChild(s);
        }
      }
      ensureStyle();
      const headObserver = new MutationObserver(() => ensureStyle());
      headObserver.observe(document.head, { childList: true });
    } catch (e) { console.warn('enforceFixedHeaderCSS error', e); }
  })();

});
