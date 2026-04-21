const extractLimitText = message => {
  const match = String(message).match(/[（(]([^（）()]+)[）)]/)
  return match ? match[1].trim() : ''
}

export const normalizeUserMessage = (message, fallback = '操作失败，请稍后重试。') => {
  if (typeof message !== 'string' || !message.trim()) {
    return fallback
  }

  const text = message.trim()

  if (/^Unauthorized$/i.test(text)) {
    return '登录状态已失效，请重新登录。'
  }

  if (/^Forbidden$/i.test(text)) {
    return '您没有权限执行当前操作。'
  }

  if (/^Reservation created successfully, pending admin approval$/i.test(text)) {
    return '预约申请已提交，待管理员审核。'
  }

  if (/^Reservation created successfully$/i.test(text)) {
    return '预约提交成功。'
  }

  if (/^Reservation approved$/i.test(text)) {
    return '预约审核已通过。'
  }

  if (/^Reservation not found$/i.test(text)) {
    return '未找到对应的预约记录。'
  }

  if (/^Current status does not allow approval$/i.test(text)) {
    return '当前预约状态不支持审核通过。'
  }

  if (/^Reservation creation failed:/i.test(text)) {
    return `预约提交失败：${text.replace(/^Reservation creation failed:\s*/i, '')}`
  }

  if (text.includes('预约次数已达上限') || text.includes('活跃预约数量已达上限')) {
    const limitText = extractLimitText(text)
    return `当前类别设施预约数已达上限${limitText ? `（${limitText}）` : ''}，无法进行预约。`
  }

  if (text.includes('该时间段已被预约') || text.includes('冲突')) {
    return '当前时段已被其他预约占用，请重新选择时间。'
  }

  if (text.includes('该时间段可用')) {
    return '当前时段可以预约。'
  }

  if (text.includes('不能预约过去的时间')) {
    return '开始时间不能早于当前时间，请重新选择。'
  }

  if (text.includes('结束时间不能早于开始时间')) {
    return '结束时间不能早于开始时间，请重新选择。'
  }

  if (text.includes('请先签到后再签退')) {
    return '请先完成签到，再进行签退。'
  }

  if (text.includes('还未到签到时间')) {
    return '当前还未到可签到时间，最多可提前15分钟签到。'
  }

  if (text.includes('预约时间已结束，无法签到')) {
    return '当前预约时段已结束，无法签到。'
  }

  if (text.includes('只有已通过的预约才能签到')) {
    return '只有审核通过的预约才能签到。'
  }

  if (text.includes('只有已通过的预约才能签退')) {
    return '只有审核通过的预约才能签退。'
  }

  if (text.includes('只有预约用户本人才能进行签到操作')) {
    return '仅限预约人本人执行签到。'
  }

  if (text.includes('只有预约用户本人才能进行签退操作')) {
    return '仅限预约人本人执行签退。'
  }

  if (text.includes('该用户已被列入黑名单')) {
    return '您当前已被限制预约，如有疑问请联系管理员。'
  }

  if (text.includes('单次预约时长不能超过24小时')) {
    return '单次预约时长不能超过24小时，请调整预约时段。'
  }

  if (text.includes('登录已失效，请重新登录')) {
    return '登录状态已失效，请重新登录。'
  }

  if (text.includes('无权限访问该资源')) {
    return '您没有权限访问该资源。'
  }

  if (text.includes('网络错误')) {
    return '网络连接异常，请稍后重试。'
  }

  if (text.includes('请求失败')) {
    return fallback
  }

  return text
    .replace(/: /g, '：')
    .replace(/!$/g, '。')
}

export const formatActionMessage = (prefix, message, fallback) => {
  const normalizedMessage = normalizeUserMessage(message, fallback)
  if (!prefix || normalizedMessage.startsWith(prefix)) {
    return normalizedMessage
  }

  return `${prefix}：${normalizedMessage}`
}
