import { TaskPriority, TaskStatus } from './enums';

/**
 * Data Transfer Object for List responses
 */
export interface ListDTO {
  id: string;
  name: string;
  description?: string;
  color?: string;
  tasks_count: number;
  created_at: string; // ISO string format for API responses
  updated_at: string; // ISO string format for API responses
}

/**
 * Data Transfer Object for Task responses
 */
export interface TaskDTO {
  id: string;
  list_id: string;
  title: string;
  description?: string;
  deadline?: string; // ISO string format for API responses
  priority: TaskPriority;
  status: TaskStatus;
  completed_at?: string; // ISO string format for API responses
  created_at: string; // ISO string format for API responses
  updated_at: string; // ISO string format for API responses
}

/**
 * Data Transfer Object for List with embedded tasks
 */
export interface ListWithTasksDTO extends ListDTO {
  tasks: TaskDTO[];
}

/**
 * Data Transfer Object for creating a new list
 */
export interface CreateListDTO {
  name: string;
  description?: string;
  color?: string;
}

/**
 * Data Transfer Object for updating a list
 */
export interface UpdateListDTO {
  name?: string;
  description?: string;
  color?: string;
}

/**
 * Data Transfer Object for creating a new task
 */
export interface CreateTaskDTO {
  list_id: string;
  title: string;
  description?: string;
  deadline?: string; // ISO string format
  priority?: TaskPriority;
}

/**
 * Data Transfer Object for updating a task
 */
export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  deadline?: string; // ISO string format
  priority?: TaskPriority;
  status?: TaskStatus;
  list_id?: string;
}

/**
 * Data Transfer Object for task completion
 */
export interface CompleteTaskDTO {
  completed: boolean;
}

/**
 * Data Transfer Object for query parameters
 */
export interface QueryParamsDTO {
  page?: string;
  limit?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

/**
 * Data Transfer Object for task query parameters
 */
export interface TaskQueryParamsDTO extends QueryParamsDTO {
  list_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline_from?: string;
  deadline_to?: string;
}

/**
 * Data Transfer Object for list query parameters
 */
export interface ListQueryParamsDTO extends QueryParamsDTO {
  // List-specific query parameters can be added here
}

/**
 * Helper function to convert Date to ISO string for DTOs
 */
export const dateToISOString = (date: Date | undefined): string | undefined => {
  return date ? date.toISOString() : undefined;
};

/**
 * Helper function to convert ISO string to Date for entities
 */
export const isoStringToDate = (isoString: string | undefined): Date | undefined => {
  return isoString ? new Date(isoString) : undefined;
};
