import Joi from 'joi';
import { TaskPriority, TaskStatus } from './enums';

/**
 * UUID validation schema
 */
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' }).required();

/**
 * Optional UUID validation schema
 */
const optionalUuidSchema = Joi.string().uuid({ version: 'uuidv4' }).optional();

/**
 * Date validation schema
 */
const dateSchema = Joi.date().iso().optional();

/**
 * Future date validation schema
 */
const futureDateSchema = Joi.date().iso().min('now').optional();

/**
 * List creation validation schema
 */
export const createListSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'List name is required',
    'string.min': 'List name must be at least 1 character long',
    'string.max': 'List name cannot exceed 255 characters',
    'any.required': 'List name is required',
  }),
  description: Joi.string().trim().max(1000).optional().allow('').messages({
    'string.max': 'Description cannot exceed 1000 characters',
  }),
  color: Joi.string().trim().pattern(/^#[0-9A-F]{6}$/i).optional().messages({
    'string.pattern.base': 'Color must be a valid hex color (e.g., #FF0000)',
  }),
});

/**
 * List update validation schema
 */
export const updateListSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional().messages({
    'string.empty': 'List name cannot be empty',
    'string.min': 'List name must be at least 1 character long',
    'string.max': 'List name cannot exceed 255 characters',
  }),
  description: Joi.string().trim().max(1000).optional().allow('').messages({
    'string.max': 'Description cannot exceed 1000 characters',
  }),
  color: Joi.string().trim().pattern(/^#[0-9A-F]{6}$/i).optional().messages({
    'string.pattern.base': 'Color must be a valid hex color (e.g., #FF0000)',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Task creation validation schema
 */
export const createTaskSchema = Joi.object({
  list_id: uuidSchema.messages({
    'string.guid': 'Invalid list ID format',
    'any.required': 'List ID is required',
  }),
  title: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Task title is required',
    'string.min': 'Task title must be at least 1 character long',
    'string.max': 'Task title cannot exceed 255 characters',
    'any.required': 'Task title is required',
  }),
  description: Joi.string().trim().max(2000).optional().allow('').messages({
    'string.max': 'Description cannot exceed 2000 characters',
  }),
  deadline: futureDateSchema.messages({
    'date.base': 'Deadline must be a valid date',
    'date.format': 'Deadline must be in ISO format',
    'date.min': 'Deadline must be in the future',
  }),
  priority: Joi.string().valid(...Object.values(TaskPriority)).optional().default(TaskPriority.MEDIUM).messages({
    'any.only': `Priority must be one of: ${Object.values(TaskPriority).join(', ')}`,
  }),
});

/**
 * Task update validation schema
 */
export const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).optional().messages({
    'string.empty': 'Task title cannot be empty',
    'string.min': 'Task title must be at least 1 character long',
    'string.max': 'Task title cannot exceed 255 characters',
  }),
  description: Joi.string().trim().max(2000).optional().allow('').messages({
    'string.max': 'Description cannot exceed 2000 characters',
  }),
  deadline: dateSchema.messages({
    'date.base': 'Deadline must be a valid date',
    'date.format': 'Deadline must be in ISO format',
  }),
  priority: Joi.string().valid(...Object.values(TaskPriority)).optional().messages({
    'any.only': `Priority must be one of: ${Object.values(TaskPriority).join(', ')}`,
  }),
  status: Joi.string().valid(...Object.values(TaskStatus)).optional().messages({
    'any.only': `Status must be one of: ${Object.values(TaskStatus).join(', ')}`,
  }),
  list_id: optionalUuidSchema.messages({
    'string.guid': 'Invalid list ID format',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Task completion validation schema
 */
export const completeTaskSchema = Joi.object({
  completed: Joi.boolean().required().messages({
    'any.required': 'Completed status is required',
    'boolean.base': 'Completed must be a boolean value',
  }),
});

/**
 * UUID parameter validation schema
 */
export const uuidParamSchema = Joi.object({
  id: uuidSchema.messages({
    'string.guid': 'Invalid ID format',
    'any.required': 'ID is required',
  }),
});

/**
 * Pagination validation schema
 */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
});

/**
 * Task filter validation schema
 */
export const taskFilterSchema = Joi.object({
  list_id: optionalUuidSchema.messages({
    'string.guid': 'Invalid list ID format',
  }),
  status: Joi.string().valid(...Object.values(TaskStatus)).optional().messages({
    'any.only': `Status must be one of: ${Object.values(TaskStatus).join(', ')}`,
  }),
  priority: Joi.string().valid(...Object.values(TaskPriority)).optional().messages({
    'any.only': `Priority must be one of: ${Object.values(TaskPriority).join(', ')}`,
  }),
  deadline_from: dateSchema.messages({
    'date.base': 'Deadline from must be a valid date',
    'date.format': 'Deadline from must be in ISO format',
  }),
  deadline_to: dateSchema.messages({
    'date.base': 'Deadline to must be a valid date',
    'date.format': 'Deadline to must be in ISO format',
  }),
  search: Joi.string().trim().min(1).max(100).optional().messages({
    'string.min': 'Search term must be at least 1 character long',
    'string.max': 'Search term cannot exceed 100 characters',
  }),
});

/**
 * List filter validation schema
 */
export const listFilterSchema = Joi.object({
  search: Joi.string().trim().min(1).max(100).optional().messages({
    'string.min': 'Search term must be at least 1 character long',
    'string.max': 'Search term cannot exceed 100 characters',
  }),
});
