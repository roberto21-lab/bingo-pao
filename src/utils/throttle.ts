/**
 * Utilidades para throttling y debouncing
 * Optimiza eventos frecuentes para mejorar rendimiento
 */

/**
 * Throttle: Ejecuta la función como máximo una vez cada `delay` ms
 * Útil para eventos que se disparan frecuentemente (ej: scroll, resize)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      // Ejecutar inmediatamente si ha pasado suficiente tiempo
      lastCall = now;
      func.apply(this, args);
    } else {
      // Programar ejecución para después del delay
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func.apply(this, args);
        timeoutId = null;
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * Debounce: Ejecuta la función solo después de que no se haya llamado por `delay` ms
 * Útil para eventos que deben esperar a que el usuario termine (ej: búsqueda, input)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}


