import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0F0E', // fondo
        surface: '#151A19', // tarjetas
        surfaceRaised: '#1E2523', // filas / inputs
        primary: {
          DEFAULT: '#22C55E', // verde: botones, acento, timer
          deep: '#16A34A', // pressed / hover
        },
        accentLime: '#A3E635', // PRs y destaques
        text: '#F0F4F2',
        textMuted: '#8A938F',
        danger: '#F87171',
      },
      fontFamily: {
        // Space Grotesk (títulos/logo) e Inter (cuerpo), inyectadas via next/font
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      spacing: {
        'safe-t': 'env(safe-area-inset-top)',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-l': 'env(safe-area-inset-left)',
        'safe-r': 'env(safe-area-inset-right)',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(34,197,94,0.35), 0 8px 30px -8px rgba(34,197,94,0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
