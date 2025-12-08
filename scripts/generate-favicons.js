/*
  ==========================================================================
  GENERADOR DE FAVICONS (scripts/generate-favicons.js)
  ==========================================================================

  Este script es una herramienta de desarrollo para automatizar la creación
  de los 'favicons' del sitio web (los pequeños íconos que aparecen en la
  pestaña del navegador).

  ¿CÓMO FUNCIONA?
  1. Toma un archivo de imagen vectorial (favicon.svg) de la carpeta principal.
  2. Usa una librería llamada 'sharp' para convertir y redimensionar ese SVG
     a varios tamaños de imagen PNG.
  3. Genera un 'favicon-32.png' que los navegadores modernos pueden usar.
  4. Combina varias de estas imágenes PNG (16x16, 32x32, 48x48) en un solo
     archivo 'favicon.ico', que es el formato tradicional compatible con
     navegadores más antiguos.

  ¿CÓMO USARLO?
  - Se ejecuta desde la terminal con el comando: node scripts/generate-favicons.js
  - Requiere tener Node.js instalado y la librería 'sharp' (se instala con: npm install sharp).
  - Solo necesitas ejecutarlo si cambias el diseño del favicon.svg.
*/

// --- Dependencias (las "herramientas" que necesita el script) ---
const fs = require('fs'); // 'fs' (File System) para leer y escribir archivos.
const path = require('path'); // 'path' para manejar rutas de archivos de forma segura.
const sharp = require('sharp'); // 'sharp' para la manipulación de imágenes.

// La función principal que hace todo el trabajo.
// La definimos como 'async' para poder usar 'await', que simplifica el
// manejo de tareas que toman tiempo (como procesar imágenes).
async function generate() {
  // --- Paso 1: Definir rutas y verificar el archivo de origen ---

  // '__dirname' es la carpeta actual ('scripts'). '..' sube un nivel a la raíz del proyecto.
  const root = path.resolve(__dirname, '..');
  // Creamos la ruta completa al archivo SVG de origen.
  const svgPath = path.join(root, 'favicon.svg');

  // Verificamos si el archivo 'favicon.svg' realmente existe antes de continuar.
  if (!fs.existsSync(svgPath)) {
    console.error('Error: No se encuentra el archivo "favicon.svg" en la raíz del proyecto.');
    process.exit(1); // Si no existe, terminamos el script con un código de error.
  }

  console.log('Iniciando la generación de favicons desde:', svgPath);

  try {
    // --- Paso 2: Generar un PNG simple de 32x32 ---
    // Este es un favicon moderno que muchos navegadores usan directamente.
    const png32Path = path.join(root, 'favicon-32.png');
    await sharp(svgPath) // Carga el SVG con sharp.
      .resize(32, 32)   // Redimensiona la imagen a 32x32 píxeles.
      .png({ quality: 90 }) // Convierte a formato PNG con 90% de calidad.
      .toFile(png32Path);   // Guarda el resultado en el archivo 'favicon-32.png'.
    console.log('✔ Generado:', png32Path);


    // --- Paso 3: Crear las imágenes para el archivo .ico en memoria ---
    // El formato .ico es un contenedor que puede tener varias imágenes dentro.
    // Crearemos versiones de 16x16, 32x32 y 48x48 y las guardaremos en 'buffers'.
    // Un 'buffer' es un espacio en la memoria para guardar datos binarios (como una imagen).
    console.log('\nPreparando imágenes para el archivo .ico...');
    const sizes = [16, 32, 48]; // Los tamaños que incluiremos.
    const imageEntries = []; // Un array para guardar los datos de cada imagen.

    for (const s of sizes) {
      const buffer = await sharp(svgPath)
        .resize(s, s)
        .png() // Convertir a PNG
        .toBuffer(); // Guardar en un buffer en lugar de un archivo.
      
      imageEntries.push({ size: s, buffer: buffer });
      console.log(`  - Creada imagen de ${s}x${s}px en memoria.`);
    }


    // --- Paso 4: Construir el archivo .ico manualmente ---
    // El formato .ico tiene una estructura específica:
    // 1. Un encabezado que dice cuántas imágenes contiene.
    // 2. Un "directorio" que describe cada imagen (tamaño, formato, etc.).
    // 3. Los datos de cada imagen, uno tras otro.

    const icoPath = path.join(root, 'favicon.ico');

    // 1. Crear el encabezado del .ico (6 bytes).
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // Reservado, siempre 0.
    header.writeUInt16LE(1, 2); // Tipo de archivo: 1 para .ICO.
    header.writeUInt16LE(imageEntries.length, 4); // Número de imágenes que contiene.

    // 2. Crear las entradas del directorio (16 bytes por cada imagen).
    const dirEntries = Buffer.alloc(16 * imageEntries.length);
    let offset = 6 + dirEntries.length; // El punto donde comenzarán los datos de la primera imagen.

    for (let i = 0; i < imageEntries.length; i++) {
      const { size, buffer } = imageEntries[i];
      const entryOffset = i * 16;

      // Escribimos los detalles de esta imagen en su parte del directorio:
      dirEntries.writeUInt8(size, entryOffset + 0); // Ancho (Width).
      dirEntries.writeUInt8(size, entryOffset + 1); // Alto (Height).
      dirEntries.writeUInt8(0, entryOffset + 2); // Paleta de colores (0 = no hay).
      dirEntries.writeUInt8(0, entryOffset + 3); // Reservado.
      dirEntries.writeUInt16LE(1, entryOffset + 4); // Planos de color.
      dirEntries.writeUInt16LE(32, entryOffset + 6); // Bits por píxel (32 para PNG con transparencia).
      dirEntries.writeUInt32LE(buffer.length, entryOffset + 8); // Tamaño de los datos de la imagen en bytes.
      dirEntries.writeUInt32LE(offset, entryOffset + 12); // Dónde empiezan los datos de esta imagen dentro del archivo.

      // Actualizamos el 'offset' para la siguiente imagen.
      offset += buffer.length;
    }

    // 3. Juntar todas las partes en un solo buffer.
    const allImageData = imageEntries.map(entry => entry.buffer);
    const finalIcoBuffer = Buffer.concat([header, dirEntries, ...allImageData]);

    // --- Paso 5: Escribir el archivo .ico en el disco ---
    fs.writeFileSync(icoPath, finalIcoBuffer);
    console.log('✔ Generado:', icoPath);

    console.log('\n¡Proceso completado! Si no ves los cambios, refresca la caché del navegador (Ctrl+F5 o Cmd+Shift+R).');
  
  } catch (err) {
    // Si algo falla en cualquiera de los pasos, mostramos un error.
    console.error('Error generando los favicons:', err);
    process.exit(2);
  }
}

// Iniciar la ejecución del script.
generate();
