/* --------------------------------------------------------------------
   translations.js — Diccionario de Traducciones

   Este archivo contiene todos los textos que aparecen en la página web,
   organizados por idioma.
   
   ¿CÓMO FUNCIONA?
   El sitio busca los textos usando una "clave" (el texto a la izquierda).
   Si el usuario elige Español, muestra el texto de la sección 'es'.
   Si elige Inglés, muestra el texto de la sección 'en'.

   ¿CÓMO EDITAR LOS TEXTOS?
   1. Busca la sección del idioma que quieres cambiar ('es' o 'en').
   2. Busca la clave del texto (ej: 'nav.home').
   3. Cambia SOLO el texto de la derecha, manteniendo las comillas.
      
      Ejemplo:
      'nav.home': 'Inicio',  <-- Puedes cambiar 'Inicio' por 'Portada'
   
   IMPORTANTE:
   - NO cambies las claves de la izquierda (ej: 'nav.home'), o la página dejará de encontrar el texto.
   - Mantén siempre las comillas simples ('') o dobles ("") alrededor del texto.
   - Si el texto tiene etiquetas HTML (como <strong> o <a href...>), ten cuidado de no borrarlas si quieres mantener el formato.
-------------------------------------------------------------------- */

window.SiteTranslations = {
  
  /* ==================================================================
     SECCIÓN ESPAÑOL (es)
     ================================================================== */
  es: {
    // --- Barra de Navegación ---
    'nav.main': 'Navegación principal',
    'nav.home': 'Inicio',
    'nav.videos': 'Videos',
    'nav.awards': 'Premios',
    'nav.bio': 'Bio',
    'nav.photos': 'Fotos',
    'nav.contact': 'Contacto',
    'nav.rupulo': 'Rúpulo',
    'nav.languageToggle': 'English', // Texto del botón para cambiar a inglés
    
    // Textos para accesibilidad (lectores de pantalla)
    'language.toggle.toEnglish': 'Cambiar idioma a inglés',
    'language.toggle.toSpanish': 'Cambiar idioma a castellano',
    
    // --- Información General (Meta tags) ---
    'meta.title': 'Santiago Segret - Músico',
    'meta.description': 'Santiago Segret, músico y bandoneonista. Descubre su biografía, videos, partituras y más.',
    'skip.toContent': 'Saltar al contenido',
    
    // --- Encabezado Principal (Hero) ---
    'hero.subtitle': 'músico, bandoneonista',
    'hero.imageAlt': 'Santiago Segret',

    // --- Pestañas de Secciones ---
    'tabs.bandoneon': 'Bandoneón',
    'tabs.busquedas': 'Búsquedas',
    'tabs.patio': 'Patio',
    'tabs.dsq': 'DSQ',

    // --- Sección Videos ---
    'videos.missing': 'Video próximamente.',
    'videos.bandoneon.description': 'Obras y arreglos para bandoneón solo, explorando la tradición y nuevas sonoridades.',
    'videos.busquedas.description': 'Búsquedas personales, composiciones y pruebas en distintos formatos e instrumentos.',
    'videos.patio.description': 'Música del trío Patio, junto a Andrés Pilar y Juan Quintero. Folklore y composiciones propias.',
    'videos.dsq.description': 'Registros junto al Diego Schissi Quinteto, interpretando música original y arreglos de tango.',

    // Descripciones de videos individuales (Bandoneón)
    'videos.bandoneon.1': 'Desgrabado de la versión de Roberto Di Filippo.',
    'videos.bandoneon.2': 'Instantáneas del maestro Julio Pane.',
    'videos.bandoneon.3': 'El arreglo es de Máximo Mori y la referencia inevitable es Roberto Di Filippo.',
    'videos.bandoneon.4': 'Uno de los tantos y grandes arreglos de Néstor Marconi.',
    'videos.bandoneon.5': 'Un arreglo propio sobre una música de los Hermanos Ábalos.',
    'videos.bandoneon.6': 'Un clásico arreglado por Bernardo Fingas.',
    'videos.bandoneon.7': 'Arreglo de Máximo Mori y la referencia de Di Filippo.',
    'videos.bandoneon.8': 'Desgrabando a Pedro Laurenz.',
    'videos.bandoneon.9': 'Selección de folklore en bandoneón solo.',
    'videos.bandoneon.10': 'Arreglo de Piazzolla grabado en Planta 16.',
    'videos.bandoneon.11': 'Más Piazzolla en bandoneón solo.',
    'videos.bandoneon.12': 'Arreglo de Máximo Mori, versión de referencia: Di Filippo.',
    'videos.bandoneon.13': 'Más Piazzolla en bandoneón solo.',
    'videos.bandoneon.14': 'Arreglos y más Piazzolla en bandoneón solo.',
    'videos.bandoneon.15': 'Arreglo de Máximo Mori.',

    // Descripciones de videos (Bach)
    'videos.bach.1': 'Invención 8 a dos voces de Bach.',
    'videos.bach.2': 'Las 15 invenciones de Bach a dos voces. En bandoneón.',
    'videos.bach.3': 'Varias piezas del libro de Ana Magdalena Bach.',

    // Descripciones de videos (Patio)
    'videos.patio.1': 'Con los Patio.',
    'videos.patio.2': 'Con Patio y Nadia Larsher.',
    'videos.patio.3': 'Una zamba con el trío Patio.',

    // Descripciones de videos (DSQ)
    'videos.dsq.1': '“Líquido 5” en el ex Centro Cultural Kirchner.',
    'videos.dsq.2': 'Concierto con música de Piazzolla.',
    'videos.dsq.3': '“Tanguera” de Mariano Mores, en Virasoro.',
    'videos.dsq.4': '“Canción 4” en el ex Centro Cultural Kirchner.',
    'videos.dsq.5': 'Con el Diego Schissi Quinteto y Aca Seca en Café Vinilo.',

    // Descripciones de videos (Búsquedas)
    'videos.busquedas.1': 'Composición vocal a 20 voces.',
    'videos.busquedas.2': 'Cuarteto de cuerdas grabado por Santiago Segret.',
    'videos.busquedas.3': 'Fragmento de libro de Bucles.',
    'videos.busquedas.4': '"Libro de Bucles".',
    'videos.busquedas.5': 'Una obra musical casera.',
    'videos.busquedas.6': 'Sonata para piano realizada para la carrera de composición en la UNA.',
    'videos.busquedas.7': 'Cuarteto de cuerdas con bandoneón.',
    'videos.busquedas.8': 'Una canción mía para piano.',
    'videos.busquedas.9': 'Estudiando Thelonious Monk.',
    'videos.busquedas.10': 'Preludio 16 de Chopin.',
    'videos.busquedas.11': 'El estudio 1 de Chopin.',
    'videos.busquedas.12': 'El preludio 3 de Chopin.',
    'videos.busquedas.13': 'Tocando el piano.',
    'videos.busquedas.14': 'Grabado en Panamá.',
    'videos.busquedas.15': 'Uno de los 4 duettos del maestro Bach en piano.',

    // --- Sección Biografía ---
    'bio.tabs.now': 'Presente',
    'bio.tabs.training': 'Formación',
    'bio.tabs.beginnings': 'Inicios',

    'bio.now.title': 'Presente',
    'bio.now.item2': '<span class="logro-text">Profesor de bandoneón en el <strong>Conservatorio “Astor Piazzolla”</strong> (CABA).</span> <span class="logro-ano">Desde 2018</span>',
    'bio.now.item1': '<span class="logro-text">Profesor de bandoneón privado.</span> <span class="logro-ano">Desde 2008</span>',
   'bio.now.item7': '<span class="logro-text">Desarrollador y creador del catálogo de partituras <a href="rupulo_en_desarrollo.html" rel="noopener noreferrer"><strong>Rúpulo Ediciones</strong></a> <!-- Enlace original: <a href="https://rupulo-ediciones.web.app" target="_blank" rel="noopener noreferrer"><strong>Rúpulo Ediciones</strong></a> -->.</span> <span class="logro-ano">Desde 2008</span>',
    'bio.now.item5': '<span class="logro-text">Profesor y asistente de dirección de la <strong>Orquesta de Tango de la UNA</strong>.</span> <span class="logro-ano">Desde 2010</span>',
    'bio.now.item4': '<span class="logro-text">Integra el trío <strong>Patio</strong>, junto a Andrés Pilar y Juan Quintero.</span> <span class="logro-ano">Desde 2013</span>',
    'bio.now.item6': '<span class="logro-text">Integra el <strong>Quinteto de Diego Schissi</strong>.</span> <span class="logro-ano">Desde 2009</span>',
    'bio.now.item3': '<span class="logro-text">Profesor de bandoneón en la <strong>Universidad Nacional de San Martín</strong>.</span> <span class="logro-ano">Desde 2013</span>',

    'bio.training.title': 'Formación',
    'bio.training.item1': 'En 2005 realizó el programa de la Orquesta Escuela de Tango Emilio Balcarce, junto a grandes maestros como Victor Lavallén, Raúl Garello, Lidia Borda, José Colángelo y Néstor Marconi.',
    'bio.training.caption1': 'Con Emilio Balcarce en el Panteón de Roma.',
    'bio.training.item2': 'También compartió grabaciones y escenarios con Leopoldo Federico, Raúl Garello, Victor Lavallén, Vitillo Ábalos, Hilda Herrera, Stefano Bollani, Susana Rinaldi, Nadia Larcher, Luna Monti, Naty Peluso, Pablo Estigarribia, Amelita Baltar, Jorge Fandermole, Rafaél Villazón, Nacho Vidal, Marcelo Moguilevsky, Hernán Segret, Victor Villadangos, Mariana Rewersky, Guillermo Rubino, Ismael Grossman, Juan Pablo Navarro, Mono Fontana.',
    'bio.training.item3': 'En 2019 se gradúa con el título de <strong>Licenciado en Artes Musicales con Orientación en Composición en la UNA</strong>.',
    'bio.training.caption2': 'Fragmento de tesina de graduación.',
    'bio.training.item4': 'De 2013 a 2015 integró la Orquesta del Tango de la Ciudad de Buenos Aires dirigida en aquel entonces por Raúl Garello, Néstor Marconi y Carlos Cuacci.',
    'bio.training.caption3': 'En la Usina del Arte con la Orquesta del Tango de la Ciudad.',
    'bio.training.item5': 'Cursó el programa educativo llevado adelante por Hilda Herrera llamado CIMAP: Creadores e Intérpretes de Música Argentina en Piano.',
    'bio.training.item6': 'A lo largo de su adolescencia y hacia la juventud estudió bandoneón con: Pablo Mainetti, Julio Pane, Mariano “Paya” Cigna, Federico Pereiro y con Carlos Lazzari a los 18 años.',
    'bio.training.item7': 'En esos años conoció más de 20 países con la Orquesta Escuela de Tango, la Orquesta de Érica Di Salvo, Diego Schissi Quinteto, trío Patio y otros.',

    'bio.beginnings.title': 'Inicios',
    'bio.beginnings.item1': 'Santiago Segret nació el 5 de mayo del \'88 en Illinois y desde los 4 años vive en Buenos Aires. De chico jugaba con el piano vertical de su abuelo Horacio en Almagro, tarareaba con su mamá y acompañaba con el bombo a su papá. Comenzó a tocar el bandoneón a los 7 de la mano de Osvaldo “El Marinero” Montes.',
    'bio.beginnings.caption1': 'Tocando “Caminito” y foto con el Marinero Montes.',
    'bio.beginnings.item2': 'Alrededor de los 10 años tomó clases de piano con Liliana Campos. A los 15 debuta como telonero de Javier Malosetti en La Trastienda tocando solos de Piazzolla.',
    'bio.beginnings.caption2': 'Grabaciones en La Trastienda: “Mi Refugio” y “La Familia”, audio de Raúl Monti.',
    'bio.beginnings.audio1': '<strong>Mi Refugio:</strong>',
    'bio.beginnings.audio2': '<strong>La Familia:</strong>',

    // --- Controles de Audio (Accesibilidad) ---
    'audio.unsupported': 'Tu navegador no soporta el elemento de audio.',
    'audio.miRefugio.control': 'Control de audio para “Mi Refugio”.',
    'audio.miRefugio.play': 'Reproducir',
    'audio.miRefugio.volume': 'Volumen',
    'audio.laFamilia.control': 'Control de audio para “La Familia”.',
    'audio.laFamilia.play': 'Reproducir',
    'audio.laFamilia.volume': 'Volumen',

    // --- Sección Premios ---
    'awards.title': 'Premios',
    'awards.2024': '<strong>Grammy Latino</strong> al Mejor Álbum de Tango — <a href="https://open.spotify.com/album/2wabWzvHxIp7DoiYoW5waK?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>Apiazolado</em></a>, con el Diego Schissi Quinteto.',
    'awards.2023': '<strong>Premio Gardel</strong> al Mejor Álbum de Folklore — <a href="https://open.spotify.com/album/64wnAObYHWcXusn5A8fXcl" target="_blank" rel="noopener noreferrer"><em>Patio Vol. 2</em></a>, de Juan Quintero, Andrés Pilar y Santiago Segret.',
    'awards.2018a': '<strong>Premio Gardel</strong> al Mejor Álbum de Folklore — <a href="https://open.spotify.com/album/5OePvXFX4ztMM9tTXud1uk?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>Patio Vol. 1</em></a>, de Juan Quintero, Andrés Pilar y Santiago Segret.',
    'awards.2016a': '<strong>Premio Gardel</strong> en la categoría Orquesta de Tango Instrumental — <a href="https://open.spotify.com/album/474RxN2GuitD351hsAPNbn?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>Timba</em></a>, con el Diego Schissi Quinteto.',
    'awards.2016b': '<strong>Premio Gardel</strong> al Mejor Álbum de Tango — <a href="https://open.spotify.com/intl-es/album/2PTXTj8Vr7IEmr80c7e5rJ?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>El rejunte</em></a>, de la Orquesta de Tango de la UNA.',
    'awards.2013': '<strong>Premio Gardel</strong> al Mejor Álbum de Tango — <a href="https://open.spotify.com/intl-es/album/4lkkdErHecpciBcNUEgLHh?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>Tipas y Tipos (En Vivo en Café Vinilo)</em></a>, con el Diego Schissi Quinteto.',

    // --- Sección Fotos (Textos alternativos y descripciones) ---
    'photos.1.alt': 'Con el Marinero Montes',
    'photos.1.caption': 'Con el Marinero Montes.',
    'photos.2.alt': 'De chiquito en la casa de Goyo Barja',
    'photos.2.caption': 'De chiquito en la casa de Goyo Barja.',
    'photos.3.alt': 'Con Emilio Balcarce en el Panteón de Roma',
    'photos.3.caption': 'Con Emilio Balcarce en el Panteón de Roma.',
    'photos.4.alt': 'Andrés y Vitillo',
    'photos.4.caption': 'Con Andrés Pilar y Vitillo Ábalos.',
    'photos.5.alt': 'Pablo Estigarribia y Marco Antonio Fernández',
    'photos.5.caption': 'Con Pablo Estigarribia y Marco Antonio Fernández en Roma.',
    'photos.6.alt': 'Con Leopoldo Federico',
    'photos.6.caption': 'Con Leopoldo Federico.',
    'photos.7.alt': 'Con Andrés Pilar',
    'photos.7.caption': 'Con Andrés Pilar.',
    'photos.8.alt': 'En Virasoro',
    'photos.8.caption': 'En Virasoro con Rubino, Schissi, Grossman y Navarro.',
    'photos.9.alt': 'Con Fandermole',
    'photos.9.caption': 'Con Jorge Fandermole y Tiqui Cantero en La Rioja.',
    'photos.10.alt': 'Con Federico Pereiro y Marco Antonio Fernández',
    'photos.10.caption': 'Con Federico Pereiro y Marco Antonio Fernández en la Orquesta Escuela.',
    'photos.11.alt': 'Pane Lautaro',
    'photos.11.caption': 'Con Julio Pane y Lautaro Greco.',
    'photos.12.alt': 'Con Furman, Quintanilla y Amerise',
    'photos.12.caption': 'Con Furman, Quintanilla y Amerise, acompañando a Morena Albert.',
    'photos.13.alt': 'Con la madre de Evgeny Kissin',
    'photos.13.caption': 'Con la madre de Evgeny Kissin en la puerta del Teatro Colón.',
    'photos.14.alt': 'Con Patio',
    'photos.14.caption': 'Con Patio en Rosario.',
    'photos.15.alt': 'Con Louise Cole',
    'photos.15.caption': 'Con Louise Cole.',
    'photos.16.alt': 'Con Mariana Rewersky y compañía',
    'photos.16.caption': 'Con Mariana Rewersky, Victor Villadangos, David Akerman y Paula Castro.',
    'photos.17.alt': 'En lo de Rafael Villazón',
    'photos.17.caption': 'En lo de Rafael Villazón.',
    'photos.18.alt': 'Juan y Luna',
    'photos.18.caption': 'Con Juan Quintero y Luna Monti.',
    'photos.19.alt': 'Con Aca Seca',
    'photos.19.caption': 'Con Aca Seca.',
    'photos.20.alt': 'Con el Mono Fontana',
    'photos.20.caption': 'Con el Mono Fontana.',
    'photos.21.alt': 'Palestrini y Baltazar Estol',
    'photos.21.caption': 'Con Sergio Palestrini y Baltazar Estol.',
    'photos.22.alt': 'Diego Schissi Quinteto con Bollani',
    'photos.22.caption': 'Diego Schissi Quinteto con Bollani.',

    // --- Sección Contacto ---
    'contact.title': 'Contacto',
    'contact.email': '<strong>Email:</strong> <a href="mailto:ssegret@gmail.com" class="contacto-link">ssegret@gmail.com</a>',
    'contact.phone': '<strong>Celular:</strong> <a href="tel:+541149890559" class="contacto-link">+54 11 4989-0559</a>',
    'contact.youtube': '<strong>YouTube:</strong> <a href="https://www.youtube.com/@SantiagoSegret" target="_blank" rel="noopener noreferrer" class="contacto-link">Visitar canal</a>',

    // --- Sección Rúpulo ---
    'rupulo.title': 'Rúpulo Ediciones',
    'rupulo.description': '<strong>Rúpulo Ediciones</strong> es el catálogo de partituras de Santiago Segret. Desgrabaciones, arreglos, composiciones, copias, inventos, ejercicios, pruebas, fundamentalmente orientadas al bandoneón y al tango así como también a otras áreas de la música y la pedagogía.',
    'rupulo.visitLabel': 'Visitar catálogo:',

    // --- Elementos de Interfaz (UI) ---
    'ui.backToTop.aria': 'Volver al inicio de la página',
    'ui.backToTop.title': 'Volver arriba',
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

  /* ==========================================================================
     SECCIÓN INGLÉS (en)
     ==========================================================================
     Aquí están todas las traducciones para la versión en INGLÉS del sitio.
     La estructura es idéntica a la de español, pero con los textos traducidos.
     ========================================================================== */
  en: {
    // --- Metadatos y Navegación ---
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

    // --- Sección Hero (Portada) ---
    'hero.subtitle': 'musician, bandoneonist',
    'hero.imageAlt': 'Santiago Segret',

    // --- Pestañas de Videos ---
    'tabs.bandoneon': 'Bandoneón',
    'tabs.busquedas': 'Explorations',
    'tabs.patio': 'Patio',
    'tabs.dsq': 'DSQ',

    // --- Descripciones de Videos ---
    'videos.missing': 'Video coming soon.',
    'videos.bandoneon.description': 'Works and arrangements for solo bandoneon, exploring tradition and new sonorities.',
    'videos.busquedas.description': 'Personal searches, compositions, and experiments in different formats and instruments.',
    'videos.patio.description': 'Music by the trio Patio, with Andrés Pilar and Juan Quintero. Folklore and original compositions.',
    'videos.dsq.description': 'Recordings with the Diego Schissi Quinteto, performing original music and tango arrangements.',

    // --- Títulos de Videos (Bandoneón) ---
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

    // --- Títulos de Videos (Bach) ---
    'videos.bach.1': 'Bach\'s Invention No. 8 for two voices.',
    'videos.bach.2': 'The 15 two-voice inventions by Bach on bandoneon.',
    'videos.bach.3': 'Several pieces from the Anna Magdalena Bach Notebook.',

    // --- Títulos de Videos (Patio) ---
    'videos.patio.1': 'With Patio.',
    'videos.patio.2': 'With Patio and Nadia Larsher.',
    'videos.patio.3': 'A zamba with the trio Patio.',

    // --- Títulos de Videos (DSQ) ---
    'videos.dsq.1': '“Líquido 5” at the former Kirchner Cultural Center.',
    'videos.dsq.2': 'Concert featuring the music of Piazzolla.',
    'videos.dsq.3': '“Tanguera” by Mariano Mores, at Virasoro.',
    'videos.dsq.4': '“Canción 4” at the former Kirchner Cultural Center.',
    'videos.dsq.5': 'With the Diego Schissi Quinteto and Aca Seca at Café Vinilo.',

    // --- Títulos de Videos (Búsquedas) ---
    'videos.busquedas.1': 'Vocal composition for 20 voices.',
    'videos.busquedas.2': 'String quartet recorded by Santiago Segret.',
    'videos.busquedas.3': 'Fragment from Book of Loops.',
    'videos.busquedas.4': '"Libro de Bucles".',
    'videos.busquedas.5': 'A homemade musical piece.',
    'videos.busquedas.6': 'Piano sonata created for the composition degree at UNA.',
    'videos.busquedas.7': 'String quartet with bandoneon.',
    'videos.busquedas.8': 'A song of mine for piano.',
    'videos.busquedas.9': 'Studying Thelonious Monk.',
    'videos.busquedas.10': 'Chopin\'s Prelude No. 16.',
    'videos.busquedas.11': 'Chopin\'s Étude No. 1.',
    'videos.busquedas.12': 'Chopin\'s Prelude No. 3.',
    'videos.busquedas.13': 'Playing the piano.',
    'videos.busquedas.14': 'Recorded in Panama.',
    'videos.busquedas.15': 'One of maestro Bach\'s four duets on piano.',

    // --- Sección Biografía ---
    'bio.tabs.now': 'Now',
    'bio.tabs.training': 'Training',
    'bio.tabs.beginnings': 'Beginnings',

    // --- Biografía: Actualidad ---
    'bio.now.title': 'Now',
    'bio.now.item2': '<span class="logro-text">Bandoneon professor at the <strong>“Astor Piazzolla” Conservatory</strong> (CABA).</span> <span class="logro-ano">Since 2018</span>',
    'bio.now.item1': '<span class="logro-text">Private bandoneon lessons, online and in person.</span> <span class="logro-ano">Since 2008</span>',
   'bio.now.item7': '<span class="logro-text">Developer and creator of the sheet music catalog <a href="rupulo_en_desarrollo.html" rel="noopener noreferrer"><strong>Rúpulo Ediciones</strong></a> <!-- Original link: <a href="https://rupulo-ediciones.web.app" target="_blank" rel="noopener noreferrer"><strong>Rúpulo Ediciones</strong></a> -->.</span> <span class="logro-ano">Since 2008</span>',
    'bio.now.item5': '<span class="logro-text">Professor and assistant conductor of the <strong>UNA Tango Orchestra</strong>.</span> <span class="logro-ano">Since 2010</span>',
    'bio.now.item4': '<span class="logro-text">Member of the trio <strong>Patio</strong>, with Andrés Pilar and Juan Quintero.</span> <span class="logro-ano">Since 2013</span>',
    'bio.now.item6': '<span class="logro-text">Member of the <strong>Diego Schissi Quinteto</strong>.</span> <span class="logro-ano">Since 2009</span>',
    'bio.now.item3': '<span class="logro-text">Bandoneon professor at the <strong>National University of San Martín</strong>.</span> <span class="logro-ano">Since 2013</span>',

    // --- Biografía: Formación ---
    'bio.training.title': 'Training',
    'bio.training.item1': 'In 2005 he completed the program of the Emilio Balcarce Tango Orchestra School alongside masters such as Victor Lavallén, Raúl Garello, Lidia Borda, José Colángelo, and Néstor Marconi.',
    'bio.training.caption1': 'Photo with Emilio Balcarce at the Pantheon in Rome.',
    'bio.training.item2': 'He has also shared recordings and stages with Leopoldo Federico, Raúl Garello, Victor Lavallén, Vitillo Ábalos, Hilda Herrera, Stefano Bollani, Susana Rinaldi, Nadia Larcher, Luna Monti, Naty Peluso, Pablo Estigarribia, Amelita Baltar, Jorge Fandermole, Rafael Villazón, Nacho Vidal, Marcelo Moguilevsky, Hernán Segret, Victor Villadangos, Mariana Rewersky, Guillermo Rubino, Ismael Grossman, Juan Pablo Navarro, Mono Fontana.',
    'bio.training.item3': 'In 2019 he graduated with a degree in <strong>Music Arts with a concentration in Composition at UNA</strong>.',
    'bio.training.caption2': 'Fragment of graduation thesis.',
    'bio.training.item4': 'From 2013 to 2015 he was part of the Buenos Aires City Tango Orchestra, then conducted by Raúl Garello, Néstor Marconi, and Carlos Cuacci.',
    'bio.training.caption3': 'At the Usina del Arte with the Buenos Aires City Tango Orchestra.',
    'bio.training.item5': 'He completed the educational program led by Hilda Herrera called CIMAP: Creators and Performers of Argentine Music on Piano.',
    'bio.training.item6': 'Throughout his adolescence and youth he studied bandoneon with Pablo Mainetti, Julio Pane, Mariano “Paya” Cigna, Federico Pereiro, and with Carlos Lazzari at age 18.',
    'bio.training.item7': 'In those years he visited more than 20 countries with the Tango Orchestra School, Érica Di Salvo\'s Orchestra, the Diego Schissi Quinteto, the trio Patio, and others.',

    // --- Biografía: Comienzos ---
    'bio.beginnings.title': 'Beginnings',
    'bio.beginnings.item1': 'Santiago Segret was born on May 5, 1988 in Illinois and has lived in Buenos Aires since he was four. As a child he played on his grandfather Horacio\'s upright piano in Almagro, sang with his mother, and kept rhythm on the bombo with his father. He began playing bandoneon at seven with Osvaldo “El Marinero” Montes.',
    'bio.beginnings.caption1': 'Playing “Caminito” and photo with Marinero Montes.',
    'bio.beginnings.item2': 'Around age ten he took piano lessons with Liliana Campos. At fifteen he opened for Javier Malosetti at La Trastienda performing Piazzolla solos.',
    'bio.beginnings.caption2': 'Recordings from La Trastienda: “Mi Refugio” and “La Familia”, audio by Raúl Monti.',
    'bio.beginnings.audio1': '<strong>Mi Refugio:</strong>',
    'bio.beginnings.audio2': '<strong>La Familia:</strong>',

    // --- Sección Audio ---
    'audio.unsupported': 'Your browser does not support the audio element.',
    'audio.miRefugio.control': 'Audio controls for “Mi Refugio”.',
    'audio.miRefugio.play': 'Play',
    'audio.miRefugio.volume': 'Volume',
    'audio.laFamilia.control': 'Audio controls for “La Familia”.',
    'audio.laFamilia.play': 'Play',
    'audio.laFamilia.volume': 'Volume',

    // --- Sección Premios ---
    'awards.title': 'Awards',
    'awards.2024': '<strong>Latin Grammy</strong> for Best Tango Album — <a href="https://open.spotify.com/album/2wabWzvHxIp7DoiYoW5waK?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>Apiazolado</em></a>, with the Diego Schissi Quinteto.',
    'awards.2023': '<strong>Premio Gardel</strong> for Best Folklore Album — <a href="https://open.spotify.com/album/64wnAObYHWcXusn5A8fXcl" target="_blank" rel="noopener noreferrer"><em>Patio Vol. 2</em></a>, by Juan Quintero, Andrés Pilar, and Santiago Segret.',
    'awards.2018a': '<strong>Premio Gardel</strong> for Best Folklore Album — <a href="https://open.spotify.com/album/5OePvXFX4ztMM9tTXud1uk?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>Patio Vol. 1</em></a>, by Juan Quintero, Andrés Pilar, and Santiago Segret.',
    'awards.2016a': '<strong>Premio Gardel</strong> in the Tango Instrumental Orchestra category — <a href="https://open.spotify.com/album/474RxN2GuitD351hsAPNbn?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>Timba</em></a>, with the Diego Schissi Quinteto.',
    'awards.2016b': '<strong>Premio Gardel</strong> for Best Tango Album — <a href="https://open.spotify.com/intl-es/album/2PTXTj8Vr7IEmr80c7e5rJ?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>El rejunte</em></a>, by the UNA Tango Orchestra.',
    'awards.2013': '<strong>Premio Gardel</strong> for Best Tango Album — <a href="https://open.spotify.com/intl-es/album/4lkkdErHecpciBcNUEgLHh?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer"><em>Tipas y Tipos (En Vivo en Café Vinilo)</em></a>, with the Diego Schissi Quinteto.',

    // --- Sección Fotos (Textos alternativos y descripciones) ---
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
    'photos.22.alt': 'Diego Schissi Quinteto with Bollani',
    'photos.22.caption': 'Diego Schissi Quinteto with Bollani.',

    // --- Sección Contacto ---
    'contact.title': 'Contact',
    'contact.email': '<strong>Email:</strong> <a href="mailto:ssegret@gmail.com" class="contacto-link">ssegret@gmail.com</a>',
    'contact.phone': '<strong>Mobile:</strong> <a href="tel:+541149890559" class="contacto-link">+54 11 4989-0559</a>',
    'contact.youtube': '<strong>YouTube:</strong> <a href="https://www.youtube.com/@SantiagoSegret" target="_blank" rel="noopener noreferrer" class="contacto-link">Visit channel</a>',

    // --- Sección Rúpulo ---
    'rupulo.title': 'Rúpulo Ediciones',
    'rupulo.description': '<strong>Rúpulo Ediciones</strong> is the sheet music catalog of Santiago Segret. Transcriptions, arrangements, compositions, copies, inventions, exercises, tests, primarily oriented towards the bandoneon and tango as well as other areas of music and pedagogy.',
    'rupulo.visitLabel': 'Visit catalog:',

    // --- Elementos de Interfaz (UI) ---
    'ui.backToTop.aria': 'Back to top of page',
    'ui.backToTop.title': 'Back to top',
    'gallery.dialogLabel': 'Photo viewer',
    'gallery.close': 'Close gallery',
    'gallery.prev': 'View previous photo',
    'gallery.next': 'View next photo',
    'gallery.triggerPrefix': 'Open photo:',
    'gallery.triggerFallback': 'Open photo in full size',
    'gallery.defaultAlt': 'Photograph',
    'counter.label': 'Visits: {count}',
    'globalMute.mute': 'Mute all',
    'globalMute.unmute': 'Unmute all audio'
  },


};
