# 🚀 TODO List Management API

A comprehensive RESTful API for task and list management with JWT authentication, built with Express.js and TypeScript. Features in-memory storage for lightning-fast operations and includes a complete Postman collection for easy integration.

## ✨ Features

- **🔐 JWT Authentication**: Secure user registration, login, and token-based auth
- **📋 Lists Management**: Create, read, update, delete todo lists
- **✅ Tasks Management**: Full CRUD operations for tasks with priorities and deadlines
- **🔍 Advanced Filtering**: Search, sort, and filter by multiple criteria
- **⚡ In-Memory Storage**: Lightning-fast operations with JavaScript Maps
- **🛡️ Security First**: Rate limiting, CORS, security headers, input validation
- **📝 TypeScript**: Full type safety and enhanced developer experience
- **🧪 Testing Ready**: Jest testing framework with comprehensive coverage
- **📚 Postman Collection**: Complete API documentation and examples
- **🎯 Developer Friendly**: Clear error messages, detailed logging, hot reload

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ 
- **npm** or yarn package manager

### 1. Installation
```bash
# Clone the repository
git clone <repository-url>
cd task-management-api

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### 2. Start Development Server
```bash
# Start with hot reload
npm run dev

# Or build and run production
npm run build
npm start
```

**🌐 API Base URL**: `http://localhost:3002`

### 3. Verify Installation
```bash
# Health check
curl http://localhost:3002/health

# API information
curl http://localhost:3002/api
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## 📚 API Documentation

### 🌐 Base URL
```
http://localhost:3002/api/v1
```

### 🔐 Authentication Flow

#### 1. Register New User
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "user"
}
```

#### 2. Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 3. Use Bearer Token
```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### 🔑 Default Test Accounts
```javascript
// Admin Account
email: "admin@todoapi.com"
password: "admin123"

// User Account  
email: "user@todoapi.com"
password: "user123"
```

### 📋 Core API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout

#### Lists Management
- `GET /lists` - Get all lists (with pagination, search, filters)
- `POST /lists` - Create new list
- `GET /lists/:id` - Get specific list
- `PUT /lists/:id` - Update list
- `DELETE /lists/:id` - Delete list and all tasks
- `GET /lists/:id/tasks` - Get all tasks in a list

#### Tasks Management
- `GET /tasks` - Get all tasks (with pagination, search, filters)
- `POST /tasks` - Create new task
- `GET /tasks/:id` - Get specific task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `PATCH /tasks/:id/complete` - Mark task as completed
- `GET /tasks/priority/:priority` - Get tasks by priority

#### Health & Info
- `GET /health` - API health status
- `GET /api` - API information and available endpoints

### 🔍 Query Parameters

#### Pagination
```bash
?page=1&limit=10
```

#### Sorting
```bash
?sort_field=created_at&sort_order=desc
```

#### Filtering Tasks
```bash
?status=pending&priority=high&deadline_from=2025-07-01&deadline_to=2025-07-31
```

#### Search
```bash
?search=documentation
```

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run lint` | Run ESLint code analysis |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format code with Prettier |

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server Configuration
NODE_ENV=development
PORT=3002
API_VERSION=v1

# CORS Configuration  
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-characters
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
MUTATION_RATE_LIMIT_MAX_REQUESTS=10

# Logging
LOG_LEVEL=info
```

## 📦 Postman Collection

### Quick Import
1. **Import Collection**: `postman/todo-collection.json`
2. **Import Environment**: `postman/todo-environment.json`
3. **Select Environment**: Choose "TODO API Environment"
4. **Start Testing**: Run "Login User" → "Create New List" → "Create New Task"

### Collection Features
- 🔐 **Auto-Authentication**: Tokens automatically saved and used
- 📁 **Organized Folders**: Grouped by functionality (Auth, Lists, Tasks)
- 🎯 **Real Examples**: Practical request/response examples
- ❌ **Error Scenarios**: Common error cases and handling
- 🔍 **Search & Filter**: Advanced query examples
- 📊 **Test Scripts**: Automatic variable extraction

[**📖 Detailed Postman Guide**](./postman/README.md)

## 🏗️ Project Structure

```
📁 todo-api/
├── 📁 src/
│   ├── 📁 controllers/          # HTTP request handlers
│   ├── 📁 services/             # Business logic layer  
│   ├── 📁 repositories/         # Data access layer
│   ├── 📁 models/               # TypeScript interfaces & types
│   ├── 📁 middleware/           # Express middleware (auth, validation, etc.)
│   ├── 📁 routes/               # API route definitions
│   ├── 📁 storage/              # In-memory storage implementation
│   ├── 📁 utils/                # Utility functions & helpers
│   └── 📄 app.ts                # Express application entry point
├── 📁 tests/                    # Jest test files
│   ├── 📁 unit/                 # Unit tests
│   ├── 📁 integration/          # Integration tests
│   └── 📁 e2e/                  # End-to-end tests
├── 📁 postman/                  # Postman collection & environment
│   ├── 📄 todo-collection.json  # Complete API collection
│   ├── 📄 todo-environment.json # Environment variables
│   └── 📄 README.md             # Postman usage guide
├── 📁 docs/                     # Project documentation
│   ├── 📄 architecture.md       # System architecture
│   ├── 📄 prd.md               # Product requirements
│   └── 📄 tasks.md             # Implementation tasks
├── 📄 .env.example              # Environment variables template
├── 📄 package.json              # Dependencies & scripts
├── 📄 tsconfig.json             # TypeScript configuration
└── 📄 README.md                 # This file
```

## 🎯 Usage Examples

### Frontend Integration

#### React/Next.js Example
```javascript
// API service
const API_BASE = 'http://localhost:3002/api/v1';

class TodoAPI {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.success) {
      this.token = data.data.token;
      localStorage.setItem('authToken', this.token);
    }
    return data;
  }

  async getLists() {
    const response = await fetch(`${API_BASE}/lists`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async createList(listData) {
    const response = await fetch(`${API_BASE}/lists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(listData)
    });
    return response.json();
  }
}
```

#### cURL Examples
```bash
# Login
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@todoapi.com","password":"user123"}'

# Create List (replace TOKEN with actual JWT)
curl -X POST http://localhost:3002/api/v1/lists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"My List","description":"Test list"}'

# Get All Tasks
curl -X GET "http://localhost:3002/api/v1/tasks?status=pending&priority=high" \
  -H "Authorization: Bearer TOKEN"
```

## 🔧 Development

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm test

# Test with coverage
npm run test:coverage
```

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing  
- **E2E Tests**: Complete workflow testing
- **Coverage**: Aim for 80%+ code coverage

### Adding New Features
1. **Models**: Define TypeScript interfaces in `src/models/`
2. **Repository**: Implement data access in `src/repositories/`
3. **Service**: Add business logic in `src/services/`
4. **Controller**: Handle HTTP requests in `src/controllers/`
5. **Routes**: Define endpoints in `src/routes/`
6. **Middleware**: Add validation in `src/middleware/`
7. **Tests**: Write comprehensive tests

## 🚀 Production Deployment

### Build & Run
```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm start
```

### Production Checklist
- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Configure proper `CORS_ORIGIN`
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure rate limiting appropriately
- [ ] Set up monitoring/logging
- [ ] Use process manager (PM2/Docker)

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["npm", "start"]
```

## 🛡️ Security Features

- **🔐 JWT Authentication**: Secure token-based authentication
- **🛡️ Rate Limiting**: Prevent API abuse and DDoS attacks
- **🔒 Input Validation**: Comprehensive request validation with Joi
- **🔐 CORS Protection**: Configurable cross-origin resource sharing
- **🛡️ Security Headers**: Helmet.js for security best practices
- **🔒 Password Hashing**: bcrypt for secure password storage
- **⚡ Request Logging**: Detailed logging for monitoring and debugging

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "My Todo List",
    "created_at": "2025-07-09T15:26:11.939Z"
  },
  "meta": {
    "timestamp": "2025-07-09T15:26:11.939Z",
    "total": 10,
    "page": 1,
    "limit": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "validation_errors": [
        {
          "field": "email",
          "message": "Please provide a valid email address",
          "value": "invalid-email"
        }
      ]
    }
  }
}
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use conventional commit messages
- Update documentation for new features
- Add integration tests for new endpoints

## 📞 Support & Troubleshooting

### Common Issues

**🔴 Port Already in Use**
```bash
# Change port in .env file
PORT=3003

# Or kill existing process
lsof -ti:3002 | xargs kill -9
```

**🔴 JWT Token Issues**
- Ensure `JWT_SECRET` is set and consistent
- Check token expiration (default 24h)
- Verify Authorization header format: `Bearer TOKEN`

**🔴 CORS Errors**
- Update `CORS_ORIGIN` in .env to match your frontend URL
- For development, use: `CORS_ORIGIN=http://localhost:3000`

**🔴 Database Connection**
- This API uses in-memory storage (no database required)
- Data persists only during server runtime
- For persistence, consider implementing file-based storage

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev
```

### Health Monitoring
```bash
# Check API health
curl http://localhost:3002/health

# Get API information  
curl http://localhost:3002/api
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Express.js** - Fast, unopinionated web framework
- **TypeScript** - Typed JavaScript at scale
- **Joi** - Object schema validation
- **bcrypt** - Password hashing library
- **jsonwebtoken** - JWT implementation
- **Jest** - Testing framework
- **Postman** - API development and testing

---

## 🚨 Important Notes for AI Integration

### For AI Developers & Language Models:

1. **Authentication Required**: All CRUD operations require JWT Bearer token
2. **Base URL**: `http://localhost:3002/api/v1`
3. **Default Test Users**: 
   - Admin: `admin@todoapi.com` / `admin123`
   - User: `user@todoapi.com` / `user123`
4. **Token Flow**: POST `/auth/login` → Extract `data.token` → Use in `Authorization: Bearer TOKEN`
5. **Response Format**: Always check `success` boolean, data in `data` field
6. **Error Handling**: Errors in `error` field with `code` and `message`
7. **Validation**: Request bodies validated against Joi schemas
8. **Pagination**: Use `page` and `limit` query parameters
9. **Filtering**: Multiple query parameters available for search/filter
10. **Rate Limiting**: Respect rate limits (especially auth endpoints)

### Quick Test Sequence:
```bash
1. POST /auth/login (get token)
2. GET /lists (verify auth works)  
3. POST /lists (create list, save ID)
4. POST /tasks (create task with list_id)
5. GET /tasks (verify task created)
```

This API is designed for easy integration with frontend applications and AI systems. The Postman collection provides comprehensive examples for all endpoints and scenarios.

---

**Made with ❤️ for developers and AI systems**
