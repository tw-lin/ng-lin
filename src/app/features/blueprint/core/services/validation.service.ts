import { Injectable } from '@angular/core';

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: ValidationErrorDetail[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Field validator definition
 * 欄位驗證器定義
 */
export interface FieldValidator {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
  validator?: (value: unknown) => boolean;
}

/**
 * Validation schema definition
 * 驗證架構定義
 */
export type ValidationSchema = Record<string, FieldValidator[]>;

/**
 * Validation result
 * 驗證結果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationErrorDetail[];
}

/**
 * Simple validation service following Occam's Razor principle
 * 簡單的驗證服務，遵循奧卡姆剃刀原則
 */
@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  /**
   * Validate data against schema
   * 依據架構驗證資料
   */
  validate(data: unknown, schema: ValidationSchema): ValidationResult {
    const errors: ValidationErrorDetail[] = [];

    for (const [field, validators] of Object.entries(schema)) {
      const value = this.getFieldValue(data, field);

      for (const validator of validators) {
        const error = this.validateField(field, value, validator);
        if (error) {
          errors.push(error);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate single field
   * 驗證單一欄位
   */
  private validateField(field: string, value: unknown, validator: FieldValidator): ValidationErrorDetail | null {
    switch (validator.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          return { field, message: validator.message, value };
        }
        break;

      case 'minLength':
        if (typeof value === 'string' && value.length < (validator.value as number)) {
          return { field, message: validator.message, value };
        }
        break;

      case 'maxLength':
        if (typeof value === 'string' && value.length > (validator.value as number)) {
          return { field, message: validator.message, value };
        }
        break;

      case 'pattern':
        if (typeof value === 'string' && !(validator.value as RegExp).test(value)) {
          return { field, message: validator.message, value };
        }
        break;

      case 'custom':
        if (validator.validator && !validator.validator(value)) {
          return { field, message: validator.message, value };
        }
        break;
    }

    return null;
  }

  /**
   * Get field value from object using dot notation
   * 使用點記法從物件取得欄位值
   */
  private getFieldValue(data: unknown, field: string): unknown {
    if (!data || typeof data !== 'object') {
      return undefined;
    }

    const keys = field.split('.');
    let value: unknown = data;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Throw validation error if validation fails
   * 如果驗證失敗則擲出驗證錯誤
   */
  validateOrThrow(data: unknown, schema: ValidationSchema, fieldName = 'data'): void {
    const result = this.validate(data, schema);
    if (!result.valid) {
      throw new ValidationError(`Validation failed with ${result.errors.length} errors`, result.errors);
    }
  }
}
