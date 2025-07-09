/**
 * Priority levels for tasks
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Status of tasks
 */
export enum TaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

/**
 * API response status codes
 */
export enum ApiResponseCode {
  SUCCESS = 'SUCCESS',
  CREATED = 'CREATED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
}

/**
 * Sort order for queries
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Sort fields for tasks
 */
export enum TaskSortField {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  DEADLINE = 'deadline',
  PRIORITY = 'priority',
  TITLE = 'title',
}

/**
 * Sort fields for lists
 */
export enum ListSortField {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  NAME = 'name',
}
