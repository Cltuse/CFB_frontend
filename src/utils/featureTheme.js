const ROLE_THEMES = {
  admin: {
    primary: '#8fc6ea',
    secondary: '#cfe6f7',
    soft: 'rgba(143, 198, 234, 0.18)',
    glow: 'rgba(143, 198, 234, 0.22)',
    surface: '#f4f9fd',
    shellTop: '#f7fbfe',
    shellBottom: '#eef5fb'
  },
  maintainer: {
    primary: '#8fcf9b',
    secondary: '#d8f0de',
    soft: 'rgba(143, 207, 155, 0.18)',
    glow: 'rgba(143, 207, 155, 0.24)',
    surface: '#f4fbf5',
    shellTop: '#f8fcf8',
    shellBottom: '#edf7ef'
  },
  user: {
    primary: '#7fc8f8',
    secondary: '#d8eefc',
    soft: 'rgba(127, 200, 248, 0.18)',
    glow: 'rgba(127, 200, 248, 0.24)',
    surface: '#f4fbff',
    shellTop: '#f8fcff',
    shellBottom: '#edf7fd'
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
