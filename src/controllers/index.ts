/**
 * Controllers layer exports
 * Handles HTTP request/response cycle
 */

export { ListController, listController } from './listController';
export { TaskController, taskController } from './taskController';
export { AuthController, authController } from './authController';

// Re-export default instances for convenience
import { listController } from './listController';
import { taskController } from './taskController';
import { authController } from './authController';

export default {
  listController,
  taskController,
  authController,
};
