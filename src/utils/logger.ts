/**
 * Sistema de logging condicional para Frontend
 * Solo loguea en desarrollo o cuando VITE_DEBUG=true
 */

const isDevelopment = import.meta.env.DEV;
const DEBUG = import.meta.env.VITE_DEBUG === "true" || isDevelopment;

/**
 * Logger optimizado para producción
 * - Errores siempre se loguean
 * - Logs normales solo en desarrollo o con VITE_DEBUG=true
 */
export const logger = {
  /**
   * Log normal (solo en desarrollo o con VITE_DEBUG)
   */
  log: (...args: any[]) => {
    if (DEBUG) {
      console.log(...args);
    }
  },

  /**
   * Warning (solo en desarrollo o con VITE_DEBUG)
   */
  warn: (...args: any[]) => {
    if (DEBUG) {
      console.warn(...args);
    }
  },

  /**
   * Error (siempre se loguea)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Log específico para Socket.io (solo con VITE_DEBUG)
   */
  socket: (...args: any[]) => {
    if (DEBUG) {
      console.log("[Socket]", ...args);
    }
  },

  /**
   * Log específico para Notifications (solo con VITE_DEBUG)
   */
  notification: (...args: any[]) => {
    if (DEBUG) {
      console.log("[Notification]", ...args);
    }
  },

  /**
   * Log específico para Wallet (solo con VITE_DEBUG)
   */
  wallet: (...args: any[]) => {
    if (DEBUG) {
      console.log("[Wallet]", ...args);
    }
  },
};


