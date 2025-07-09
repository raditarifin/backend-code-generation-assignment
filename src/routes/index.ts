/**
 * Routes layer exports
 * Configures and exports Express routers for all API endpoints
 */

export { default as listRoutes } from './listRoutes';
export { default as taskRoutes } from './taskRoutes';
export { default as authRoutes } from './authRoutes';

// Export routers with their configured middleware
import listRoutes from './listRoutes';
import taskRoutes from './taskRoutes';
import authRoutes from './authRoutes';

export default {
  listRoutes,
  taskRoutes,
  authRoutes,
};
