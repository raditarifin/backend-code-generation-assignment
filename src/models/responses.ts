import { ApiResponseCode } from './enums';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

/**
 * API error structure
 */
export interface ApiError {
  code: ApiResponseCode;
  message: string;
  details?: Record<string, any>;
  field?: string;
  value?: any;
}

/**
 * Response metadata for pagination and additional info
 */
export interface ResponseMeta {
  total?: number;
  page?: number;
  limit?: number;
  total_pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
  timestamp?: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Success response helper
 */
export const createSuccessResponse = <T>(data: T, meta?: ResponseMeta): ApiResponse<T> => {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
};

/**
 * Error response helper
 */
export const createErrorResponse = (
  code: ApiResponseCode,
  message: string,
  details?: Record<string, any>,
  field?: string,
  value?: any
): ApiResponse => {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(field && { field }),
      ...(value !== undefined && { value }),
    },
  };
};

/**
 * Validation error response helper
 */
export const createValidationErrorResponse = (
  message: string,
  errors: ValidationError[]
): ApiResponse => {
  return {
    success: false,
    error: {
      code: ApiResponseCode.VALIDATION_ERROR,
      message,
      details: {
        validation_errors: errors,
      },
    },
  };
};

/**
 * Paginated response helper
 */
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): ApiResponse<T[]> => {
  const total_pages = Math.ceil(total / limit);
  const has_next = page < total_pages;
  const has_prev = page > 1;

  return {
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      total_pages,
      has_next,
      has_prev,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * General API response helper with code
 */
export const createApiResponse = <T>(
  code: ApiResponseCode,
  message: string,
  data: T,
  meta?: ResponseMeta
): ApiResponse<T> => {
  const isSuccess = code === ApiResponseCode.SUCCESS || code === ApiResponseCode.CREATED;
  
  if (isSuccess) {
    return {
      success: true,
      data,
      ...(meta && { meta }),
    };
  } else {
    return {
      success: false,
      error: {
        code,
        message,
      },
    };
  }
};
