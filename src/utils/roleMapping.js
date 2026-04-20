const roleMapping = {
  ADMIN: '系统管理员',
  MAINTAINER: '设施管理员',
  TEACHER: '教师',
  STUDENT: '学生',
  USER: '普通用户'
}

export const getRoleDisplayName = role => roleMapping[role] || '用户'

export const getRoleOptions = () =>
  Object.entries(roleMapping).map(([value, label]) => ({
    value,
    label
  }))

export default roleMapping
