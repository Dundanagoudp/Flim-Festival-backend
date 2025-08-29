# Guest Management API Documentation

## Overview
This API provides comprehensive guest management functionality for the Arunachal Film Festival, including year management and guest CRUD operations with Firebase image storage.

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
Currently, no authentication is required for these endpoints.

## API Endpoints

### Year Management

#### 1. Create Year
- **URL**: `POST /years`
- **Description**: Creates a new festival year
- **Request Body**:
  ```json
  {
    "value": 2025
  }
  ```
- **Response**:
  ```json
  {
    "message": "Year created successfully",
    "year": {
      "_id": "64f9...",
      "value": 2025,
      "active": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

#### 2. Get All Years
- **URL**: `GET /years`
- **Description**: Returns all years sorted (active years first)
- **Response**:
  ```json
  [
    {
      "_id": "64f9...",
      "value": 2025,
      "active": true
    },
    {
      "_id": "64f8...",
      "value": 2024,
      "active": false
    }
  ]
  ```

### Guest Management

#### 3. Create Guest
- **URL**: `POST /guests`
- **Description**: Adds a new guest under a selected year
- **Request**: FormData with fields:
  - `name` (string, required) - Guest's full name
  - `role` (string, required) - Role in festival (Judge, Actor, Director, etc.)
  - `age` (number, optional) - Guest's age
  - `description` (string, optional) - Brief description
  - `year` (string, required) - Year ID from year creation
  - `movies` (string, optional) - Comma-separated movie list
  - `photo` (file, required) - Guest's photo (image file)
- **Response**:
  ```json
  {
    "message": "Guest created successfully",
    "guest": {
      "_id": "64f1...",
      "name": "John Doe",
      "role": "Judge",
      "age": 45,
      "description": "Award-winning film critic",
      "year": "64f9...",
      "movies": "Movie1, Movie2",
      "photo": "https://storage.googleapis.com/bucket-name/guests/2025/timestamp-filename.jpg"
    }
  }
  ```

#### 4. Get All Guests (Flat List)
- **URL**: `GET /guests`
- **Query Parameters**:
  - `year` (optional) - Filter by year value (e.g., `?year=2025`)
- **Description**: Returns all guests in a flat list format
- **Response**:
  ```json
  [
    {
      "_id": "64f1...",
      "name": "John Doe",
      "role": "Judge",
      "year": 2025,
      "age": 45,
      "description": "Award-winning film critic",
      "movies": "Movie1, Movie2",
      "photo": "https://storage.googleapis.com/bucket-name/guests/2025/timestamp-filename.jpg"
    }
  ]
  ```

#### 5. Get All Guests (Grouped by Year)
- **URL**: `GET /guests?groupBy=year`
- **Description**: Returns all guests grouped by their festival year
- **Response**:
  ```json
  [
    {
      "_id": 2025,
      "guests": [
        {
          "_id": "64f1...",
          "name": "John Doe",
          "role": "Judge",
          "age": 45,
          "description": "Award-winning film critic",
          "movies": "Movie1, Movie2",
          "photo": "https://storage.googleapis.com/bucket-name/guests/2025/timestamp-filename.jpg"
        }
      ]
    },
    {
      "_id": 2024,
      "guests": [
        {
          "_id": "64f3...",
          "name": "Alex Lee",
          "role": "Director"
        }
      ]
    }
  ]
  ```

#### 6. Get Single Guest
- **URL**: `GET /guests/:id`
- **Description**: Returns details of a specific guest
- **Response**:
  ```json
  {
    "_id": "64f1...",
    "name": "John Doe",
    "role": "Judge",
    "year": 2025,
    "age": 45,
    "description": "Award-winning film critic",
    "movies": "Movie1, Movie2",
    "photo": "https://storage.googleapis.com/bucket-name/guests/2025/timestamp-filename.jpg"
  }
  ```

#### 7. Update Guest
- **URL**: `PUT /guests/:id`
- **Description**: Updates an existing guest's information
- **Request**: FormData with fields (all optional):
  - `name` - Updated name
  - `role` - Updated role
  - `age` - Updated age
  - `description` - Updated description
  - `year` - Updated year ID
  - `movies` - Updated movies list
  - `photo` - New photo file (optional)
- **Response**:
  ```json
  {
    "message": "Guest updated successfully",
    "guest": {
      "_id": "64f1...",
      "name": "Updated Name",
      "role": "Director",
      "age": 46,
      "description": "Updated description",
      "year": "64f9...",
      "movies": "New Movie1, New Movie2",
      "photo": "https://storage.googleapis.com/bucket-name/guests/2025/timestamp-newfilename.jpg"
    }
  }
  ```

#### 8. Delete Guest
- **URL**: `DELETE /guests/:id`
- **Description**: Deletes a guest and their associated photo
- **Response**:
  ```json
  {
    "message": "Guest deleted successfully"
  }
  ```

#### 9. Get Guests by Specific Year
- **URL**: `GET /guests/year/:yearId`
- **Description**: Returns all guests for a specific year ID
- **Response**:
  ```json
  {
    "year": 2025,
    "guests": [
      {
        "_id": "64f1...",
        "name": "John Doe",
        "role": "Judge",
        "age": 45,
        "description": "Award-winning film critic",
        "movies": "Movie1, Movie2",
        "photo": "https://storage.googleapis.com/bucket-name/guests/2025/timestamp-filename.jpg"
      }
    ]
  }
  ```

## Data Models

### Year Schema
```javascript
{
  value: Number,        // Year value (e.g., 2025)
  active: Boolean,      // Whether this year is active
  timestamps: true      // createdAt, updatedAt
}
```

### Guest Schema
```javascript
{
  name: String,         // Guest's full name (required)
  role: String,         // Role in festival (required)
  age: Number,          // Guest's age (optional)
  description: String,  // Brief description (optional)
  year: ObjectId,       // Reference to Year model (required)
  movies: String,       // Comma-separated movie list (optional)
  photo: String,        // Firebase storage URL (required)
  timestamps: true      // createdAt, updatedAt
}
```

## Role Options
Valid roles for guests include:
- Judge
- Actor
- Director
- Producer
- Writer
- Cinematographer
- Editor
- Composer
- Other

## File Upload
- Photos are uploaded to Firebase Cloud Storage
- File path structure: `guests/{year}/{timestamp}-{filename}`
- Supported image formats: JPG, PNG, GIF, etc.
- Files are automatically made public for access

## Error Handling
All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

Error responses include:
```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Testing
Use the `test-guest-api.js` file for testing examples and curl commands.

## Dependencies
- Express.js
- Mongoose (MongoDB)
- Multer (File uploads)
- Firebase Admin SDK (Cloud Storage)
- CORS enabled
