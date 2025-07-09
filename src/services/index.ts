/**
 * Services layer exports
 * Provides business logic orchestration
 */

import { ListService, listService } from './listService';
import { TaskService, taskService } from './taskService';
import { AuthService, authService } from './authService';

export { ListService, listService } from './listService';
export { TaskService, taskService } from './taskService';
export { AuthService, authService } from './authService';

// Re-export default instances for convenience
export default {
  listService,
  taskService,
  authService,
};
