# 📋 TODO API - Postman Collection Guide

This guide explains how to use the comprehensive Postman collection for the TODO List API.

## 📥 Import Instructions

### 1. Import Collection
1. Open Postman
2. Click "Import" button
3. Select `postman/todo-collection.json`
4. Click "Import"

### 2. Import Environment
1. Click the environment dropdown (top right)
2. Click "Import"
3. Select `postman/todo-environment.json`
4. Click "Import"
5. Select "TODO API Environment" from the dropdown

## 🚀 Quick Start

### Step 1: Start the API Server
Make sure your API server is running:
```bash
npm run dev
```
The server should be running on `http://localhost:3002` (or update the `baseUrl` in environment).

### Step 2: Test API Health
1. Run "Health Check" request
2. Run "API Information" request

### Step 3: Authenticate
Choose one of these authentication options:

**Option A: Login with existing test user**
1. Run "Login User" request (uses `user@todoapi.com` / `user123`)
2. The auth token will be automatically saved

**Option B: Login with admin user**
1. Run "Login Admin" request (uses `admin@todoapi.com` / `admin123`)
2. The auth token will be automatically saved

**Option C: Register new user**
1. Update the email in "Register New User" request
2. Run the request
3. The auth token will be automatically saved

### Step 4: Test Core Functionality
1. Run "Create New List" (saves list ID automatically)
2. Run "Create New Task" (saves task ID automatically)
3. Run "Get All Lists"
4. Run "Get All Tasks"

## 📁 Collection Structure

### 🏥 Health & Info
- **Health Check**: Verify API is running
- **API Information**: Get API details and available endpoints

### 🔐 Authentication
- **Register New User**: Create a new user account
- **Login User**: Authenticate with test user credentials
- **Login Admin**: Authenticate with admin credentials
- **Get My Profile**: Get current user information
- **Refresh Token**: Get a new JWT token
- **Logout**: Logout (client-side token removal)

### 📋 Lists Management
- **Get All Lists**: Retrieve all lists with pagination and filtering
- **Create New List**: Create a new todo list
- **Get List by ID**: Retrieve a specific list
- **Update List**: Update list details
- **Get List Tasks**: Get all tasks for a specific list
- **Delete List**: Delete a list and all its tasks

### ✅ Tasks Management
- **Get All Tasks**: Retrieve all tasks with filtering and sorting
- **Create New Task**: Create a new task
- **Get Task by ID**: Retrieve a specific task
- **Update Task**: Update task details
- **Complete Task**: Mark a task as completed
- **Get Tasks by Priority**: Filter tasks by priority level
- **Move Task to Different List**: Move task between lists
- **Delete Task**: Delete a specific task

### 🔍 Search & Filter Examples
- **Search Lists**: Search lists by name and filter by color
- **Filter Tasks by Date Range**: Get tasks within a deadline range
- **Search Tasks by Title**: Search tasks by title with additional filters

### ❌ Error Examples
- **Unauthorized Request**: Example of request without auth token
- **Invalid Token**: Example with invalid authentication
- **Invalid Request Body**: Example of validation errors
- **Not Found Resource**: Example of 404 errors

## 🔧 Environment Variables

The collection uses these variables (automatically managed):

| Variable | Description | Auto-Updated |
|----------|-------------|--------------|
| `baseUrl` | API server URL | No |
| `apiVersion` | API version | No |
| `authToken` | JWT authentication token | Yes (on login) |
| `userId` | Current user ID | Yes (on login) |
| `listId` | Sample list ID | Yes (on list creation) |
| `taskId` | Sample task ID | Yes (on task creation) |

## 🔑 Authentication Flow

1. **Register or Login**: Use any auth endpoint to get a JWT token
2. **Auto-Token Management**: Token is automatically saved and used
3. **Protected Endpoints**: All list/task operations require authentication
4. **Token Refresh**: Use refresh endpoint to get new token
5. **Logout**: Client-side token removal

## 📝 Request Examples

### Creating a List
```json
{
  "name": "Work Tasks",
  "description": "List of work-related tasks and projects",
  "color": "#3498db"
}
```

### Creating a Task
```json
{
  "list_id": "{{listId}}",
  "title": "Complete API Documentation",
  "description": "Write comprehensive API documentation with examples",
  "deadline": "2025-07-15T23:59:59.000Z",
  "priority": "high"
}
```

### Updating a Task
```json
{
  "title": "Complete API Documentation (Updated)",
  "description": "Write comprehensive API documentation with examples and Postman collection",
  "deadline": "2025-07-20T23:59:59.000Z",
  "priority": "medium",
  "status": "in_progress"
}
```

## 🔄 Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

### Sorting
- `sort_field`: Field to sort by (created_at, updated_at, name, title, deadline, priority)
- `sort_order`: Sort direction (asc, desc)

### Filtering Lists
- `search`: Search in list name and description
- `color`: Filter by color code

### Filtering Tasks
- `search`: Search in task title and description
- `status`: Filter by status (pending, in_progress, completed)
- `priority`: Filter by priority (low, medium, high)
- `list_id`: Filter by list ID
- `deadline_from`: Filter tasks with deadline after this date
- `deadline_to`: Filter tasks with deadline before this date

## 🛡️ Security Headers

All protected endpoints require:
```
Authorization: Bearer {your-jwt-token}
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-07-09T15:26:11.939Z",
    "total": 10,
    "page": 1,
    "limit": 10,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
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

## 🎯 Testing Scenarios

### Scenario 1: Complete Workflow
1. Register/Login → Create List → Create Tasks → Update Tasks → Complete Tasks

### Scenario 2: Search & Filter
1. Login → Create multiple lists/tasks → Test various search/filter combinations

### Scenario 3: Error Handling
1. Test all error examples to understand API behavior

### Scenario 4: Admin vs User
1. Login as admin → Test all operations
2. Login as user → Test user permissions

## 🚨 Troubleshooting

### Common Issues

**1. "Unauthorized" errors**
- Check if you're logged in (run login request)
- Verify `authToken` variable is set
- Check token expiration (use refresh endpoint)

**2. "Not Found" errors**
- Ensure you've created a list/task first
- Check if `listId`/`taskId` variables are set
- Verify the resource exists

**3. Validation errors**
- Check request body format
- Ensure required fields are present
- Verify data types and constraints

**4. Server not responding**
- Ensure API server is running (`npm run dev`)
- Check the `baseUrl` in environment matches your server
- Verify firewall/port settings

### Debug Tips
1. Check the Postman Console for detailed request/response info
2. Verify environment variables are set correctly
3. Test with simpler requests first (health check)
4. Check server logs for error details

## 🔗 Related Files
- Collection: `postman/todo-collection.json`
- Environment: `postman/todo-environment.json`
- API Documentation: `README.md`
- Source Code: `src/`
