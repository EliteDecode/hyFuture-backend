# HyFuture Admin API Documentation

This document provides details for all administrative endpoints in the HyFuture backend. All endpoints (except Auth) require an `Authorization: Bearer <token>` header with a valid Admin JWT.

## 1. Authentication

### Admin Login
`POST /admin/auth/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "yourpassword"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbG...",
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Super Admin"
  }
}
```

---

## 2. Broadcast Emails

### Schedule Broadcast
`POST /broadcast-email`

**Request Body:**
```json
{
  "type": "WAITLIST", // Options: "WAITLIST", "GENERAL", "TEST"
  "subject": "Exciting News!",
  "message": "Hello everyone...",
  "deliveryDate": "2026-01-15T10:00:00Z", // Optional (ISO 8601)
  "actionButton": { // Optional
    "introText": "Click here to join:",
    "buttonText": "Join Now",
    "url": "https://hyfuture.com/join"
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Broadcast email scheduled successfully",
  "data": {
    "jobId": "123",
    "type": "WAITLIST",
    "subject": "Exciting News!",
    "recipientCount": 45,
    "deliveryDate": "2026-01-15T10:00:00Z"
  }
}
```

### Check Job Status
`GET /broadcast-email/job/:jobId`

**Response (200 OK):**
```json
{
  "id": "123",
  "state": "completed", // "waiting", "active", "completed", "failed", "delayed"
  "data": { ... },
  "timestamp": 1736428800000,
  "processedOn": 1736428805000,
  "finishedOn": 1736428810000,
  "failedReason": null
}
```

### Queue Statistics
`GET /broadcast-email/queue/stats`

**Response (200 OK):**
```json
{
  "waiting": 0,
  "active": 0,
  "completed": 10,
  "failed": 1,
  "delayed": 2,
  "total": 13
}
```

---

## 3. Letters Management

### Admin Stats
`GET /letters/admin/stats`

**Response (200 OK):**
```json
{
  "DELIVERED": 150,
  "SCHEDULED": 25,
  "DRAFT": 10,
  "FAILED": 2,
  "TOTAL": 187
}
```

### List All Letters
`GET /letters/admin/all?status=SCHEDULED`

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "subject": "My Future Letter",
    "content": "<p>Hello future me...</p>",
    "recipientEmail": "user@example.com",
    "recipientName": "John Doe",
    "senderEmail": "sender@example.com",
    "senderName": "Jane Smith",
    "deliveryDate": "2026-12-25T10:00:00.000Z",
    "status": "SCHEDULED",
    "isPublic": false,
    "locked": true,
    "attachments": [
      {
        "id": "att-uuid",
        "fileUrl": "https://storage.com/file.jpg",
        "type": "IMAGE"
      }
    ]
  }
]
```

---

## 4. Waitlist Management

### List All Waitlist Entries
`GET /waitlist/admin/all`

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "email": "waiting@example.com",
    "name": "Bob Wilson",
    "createdAt": "2026-01-09T12:00:00.000Z"
  }
]
```

---

## 5. User Management

### List All Users
`GET /users/admin/all`

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Alice Green",
      "isEmailVerified": true,
      "provider": "LOCAL",
      "avatar": null,
      "createdAt": "2026-01-01T08:00:00.000Z"
    }
  ],
  "count": 1
}
```
