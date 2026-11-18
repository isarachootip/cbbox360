/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./core/client/**/*.{js,ts,jsx,tsx}",
    "./modules/**/*.{js,ts,jsx,tsx}",
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
          DEFAULT: 'rgb(var(--cb-brand-rgb, 31 111 209) / <alpha-value>)',
          hover: 'rgb(var(--cb-brand-hover-rgb, 21 88 176) / <alpha-value>)',
          deep: 'rgb(var(--cb-brand-deep-rgb, 23 78 140) / <alpha-value>)',
          tint: 'rgb(var(--cb-brand-tint-rgb, 230 240 253) / <alpha-value>)',
          selected: 'rgb(var(--cb-brand-selected-rgb, 237 244 253) / <alpha-value>)',
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
          muted: '#64748B',
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
        sans: [
          '"IBM Plex Sans"',
          '"IBM Plex Sans Thai"',
          '"Leelawadee UI"',
          '"Thonburi"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        mono: [
          '"IBM Plex Mono"',
          '"IBM Plex Sans Thai"',
          'ui-monospace',
          '"Cascadia Mono"',
          '"Consolas"',
          '"Leelawadee UI"',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': ['calc(12px * var(--cb-font-scale, 1.05))', { lineHeight: '1.5' }],
        xs: ['calc(12.5px * var(--cb-font-scale, 1.05))', { lineHeight: '1.55' }],
        ui: ['calc(13.5px * var(--cb-font-scale, 1.05))', { lineHeight: '1.6' }],
        sm: ['calc(14px * var(--cb-font-scale, 1.05))', { lineHeight: '1.62' }],
        base: ['calc(14.5px * var(--cb-font-scale, 1.05))', { lineHeight: '1.65' }],
        lg: ['calc(16.5px * var(--cb-font-scale, 1.05))', { lineHeight: '1.45' }],
        xl: ['calc(18.5px * var(--cb-font-scale, 1.05))', { lineHeight: '1.38' }],
        '2xl': ['calc(24px * var(--cb-font-scale, 1.05))', { lineHeight: '1.25' }],
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
