import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      zIndex: {
        '1': '1',
        '2': '2',
        '3': '3',
        '4': '4',
        '5': '5',
      },
      transitionDuration: {
        '2000': '2000ms',
        '5000': '5000ms',
      },
      keyframes: {
        moveArrow: {
          '0%': { transform: 'translateX(0)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(40px)', opacity: '0' },
        },
      },
      animation: {
        moveArrow: 'moveArrow 2s infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
