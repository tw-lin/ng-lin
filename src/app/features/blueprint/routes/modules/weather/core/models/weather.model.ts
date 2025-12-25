/**
 * Weather Data Models
 * 天氣資料模型
 */

/** 天氣預報資料 */
export interface WeatherForecast {
  /** 地點名稱 */
  locationName: string;

  /** 開始時間 (ISO 8601) */
  startTime: string;

  /** 結束時間 (ISO 8601) */
  endTime: string;

  /** 天氣描述 */
  weatherDescription: string;

  /** 天氣現象代碼 */
  weatherCode?: string;

  /** 溫度資訊 */
  temperature: {
    min: number;
    max: number;
    unit?: string;
  };

  /** 降雨機率 (%) */
  rainProbability: number;

  /** 相對濕度 (%) */
  humidity?: number;

  /** 風速 (m/s) */
  windSpeed?: number;
}

/** 地震資訊 */
export interface EarthquakeInfo {
  /** 地震編號 */
  earthquakeNo: string;

  /** 發震時間 (ISO 8601) */
  originTime: string;

  /** 震央位置描述 */
  epicenterLocation: string;

  /** 芮氏規模 */
  magnitude: number;

  /** 地震深度 (km) */
  depth: number;

  /** 報告內容 */
  reportContent?: string;
}

/** 施工適宜度評估 */
export interface ConstructionSuitability {
  /** 評估分數 (0-100) */
  score: number;

  /** 適宜度等級 */
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous';

  /** 評估因素 */
  factors: {
    rainfall: { value: number; impact: number; description: string };
    temperature: { value: number; impact: number; description: string };
    wind: { value: number; impact: number; description: string };
    weather: { value: string; impact: number; description: string };
  };

  /** 建議 */
  recommendations: string[];

  /** 警告 */
  warnings: string[];
}
