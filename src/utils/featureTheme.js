const ROLE_THEMES = {
  admin: {
    primary: '#5f8fbd',
    secondary: '#c9dced',
    soft: 'rgba(95, 143, 189, 0.18)',
    glow: 'rgba(95, 143, 189, 0.26)',
    surface: '#f2f7fc',
    shellTop: '#f6f9fd',
    shellBottom: '#e8f0f8'
  },
  maintainer: {
    primary: '#5f9f73',
    secondary: '#c9e2cf',
    soft: 'rgba(95, 159, 115, 0.18)',
    glow: 'rgba(95, 159, 115, 0.26)',
    surface: '#f2f8f3',
    shellTop: '#f6fbf7',
    shellBottom: '#e8f3eb'
  },
  user: {
    primary: '#d9cbb8',
    secondary: '#f2ece3',
    soft: 'rgba(217, 203, 184, 0.2)',
    glow: 'rgba(217, 203, 184, 0.24)',
    surface: '#faf7f2',
    shellTop: '#fdfbf8',
    shellBottom: '#f4efe8'
  }
}

export function getRoleTheme(role) {
  const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : ''
  const roleKey = {
    administrator: 'admin',
    admin: 'admin',
    maintainer: 'maintainer',
    teacher: 'user',
    student: 'user',
    user: 'user'
  }[normalizedRole] || normalizedRole

  return ROLE_THEMES[roleKey] || ROLE_THEMES.user
}

export function buildFeatureVars(theme) {
  return {
    '--feature-primary': theme.primary,
    '--feature-secondary': theme.secondary,
    '--feature-soft': theme.soft,
    '--feature-glow': theme.glow,
    '--feature-surface': theme.surface,
    '--layout-shell-top': theme.shellTop,
    '--layout-shell-bottom': theme.shellBottom
  }
}
