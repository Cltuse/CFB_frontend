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
    primary: '#8fc6ea',
    secondary: '#cfe6f7',
    soft: 'rgba(143, 198, 234, 0.18)',
    glow: 'rgba(143, 198, 234, 0.22)',
    surface: '#f4f9fd',
    shellTop: '#f7fbfe',
    shellBottom: '#eef5fb'
  },
  user: {
    primary: '#f5b7c0',
    secondary: '#fce4e8',
    soft: 'rgba(245, 183, 192, 0.18)',
    glow: 'rgba(245, 183, 192, 0.22)',
    surface: '#fef8f9',
    shellTop: '#fffafb',
    shellBottom: '#fdf0f3'
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
