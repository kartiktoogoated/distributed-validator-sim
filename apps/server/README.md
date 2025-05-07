# DeepFry API Documentation

## Authentication Endpoints

### Signup
- **POST** `/api/auth/signup`
- **Description**: Register a new user with email and password
- **Body**:
  ```json
  {
    "email": "string",
    "password": "string",
    "confirmPassword": "string"
  }
  ```
- **Response**: 
  - Success (201): `{ message: "Pending signup initiated. Please check your email for the OTP.", email: string }`
  - Error (400): `{ message: "All fields are required" | "Passwords do not match" | "User already exists" }`

### Verify OTP
- **POST** `/api/auth/verify-otp`
- **Description**: Verify OTP and complete user registration
- **Body**:
  ```json
  {
    "email": "string",
    "otp": "string"
  }
  ```
- **Response**:
  - Success (200): `{ message: "User verified and created successfully", userId: number }`
  - Error (400): `{ message: "Email and OTP are required" | "Invalid OTP" | "OTP expired" }`

### Signin
- **POST** `/api/auth/signin`
- **Description**: Authenticate user and get JWT token
- **Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  - Success (200): `{ message: "Signin successful", token: string }`
  - Error (400): `{ message: "Invalid credentials" }`

## Website Monitoring Endpoints

### Add Website
- **POST** `/api/websites`
- **Auth Required**: Yes
- **Description**: Add a new website for monitoring
- **Body**:
  ```json
  {
    "url": "string",
    "description": "string"
  }
  ```
- **Response**:
  - Success (201): `{ message: "Website added", website: Website }`
  - Error (400): `{ message: "URL is required" | "Website already added" }`

### List Websites
- **GET** `/api/websites`
- **Auth Required**: Yes
- **Description**: Get list of user's monitored websites
- **Response**:
  - Success (200): `{ websites: Website[] }`

### Update Website
- **PUT** `/api/websites/:id`
- **Auth Required**: Yes
- **Description**: Update website URL
- **Body**:
  ```json
  {
    "url": "string"
  }
  ```
- **Response**:
  - Success (200): `{ message: "Website updated", updated: Website }`
  - Error (403): `{ message: "Not allowed to edit this website" }`

### Delete Website
- **DELETE** `/api/websites/:id`
- **Auth Required**: Yes
- **Description**: Remove website from monitoring
- **Response**:
  - Success (200): `{ message: "Website deleted" }`
  - Error (403): `{ message: "Not authorized" }`

### Get Website History
- **GET** `/api/websites/:id/history`
- **Auth Required**: Yes
- **Query Parameters**:
  - `limit`: number (default: 50, max: 100)
  - `page`: number (default: 1)
- **Response**:
  - Success (200): 
    ```json
    {
      "url": "string",
      "total": number,
      "page": number,
      "pageSize": number,
      "totalPages": number,
      "logs": ValidatorLog[]
    }
    ```

### Pause/Resume Monitoring
- **PUT** `/api/websites/:id/pause`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "paused": boolean
  }
  ```
- **Response**:
  - Success (200): `{ message: "Monitoring paused/resumed", website: Website }`

### Get Website Summary
- **GET** `/api/websites/:id/summary`
- **Auth Required**: Yes
- **Response**:
  ```json
  {
    "url": "string",
    "status": "UP" | "DOWN" | "N/A",
    "lastChecked": "timestamp",
    "uptime": "string",
    "latency": number,
    "paused": boolean
  }
  ```

## Validator Endpoints

### Get Validator Metadata
- **GET** `/api/validators/:id/meta`
- **Description**: Get validator performance metrics
- **Response**:
  ```json
  {
    "validatorId": number,
    "correctVotes": number,
    "totalVotes": number,
    "accuracy": string,
    "averageLatency": string,
    "uptime": string,
    "weight": string,
    "lastUpdated": "timestamp"
  }
  ```

## Status Endpoints

### Check Website Status
- **GET** `/api/status`
- **Query Parameters**:
  - `url`: string (optional, defaults to DEFAULT_TARGET_URL)
- **Response**:
  ```json
  {
    "success": boolean,
    "url": string,
    "status": "UP" | "DOWN",
    "weight": number
  }
  ```

## Logs Endpoints

### Get All Logs
- **GET** `/api/logs`
- **Description**: Get all validator logs
- **Response**:
  ```json
  {
    "success": boolean,
    "logs": [
      {
        "id": number,
        "validatorId": number,
        "region": string,
        "site": string,
        "status": string,
        "latency": number | null,
        "timestamp": "timestamp"
      }
    ]
  }
  ```

## Rate Limiting

All endpoints except Raft endpoints are rate limited:
- Auth endpoints: 5 requests per 15 minutes
- Other endpoints: 100 requests per 15 minutes

## WebSocket Endpoints

### WebSocket Connection
- **Path**: `/api/ws`
- **Description**: Real-time updates for validator status and alerts
- **Events**:
  - `raft-commit`: Raft consensus updates
  - Echo responses for testing

## Error Responses

All endpoints may return the following error responses:
- 400: Bad Request - Invalid input
- 401: Unauthorized - Missing or invalid authentication
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource doesn't exist
- 429: Too Many Requests - Rate limit exceeded
- 500: Internal Server Error - Server-side error

## Authentication

Protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer REDACTED_TOKEN
``` 