/**
 * Conditional logging utility.
 * Only outputs logs in development mode to keep production console clean.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log error messages. Always outputs, even in production.
   * Errors should never be silently swallowed.
   */
  error: (message: string, error?: unknown): void => {
    if (error !== undefined) {
      console.error(message, error);
    } else {
      console.error(message);
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
