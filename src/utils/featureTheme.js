const FEATURE_THEMES = {
  overview: {
    key: 'overview',
    kicker: '运营总览',
    title: '数据总览',
    description: '统一查看核心趋势、任务负载和关键提醒，保持日常管理节奏一致。',
    badge: '总览模块',
    primary: '#5bb7b0',
    secondary: '#8fd8d2',
    soft: 'rgba(143, 216, 210, 0.18)',
    glow: 'rgba(91, 183, 176, 0.18)'
  },
  facility: {
    key: 'facility',
    kicker: '设施运营',
    title: '设施管理',
    description: '围绕场地、分类和可用状态进行统一管理，保持信息层级清晰稳定。',
    badge: '设施模块',
    primary: '#69b6c4',
    secondary: '#9dd7df',
    soft: 'rgba(157, 215, 223, 0.18)',
    glow: 'rgba(105, 182, 196, 0.18)'
  },
  reservation: {
    key: 'reservation',
    kicker: '预约流程',
    title: '预约处理',
    description: '覆盖申请、审批和履约状态，便于快速识别高峰、异常与资源分配情况。',
    badge: '预约模块',
    primary: '#78adff',
    secondary: '#b5d0ff',
    soft: 'rgba(181, 208, 255, 0.18)',
    glow: 'rgba(120, 173, 255, 0.18)'
  },
  maintenance: {
    key: 'maintenance',
    kicker: '维护流程',
    title: '维护登记',
    description: '统一维护任务的创建、编辑与跟踪，让现场处理链路更顺畅、信息更集中。',
    badge: '维护模块',
    primary: '#8c97d8',
    secondary: '#c1c9f2',
    soft: 'rgba(193, 201, 242, 0.18)',
    glow: 'rgba(140, 151, 216, 0.18)'
  },
  violation: {
    key: 'violation',
    kicker: '纪律管理',
    title: '违规记录',
    description: '管理违规与黑名单信息，帮助快速识别风险并保持后续治理节奏。',
    badge: '纪律模块',
    primary: '#b07ac6',
    secondary: '#d7b1e7',
    soft: 'rgba(215, 177, 231, 0.18)',
    glow: 'rgba(176, 122, 198, 0.18)'
  },
  notice: {
    key: 'notice',
    kicker: '通知中心',
    title: '系统通知',
    description: '统一发布与查看系统通知，保证消息传递及时、清晰并具备可追踪性。',
    badge: '通知模块',
    primary: '#4f98ba',
    secondary: '#9fd3e7',
    soft: 'rgba(159, 211, 231, 0.18)',
    glow: 'rgba(79, 152, 186, 0.18)'
  },
  feedback: {
    key: 'feedback',
    kicker: '反馈处理',
    title: '意见反馈',
    description: '集中处理建议和问题反馈，减少信息散落，提升响应效率与体验。',
    badge: '反馈模块',
    primary: '#df8f73',
    secondary: '#f2bfac',
    soft: 'rgba(242, 191, 172, 0.18)',
    glow: 'rgba(223, 143, 115, 0.18)'
  },
  profile: {
    key: 'profile',
    kicker: '个人中心',
    title: '账户信息',
    description: '管理个人资料与安全设置，保持账户状态稳定可控。',
    badge: '个人模块',
    primary: '#7cc8ad',
    secondary: '#b9e6d1',
    soft: 'rgba(185, 230, 209, 0.18)',
    glow: 'rgba(124, 200, 173, 0.18)'
  },
  user: {
    key: 'user',
    kicker: '账号治理',
    title: '用户管理',
    description: '统一管理用户、角色与状态，提升权限治理的透明度和一致性。',
    badge: '用户模块',
    primary: '#8897d8',
    secondary: '#c0c8f1',
    soft: 'rgba(192, 200, 241, 0.18)',
    glow: 'rgba(136, 151, 216, 0.18)'
  },
  policy: {
    key: 'policy',
    kicker: '规则配置',
    title: '策略管理',
    description: '维护业务规则与阈值配置，保证流程执行口径一致。',
    badge: '规则模块',
    primary: '#f0b36f',
    secondary: '#f6d09f',
    soft: 'rgba(246, 208, 159, 0.18)',
    glow: 'rgba(240, 179, 111, 0.18)'
  },
  logs: {
    key: 'logs',
    kicker: '审计追踪',
    title: '操作日志',
    description: '记录关键操作历史，便于审计追溯、问题定位与责任确认。',
    badge: '日志模块',
    primary: '#7b92a8',
    secondary: '#b8c8d7',
    soft: 'rgba(184, 200, 215, 0.18)',
    glow: 'rgba(123, 146, 168, 0.18)'
  },
  default: {
    key: 'default',
    kicker: '系统工作区',
    title: '管理控制台',
    description: '以统一布局承载各项功能，减少切换成本与视觉负担。',
    badge: '通用模块',
    primary: '#5bb7b0',
    secondary: '#8fd8d2',
    soft: 'rgba(143, 216, 210, 0.18)',
    glow: 'rgba(91, 183, 176, 0.18)'
  }
}

const ROUTE_RULES = [
  { pattern: /\/dashboard$/, key: 'overview' },
  { pattern: /\/welcome$/, key: 'overview' },
  { pattern: /\/facility-category$/, key: 'facility' },
  { pattern: /\/facility(?:\/|$)/, key: 'facility' },
  { pattern: /\/my-reservation$/, key: 'reservation' },
  { pattern: /\/reservation$/, key: 'reservation' },
  { pattern: /\/maintenance$/, key: 'maintenance' },
  { pattern: /\/violation-records$/, key: 'violation' },
  { pattern: /\/violation-report$/, key: 'violation' },
  { pattern: /\/blacklist$/, key: 'violation' },
  { pattern: /\/feedback$/, key: 'feedback' },
  { pattern: /\/notice$/, key: 'notice' },
  { pattern: /\/profile$/, key: 'profile' },
  { pattern: /\/rule-config$/, key: 'policy' },
  { pattern: /\/operation-log$/, key: 'logs' },
  { pattern: /\/user$/, key: 'user' }
]

export function resolveFeatureTheme(path) {
  const normalized = (path || '').split('?')[0]
  const matched = ROUTE_RULES.find((rule) => rule.pattern.test(normalized))
  const key = matched?.key || 'default'
  return FEATURE_THEMES[key] || FEATURE_THEMES.default
}

export function buildFeatureVars(theme) {
  return {
    '--feature-primary': theme.primary,
    '--feature-secondary': theme.secondary,
    '--feature-soft': theme.soft,
    '--feature-glow': theme.glow
  }
}
