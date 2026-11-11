/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          app: '#F6F8FC',
          surface: '#FFFFFF',
          subtle: '#F8FAFD',
          muted: '#F3F6FB',
        },
        sidebar: {
          bg: '#F0F5FC',
          border: '#DCE6F2',
          text: '#1E3A5F',
          label: '#5A7190',
        },
        brand: {
          DEFAULT: '#1F6FD1',
          hover: '#1558B0',
          deep: '#174E8C',
          tint: '#E6F0FD',
          selected: '#EDF4FD',
        },
        border: {
          DEFAULT: '#E2E8F0',
        },
        divider: {
          DEFAULT: '#EDF2F7',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          body2: '#1E293B',
        },
        warn: {
          bg: '#FDF6E9',
          border: '#F0DDB5',
          text: '#7A4F00',
        },
        danger: {
          bg: '#FDF1EE',
          border: '#F1CFC5',
          text: '#8A2E1C',
        },
        success: {
          bg: '#E3F1E6',
          text: '#1F6B35',
        },
        badge: {
          orange: '#B4480A',
        },
        tier: {
          member: {
            text: '#4A5058',
            bg: '#EEF1F5',
            accent: '#9AA3AD',
          },
          silver: {
            text: '#4A5058',
            bg: '#ECEEF0',
            accent: '#8C959F',
          },
          gold: {
            text: '#7A4F00',
            bg: '#FBEBC8',
            accent: '#C9962E',
          },
          platinum: {
            text: '#4A3F8C',
            bg: '#E9E7F5',
            accent: '#6A5CB8',
          },
        },
        grade: {
          a: { text: '#1F6B35', bg: '#E3F1E6' },
          b: { text: '#1146A8', bg: '#E6EEFF' },
          c: { text: '#7A4F00', bg: '#FCEFD9' },
          d: { text: '#8A2E1C', bg: '#F6E1DC' },
        },
        channel: {
          line: { text: '#0B6B34', bg: '#E3F7EA', dot: '#06A94A' },
          facebook: { text: '#1146A8', bg: '#E6EEFF', dot: '#0866FF' },
          voice: { text: '#6B21A8', bg: '#F3E8FF', dot: '#9333EA' },
          web: { text: '#0E7490', bg: '#E0F2FE', dot: '#0284C7' },
          sales: { text: '#C2410C', bg: '#FFEDD5', dot: '#EA580C' },
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"IBM Plex Sans Thai"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'sidebar-active': '0 1px 3px rgba(31, 111, 209, 0.12), 0 1px 2px rgba(15, 23, 42, 0.05)',
        'card': '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 43, 77, 0.04)',
        'modal': '0 12px 28px -6px rgba(15, 23, 42, 0.14), 0 8px 12px -6px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
};
