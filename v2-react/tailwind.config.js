/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MagicPatterns dark theme colors
        background: {
          DEFAULT: '#0A0A0B',
          elevated: '#121214'
        },
        surface: {
          DEFAULT: '#1A1A1D',
          elevated: '#1F1F23'
        },
        accent: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB'
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1AA',
          tertiary: '#71717A'
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          highlight: 'rgba(255, 255, 255, 0.12)'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      spacing: {
        // Safe area inset support
        'safe': 'var(--safe-bottom)'
      },
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.4)',
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.4)'
      }
    },
  },
  plugins: [],
}
