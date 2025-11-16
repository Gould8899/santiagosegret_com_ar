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
    // API para pausar todo el audio/video (HTML5 + YouTube + hero)
    window.AudioCore.pauseAllMedia = function(){
      try { MediaManager.pauseAllHtmlMedia(); } catch(_){ }
      try { if (YouTubeManager && typeof YouTubeManager.pauseAll === 'function') YouTubeManager.pauseAll(); } catch(_){ }
      try { var h = document.querySelector('.hero-video'); if (h && !h.paused) h.pause(); } catch(_){ }
    };

    // -------------------- Hero video (centralizado) ------------------
    var hero = document.querySelector('.hero-video');
    var userGestureDone = false;
    // Overlay eliminado: no mostramos botón "Activar sonido"

    // Pausar hero cuando sale de vista
    if (hero) {
      try {
        var heroObserver = new IntersectionObserver(function(entries){
          entries.forEach(function(entry){ if(!entry.isIntersecting){ try{ hero.pause(); }catch(_){ } } });
        }, { threshold: 0.3 });
        heroObserver.observe(hero);
      } catch(_){ }
    }

    function pauseOthers(except){
      try {
        if (except && typeof MediaManager.pauseAllExcept === 'function') MediaManager.pauseAllExcept(except);
        else MediaManager.pauseAllHtmlMedia();
      } catch(_){ }
      try { if (YouTubeManager && typeof YouTubeManager.pauseAll === 'function') YouTubeManager.pauseAll(); } catch(_){ }
    }

    function tryPlayHeroUnmutedWithFallback(){
      if (!hero) return;
      var triedUnmuteOnPlay = false;
      function attemptUnmute(){
        try { hero.removeAttribute('muted'); } catch(_){ }
        try { hero.defaultMuted = false; } catch(_){ }
        try { hero.muted = false; } catch(_){ }
        try { if (typeof hero.volume === 'number') hero.volume = Math.max(0.7, hero.volume || 0.7); } catch(_){ }
        try { setGlobalMuted(false); } catch(_){ }
      }
      // Intento directo desmuteado
      attemptUnmute();
      var p = hero.play();
      if (p && typeof p.then === 'function') {
        p.then(function(){
          if (!triedUnmuteOnPlay) {
            triedUnmuteOnPlay = true;
            // Reintentar unmute poco después de empezar a reproducir
            setTimeout(attemptUnmute, 150);
          }
        }).catch(function(){
          // Fallback: autoplay bloqueado, reproducir muteado
          try { hero.muted = true; } catch(_){ }
          var p2 = hero.play();
          if (p2 && typeof p2.then === 'function') {
            p2.then(function(){ setTimeout(attemptUnmute, 250); }).catch(function(){});
          }
        });
      } else {
        // Si no hay promesa (navegador viejo), intentar unmute luego
        setTimeout(attemptUnmute, 150);
      }
      // Listener one-shot al entrar en "playing" para asegurar unmute
      var onPlaying = function(){
        try { hero.removeEventListener('playing', onPlaying, true); } catch(_){ }
        setTimeout(attemptUnmute, 100);
      };
      try { hero.addEventListener('playing', onPlaying, true); } catch(_){ }

      // Asegurar reproducción: si sigue en pausa por condiciones de carga,
      // reintentar play() unas pocas veces mientras estemos en #inicio.
      (function ensurePlayingRetries(){
        var tries = 0;
        function tick(){
          tries++;
          var inInicio = ((window.location && window.location.hash) || '#inicio') === '#inicio';
          if (!inInicio) return;
          try { attemptUnmute(); } catch(_){ }
          try { if (hero.paused) { var _p = hero.play(); if (_p && _p.catch) _p.catch(function(){}); } } catch(_){ }
          if (tries < 4 && hero.paused) setTimeout(tick, tries === 1 ? 180 : tries === 2 ? 400 : 900);
        }
        setTimeout(tick, 160);
      })();
    }

    function syncHeroForSection(hash){
      var target = (hash && hash.charAt(0)==='#') ? hash : '#inicio';
      if (!hero) { pauseOthers(); return; }
      if (target !== '#inicio') { pauseOthers(); try{ hero.pause(); }catch(_){ } return; }
      // En Inicio: pausar todo excepto el héroe y reproducirlo con sonido
      pauseOthers(hero);
      tryPlayHeroUnmutedWithFallback();
    }

    // Exponer para navegación
    window.AudioCore.notifySectionChange = syncHeroForSection;

    // Gesto del usuario: permitir desmuteo si estaba bloqueado
    (function setupFirstGesture(){
      if (!hero) return;
      var done = false;
      var handler = function(){
        if (done) return; done = true; userGestureDone = true;
        var isInicio = (window.location.hash || '#inicio') === '#inicio';
        if (isInicio) { tryPlayHeroUnmutedWithFallback(); }
        window.removeEventListener('click', handler, true);
        window.removeEventListener('keydown', handler, true);
        window.removeEventListener('touchstart', handler, true);
        window.removeEventListener('wheel', handler, true);
        window.removeEventListener('scroll', handler, true);
      };
      window.addEventListener('click', handler, true);
      window.addEventListener('keydown', handler, true);
      window.addEventListener('touchstart', handler, true);
      window.addEventListener('wheel', handler, { capture: true, passive: true });
      window.addEventListener('scroll', handler, { capture: true, passive: true });
    })();

    // La sincronización inicial de sección la realiza scripts.js

    // Fallback de formato MP4: si no puede reproducir, ofrecer link + poster
    (function videoFormatFallback(){
      try {
        if (!hero) return;
        var canPlayMp4 = hero.canPlayType && hero.canPlayType('video/mp4') !== '';
        if (canPlayMp4) return;
        var container = hero.parentElement;
        var poster = hero.dataset && hero.dataset.fallbackPoster ? hero.dataset.fallbackPoster : '';
        var link = document.createElement('a');
        link.href = hero.querySelector('source') ? hero.querySelector('source').getAttribute('src') : '';
        if (!link.href) link.href = '003-balcon-3.mp4';
        link.textContent = 'Descargar / reproducir video';
        link.style.display = 'inline-block';
        link.style.color = '#fff';
        link.style.marginTop = '8px';
        link.style.textDecoration = 'underline';
        if (poster) {
          var img = document.createElement('img');
          img.src = poster; img.alt = 'Imagen del video';
          img.style.maxWidth = '100%'; img.style.borderRadius = '8px';
          container.innerHTML = ''; container.appendChild(img); container.appendChild(link);
        } else {
          container.innerHTML = ''; container.appendChild(link);
        }
      } catch(_){ }
    })();
  });
})();
