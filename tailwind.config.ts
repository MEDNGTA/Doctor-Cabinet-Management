import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
          accent: '#ec4899',
        },
      },
      spacing: {
        sidebar: '16rem',
      },
    },
  },
  plugins: [],
};
export default config;
