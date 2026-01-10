/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // EXACT Orbit app colors
        background: {
          DEFAULT: '#1a0f2e',      // Main app background (Orbit exact)
          elevated: '#251934',     // Card backgrounds (Orbit exact)
          surface: '#2a1f3d',      // Raised elements (Orbit exact)
          nav: '#1f1429'           // Bottom nav bar (Orbit exact)
        },
        surface: {
          DEFAULT: '#251934',      // Cards (Orbit exact)
          elevated: '#2a1f3d'      // Elevated cards (Orbit exact)
        },
        accent: {
          DEFAULT: '#7c4dd4',      // PRIMARY CTA - Bright Purple (Orbit exact!) ⭐
          hover: '#9366e8',        // Lighter purple on hover
          orange: '#fe9f39',       // Orange (orb gradient only)
          pink: '#ff2c7b',         // Pink (orb gradient only)
          coral: '#ff6a52'         // Coral (destructive actions)
        },
        text: {
          primary: '#FFFFFF',      // White headings/prices (Orbit exact)
          secondary: '#9b8fb5',    // Light purple-gray labels (Orbit exact)
          tertiary: '#6b5a8e'      // Dark purple-gray section headers (Orbit exact)
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',  // Subtle borders (Orbit exact)
          subtle: 'rgba(255, 255, 255, 0.04)',
          highlight: 'rgba(124, 77, 212, 0.3)'   // Purple highlight
        },
        semantic: {
          success: '#7c4dd4',      // Purple for success (Orbit style)
          error: '#ff6a52',        // Coral for errors (Orbit exact)
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
        'glow': '0 0 20px rgba(124, 77, 212, 0.4)',        // Purple glow (Orbit)
        'glow-orange': '0 0 24px rgba(254, 159, 57, 0.5)', // Orange glow
        'glow-pink': '0 0 24px rgba(255, 44, 123, 0.5)',   // Pink glow
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.4)'
      },
      backgroundImage: {
        'gradient-orb': 'linear-gradient(135deg, #fe9f39 0%, #ff2c7b 50%, #ff6a52 100%)',
        'gradient-purple': 'linear-gradient(135deg, #7c4dd4 0%, #9366e8 100%)',
        'gradient-dark': 'linear-gradient(180deg, #1a0f2e 0%, #251934 100%)',  // Orbit backgrounds
        'gradient-card': 'linear-gradient(135deg, rgba(124, 77, 212, 0.1) 0%, rgba(124, 77, 212, 0.05) 100%)'
      }
    },
  },
  plugins: [],
}
