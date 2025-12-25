import { ValidationSchema } from './validation.service';

/**
 * Blueprint validation schemas
 * 藍圖驗證架構
 */

/**
 * Blueprint creation validation schema
 * 藍圖建立驗證架構
 */
export const BlueprintCreateSchema: ValidationSchema = {
  name: [
    { type: 'required', message: '名稱為必填' },
    { type: 'minLength', value: 3, message: '名稱至少需要 3 個字元' },
    { type: 'maxLength', value: 100, message: '名稱不能超過 100 個字元' }
  ],
  slug: [
    { type: 'required', message: 'Slug 為必填' },
    {
      type: 'pattern',
      value: /^[a-z0-9-]+$/,
      message: 'Slug 只能包含小寫字母、數字和連字符'
    }
  ],
  description: [{ type: 'maxLength', value: 500, message: '描述不能超過 500 個字元' }],
  ownerId: [{ type: 'required', message: '擁有者 ID 為必填' }],
  ownerType: [
    { type: 'required', message: '擁有者類型為必填' },
    {
      type: 'custom',
      message: '擁有者類型必須為 user 或 organization',
      validator: value => value === 'user' || value === 'organization'
    }
  ],
  createdBy: [{ type: 'required', message: '建立者 ID 為必填' }]
};

/**
 * Blueprint update validation schema
 * 藍圖更新驗證架構
 */
export const BlueprintUpdateSchema: ValidationSchema = {
  name: [
    { type: 'minLength', value: 3, message: '名稱至少需要 3 個字元' },
    { type: 'maxLength', value: 100, message: '名稱不能超過 100 個字元' }
  ],
  slug: [
    {
      type: 'pattern',
      value: /^[a-z0-9-]+$/,
      message: 'Slug 只能包含小寫字母、數字和連字符'
    }
  ],
  description: [{ type: 'maxLength', value: 500, message: '描述不能超過 500 個字元' }]
};
