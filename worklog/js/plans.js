/**
 * 排休计划结算。
 *
 * 只把「日期已经过去」的 planned 记录转为 rest：
 * - 今天及未来继续保持 planned；
 * - 转换后保留 date / dayTypeOverride / note；
 * - 只更新 status / days / updatedAt。
 *
 * 纯函数，不依赖 DOM / localStorage，方便在 Node、QuickJS 和浏览器中测试。
 *
 * @param {Record<string, object>} days
 * @param {string} today YYYY-MM-DD
 * @param {number} [now]
 * @returns {string[]} 被转换的日期，按日期升序
 */
export function settleDuePlans(days, today, now = Date.now()) {
  if (!days || typeof days !== 'object' || !today) return []

  const changed = []
  for (const [date, rec] of Object.entries(days)) {
    if (!rec || rec.status !== 'planned' || date >= today) continue
    rec.status = 'rest'
    rec.days = Number(rec.days) || 1
    rec.updatedAt = now
    changed.push(date)
  }
  return changed.sort()
}
