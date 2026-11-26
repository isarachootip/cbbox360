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
          app: '#F2F4FA',
          surface: '#FFFFFF',
          subtle: '#F7F8FD',
          muted: '#EEF0FA',
        },
        sidebar: {
          bg: '#F8F9FE',
          border: '#E4E7F4',
          text: '#334155',
          label: '#7B84A3',
        },
        brand: {
          DEFAULT: 'rgb(var(--cb-brand-rgb, 99 102 241) / <alpha-value>)',
          hover: 'rgb(var(--cb-brand-hover-rgb, 79 70 229) / <alpha-value>)',
          deep: 'rgb(var(--cb-brand-deep-rgb, 67 56 202) / <alpha-value>)',
          tint: 'rgb(var(--cb-brand-tint-rgb, 238 240 255) / <alpha-value>)',
          selected: 'rgb(var(--cb-brand-selected-rgb, 242 241 255) / <alpha-value>)',
        },
        border: {
          DEFAULT: '#E4E7F2',
        },
        divider: {
          DEFAULT: '#EEF0F8',
        },
        text: {
          primary: '#111827',
          secondary: '#525E7A',
          muted: '#7B84A3',
          body2: '#1F2937',
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
            text: '#4338CA',
            bg: '#EEF0FF',
            accent: '#6366F1',
          },
        },
        grade: {
          a: { text: '#1F6B35', bg: '#E3F1E6' },
          b: { text: '#3730A3', bg: '#E0E7FF' },
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
          '"Plus Jakarta Sans"',
          '"Prompt"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Prompt"',
          'ui-monospace',
          '"Cascadia Mono"',
          '"Consolas"',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': ['calc(11.5px * var(--cb-font-scale, 1.04))', { lineHeight: '1.5' }],
        xs: ['calc(12.5px * var(--cb-font-scale, 1.04))', { lineHeight: '1.55' }],
        ui: ['calc(13.5px * var(--cb-font-scale, 1.04))', { lineHeight: '1.6' }],
        sm: ['calc(14px * var(--cb-font-scale, 1.04))', { lineHeight: '1.62' }],
        base: ['calc(14.5px * var(--cb-font-scale, 1.04))', { lineHeight: '1.65' }],
        lg: ['calc(16.5px * var(--cb-font-scale, 1.04))', { lineHeight: '1.45' }],
        xl: ['calc(18.5px * var(--cb-font-scale, 1.04))', { lineHeight: '1.38' }],
        '2xl': ['calc(24px * var(--cb-font-scale, 1.04))', { lineHeight: '1.25' }],
      },
      boxShadow: {
        'sidebar-active': '0 4px 12px rgba(99, 102, 241, 0.14), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'card': '0 4px 20px -2px rgba(99, 102, 241, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'modal': '0 20px 40px -10px rgba(67, 56, 202, 0.16), 0 8px 16px -6px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        'card': '16px',
      },
    },
  },
  plugins: [],
};
