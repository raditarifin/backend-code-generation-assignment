import { Request, Response, NextFunction } from 'express';
import { 
  CreateListInput, 
  UpdateListInput, 
  ListFilterParams, 
  SortParams,
  ApiResponseCode
} from '../models';
import { listService } from '../services';
import { logger } from '../utils/logger';
import { 
  createApiResponse,
  createValidationErrorResponse,
  ValidationError
} from '../models/responses';

/**
 * Controller for List-related HTTP endpoints
 * Handles request/response cycle and delegates business logic to services
 */
export class ListController {
  /**
   * GET /api/lists
   * Get all lists with optional filtering, sorting, and pagination
   */
  async getAllLists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract query parameters
      const {
        search,
        sort_field,
        sort_order,
        page = '1',
        limit = '10'
      } = req.query;

      // Parse pagination
      const pageNum = parseInt(String(page), 10);
      const limitNum = parseInt(String(limit), 10);

      // Validate pagination parameters
      if (isNaN(pageNum) || pageNum < 1) {
        const response = createValidationErrorResponse('Invalid page parameter', [
          { field: 'page', message: 'Page must be a positive integer' }
        ]);
        res.status(400).json(response);
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        const response = createValidationErrorResponse('Invalid limit parameter', [
          { field: 'limit', message: 'Limit must be between 1 and 100' }
        ]);
        res.status(400).json(response);
        return;
      }

      // Build filter parameters
      const filters: ListFilterParams = {};
      if (search) filters.search = String(search);

      // Build sort parameters
      let sort: SortParams | undefined;
      if (sort_field) {
        sort = {
          field: String(sort_field) as any,
          order: (sort_order === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
        };
      }

      // Get lists from service
      const result = await listService.getAllLists(filters, sort, pageNum, limitNum);

      // Create successful response
      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        'Lists retrieved successfully',
        {
          lists: result.lists,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev
          }
        }
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lists/:id
   * Get a specific list by ID
   */
  async getListById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response = createValidationErrorResponse('Invalid list ID', [
          { field: 'id', message: 'List ID is required' }
        ]);
        res.status(400).json(response);
        return;
      }
      
      const list = await listService.getListById(id);

      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        'List retrieved successfully',
        { list }
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/lists
   * Create a new list
   */
  async createList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: CreateListInput = req.body;
      const list = await listService.createList(input);

      const response = createApiResponse(
        ApiResponseCode.CREATED,
        'List created successfully',
        { list }
      );

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/lists/:id
   * Update an existing list
   */
  async updateList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response = createValidationErrorResponse('Invalid list ID', [
          { field: 'id', message: 'List ID is required' }
        ]);
        res.status(400).json(response);
        return;
      }
      
      const input: UpdateListInput = req.body;
      const list = await listService.updateList(id, input);

      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        'List updated successfully',
        { list }
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/lists/:id
   * Delete a list
   */
  async deleteList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response = createValidationErrorResponse('Invalid list ID', [
          { field: 'id', message: 'List ID is required' }
        ]);
        res.status(400).json(response);
        return;
      }
      
      await listService.deleteList(id);

      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        'List deleted successfully',
        null
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lists/:id/tasks
   * Get all tasks for a specific list
   */
  async getListTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response = createValidationErrorResponse('Invalid list ID', [
          { field: 'id', message: 'List ID is required' }
        ]);
        res.status(400).json(response);
        return;
      }
      
      const {
        status,
        priority,
        deadline_from,
        deadline_to,
        sort_field,
        sort_order,
        page = '1',
        limit = '10'
      } = req.query;

      // Parse pagination
      const pageNum = parseInt(String(page), 10);
      const limitNum = parseInt(String(limit), 10);

      // Validate pagination parameters
      if (isNaN(pageNum) || pageNum < 1) {
        const response = createValidationErrorResponse('Invalid page parameter', [
          { field: 'page', message: 'Page must be a positive integer' }
        ]);
        res.status(400).json(response);
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        const response = createValidationErrorResponse('Invalid limit parameter', [
          { field: 'limit', message: 'Limit must be between 1 and 100' }
        ]);
        res.status(400).json(response);
        return;
      }

      // Build sort parameters
      let sort: SortParams | undefined;
      if (sort_field) {
        sort = {
          field: String(sort_field) as any,
          order: (sort_order === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
        };
      }

      // Get tasks for list through service
      const result = await listService.getListWithTasks(
        id,
        {
          status: status ? String(status) as any : undefined,
          priority: priority ? String(priority) as any : undefined,
          deadline_from: deadline_from ? new Date(String(deadline_from)) : undefined,
          deadline_to: deadline_to ? new Date(String(deadline_to)) : undefined,
        },
        sort,
        pageNum,
        limitNum
      );

      // Create successful response
      const response = createApiResponse(
        ApiResponseCode.SUCCESS,
        'List tasks retrieved successfully',
        {
          tasks: result.tasks,
          list: result.list,
          pagination: {
            page: result.tasksPagination.page,
            limit: result.tasksPagination.limit,
            total: result.tasksPagination.total,
            totalPages: result.tasksPagination.totalPages,
            hasNext: result.tasksPagination.hasNext,
            hasPrev: result.tasksPagination.hasPrev
          }
        }
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

// Create and export singleton instance
export const listController = new ListController();

export default listController;
