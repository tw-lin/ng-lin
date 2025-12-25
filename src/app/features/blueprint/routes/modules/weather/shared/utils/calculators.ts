/**
 * Construction Suitability Calculators
 * 施工適宜度計算工具
 */

import type { WeatherForecast, ConstructionSuitability } from '../../core/models';

/**
 * 計算施工適宜度
 */
export function calculateConstructionSuitability(forecast: WeatherForecast): ConstructionSuitability {
  let score = 100;
  const factors: ConstructionSuitability['factors'] = {
    rainfall: { value: 0, impact: 0, description: '' },
    temperature: { value: 0, impact: 0, description: '' },
    wind: { value: 0, impact: 0, description: '' },
    weather: { value: '', impact: 0, description: '' }
  };
  const recommendations: string[] = [];
  const warnings: string[] = [];

  // 1. 降雨機率評估
  const rainProb = forecast.rainProbability;
  factors.rainfall.value = rainProb;

  if (rainProb > 70) {
    factors.rainfall.impact = -40;
    factors.rainfall.description = '高降雨機率';
    score += factors.rainfall.impact;
    warnings.push('降雨機率極高，不建議進行室外施工');
  } else if (rainProb > 50) {
    factors.rainfall.impact = -25;
    factors.rainfall.description = '中等降雨機率';
    score += factors.rainfall.impact;
    warnings.push('降雨機率偏高，建議準備防雨措施');
  } else if (rainProb > 30) {
    factors.rainfall.impact = -10;
    factors.rainfall.description = '低降雨機率';
    score += factors.rainfall.impact;
    recommendations.push('可進行施工，但建議密切注意天氣變化');
  } else {
    factors.rainfall.description = '降雨機率低';
    recommendations.push('天氣穩定，適合室外施工');
  }

  // 2. 溫度評估
  const avgTemp = (forecast.temperature.min + forecast.temperature.max) / 2;
  factors.temperature.value = avgTemp;

  if (avgTemp > 35) {
    factors.temperature.impact = -20;
    factors.temperature.description = '高溫環境';
    score += factors.temperature.impact;
    warnings.push('高溫環境，注意工作人員防暑降溫');
    recommendations.push('避開中午時段施工，增加休息時間');
  } else if (avgTemp < 10) {
    factors.temperature.impact = -15;
    factors.temperature.description = '低溫環境';
    score += factors.temperature.impact;
    warnings.push('低溫環境，注意材料性能變化');
    recommendations.push('使用適合低溫的施工材料');
  } else if (avgTemp >= 20 && avgTemp <= 28) {
    factors.temperature.description = '舒適溫度';
    recommendations.push('溫度適宜，工作效率佳');
  } else {
    factors.temperature.description = '一般溫度';
  }

  // 3. 風速評估 (若有資料)
  if (forecast.windSpeed !== undefined) {
    factors.wind.value = forecast.windSpeed;

    if (forecast.windSpeed > 10) {
      factors.wind.impact = -30;
      factors.wind.description = '強風環境';
      score += factors.wind.impact;
      warnings.push('風速過高，停止高處作業');
    } else if (forecast.windSpeed > 6) {
      factors.wind.impact = -15;
      factors.wind.description = '中等風速';
      score += factors.wind.impact;
      warnings.push('風速較大，注意高處作業安全');
    } else {
      factors.wind.description = '風速適中';
    }
  }

  // 4. 天氣現象評估
  factors.weather.value = forecast.weatherDescription;

  if (forecast.weatherDescription.includes('雨') || forecast.weatherDescription.includes('雷')) {
    factors.weather.impact = -20;
    factors.weather.description = '不利天氣';
    score += factors.weather.impact;
    warnings.push('天氣不佳，建議延後施工');
  } else if (forecast.weatherDescription.includes('陰')) {
    factors.weather.impact = -5;
    factors.weather.description = '陰天';
    score += factors.weather.impact;
  } else if (forecast.weatherDescription.includes('晴')) {
    factors.weather.description = '晴朗';
    recommendations.push('天氣良好，適合施工');
  } else {
    factors.weather.description = '多雲';
  }

  // 確保分數在 0-100 範圍內
  score = Math.max(0, Math.min(100, score));

  // 決定適宜度等級
  let level: ConstructionSuitability['level'];
  if (score >= 90) {
    level = 'excellent';
  } else if (score >= 70) {
    level = 'good';
  } else if (score >= 50) {
    level = 'fair';
  } else if (score >= 30) {
    level = 'poor';
  } else {
    level = 'dangerous';
  }

  return {
    score,
    level,
    factors,
    recommendations,
    warnings
  };
}
