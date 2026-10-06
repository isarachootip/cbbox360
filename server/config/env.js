/**
 * Centralized Environment Configuration
 */
import fs from 'fs';
import path from 'path';

// Automatically parse and load .env into process.env if present
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const fileContent = fs.readFileSync(envPath, 'utf8');
    const lines = fileContent.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
} catch {
  // Ignore filesystem reading errors
}

export const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL || '',
  LINE_CHANNEL_ID: process.env.LINE_CHANNEL_ID || '2011580063',
  LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET || 'f2030ccfd113a46d89297e3919df39c1',
  LINE_CHANNEL_ACCESS_TOKEN:
    process.env.LINE_CHANNEL_ACCESS_TOKEN ||
    'G6HhxgQDo/1Ji4LOomrfk8Eh4yhBn74w0i+T2vXPjdA2/8bRXZCtvXF9hSwFpjM0MKhTYasa+K/CKZjamIj9JhvqhXCKJXtH/I2YjgGpTkZgwNweMhhOe0GcuLKArE8W1B4tn68xsWeRD/0WY1cpowdB04t89/1O/w1cDnyilFU=',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};

if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
  console.warn('[Security Warning]: LINE_CHANNEL_ACCESS_TOKEN is not set in environment variables.');
}
