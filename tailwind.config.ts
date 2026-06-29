import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // Single desaturated accent — emerald. No purple, no neon.
        accent: {
          DEFAULT: '#34d399', // emerald-400
          fill: '#10b981', // emerald-500
          dim: '#065f46', // emerald-800
        },
      },
      fontFamily: {
        sans: ['Geist Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        breathe: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
        breathe: 'breathe 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
