/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Orbit-inspired dark theme colors
        background: {
          DEFAULT: '#100a1e',      // Deep navy-purple
          elevated: '#1b1626',     // Card backgrounds
          surface: '#2a1f3d'       // Raised elements
        },
        surface: {
          DEFAULT: '#1b1626',      // Cards
          elevated: '#2a1f3d'      // Elevated cards
        },
        accent: {
          DEFAULT: '#643ab1',      // Purple (primary CTA)
          hover: '#7c4dd4',        // Lighter purple on hover
          orange: '#fe9f39',       // Secondary accent
          pink: '#ff2c7b',         // Tertiary accent
          coral: '#ff6a52'         // Quaternary accent
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#a696c8',    // Muted purple
          tertiary: '#6b5a8e'      // Darker purple
        },
        border: {
          DEFAULT: 'rgba(100, 58, 177, 0.15)',
          subtle: 'rgba(100, 58, 177, 0.10)',
          highlight: 'rgba(254, 159, 57, 0.25)'
        },
        semantic: {
          success: '#10b981',      // Green for success
          error: '#ff6a52',        // Coral for errors
          warning: '#fe9f39'       // Orange for warnings
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
        'glow': '0 0 20px rgba(100, 58, 177, 0.4)',         // Purple glow
        'glow-orange': '0 0 24px rgba(254, 159, 57, 0.5)', // Orange glow
        'glow-pink': '0 0 24px rgba(255, 44, 123, 0.5)',   // Pink glow
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.4)'
      },
      backgroundImage: {
        'gradient-orb': 'linear-gradient(135deg, #fe9f39 0%, #ff2c7b 50%, #ff6a52 100%)',
        'gradient-purple': 'linear-gradient(135deg, #643ab1 0%, #7c4dd4 100%)',
        'gradient-dark': 'linear-gradient(180deg, #100a1e 0%, #1b1626 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(100, 58, 177, 0.1) 0%, rgba(254, 159, 57, 0.05) 100%)'
      }
    },
  },
  plugins: [],
}
