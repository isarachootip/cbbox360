/**
 * Centralized Environment Configuration
 */

export const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL || '',
  LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
};

if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
  console.warn('[Security Warning]: LINE_CHANNEL_ACCESS_TOKEN is not set in environment variables.');
}
