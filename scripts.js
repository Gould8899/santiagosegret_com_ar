// --- FUNCIONES PARA NAVEGACIÓN Y AUDIO ---
document.addEventListener("DOMContentLoaded", () => {
  // --- SECTION NAVIGATION ---
  const navTabs = document.querySelectorAll('.navbar-tabs.tab-menu a');
  const secciones = document.querySelectorAll('section.seccion');
  // Accessibility: label navbar if not present
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
      // Force scroll to top instantly
      window.scrollTo({ top: 0, behavior: "auto" });
      setTimeout(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, 0);
      const hash = this.getAttribute('href');
      window.location.hash = hash;
      showSectionFromHash(hash);
    });
  });

  window.addEventListener('hashchange', () => {
    showSectionFromHash(window.location.hash);
    // On section change, activate default tab for videos/bio
    if (window.location.hash === '#videos') {
      activateDefaultTab('.video-tabs.tab-menu', '.video-tabs-content');
    }
    if (window.location.hash === '#bio') {
      activateDefaultTab('.bio-tabs.tab-menu', '.bio-tabs-content');
    }
  });

  // --- REUSABLE TAB SYSTEM ---
  function initTabs(tabMenuSelector, tabContentSelector) {
    const tabMenu = document.querySelector(tabMenuSelector);
    if (!tabMenu) return;
    // ARIA: mark as tablist
    if (!tabMenu.getAttribute('role')) tabMenu.setAttribute('role', 'tablist');
    const tabs = tabMenu.querySelectorAll('a[data-tab]');
    // Add role and aria-selected to tabs
    tabs.forEach((t, i) => {
      if (!t.getAttribute('role')) t.setAttribute('role', 'tab');
      if (!t.hasAttribute('aria-selected')) t.setAttribute('aria-selected', t.classList.contains('active') ? 'true' : 'false');
      // ensure focusable
      t.setAttribute('tabindex', t.classList.contains('active') ? '0' : '-1');
    });
    const tabContent = document.querySelector(tabContentSelector);
    if (!tabContent) return;
    const panes = tabContent.querySelectorAll('.tab-pane');

    // Tab click handler with animation (no layout recalculation)
    tabs.forEach(tab => {
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        // Force scroll to top instantly
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

    // Default tab activation
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

  // Initialize video and bio tabs
  initTabs('.video-tabs.tab-menu', '.video-tabs-content');
  initTabs('.bio-tabs.tab-menu', '.bio-tabs-content');

  // On initial load, if section is videos/bio, activate default tab
  if (window.location.hash === '#videos') {
    activateDefaultTab('.video-tabs.tab-menu', '.video-tabs-content');
  }
  if (window.location.hash === '#bio') {
    activateDefaultTab('.bio-tabs.tab-menu', '.bio-tabs-content');
  }

  // Lazy load videos
  const lazyVideos = document.querySelectorAll("iframe.lazy-video");
  let ytPlayers = [];
  let pendingIframes = [];
  function initYTPlayer(iframe) {
    // Detectar si es el video de inicio
    const isInicioVideo = iframe.closest('#inicio') !== null;
    if (window.YT && window.YT.Player && iframe.src) {
      ytPlayers.push(new YT.Player(iframe, {
        events: {
          'onStateChange': function (event) {
            if (event.data === YT.PlayerState.PLAYING) {
              ytPlayers.forEach(player => {
                // Si el video NO es el de inicio, puede pausar otros
                if (player && player.getIframe() !== iframe && !isInicioVideo) {
                  // No pausar el video de inicio
                  if (player.getIframe().closest('#inicio')) return;
                  player.pauseVideo();
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
          // Agregar enablejsapi=1 si es un video de YouTube y no está presente
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

  // Asegurarse de inicializar los pendientes cuando la API esté lista
  if (typeof window.onYouTubeIframeAPIReady === 'function') {
    const prevFn = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      prevFn();
      processPendingIframes();
    };
  } else {
    window.onYouTubeIframeAPIReady = processPendingIframes;
  }

  // Contador de visitas
  let visitCount = localStorage.getItem('visitCount') || 0;
  visitCount++;
  localStorage.setItem('visitCount', visitCount);
  const counter = document.getElementById('visit-counter');
  if (counter) counter.textContent = `Visitas: ${visitCount}`;

  // Audio toggle
  function setupAudioToggle(audioId, buttonId, label) {
    const audio = document.getElementById(audioId);
    const button = document.getElementById(buttonId);
    if (audio && button) {
      button.addEventListener('click', () => {
        if (audio.paused) {
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
