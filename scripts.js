/* --------------------------------------------------------------------
   FUNCIONES PARA NAVEGACIÓN, PESTAÑAS, Y CONTROL DE AUDIO

   Explicación general (para quien no programa):
   - Este script se ejecuta cuando la página terminó de cargarse.
   - Maneja la navegación entre secciones (usando enlaces con #hash).
   - Implementa un sistema reutilizable de pestañas (tabs) que muestra
     contenido distinto según la pestaña seleccionada.
   - Carga los videos de YouTube sólo cuando entran en pantalla (lazy-load)
     y, cuando es posible, los registra con la API de YouTube para poder
     pausar otros videos cuando uno empieza a reproducirse.
   - Lleva un contador simple de visitas usando localStorage.
   - Controla botones que reproducen/pausan audios embebidos.

   Todos los comentarios dentro del archivo están escritos en castellano
   y explican, paso a paso, qué hace cada bloque para que cualquiera
   pueda entender y modificar con seguridad.
-------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // --- NAVEGACIÓN ENTRE SECCIONES (anclas/hash) ---
  // Selecciona los enlaces del menú principal y las secciones de la página
  const navTabs = document.querySelectorAll('.navbar-tabs.tab-menu a');
  const secciones = document.querySelectorAll('section.seccion');
  // Accesibilidad: si la barra de navegación no tiene un atributo
  // aria-label, se le añade uno. Esto ayuda a los lectores de pantalla
  // a identificar el elemento como el menú principal.
  const navbar = document.querySelector('.navbar');
  if (navbar && !navbar.getAttribute('aria-label')) {
    navbar.setAttribute('aria-label', 'Navegación principal');
  }

  function showSectionFromHash(hash) {
    let found = false;
    let hashToShow = hash && hash.startsWith('#') ? hash : '#inicio';
    secciones.forEach(sec => {
      if ('#' + sec.id === hashToShow) {
        sec.classList.add('active');
        found = true;
      } else {
        sec.classList.remove('active');
      }
    });
    if (!found) {
      secciones.forEach(sec => {
        if (sec.id === 'inicio') sec.classList.add('active');
        else sec.classList.remove('active');
      });
    }
    navTabs.forEach(l => {
      if (l.getAttribute('href') === hashToShow) l.classList.add('active');
      else l.classList.remove('active');
    });
  }

  showSectionFromHash(window.location.hash);

  navTabs.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      // Forzar el desplazamiento hacia arriba inmediatamente.
      // Esto evita que el contenido quede cubierto por la barra fija
      // al navegar entre secciones (mejora la experiencia visual).
      window.scrollTo({ top: 0, behavior: "auto" });
      setTimeout(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, 0);
      const hash = this.getAttribute('href');
      window.location.hash = hash;
      showSectionFromHash(hash);
    });
  });

  window.addEventListener('hashchange', () => {
    showSectionFromHash(window.location.hash);
    // Cuando cambia la sección (por ejemplo al ir a #videos o #bio),
    // activamos la pestaña por defecto correspondiente para asegurarnos
    // de que siempre haya contenido visible dentro de esa sección.
    if (window.location.hash === '#videos') {
      activateDefaultTab('.video-tabs.tab-menu', '.video-tabs-content');
    }
    if (window.location.hash === '#bio') {
      activateDefaultTab('.bio-tabs.tab-menu', '.bio-tabs-content');
    }
  });

  // --- SISTEMA REUTILIZABLE DE PESTAÑAS (tabs) ---
  // Esta función inicializa el comportamiento de un menú de pestañas:
  // - añade roles ARIA para accesibilidad
  // - establece qué pestaña está activa
  // - gestiona el cambio de pestañas al hacer click
  function initTabs(tabMenuSelector, tabContentSelector) {
    const tabMenu = document.querySelector(tabMenuSelector);
    if (!tabMenu) return;
    // ARIA: marcar el contenedor como una lista de pestañas (tablist)
    if (!tabMenu.getAttribute('role')) tabMenu.setAttribute('role', 'tablist');
    const tabs = tabMenu.querySelectorAll('a[data-tab]');
    // Asignar a cada enlace el role "tab" y atributos ARIA que indican
    // si la pestaña está seleccionada, además de tabindex para que
    // el teclado pueda navegar correctamente entre pestañas.
    tabs.forEach((t, i) => {
      if (!t.getAttribute('role')) t.setAttribute('role', 'tab');
      if (!t.hasAttribute('aria-selected')) t.setAttribute('aria-selected', t.classList.contains('active') ? 'true' : 'false');
      // Asegurar que la pestaña activa sea accesible con TAB (tabindex=0)
      t.setAttribute('tabindex', t.classList.contains('active') ? '0' : '-1');
    });
    const tabContent = document.querySelector(tabContentSelector);
    if (!tabContent) return;
    const panes = tabContent.querySelectorAll('.tab-pane');

    // Manejador de clicks en pestañas:
    // - evita el comportamiento por defecto del enlace
    // - actualiza clases y atributos para marcar la pestaña activa
    // - muestra/oculta los paneles correspondientes
    tabs.forEach(tab => {
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        // Forzar desplazamiento al tope para que el panel activo quede visible
        window.scrollTo({ top: 0, behavior: "auto" });
        setTimeout(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, 0);
        tabs.forEach((t, idx) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
          t.setAttribute('tabindex', '-1');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('tabindex', '0');
        const tabName = tab.getAttribute('data-tab');
        panes.forEach(pane => {
          if (pane.id === tabName) {
            pane.classList.add('active');
          } else {
            pane.classList.remove('active');
          }
        });
      });
    });

    // Activar la pestaña por defecto (la primera) si no hay ninguna activa.
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
    if (tabs.length && panes.length) {
      tabs[0].classList.add('active');
      panes[0].classList.add('active');
    }
  }

  // Inicializar las pestañas de 'videos' y 'bio' al cargar la página
  initTabs('.video-tabs.tab-menu', '.video-tabs-content');
  initTabs('.bio-tabs.tab-menu', '.bio-tabs-content');

  // Si la URL ya apunta a #videos o #bio al cargar la página, activar
  // la pestaña por defecto correspondiente para mostrar contenido.
  if (window.location.hash === '#videos') {
    activateDefaultTab('.video-tabs.tab-menu', '.video-tabs-content');
  }
  if (window.location.hash === '#bio') {
    activateDefaultTab('.bio-tabs.tab-menu', '.bio-tabs-content');
  }

  // CARGA PEREZOSA (lazy-load) DE VIDEOS
  // Los iframes tienen data-src y no se les pone src hasta que entran
  // en pantalla. Esto mejora el rendimiento y evita cargar muchos
  // reproductores innecesarios al abrir la página.
  const lazyVideos = document.querySelectorAll("iframe.lazy-video");
  let ytPlayers = [];
  // MediaManager: asegura que no suenen dos medios a la vez.
  const MediaManager = {
    htmlMedias: new Set(),
    // Registrar un elemento HTMLMediaElement para escuchar 'play' y pausar los demás
    registerHtmlMedia(el) {
      if (!el) return;
      this.htmlMedias.add(el);
      // Cuando un elemento empieza a reproducir, pausamos los demás
      el.addEventListener('play', () => {
        this.pauseAllExcept(el);
      });
    },
    // Pausar todos los HTML media excepto el provisto
    pauseAllExcept(except) {
      try {
        this.htmlMedias.forEach(m => {
          if (m !== except && !m.paused) {
            try { m.pause(); } catch (e) { /* ignore */ }
          }
        });
        // También pausar cualquier reproductor de YouTube que esté sonando
        if (window.YT && Array.isArray(ytPlayers)) {
          ytPlayers.forEach(p => {
            try {
              if (p && typeof p.getPlayerState === 'function' && p.getPlayerState() === YT.PlayerState.PLAYING) {
                p.pauseVideo();
              }
            } catch (e) { /* ignore */ }
          });
        }
      } catch (e) {
        console.error('MediaManager.pauseAllExcept error', e);
      }
    },
    // Pausar únicamente HTML medias (útil cuando un YT empieza a sonar)
    pauseAllHtmlMedia() {
      try {
        this.htmlMedias.forEach(m => {
          if (!m.paused) try { m.pause(); } catch (e) { }
        });
      } catch (e) { console.error('MediaManager.pauseAllHtmlMedia', e); }
    }
  };
  // Registrar los elementos <audio> y <video> ya presentes en la página
  document.querySelectorAll('audio, video').forEach(el => MediaManager.registerHtmlMedia(el));
  let pendingIframes = [];
  function initYTPlayer(iframe) {
    if (window.YT && window.YT.Player && iframe.src) {
      ytPlayers.push(new YT.Player(iframe, {
        events: {
          'onStateChange': function (event) {
            if (event.data === YT.PlayerState.PLAYING) {
              // Pausar primero cualquier <audio> o <video> HTML que pueda estar sonando
              try { MediaManager.pauseAllHtmlMedia(); } catch (e) { }
              // Pausar otros reproductores de YouTube
              ytPlayers.forEach(player => {
                if (player && player.getIframe && player.getIframe() !== iframe) {
                  try { player.pauseVideo(); } catch (e) { }
                }
              });
            }
          }
        }
      }));
    } else {
      pendingIframes.push(iframe);
    }
  }

  function processPendingIframes() {
    if (window.YT && window.YT.Player) {
      pendingIframes.forEach(iframe => {
        initYTPlayer(iframe);
      });
      pendingIframes = [];
    }
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const iframe = entry.target;
        if (iframe.dataset.src) {
          let src = iframe.dataset.src;
          // Si la URL es de YouTube, añadir el parámetro enablejsapi=1
          // (necesario para poder controlar el reproductor desde JS).
          if (src.includes('youtube.com/embed') && !src.includes('enablejsapi=1')) {
            if (src.includes('?')) {
              src += '&enablejsapi=1';
            } else {
              src += '?enablejsapi=1';
            }
          }
          iframe.src = src;
          delete iframe.dataset.src;
          initYTPlayer(iframe);
          processPendingIframes();
        }
        obs.unobserve(iframe);
      }
    });
  });
  lazyVideos.forEach(video => observer.observe(video));

  // La API de YouTube puede cargar después de que asignamos iframes.
  // Si ya existen iframes pendientes, los inicializamos cuando la API
  // llama a window.onYouTubeIframeAPIReady.
  if (typeof window.onYouTubeIframeAPIReady === 'function') {
    const prevFn = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      prevFn();
      processPendingIframes();
    };
  } else {
    window.onYouTubeIframeAPIReady = processPendingIframes;
  }

  // CONTADOR SIMPLE DE VISITAS
  // Se guarda un número en localStorage para contar cuántas veces
  // el mismo navegador abrió el sitio. No es un contador global.
  let visitCount = localStorage.getItem('visitCount') || 0;
  visitCount++;
  localStorage.setItem('visitCount', visitCount);
  const counter = document.getElementById('visit-counter');
  if (counter) counter.textContent = `Visitas: ${visitCount}`;

  // BOTONES DE AUDIO: reproducir / pausar
  // setupAudioToggle conecta un botón con un elemento <audio> y cambia
  // su texto según el estado (reproduciendo/pausado).
  function setupAudioToggle(audioId, buttonId, label) {
    const audio = document.getElementById(audioId);
    const button = document.getElementById(buttonId);
    if (audio && button) {
      button.addEventListener('click', () => {
        if (audio.paused) {
          // Asegurar que no haya otro medio sonando
          try { MediaManager.pauseAllExcept(audio); } catch (e) { }
          audio.play();
          button.textContent = `Pausar ${label}`;
        } else {
          audio.pause();
          button.textContent = `Reproducir ${label}`;
        }
      });
    }
  }
  setupAudioToggle("audio-mi-refugio", "audio-button-mi-refugio", "'Mi Refugio'");
  setupAudioToggle("audio-la-familia", "audio-button-la-familia", "'La Familia'");
});
