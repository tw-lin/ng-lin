/**
 * CWA API Response Models
 * 中央氣象署 API 回應模型
 */

/** CWA API 標準回應結構 */
export interface CwaApiResponse {
  success: string;
  result?: {
    resource_id: string;
    fields: Array<{ id: string; type: string }>;
  };
  records: CwaRecords;
}

/** CWA 記錄結構 */
export interface CwaRecords {
  datasetDescription?: string;
  location: CwaLocation[];
}

/** CWA 地點資料 */
export interface CwaLocation {
  locationName: string;
  geocode?: string;
  lat?: string;
  lon?: string;
  weatherElement: CwaWeatherElement[];
}

/** CWA 氣象要素 */
export interface CwaWeatherElement {
  elementName: string;
  description?: string;
  time: CwaTimeData[];
}

/** CWA 時間資料 */
export interface CwaTimeData {
  startTime: string;
  endTime: string;
  parameter: CwaParameter;
}

/** CWA 參數 */
export interface CwaParameter {
  parameterName: string;
  parameterValue?: string;
  parameterUnit?: string;
}
