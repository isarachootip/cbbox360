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
          app: '#F2F6FB',
          surface: '#FFFFFF',
          subtle: '#F4F8FD',
          muted: '#F7FAFE',
        },
        sidebar: {
          bg: '#EAF2FC',
          border: '#D5E3F4',
          text: '#1E3A5F',
          label: '#50698A',
        },
        brand: {
          DEFAULT: '#1F6FD1',
          hover: '#1558B0',
          deep: '#174E8C',
          tint: '#E3EEFB',
          selected: '#EAF2FC',
        },
        border: {
          DEFAULT: '#DCE5F0',
        },
        divider: {
          DEFAULT: '#E6ECF4',
        },
        text: {
          primary: '#1D2125',
          secondary: '#5E636B',
          body2: '#3F444B',
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
        sans: ['"IBM Plex Sans Thai"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        'sidebar-active': '0 1px 2px rgba(20,60,110,0.14)',
        'card': '0 1px 3px rgba(15,43,77,0.05)',
        'modal': '0 10px 25px -5px rgba(15,43,77,0.1), 0 8px 10px -6px rgba(15,43,77,0.1)',
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
};
