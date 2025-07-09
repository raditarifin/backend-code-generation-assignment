# Task Management API Architecture

## Overview

This document outlines the architecture for the Task Management API, providing a comprehensive view of the system design, components, and their interactions.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Load Balancer │    │   API Gateway   │
│  (Web, Mobile)  │────│   (Optional)    │────│   (Optional)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                              ┌─────────────────────────┘
                              │
                    ┌─────────────────┐
                    │   Express.js    │
                    │  Application    │
                    │     Server      │
                    │   (In-Memory    │
                    │    Storage)     │
                    └─────────────────┘
```

## Application Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │   Routes    │ │ Middleware  │ │   Controllers       │ │
│  │             │ │             │ │                     │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                    Business Logic Layer                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │   Services  │ │ Validators  │ │   Business Rules    │ │
│  │             │ │             │ │                     │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                    Data Access Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │   Models    │ │ Repositories│ │   In-Memory Store   │ │
│  │             │ │             │ │   (Arrays/Maps)     │ │
│  │             │ │             │ │                     │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                    Data Storage Layer                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │  In-Memory  │ │   JSON File │ │   Local Storage     │ │
│  │   Arrays    │ │  (Optional) │ │   (Development)     │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
api/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── listController.ts
│   │   └── taskController.ts
│   ├── services/            # Business logic
│   │   ├── listService.ts
│   │   └── taskService.ts
│   ├── models/              # Data models
│   │   ├── List.ts
│   │   ├── Task.ts
│   │   └── types.ts
│   ├── repositories/        # Data access layer
│   │   ├── listRepository.ts
│   │   └── taskRepository.ts
│   ├── storage/             # In-memory storage
│   │   ├── memoryStore.ts
│   │   └── fileStore.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── routes/              # API routes
│   │   ├── listRoutes.ts
│   │   └── taskRoutes.ts
│   ├── validators/          # Input validation
│   │   ├── listValidator.ts
│   │   └── taskValidator.ts
│   ├── utils/               # Utility functions
│   │   ├── logger.ts
│   │   └── idGenerator.ts
│   └── app.ts               # Application entry point
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                    # Documentation
├── config/                  # Configuration files
└── package.json
```

## Component Architecture

### Controllers
- **Responsibility**: Handle HTTP requests and responses
- **Dependencies**: Services, Validators
- **Pattern**: Thin controllers that delegate to services

### Services
- **Responsibility**: Business logic implementation
- **Dependencies**: Repositories, Models
- **Pattern**: Service layer pattern for business operations

### Repositories
- **Responsibility**: Data access abstraction
- **Dependencies**: In-memory storage, Data models
- **Pattern**: Repository pattern for data operations

### Models
- **Responsibility**: Data structure definitions
- **Dependencies**: TypeScript interfaces
- **Pattern**: Data Transfer Objects (DTOs) and interfaces

## Data Flow

### Request Flow
1. **Client Request** → API endpoint
2. **Route Handler** → Controller method
3. **Controller** → Input validation
4. **Controller** → Service method
5. **Service** → Business logic processing
6. **Service** → Repository method
7. **Repository** → In-memory storage operation
8. **Storage** → Data retrieval/manipulation from arrays/maps
9. **Repository** → Data transformation
10. **Service** → Business rule application
11. **Controller** → Response formatting
12. **Client** → Response delivery

### Error Flow
1. **Error occurs** at any layer
2. **Error propagation** through layers
3. **Error handling middleware** catches errors
4. **Error formatting** and logging
5. **Client response** with appropriate error

## Data Storage Design

### In-Memory Storage Structure

```typescript
// In-memory storage interface
interface MemoryStore {
  lists: Map<string, List>;
  tasks: Map<string, Task>;
  
  // Helper methods
  getAllLists(): List[];
  getListById(id: string): List | undefined;
  getAllTasks(): Task[];
  getTaskById(id: string): Task | undefined;
  getTasksByListId(listId: string): Task[];
  
  // CRUD operations
  createList(list: List): void;
  updateList(id: string, updates: Partial<List>): boolean;
  deleteList(id: string): boolean;
  
  createTask(task: Task): void;
  updateTask(id: string, updates: Partial<Task>): boolean;
  deleteTask(id: string): boolean;
}
```

### Data Relationships

```
┌─────────────────┐         ┌─────────────────┐
│      Lists      │         │     Tasks       │
│   (In-Memory)   │         │   (In-Memory)   │
├─────────────────┤         ├─────────────────┤
│ id (UUID) PK    │────────┐│ id (UUID) PK    │
│ name (string)   │        ││ list_id (UUID)  │
│ description     │        ││ title (string)  │
│ color           │        ││ description     │
│ created_at      │        ││ deadline        │
│ updated_at      │        ││ priority        │
│                 │        ││ status          │
│                 │        ││ created_at      │
│                 │        ││ updated_at      │
│                 │        ││ completed_at    │
└─────────────────┘        │└─────────────────┘
                           │
                           └─── Reference (list_id → Lists.id)
```

### Storage Optimization

```typescript
// Indexed storage for better performance
interface IndexedMemoryStore {
  // Primary storage
  lists: Map<string, List>;
  tasks: Map<string, Task>;
  
  // Indexes for faster queries
  tasksByListId: Map<string, string[]>;
  tasksByStatus: Map<TaskStatus, string[]>;
  tasksByPriority: Map<TaskPriority, string[]>;
  tasksByDeadline: Map<string, string[]>; // grouped by date
}
```

## API Design Patterns

### RESTful Design
- Resource-based URLs
- HTTP methods for operations
- Consistent response formats
- Proper status codes

### Request/Response Patterns
```typescript
// Request Pattern
interface ApiRequest {
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  headers: Record<string, string>;
}

// Response Pattern
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}
```

## Security Architecture

### Authentication & Authorization
- **JWT Token-based authentication**
- **Role-based access control (RBAC)**
- **Request rate limiting**
- **Input validation and sanitization**

### Security Layers
1. **Transport Layer**: HTTPS encryption
2. **API Gateway**: Request filtering
3. **Authentication**: JWT validation
4. **Authorization**: Permission checking
5. **Input Validation**: Data sanitization
6. **Storage**: Memory-safe operations

## Performance Considerations

### Caching Strategy
- **In-memory storage** is inherently cached
- **Response caching** for computed results
- **CDN** for static assets

### Storage Optimization
- **Indexed maps** for faster lookups
- **Memory-efficient data structures**
- **Garbage collection optimization**
- **Optional persistence** to JSON files

### API Optimization
- **Pagination** for large datasets
- **Field selection** (sparse fieldsets)
- **Compression** (gzip)
- **Rate limiting**

## Scalability Strategy

### Horizontal Scaling
- **Load balancing** across multiple instances
- **Session persistence** (sticky sessions or external storage)
- **Microservices architecture** (future)
- **Container orchestration**

### Vertical Scaling
- **Resource optimization**
- **Memory tuning**
- **Code optimization**
- **Memory management**

### Data Persistence (Optional)
- **JSON file exports**
- **Periodic backups**
- **Data import/export features**
- **External database migration path**

## Monitoring & Observability

### Logging Strategy
- **Structured logging** (JSON format)
- **Log levels** (error, warn, info, debug)
- **Request/response logging**
- **Performance metrics**

### Monitoring Tools
- **Application Performance Monitoring (APM)**
- **Memory usage monitoring**
- **Infrastructure monitoring**
- **Error tracking**

## Deployment Architecture

### Development Environment
```
Developer Machine
├── Node.js Runtime
├── In-Memory Storage
├── Optional JSON Files
└── Development Server
```

### Production Environment
```
Production Infrastructure
├── Load Balancer
├── Application Servers (Multiple instances)
├── Shared Storage (if needed)
├── Monitoring Stack
└── Backup System (optional)
```

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Storage**: In-Memory (Maps/Arrays)
- **Persistence**: JSON Files (optional)
- **Validation**: Joi/Zod

### Development Tools
- **Package Manager**: npm/yarn
- **Build Tool**: Vite
- **Testing**: Jest
- **Linting**: ESLint
- **Formatting**: Prettier

### DevOps
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus/Grafana

## Future Architecture Considerations

### Microservices Migration
- **Service decomposition**
- **API gateway pattern**
- **Service mesh**
- **Event-driven architecture**

### Advanced Features
- **Real-time updates** (WebSockets)
- **Message queuing** (RabbitMQ/Kafka)
- **Search optimization** (In-memory indexing)
- **File storage** (Local files/AWS S3/Azure Blob)
- **Data persistence** (Database migration path)
- **Clustering** (Multiple Node.js instances)

---

**Document Version**: 1.0  
**Created**: July 9, 2025  
**Status**: Draft  
**Next Review**: TBD
