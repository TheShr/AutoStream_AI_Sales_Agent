import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 24px 64px rgba(15, 23, 42, 0.12)',
      },
      colors: {
        surface: '#101827',
      },
    },
  },
  plugins: [],
};

export default config;
