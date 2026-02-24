/**
 * Hello Labs — Design Tokens
 * ============================
 * FONTE UNICA DE VERDADE para todos os valores visuais do sistema.
 * Alterar aqui = alterar no sistema inteiro via Tailwind + CSS variables.
 *
 * Workflow: tokens.ts → tailwind.config.ts → globals.css → componentes
 *
 * NOTA: Cores provisorias — serao atualizadas quando o design for finalizado.
 */

export const tokens = {
  colors: {
    // ─── Marca — Hello Labs Azul Figma ───
    primary: {
      50: '#eef1fe',
      100: '#dde3fd',
      200: '#bbc7fb',
      300: '#99abf9',
      400: '#778ff7',
      500: '#5e81f4',  // Principal
      600: '#3d5fd2',
      700: '#2e4aab',
      800: '#203584',
      900: '#12205d',
      950: '#0a1236',
      DEFAULT: '#5e81f4',
    },

    // ─── Background / Surface ───
    surface: {
      page: '#f5f5fa',
      card: '#ffffff',
      border: '#f0f0f3',
    },

    // ─── Semanticas ───
    success: {
      DEFAULT: '#7ce7ac',
      fg: '#1a7a4a',
      bg: 'rgba(124,231,172,0.15)',
      border: '#7ce7ac',
    },
    warning: {
      DEFAULT: '#f4be5e',
      fg: '#7a5a1a',
      bg: 'rgba(244,190,94,0.15)',
      border: '#f4be5e',
    },
    error: {
      DEFAULT: '#ff808b',
      fg: '#cc2d3a',
      bg: 'rgba(255,128,139,0.15)',
      border: '#ff808b',
    },
    info: {
      DEFAULT: '#5e81f4',
      fg: '#5e81f4',
      bg: 'rgba(94,129,244,0.1)',
      border: 'rgba(94,129,244,0.3)',
    },

    // ─── Neutras ───
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  spacing: {
    px: '1px',
    0: '0px',
    0.5: '2px',
    1: '4px',
    1.5: '6px',
    2: '8px',
    2.5: '10px',
    3: '12px',
    3.5: '14px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    11: '44px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  layout: {
    sidebar: {
      expanded: '256px',
      collapsed: '64px',
    },
    topbar: {
      height: '64px',
    },
    content: {
      maxWidth: '1280px',
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
} as const;

// Type exports para uso em componentes
export type DesignTokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
export type SpacingToken = keyof typeof tokens.spacing;
