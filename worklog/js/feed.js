const TYPES = new Set(['statutory', 'rest', 'makeup'])

export async function fetchHolidayFeed(url) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const data = await res.json()
  if (!data || !Array.isArray(data.holidays)) throw new Error('格式不正确：缺少 holidays 数组')
  const holidays = data.holidays
    .filter((h) => h && typeof h.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(h.date))
    .filter((h) => TYPES.has(h.type))
    .map((h) => ({
      date: h.date,
      name: String(h.name || '节假日').slice(0, 20),
      type: h.type,
      source: 'remote',
    }))
  if (holidays.length === 0) throw new Error('没有可用的节假日数据')
  return {
    version: String(data.version || 'remote'),
    fetchedAt: Date.now(),
    holidays,
  }
}
