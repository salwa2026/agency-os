import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        lime: {
          400: '#A3E635',
          300: '#b5f03d',
        },
        surface: {
          DEFAULT: '#141414',
          card: '#1E1E1E',
          elevated: '#252525',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      typography: {
        invert: {
          css: {
            '--tw-prose-body': '#d4d4d8',
            '--tw-prose-headings': '#ffffff',
            '--tw-prose-links': '#A3E635',
            '--tw-prose-bold': '#ffffff',
            '--tw-prose-counters': '#71717a',
            '--tw-prose-bullets': '#52525b',
            '--tw-prose-hr': '#3f3f46',
            '--tw-prose-quotes': '#d4d4d8',
            '--tw-prose-quote-borders': '#52525b',
            '--tw-prose-captions': '#71717a',
            '--tw-prose-code': '#A3E635',
            '--tw-prose-pre-code': '#d4d4d8',
            '--tw-prose-pre-bg': '#18181b',
            '--tw-prose-th-borders': '#3f3f46',
            '--tw-prose-td-borders': '#27272a',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
