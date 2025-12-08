/* --------------------------------------------------------------------
   utils.js — Funciones de Ayuda (Helpers)

   Este archivo contiene funciones pequeñas y reutilizables que pueden
   ser usadas por cualquier otro script en la página. El objetivo es
   evitar duplicar código y mantener un orden.
-------------------------------------------------------------------- */

/**
 * Convierte un número de segundos a un formato de cadena "m:ss".
 * Por ejemplo, 75 segundos se convierten en "1:15".
 * 
 * @param {number} s - El número de segundos a formatear.
 * @returns {string} El tiempo formateado como una cadena.
 */
function formatTime(s) {
  if (!s || isNaN(s)) {
    return '0:00';
  }
  const minutes = Math.floor(s / 60);
  const seconds = Math.floor(s % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
