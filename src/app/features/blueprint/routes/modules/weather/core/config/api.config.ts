/**
 * CWA API Configuration
 * 中央氣象署 API 配置
 */

import { environment } from 'src/environments/environment';

export const CWA_API_CONFIG = {
  /** API Base URL */
  baseUrl: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore',

  /** API Authorization Key */
  apiKey: environment.CWA_API_KEY,

  /** HTTP 請求逾時時間 (毫秒) */
  timeout: 30000,

  /** 重試次數 */
  retryAttempts: 3,

  /** 資料集 ID */
  datasets: {
    /** 一般天氣預報-今明36小時天氣預報 */
    cityForecast: 'F-C0032-001',

    /** 地震報告-顯著有感地震報告 */
    earthquakeReport: 'E-A0016-001',

    /** 自動氣象站-氣象觀測資料 */
    weatherStation: 'O-A0001-001'
  }
} as const;
