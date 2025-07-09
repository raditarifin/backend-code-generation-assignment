import Joi from 'joi';
import { validate } from './validation';
import {
  createListSchema,
  updateListSchema,
  createTaskSchema,
  updateTaskSchema,
  completeTaskSchema,
  paginationSchema,
  listFilterSchema,
  taskFilterSchema,
} from '../models/validation';

/**
 * Authentication schemas
 */
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one letter and one number',
      'any.required': 'Password is required',
    }),
  first_name: Joi.string().min(1).max(50).optional().messages({
    'string.min': 'First name cannot be empty',
    'string.max': 'First name cannot exceed 50 characters',
  }),
  last_name: Joi.string().min(1).max(50).optional().messages({
    'string.min': 'Last name cannot be empty',
    'string.max': 'Last name cannot exceed 50 characters',
  }),
  role: Joi.string().valid('admin', 'user').default('user').messages({
    'any.only': 'Role must be either admin or user',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

/**
 * Common parameter schemas
 */
const uuidParamSchema = Joi.object({
  id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.uuid': 'ID must be a valid UUID',
    'any.required': 'ID is required',
  }),
});

const priorityParamSchema = Joi.object({
  priority: Joi.string().valid('low', 'medium', 'high').required().messages({
    'any.only': 'Priority must be one of: low, medium, high',
    'any.required': 'Priority is required',
  }),
});

/**
 * Common query schemas
 */
const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
  sort_field: Joi.string().valid(
    'created_at', 'updated_at', 'name', 'title', 'deadline', 'priority'
  ).optional().messages({
    'any.only': 'Sort field must be one of: created_at, updated_at, name, title, deadline, priority',
  }),
  sort_order: Joi.string().valid('asc', 'desc').default('asc').messages({
    'any.only': 'Sort order must be either asc or desc',
  }),
});

const listQuerySchema = paginationQuerySchema.keys({
  search: Joi.string().trim().max(255).optional().messages({
    'string.max': 'Search term cannot exceed 255 characters',
  }),
});

const taskQuerySchema = paginationQuerySchema.keys({
  list_id: Joi.string().uuid({ version: 'uuidv4' }).optional().messages({
    'string.uuid': 'List ID must be a valid UUID',
  }),
  status: Joi.string().valid('pending', 'completed').optional().messages({
    'any.only': 'Status must be either pending or completed',
  }),
  priority: Joi.string().valid('low', 'medium', 'high').optional().messages({
    'any.only': 'Priority must be one of: low, medium, high',
  }),
  search: Joi.string().trim().max(255).optional().messages({
    'string.max': 'Search term cannot exceed 255 characters',
  }),
  deadline_from: Joi.date().iso().optional().messages({
    'date.format': 'Deadline from must be a valid ISO date',
  }),
  deadline_to: Joi.date().iso().optional().messages({
    'date.format': 'Deadline to must be a valid ISO date',
  }),
  include_null_deadlines: Joi.boolean().optional().messages({
    'boolean.base': 'Include null deadlines must be a boolean',
  }),
});

const listTasksQuerySchema = taskQuerySchema.keys({
  // Inherit all task query parameters
});

/**
 * Bulk operations schema
 */
const bulkUpdateTasksSchema = Joi.object({
  taskIds: Joi.array().items(
    Joi.string().uuid({ version: 'uuidv4' }).required()
  ).min(1).max(50).required().messages({
    'array.min': 'At least one task ID is required',
    'array.max': 'Cannot update more than 50 tasks at once',
    'any.required': 'Task IDs are required',
  }),
  status: Joi.string().valid('pending', 'completed').required().messages({
    'any.only': 'Status must be either pending or completed',
    'any.required': 'Status is required',
  }),
});

/**
 * Validation middleware configurations
 */

// Authentication validation middlewares
export const validateRegister = validate({
  body: registerSchema,
});

export const validateLogin = validate({
  body: loginSchema,
});

// List validation middlewares
export const validateCreateList = validate({
  body: createListSchema,
});

export const validateUpdateList = validate({
  body: updateListSchema,
  params: uuidParamSchema,
});

export const validateListParams = validate({
  params: uuidParamSchema,
});

export const validateListQuery = validate({
  query: listQuerySchema,
});

export const validateListTasksQuery = validate({
  params: uuidParamSchema,
  query: listTasksQuerySchema,
});

// Task validation middlewares
export const validateCreateTask = validate({
  body: createTaskSchema,
});

export const validateUpdateTask = validate({
  body: updateTaskSchema,
  params: uuidParamSchema,
});

export const validateTaskParams = validate({
  params: uuidParamSchema,
});

export const validateTaskQuery = validate({
  query: taskQuerySchema,
});

export const validateTasksByPriorityParams = validate({
  params: priorityParamSchema,
  query: taskQuerySchema,
});

export const validateBulkUpdateTasks = validate({
  body: bulkUpdateTasksSchema,
});

// Specialized task query validations
export const validateTasksDueThisWeekQuery = validate({
  query: taskQuerySchema.fork(['deadline_from', 'deadline_to'], (schema) => 
    schema.forbidden().messages({
      'any.unknown': 'Deadline filters are not allowed for this endpoint',
    })
  ),
});

export const validateTasksByDeadlineQuery = validate({
  query: taskQuerySchema,
});

export const validateOverdueTasksQuery = validate({
  query: taskQuerySchema.fork(['status', 'deadline_to'], (schema) => 
    schema.forbidden().messages({
      'any.unknown': 'Status and deadline_to filters are automatically applied for overdue tasks',
    })
  ),
});

/**
 * Custom validation helpers
 */

/**
 * Validate date range
 */
export const validateDateRange = (req: any, res: any, next: any): void => {
  const { deadline_from, deadline_to } = req.query;
  
  if (deadline_from && deadline_to) {
    const fromDate = new Date(deadline_from);
    const toDate = new Date(deadline_to);
    
    if (fromDate >= toDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'deadline_from must be before deadline_to',
          details: {
            validation_errors: [{
              field: 'query.deadline_from',
              message: 'Must be before deadline_to',
              value: deadline_from,
            }],
          },
        },
      });
    }
  }
  
  next();
};

/**
 * Validate that user owns the resource
 */
export const validateResourceOwnership = (req: any, res: any, next: any): void => {
  // This would be implemented when user management is added
  // For now, just pass through
  next();
};

export default {
  // Authentication validations
  validateRegister,
  validateLogin,
  
  // List validations
  validateCreateList,
  validateUpdateList,
  validateListParams,
  validateListQuery,
  validateListTasksQuery,
  
  // Task validations
  validateCreateTask,
  validateUpdateTask,
  validateTaskParams,
  validateTaskQuery,
  validateTasksByPriorityParams,
  validateBulkUpdateTasks,
  
  // Specialized validations
  validateTasksDueThisWeekQuery,
  validateTasksByDeadlineQuery,
  validateOverdueTasksQuery,
  
  // Custom helpers
  validateDateRange,
  validateResourceOwnership,
};
