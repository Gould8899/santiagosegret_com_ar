// --- FUNCIONES PARA NAVEGACIÓN Y AUDIO ---
document.addEventListener("DOMContentLoaded", () => {
  // Navegación por secciones
  const navLinks = document.querySelectorAll('.navbar ul li a');
  const secciones = document.querySelectorAll('section.seccion');

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
    navLinks.forEach(l => {
      if (l.getAttribute('href') === hashToShow) l.classList.add('active');
      else l.classList.remove('active');
    });
  }

  showSectionFromHash(window.location.hash);

  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const hash = this.getAttribute('href');
      window.location.hash = hash;
      showSectionFromHash(hash);

      // Al hacer click en Videos o Bio, activar la primera pestaña interna
      if (hash === '#videos') {
        setTimeout(() => {
          const videoTabs = document.querySelectorAll('#videos .tab-menu a');
          const videoPanes = document.querySelectorAll('#videos .tab-content .tab-pane');
          videoTabs.forEach(t => t.classList.remove('active'));
          videoPanes.forEach(p => p.classList.remove('active'));
          if (videoTabs.length && videoPanes.length) {
            videoTabs[0].classList.add('active');
            videoPanes[0].classList.add('active');
          }
        }, 10);
      }
      if (hash === '#bio') {
        setTimeout(() => {
          const bioTabs = document.querySelectorAll('#bio .tab-menu a');
          const bioPanes = document.querySelectorAll('#bio .tab-content .tab-pane');
          bioTabs.forEach(t => t.classList.remove('active'));
          bioPanes.forEach(p => p.classList.remove('active'));
          if (bioTabs.length && bioPanes.length) {
            bioTabs[0].classList.add('active');
            bioPanes[0].classList.add('active');
          }
        }, 10);
      }
    });
  });

  window.addEventListener('hashchange', () => {
    showSectionFromHash(window.location.hash);
  });

  // Pestañas de videos
  function setupTabs(tabSelector, paneSelector) {
    const tabs = document.querySelectorAll(tabSelector);
    const panes = document.querySelectorAll(paneSelector);
    tabs.forEach(tab => {
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.getAttribute('data-tab');
        panes.forEach(pane => {
          if (pane.id === tabName) pane.classList.add('active');
          else pane.classList.remove('active');
        });
      });
    });
    // Activar la primera pestaña por defecto
    if (tabs.length && panes.length) {
      tabs[0].classList.add('active');
      panes[0].classList.add('active');
    }
  }
  setupTabs('.tab-menu a', '.tab-content .tab-pane');

  // Lazy load videos
  const lazyVideos = document.querySelectorAll("iframe.lazy-video");
  let ytPlayers = [];
  let pendingIframes = [];
  function initYTPlayer(iframe) {
    if (window.YT && window.YT.Player && iframe.src) {
      ytPlayers.push(new YT.Player(iframe, {
        events: {
          'onStateChange': function (event) {
            if (event.data === YT.PlayerState.PLAYING) {
              ytPlayers.forEach(player => {
                if (player && player.getIframe() !== iframe) {
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
