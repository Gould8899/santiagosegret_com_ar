/* --------------------------------------------------------------------
   scriptsaudio.js — núcleo de audio/video centralizado

   - MediaManager: registra <audio>/<video> y garantiza "uno a la vez"
   - YouTubeManager: pausa otros iframes YouTube y sincroniza mute global
   - Controles compactos de audio: UI mínima para los dos audios locales
   - Mute global: estado persistente y API pública para UI externas

   Expone window.AudioCore con:
     - MediaManager, YouTube, registerHtmlMedia(el)
     - setGlobalMuted(m), toggleGlobalMute(), isMuted(), onMutedChange(fn)
-------------------------------------------------------------------- */
(function(){
  // Esperar DOM para operar con elementos
  document.addEventListener('DOMContentLoaded', function(){
    // Utilidad local: formatear tiempo en M:SS
    function formatTime(s){ if(!s || isNaN(s)) return '0:00'; var m=Math.floor(s/60); var sec=String(Math.floor(s%60)).padStart(2,'0'); return m+':'+sec; }

    // ---------------- MediaManager (HTML audio/video) ----------------
    var MediaManager = {
      htmlMedias: new Set(),
      _listeners: new WeakMap(),
      registerHtmlMedia: function(el){
        if(!el || typeof el.addEventListener !== 'function') return;
        if(this.htmlMedias.has(el)) return;
        this.htmlMedias.add(el);
        var self=this;
        var onPlay = function(){
          try { self.pauseAllExcept(el); } catch(e){}
          try {
            var hero = document.querySelector('.hero-video');
            if(hero && hero !== el && !hero.paused){ try{ hero.pause(); }catch(e){} }
          } catch(e){}
          try { if(window.AudioCore && window.AudioCore.YouTube && typeof window.AudioCore.YouTube.pauseAll === 'function'){ window.AudioCore.YouTube.pauseAll(); } } catch(e){}
        };
        el.addEventListener('play', onPlay);
        try{ this._listeners.set(el, onPlay); }catch(e){}
      },
      pauseAllExcept: function(except){ this.htmlMedias.forEach(function(m){ if(m!==except){ try{ if(!m.paused) m.pause(); }catch(e){} } }); },
      pauseAllHtmlMedia: function(){ this.htmlMedias.forEach(function(m){ try{ if(!m.paused) m.pause(); }catch(e){} }); }
    };

    // ---------------- YouTube Manager (iframe API) -------------------
    var YouTubeManager = (function(){
      var players = new Map();
      var pending = new Set();
      var apiRequested = false;
      var apiReady = false;
      var globalMuted = false;

      function ensureApi(){
        if(window.YT && typeof window.YT.Player === 'function'){ apiReady=true; return; }
        if(apiRequested) return;
        apiRequested = true;
        if(!document.getElementById('youtube-iframe-api')){
          var tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          tag.id = 'youtube-iframe-api';
          (document.head||document.body||document.documentElement).appendChild(tag);
        }
      }

      var previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function(){
        apiReady = true;
        pending.forEach(function(iframe){ try{ createPlayer(iframe); }catch(e){} });
        pending.clear();
        if(typeof previousReady === 'function'){ try{ previousReady(); }catch(e){} }
      };

      function applyMuteState(player){
        if(!player || typeof player.mute !== 'function' || typeof player.unMute !== 'function') return;
        try { if(globalMuted) player.mute(); else player.unMute(); } catch(e){}
      }

      function handleStateChange(event){
        if(!event || typeof event.data === 'undefined' || !event.target || typeof YT === 'undefined') return;
        var player = event.target;
        if(event.data === YT.PlayerState.PLAYING){
          pauseAllExcept(player);
          try{ MediaManager.pauseAllHtmlMedia(); }catch(e){}
        }
      }

      function createPlayer(iframe){
        if(!iframe || players.has(iframe)) return;
        if(!window.YT || typeof window.YT.Player !== 'function'){ pending.add(iframe); ensureApi(); return; }
        var player = new YT.Player(iframe, { events: { onReady: function(){ applyMuteState(player); }, onStateChange: handleStateChange } });
        players.set(iframe, player);
        pending.delete(iframe);
        applyMuteState(player);
      }

      function pauseAllExcept(active){
        players.forEach(function(p){ if(active && p===active) return; try{ p.pauseVideo(); }catch(e){} });
      }

      function pauseAll(){ pauseAllExcept(null); }

      return {
        registerIframe: function(iframe){
          if(!iframe) return;
          if(players.has(iframe) || pending.has(iframe)) return;
          if(window.YT && typeof window.YT.Player === 'function'){ createPlayer(iframe); }
          else { pending.add(iframe); ensureApi(); }
        },
        notifyHtmlMediaPlay: function(){ pauseAll(); },
        pauseAllExcept: pauseAllExcept,
        pauseAll: pauseAll,
        setGlobalMuted: function(m){ globalMuted = !!m; players.forEach(function(p){ applyMuteState(p); }); }
      };
    })();

    // Registrar existentes y nuevos medios HTML
    Array.prototype.forEach.call(document.querySelectorAll('audio, video'), function(el){ MediaManager.registerHtmlMedia(el); });

    // Listener global para pausar hero cuando otro medio reproduce
    try {
      document.addEventListener('play', function(e){
        try {
          var target = e && e.target; if(!target) return;
          var hero = document.querySelector('.hero-video');
          if(hero && target !== hero && !hero.paused){ try{ hero.pause(); }catch(err){} }
        } catch(err){}
      }, true);
    } catch(_){ }

    // Observer de mutaciones para medios insertados luego
    try{
      var mediaObserver = new MutationObserver(function(muts){
        muts.forEach(function(m){
          (m.addedNodes||[]).forEach(function(node){
            try{
              if(!node || node.nodeType !== 1) return;
              var el = node;
              if(el.matches && (el.matches('audio') || el.matches('video'))) MediaManager.registerHtmlMedia(el);
              var nested = el.querySelectorAll && el.querySelectorAll('audio, video');
              if(nested && nested.length) nested.forEach(function(x){ MediaManager.registerHtmlMedia(x); });
            }catch(e){}
          });
        });
      });
      mediaObserver.observe(document.documentElement||document.body, { childList:true, subtree:true });
    }catch(_){ }

    // -------------------- Mute global (núcleo) -----------------------
    var GLOBAL_MUTE_KEY = 'siteGlobalMuted';
    var globalMuted = !!JSON.parse(localStorage.getItem(GLOBAL_MUTE_KEY) || 'false');
    var muteSubscribers = new Set();

    function applyMuteToAll(options){
      try{
        MediaManager.htmlMedias.forEach(function(m){
          try{
            m.muted = globalMuted;
          }catch(e){}
        });
      }catch(e){}
      try{
        if(window.AudioCore && window.AudioCore.YouTube && typeof window.AudioCore.YouTube.setGlobalMuted === 'function'){
          window.AudioCore.YouTube.setGlobalMuted(globalMuted);
          if(globalMuted && typeof window.AudioCore.YouTube.pauseAll === 'function'){ window.AudioCore.YouTube.pauseAll(); }
        } else if (typeof YouTubeManager.setGlobalMuted === 'function') {
          YouTubeManager.setGlobalMuted(globalMuted);
          if(globalMuted && typeof YouTubeManager.pauseAll === 'function'){ YouTubeManager.pauseAll(); }
        }
      }catch(e){}
    }

    function setGlobalMuted(mute, options){
      globalMuted = !!mute;
      try{ localStorage.setItem(GLOBAL_MUTE_KEY, JSON.stringify(globalMuted)); }catch(e){}
      applyMuteToAll(options);
      muteSubscribers.forEach(function(fn){ try{ fn(globalMuted); }catch(e){} });
    }

    function toggleGlobalMute(){ setGlobalMuted(!globalMuted, { initial:false }); }

    // Aplicar estado inicial (respetando autoplay)
    setGlobalMuted(globalMuted, { initial:true });

    // ---------------- Controles compactos de audio -------------------
    function setupCompactAudioControls(audioId, rootId){
      var audio = document.getElementById(audioId);
      var root = document.getElementById(rootId);
      if(!audio || !root) return;
      try{ MediaManager.registerHtmlMedia(audio); }catch(e){}

      var playBtn = root.querySelector('.compact-play');
      var progress = root.querySelector('.compact-progress');
      var timeLabel = root.querySelector('.compact-time');
      var volume = root.querySelector('.compact-volume');

      audio.addEventListener('loadedmetadata', function(){ if(progress) progress.max = audio.duration; });

      if(playBtn) playBtn.addEventListener('click', function(){
        if(audio.paused){ try{ MediaManager.pauseAllExcept(audio); }catch(e){} audio.play(); playBtn.textContent='⏸'; }
        else { audio.pause(); playBtn.textContent='▶'; }
      });

      audio.addEventListener('timeupdate', function(){ if(progress && !progress.dragging) progress.value = audio.currentTime; if(timeLabel) timeLabel.textContent = formatTime(audio.currentTime); });
      audio.addEventListener('ended', function(){ if(playBtn) playBtn.textContent='▶'; if(progress) progress.value=0; if(timeLabel) timeLabel.textContent = formatTime(0); });
      audio.addEventListener('play', function(){ if(playBtn) playBtn.textContent='⏸'; });
      audio.addEventListener('pause', function(){ if(playBtn && !audio.ended) playBtn.textContent='▶'; });

      if(progress){
        progress.addEventListener('input', function(){ progress.dragging=true; if(timeLabel) timeLabel.textContent = formatTime(progress.value); });
        progress.addEventListener('change', function(){ audio.currentTime = parseFloat(progress.value); progress.dragging=false; });
      }

      if(volume){ volume.addEventListener('input', function(){ audio.volume = parseFloat(volume.value); }); audio.volume = parseFloat(volume.value||1); }

      if(timeLabel) timeLabel.textContent = formatTime(0);
      if(playBtn) playBtn.textContent = audio.paused ? '▶' : '⏸';
    }

    // Vincular controles compactos si existen
    setupCompactAudioControls('audio-mi-refugio', 'compact-mi-refugio');
    setupCompactAudioControls('audio-la-familia', 'compact-la-familia');

    // --------------------- API pública (AudioCore) -------------------
    window.AudioCore = window.AudioCore || {};
    window.AudioCore.MediaManager = MediaManager;
    window.AudioCore.YouTube = YouTubeManager;
    window.AudioCore.registerHtmlMedia = function(el){ MediaManager.registerHtmlMedia(el); };
    window.AudioCore.setGlobalMuted = function(m, options){ setGlobalMuted(m, options); };
    window.AudioCore.toggleGlobalMute = function(){ toggleGlobalMute(); };
    window.AudioCore.isMuted = function(){ return !!globalMuted; };
    window.AudioCore.onMutedChange = function(fn){ if(typeof fn === 'function') muteSubscribers.add(fn); };
    // API para pausar todo el audio/video (HTML5 + YouTube)
    window.AudioCore.pauseAllMedia = function(){
      try { MediaManager.pauseAllHtmlMedia(); } catch(_){ }
      try { if (YouTubeManager && typeof YouTubeManager.pauseAll === 'function') YouTubeManager.pauseAll(); } catch(_){ }
    };

    // -------------------- Hero (Imagen estática) ------------------
    // Ya no hay video de hero, pero mantenemos la función para compatibilidad
    function pauseOthers(except){
      try {
        if (except && typeof MediaManager.pauseAllExcept === 'function') MediaManager.pauseAllExcept(except);
        else MediaManager.pauseAllHtmlMedia();
      } catch(_){ }
      try { if (YouTubeManager && typeof YouTubeManager.pauseAll === 'function') YouTubeManager.pauseAll(); } catch(_){ }
    }

    function syncHeroForSection(hash){
      // Al cambiar de sección principal, pausamos todo el audio/video activo
      pauseOthers();
    }

    // Exponer para navegación
    window.AudioCore.notifySectionChange = syncHeroForSection;

    /* ------------------------------------------------------------------
       Lazy-load optimizado de iframes YouTube (Movido desde scripts.js)
       ------------------------------------------------------------------*/
    function initYouTubeLazyLoading() {
      var lazyVideos = document.querySelectorAll('iframe.lazy-video');

      function buildEmbedUrl(rawSrc) {
        if (!rawSrc) return null;
        try {
          var url = new URL(rawSrc);
          var isFileProtocol = window.location && window.location.protocol === 'file:';
          if (!isFileProtocol) {
            var origin = window.location && window.location.origin;
            if (origin && origin !== 'null' && !url.searchParams.has('origin')) {
              url.searchParams.set('origin', origin);
            }
          }
          if (!url.searchParams.has('rel')) url.searchParams.set('rel', '0');
          if (!url.searchParams.has('modestbranding')) url.searchParams.set('modestbranding', '1');
          if (!url.searchParams.has('playsinline')) url.searchParams.set('playsinline', '1');
          if (!url.searchParams.has('enablejsapi')) url.searchParams.set('enablejsapi', '1');
          // Asegurar autoplay al hacer click
          if (!url.searchParams.has('autoplay')) url.searchParams.set('autoplay', '1');
          return url.toString();
        } catch (error) {
          console.warn('buildEmbedUrl error', error);
          return rawSrc;
        }
      }

      // Extraer ID de video de YouTube desde URL
      function getYouTubeId(url) {
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        var match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
      }

      // Cargar iframe real
      function loadIframe(iframe) {
        if (!iframe || !iframe.dataset || !iframe.dataset.src) return;
        // Si ya tiene src, es que ya se cargó o se está cargando
        if (iframe.getAttribute('src')) return;

        var finalSrc = buildEmbedUrl(iframe.dataset.src);
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.src = finalSrc || iframe.dataset.src;
        // No removemos data-src para permitir re-verificaciones si fuera necesario, pero marcamos como cargado
        iframe.dataset.loaded = 'true';
        
        // Limpiar imagen de fondo si existía (la miniatura)
        iframe.style.backgroundImage = '';

        // Registrar en el sistema de audio (con un pequeño delay para asegurar que el iframe ha iniciado carga)
        setTimeout(function() {
          try {
            if (YouTubeManager && typeof YouTubeManager.registerIframe === 'function') { YouTubeManager.registerIframe(iframe); }
          } catch (e) { /* ignore YouTube registration errors */ }
        }, 500);
      }

      // 1. Pre-cargar miniaturas inmediatamente y configurar "Click to Load"
      lazyVideos.forEach(function(iframe) {
        var src = iframe.dataset.src;
        if (src) {
          var videoId = getYouTubeId(src);
          if (videoId) {
            // Crear elemento poster (div) que reemplaza visualmente al iframe
            var poster = document.createElement('div');
            poster.className = 'video-poster';
            var thumbUrl = 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';
            poster.style.backgroundImage = 'url(\'' + thumbUrl + '\')';
            
            // Ocultar el iframe real inicialmente
            iframe.style.display = 'none';
            
            // Insertar el poster justo antes del iframe
            if(iframe.parentNode) {
              iframe.parentNode.insertBefore(poster, iframe);
            }
            
            // Al hacer click en el poster, cargar y mostrar el iframe
            poster.addEventListener('click', function() {
              loadIframe(iframe);
              iframe.style.display = 'block'; // Mostrar iframe
              poster.style.display = 'none';  // Ocultar poster
              
              // Añadir clase al contenedor por si se necesita estilo extra
              var container = iframe.closest('.video');
              if (container) {
                container.classList.add('video-active');
                container.style.cursor = 'auto';
              }
            });
          }
        }
      });
    }

    // Inicializar lazy loading
    initYouTubeLazyLoading();

  });
})();
