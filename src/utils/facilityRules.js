const normalizeText = (value) => String(value || '').trim().toLowerCase();

export function findApplicableRuleConfig(ruleConfigs = [], categoryName = '') {
  if (!Array.isArray(ruleConfigs) || !ruleConfigs.length) {
    return null;
  }

  const normalizedCategory = normalizeText(categoryName);
  const exactMatch = ruleConfigs.find((item) => (
    item?.categoryId != null && normalizeText(item.categoryName) === normalizedCategory
  ));

  if (exactMatch) {
    return exactMatch;
  }

  return ruleConfigs.find((item) => item?.categoryId == null) || null;
}

export function formatRuleTime(value) {
  if (!value) {
    return '--:--';
  }

  const text = String(value);
  return text.length >= 5 ? text.slice(0, 5) : text;
}

export function formatMinutes(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return '-';
  }

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;

  if (!hours) {
    return `${minutes} 分钟`;
  }

  if (!remain) {
    return `${hours} 小时`;
  }

  return `${hours} 小时 ${remain} 分钟`;
}
