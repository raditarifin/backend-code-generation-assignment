// Re-export repository classes and instances
export { ListRepository, listRepository } from './listRepository';
export { TaskRepository, taskRepository } from './taskRepository';
export { UserRepository, userRepository } from './userRepository';

// Import instances for default export
import { listRepository } from './listRepository';
import { taskRepository } from './taskRepository';
import { userRepository } from './userRepository';

// Export default instances for easy importing
export default {
  listRepository,
  taskRepository,
  userRepository,
};
