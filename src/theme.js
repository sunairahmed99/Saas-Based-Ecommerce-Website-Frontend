// Unified Theme Constants for the entire application
export const theme = {
  // Background Colors
  background: {
    primary: 'linear-gradient(128deg, #1e2027 0%, #334466 100%)',
    secondary: 'rgba(255, 255, 255, 0.1)',
    card: 'rgba(255, 255, 255, 0.1)',
    cardHover: 'rgba(255, 255, 255, 0.15)',
    input: '#f8fafd',
    inputDark: 'rgba(255, 255, 255, 0.1)',
  },

  // Text Colors
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.8)',
    muted: 'rgba(255, 255, 255, 0.6)',
    accent: '#ffd043',
    accentAlt: '#fbbf24',
    dark: '#333333',
  },

  // Button Colors
  button: {
    primary: 'linear-gradient(135deg, #f97316, #facc15)',
    primaryHover: 'linear-gradient(135deg, #ea580c, #eab308)',
    secondary: 'transparent',
    secondaryBorder: '#ffd043',
    secondaryText: '#ffd043',
    disabled: 'rgba(255, 255, 255, 0.3)',
  },

  // Accent Colors
  accent: {
    primary: '#ffd043',
    secondary: '#fbbf24',
    tertiary: '#f97316',
    cyan: '#00eaff',
  },

  // Border Radius
  radius: {
    small: '6px',
    medium: '8px',
    large: '10px',
    xlarge: '12px',
    xxlarge: '16px',
    round: '999px',
  },

  // Shadows
  shadow: {
    small: '0 2px 8px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 15px rgba(0, 0, 0, 0.2)',
    large: '0 8px 25px rgba(249, 115, 22, 0.3)',
    button: '0 4px 15px rgba(249, 115, 22, 0.3)',
    buttonHover: '0 6px 20px rgba(249, 115, 22, 0.4)',
  },

  // Transitions
  transition: {
    fast: '0.15s',
    normal: '0.2s',
    slow: '0.3s',
  },

  // Button Styles
  buttonStyles: {
    primary: {
      padding: '0.7rem 1.5rem',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, #f97316, #facc15)',
      color: '#1e293b',
      fontWeight: '700',
      fontSize: '0.98rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
    },
    primaryHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)',
    },
    secondary: {
      padding: '0.7rem 1.5rem',
      borderRadius: '10px',
      background: 'transparent',
      color: '#ffd043',
      fontWeight: '600',
      fontSize: '0.95rem',
      border: '1px solid #ffd043',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    },
    secondaryHover: {
      background: 'rgba(255, 208, 67, 0.1)',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 15px rgba(255, 208, 67, 0.3)',
    },
  },
};

