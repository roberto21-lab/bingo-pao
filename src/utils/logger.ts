/**
 * Sistema de logging condicional para Frontend
 * Solo loguea en desarrollo o cuando VITE_DEBUG=true
 * 
 * P12-FIX: Logs controlados por entorno - NO se muestran en producción
 */

const isDevelopment = import.meta.env.DEV;
const DEBUG = import.meta.env.VITE_DEBUG === "true" || isDevelopment;
const DEBUG_GAME = import.meta.env.VITE_DEBUG_GAME === "true";
const DEBUG_SYNC = import.meta.env.VITE_DEBUG_SYNC === "true";

/**
 * Logger optimizado para producción
 * - Errores siempre se loguean
 * - Logs normales solo en desarrollo o con VITE_DEBUG=true
 * - Logs de game solo con VITE_DEBUG_GAME=true
 * - Logs de sync solo con VITE_DEBUG_SYNC=true
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

  /**
   * P12-FIX: Log específico para Game/Bingo (solo con VITE_DEBUG_GAME)
   */
  game: (...args: any[]) => {
    if (DEBUG_GAME || DEBUG) {
      console.log("[Game]", ...args);
    }
  },

  /**
   * P12-FIX: Log específico para Sync/Reconnection (solo con VITE_DEBUG_SYNC)
   */
  sync: (...args: any[]) => {
    if (DEBUG_SYNC || DEBUG) {
      console.log("[Sync]", ...args);
    }
  },

  /**
   * P12-FIX: Log específico para Premios (solo en desarrollo)
   */
  prize: (...args: any[]) => {
    if (DEBUG) {
      console.log("[Prize]", ...args);
    }
  },

  /**
   * P12-FIX: Log crítico - se loguea siempre pero con prefijo
   */
  critical: (...args: any[]) => {
    console.error("[CRITICAL]", ...args);
  },
};


