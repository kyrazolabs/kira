import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#07080a',
        surface: '#0d0d0d',
        'surface-elevated': '#101111',
        'surface-card': '#121212',
        'button-fg': '#18191a',
        hairline: '#242728',
        'hairline-soft': 'rgba(255,255,255,0.08)',
        'hairline-strong': 'rgba(255,255,255,0.16)',
        primary: '#ffffff',
        'primary-pressed': '#e8e8e8',
        'on-primary': '#000000',
        ink: '#f4f4f6',
        body: '#cdcdcd',
        charcoal: '#d3d3d4',
        mute: '#9c9c9d',
        ash: '#6a6b6c',
        stone: '#434345',
        'on-dark': '#ffffff',
        'on-dark-mute': 'rgba(255,255,255,0.72)',
        'accent-blue': '#57c1ff',
        'accent-blue-soft': 'rgba(87,193,255,0.15)',
        'accent-red': '#ff6161',
        'accent-red-soft': 'rgba(255,97,97,0.15)',
        'accent-green': '#59d499',
        'accent-green-soft': 'rgba(89,212,153,0.15)',
        'accent-yellow': '#ffc533',
        'accent-yellow-soft': 'rgba(255,197,51,0.15)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'display-xl': ['64px', { lineHeight: '1.1', fontWeight: '600' }],
        'display-lg': ['56px', { lineHeight: '1.17', fontWeight: '500' }],
        'heading-xl': ['24px', { lineHeight: '1.6', fontWeight: '500' }],
        'heading-lg': ['22px', { lineHeight: '1.15', fontWeight: '500' }],
        'heading-md': ['20px', { lineHeight: '1.4', fontWeight: '500' }],
        'heading-sm': ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-strong': ['16px', { lineHeight: '1.4', fontWeight: '500' }],
        'body-sm': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'caption-md': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        'caption-sm': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        'button-md': ['14px', { lineHeight: '1.6', fontWeight: '500' }]
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '16px',
        full: '9999px'
      },
      spacing: {
        xxs: '2px',
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        xxl: '32px',
        section: '96px'
      }
    }
  },
  plugins: []
} satisfies Config
