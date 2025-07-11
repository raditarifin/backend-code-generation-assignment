import swaggerJSDoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

/**
 * Swagger configuration for OpenAPI documentation
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'TODO List Management API',
    version: '1.0.0',
    description: `
      A comprehensive RESTful API for task and list management with JWT authentication.
      
      ## Features
      - 🔐 JWT Authentication with user registration and login
      - 📋 Complete CRUD operations for Lists
      - ✅ Full task management with priorities and deadlines
      - 🔍 Advanced filtering, sorting, and search capabilities
      - ⚡ In-memory storage for lightning-fast operations
      - 🛡️ Security features including rate limiting and input validation
      
      ## Authentication
      Most endpoints require authentication. Use the login endpoint to get a JWT token,
      then include it in the Authorization header: \`Bearer <token>\`
      
      ## Test Accounts
      - **Admin**: admin@todoapi.com / admin123
      - **User**: user@todoapi.com / user123
    `,
    contact: {
      name: 'API Support',
      email: 'support@todoapi.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3002',
      description: 'Development server'
    },
    {
      url: 'https://api.todoapp.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from login endpoint'
      }
    },
    schemas: {
      // Error Response Schema
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR'
              },
              message: {
                type: 'string',
                example: 'Validation failed'
              },
              details: {
                type: 'object',
                additionalProperties: true
              }
            }
          }
        }
      },
      
      // Success Response Schema
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            additionalProperties: true
          },
          meta: {
            type: 'object',
            properties: {
              timestamp: {
                type: 'string',
                format: 'date-time'
              },
              total: {
                type: 'number',
                example: 10
              },
              page: {
                type: 'number',
                example: 1
              },
              limit: {
                type: 'number',
                example: 10
              },
              total_pages: {
                type: 'number',
                example: 1
              },
              has_next: {
                type: 'boolean',
                example: false
              },
              has_prev: {
                type: 'boolean',
                example: false
              }
            }
          }
        }
      },
      
      // User Schemas
      UserProfile: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          role: {
            type: 'string',
            enum: ['admin', 'user'],
            example: 'user'
          },
          first_name: {
            type: 'string',
            example: 'John'
          },
          last_name: {
            type: 'string',
            example: 'Doe'
          },
          is_active: {
            type: 'boolean',
            example: true
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          },
          updated_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      
      RegisterInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            minLength: 8,
            pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{8,}$',
            example: 'password123',
            description: 'Password must be at least 8 characters with at least one letter and one number'
          },
          first_name: {
            type: 'string',
            example: 'John'
          },
          last_name: {
            type: 'string',
            example: 'Doe'
          },
          role: {
            type: 'string',
            enum: ['admin', 'user'],
            default: 'user'
          }
        }
      },
      
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            example: 'password123'
          }
        }
      },
      
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/UserProfile'
          },
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          expires_in: {
            type: 'number',
            example: 86400,
            description: 'Token expiration time in seconds'
          }
        }
      },
      
      // List Schemas
      List: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          name: {
            type: 'string',
            example: 'Work Tasks'
          },
          description: {
            type: 'string',
            example: 'Tasks related to work projects'
          },
          color: {
            type: 'string',
            example: '#3498db'
          },
          tasks_count: {
            type: 'number',
            example: 5
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          },
          updated_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      
      CreateListInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            example: 'Work Tasks'
          },
          description: {
            type: 'string',
            example: 'Tasks related to work projects'
          },
          color: {
            type: 'string',
            example: '#3498db'
          }
        }
      },
      
      UpdateListInput: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Updated Work Tasks'
          },
          description: {
            type: 'string',
            example: 'Updated description'
          },
          color: {
            type: 'string',
            example: '#e74c3c'
          }
        }
      },
      
      // Task Schemas
      Task: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          list_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          title: {
            type: 'string',
            example: 'Complete API Documentation'
          },
          description: {
            type: 'string',
            example: 'Write comprehensive API documentation with examples'
          },
          deadline: {
            type: 'string',
            format: 'date-time',
            example: '2025-07-15T23:59:59.000Z'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            example: 'high'
          },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            example: 'pending'
          },
          completed_at: {
            type: 'string',
            format: 'date-time',
            nullable: true
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          },
          updated_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      
      CreateTaskInput: {
        type: 'object',
        required: ['list_id', 'title'],
        properties: {
          list_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          title: {
            type: 'string',
            example: 'Complete API Documentation'
          },
          description: {
            type: 'string',
            example: 'Write comprehensive API documentation with examples'
          },
          deadline: {
            type: 'string',
            format: 'date-time',
            example: '2025-07-15T23:59:59.000Z'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            default: 'medium'
          }
        }
      },
      
      UpdateTaskInput: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            example: 'Updated Task Title'
          },
          description: {
            type: 'string',
            example: 'Updated task description'
          },
          deadline: {
            type: 'string',
            format: 'date-time',
            example: '2025-07-20T23:59:59.000Z'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high']
          },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'cancelled']
          },
          list_id: {
            type: 'string',
            format: 'uuid',
            description: 'Move task to different list'
          }
        }
      }
    },
    
    // Common parameters
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1
        },
        description: 'Page number for pagination'
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10
        },
        description: 'Number of items per page'
      },
      SortFieldParam: {
        name: 'sort_field',
        in: 'query',
        schema: {
          type: 'string',
          enum: ['created_at', 'updated_at', 'name', 'title', 'deadline', 'priority']
        },
        description: 'Field to sort by'
      },
      SortOrderParam: {
        name: 'sort_order',
        in: 'query',
        schema: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'desc'
        },
        description: 'Sort order'
      },
      SearchParam: {
        name: 'search',
        in: 'query',
        schema: {
          type: 'string'
        },
        description: 'Search term for filtering'
      },
      UuidParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'uuid'
        },
        description: 'UUID of the resource'
      }
    },
    
    // Common responses
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Access token is required'
              }
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions to access this resource'
              }
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Resource not found'
              }
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: {
                  validation_errors: [
                    {
                      field: 'email',
                      message: 'Please provide a valid email address',
                      value: 'invalid-email'
                    }
                  ]
                }
              }
            }
          }
        }
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later'
              }
            }
          }
        }
      }
    }
  },
  
  security: [
    {
      bearerAuth: []
    }
  ],
  
  tags: [
    {
      name: 'Health',
      description: 'API health and information endpoints'
    },
    {
      name: 'Authentication',
      description: 'User authentication and authorization'
    },
    {
      name: 'Lists',
      description: 'List management operations'
    },
    {
      name: 'Tasks',
      description: 'Task management operations'
    }
  ]
};

const options: Options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
