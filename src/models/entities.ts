import { TaskPriority, TaskStatus } from './enums';

/**
 * Base interface for entities with common fields
 */
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * User entity interface
 */
export interface User extends BaseEntity {
  email: string;
  password: string; // This will be hashed
  role: 'admin' | 'user';
  first_name?: string;
  last_name?: string;
  is_active: boolean;
}

/**
 * User creation input
 */
export interface CreateUserInput {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'user';
}

/**
 * User login input
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * User public profile (without sensitive data)
 */
export interface UserProfile {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  user: UserProfile;
  token: string;
  expires_in: number;
}

/**
 * List entity interface
 */
export interface List extends BaseEntity {
  name: string;
  description?: string;
  color?: string;
  tasks_count: number;
}

/**
 * Task entity interface
 */
export interface Task extends BaseEntity {
  list_id: string;
  title: string;
  description?: string;
  deadline?: Date;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at?: Date;
}

/**
 * List with embedded tasks (for API responses)
 */
export interface ListWithTasks extends List {
  tasks: Task[];
}

/**
 * Task creation input (without auto-generated fields)
 */
export interface CreateTaskInput {
  list_id: string;
  title: string;
  description?: string;
  deadline?: Date;
  priority?: TaskPriority;
}

/**
 * Task update input (partial fields)
 */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  deadline?: Date;
  priority?: TaskPriority;
  status?: TaskStatus;
  list_id?: string;
}

/**
 * List creation input
 */
export interface CreateListInput {
  name: string;
  description?: string;
  color?: string;
}

/**
 * List update input (partial fields)
 */
export interface UpdateListInput {
  name?: string;
  description?: string;
  color?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Filter parameters for tasks
 */
export interface TaskFilterParams {
  list_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline_from?: Date;
  deadline_to?: Date;
  search?: string;
}

/**
 * Filter parameters for lists
 */
export interface ListFilterParams {
  search?: string;
}
