/**
 * Weather Formatters
 * 天氣資料格式化工具
 */

/**
 * 格式化溫度
 */
export function formatTemperature(temp: number, unit = 'C'): string {
  return `${temp}°${unit}`;
}

/**
 * 格式化溫度範圍
 */
export function formatTemperatureRange(min: number, max: number, unit = 'C'): string {
  return `${min}-${max}°${unit}`;
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  });
}

/**
 * 格式化降雨機率
 */
export function formatRainProbability(prob: number): string {
  return `${prob}%`;
}

/**
 * 格式化施工適宜度等級
 */
export function formatSuitabilityLevel(level: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous'): string {
  const levelMap = {
    excellent: '優秀',
    good: '良好',
    fair: '尚可',
    poor: '不佳',
    dangerous: '危險'
  };
  return levelMap[level];
}

/**
 * 取得適宜度等級色彩
 */
export function getSuitabilityColor(level: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous'): string {
  const colorMap = {
    excellent: '#52c41a', // 綠色
    good: '#1890ff', // 藍色
    fair: '#faad14', // 橙色
    poor: '#f5222d', // 紅色
    dangerous: '#cf1322' // 暗紅
  };
  return colorMap[level];
}
