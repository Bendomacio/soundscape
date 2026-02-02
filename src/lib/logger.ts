/**
 * Conditional logging utility.
 * Only outputs logs in development mode to keep production console clean.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log error messages. Only outputs in development mode.
   */
  error: (message: string, error?: unknown): void => {
    if (isDev) {
      console.error(message, error);
    }
  },

  /**
   * Log warning messages. Only outputs in development mode.
   */
  warn: (message: string, data?: unknown): void => {
    if (isDev) {
      if (data !== undefined) {
        console.warn(message, data);
      } else {
        console.warn(message);
      }
    }
  },

  /**
   * Log debug/info messages. Only outputs in development mode.
   */
  debug: (message: string, data?: unknown): void => {
    if (isDev) {
      if (data !== undefined) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  }
};
