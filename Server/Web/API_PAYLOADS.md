# Backend API Payload Reference

This document summarizes the current backend API surface under the `api/` route group and the request/response payload shapes used by each controller.

## 1. Common notes

- Base path for all endpoints: `/api`
- The API is currently configured with `AddControllers()` and `MapControllers()` in `Program.cs`.
- Most protected endpoints rely on the caller identity from either:
  - JWT claim `sub`, or
  - request header `X-User-Id` (and sometimes `X-User-Role`).
- Response bodies are usually either:
  - a DTO object,
  - a paged result wrapper shaped like `{ data, totalCount, page, pageSize, totalPages, hasNextPage, hasPreviousPage }`, or
  - a standard error object with `{ code, message, type }`.

---

## 2. Auth endpoints

### POST /api/auth/login
Request body:
```json
{
  "identifier": "string",
  "password": "string"
}
```

Example:
```json
{
  "identifier": "admin@example.com",
  "password": "Secret@123"
}
```

Success response:
- Returns the login result object from `LoginResponseDto`.
- Typical shape:
```json
{
  "user": {
    "id": 1,
    "name": "User Name",
    "role": "Admin",
    "location": "HQ",
    "employeeId": "EMP001",
    "email": "user@example.com",
    "mobileNumber": "9999999999",
    "departmentId": 10
  },
  "department": {
    "id": 10,
    "name": "IT",
    "hodId": "2"
  },
  "headOfDepartment": {
    "id": 2,
    "name": "HOD Name",
    "employeeId": "HOD001",
    "email": "hod@example.com",
    "mobileNumber": "8888888888"
  }
}
```

Error response:
```json
{
  "message": "Identifier and password are required."
}
```

### POST /api/auth/logout
Request body: none

Success response:
```json
{
  "message": "Logged out."
}
```

---

## 3. Access request endpoints

### POST /api/access-requests
Request body:
```json
{
  "reqTo": 0,
  "isAgreed": true,
  "items": [
    {
      "folderPath": "\\\\server\\share\\folder",
      "accessType": "Read",
      "reason": "Need access for project work"
    }
  ]
}
```

Notes:
- `reqTo` = target department / recipient id.
- `isAgreed` = boolean approval flag.
- `items` = one or more folder access requests.
- `accessType` uses enum values defined in `AccessTypes`.

Success response:
- Returns the created request id (or created resource reference).

### POST /api/access-requests/hod
Request body:
- Same as `/api/access-requests`.

Purpose:
- Used for HOD-submitted requests.

### GET /api/access-requests/{id}
Path params:
- `id` = request id

Success response:
```json
{
  "requestId": 1,
  "userId": 10,
  "currentStatus": "Pending",
  "itsrNo": "ITSR-001",
  "createdOn": "2026-06-04T10:00:00",
  "items": [
    {
      "itemId": 1,
      "ticketNumber": "T-1001",
      "folderPath": "\\\\server\\share\\folder",
      "accessType": "Read",
      "confirmAccessType": "Read",
      "status": "Pending",
      "reason": "Need access",
      "rejectionReason": null,
      "approvedAtUtc": null,
      "expiresAtUtc": null
    }
  ]
}
```

### GET /api/access-requests/my
Query params:
- `page` (default `1`)
- `pageSize` (default `20`)

Success response:
- Paged result of the caller’s requests.

### POST /api/access-requests/items/{itemId}/resubmit
Path params:
- `itemId`

Request body:
```json
{
  "reason": "Resubmitting due to updated requirement",
  "comments": null
}
```

### POST /api/access-requests/items/{itemId}/renew
Path params:
- `itemId`

Request body:
```json
{
  "reason": "Renewing access for another month",
  "comments": null
}
```

---

## 4. Dashboard endpoints

### GET /api/dashboard
Request headers / claims:
- `sub` or `X-User-Id`
- `role` or `X-User-Role`

Success response:
```json
{
  "totalRequests": 12,
  "pendingWithHod": 2,
  "pendingWithIt": 3,
  "approvedActive": 4,
  "hodRejected": 1,
  "itRejected": 0,
  "revoked": 1,
  "expired": 0,
  "expiringSoon": 1,
  "myPendingItems": 2,
  "myApprovedItems": 5,
  "myRejectedItems": 1,
  "recentRequests": [
    {
      "requestId": 101,
      "userId": 55,
      "status": "Pending",
      "createdOn": "2026-06-04T09:30:00",
      "itemCount": 3
    }
  ]
}
```

---

## 5. Notification endpoints

### GET /api/notifications
Query params:
- `unreadOnly` (default `false`)

Success response:
```json
[
  {
    "auditId": 1,
    "eventType": "AccessRequestSubmitted",
    "message": "Access request submitted for approval",
    "ticketNumber": "T-1001",
    "accessReqId": 10,
    "accessItemId": 5,
    "isRead": false,
    "readAtUtc": null,
    "createdOn": "2026-06-04T11:45:00"
  }
]
```

### GET /api/notifications/unread-count
Success response:
```json
{
  "count": 5
}
```

### PATCH /api/notifications/{id}/mark-read
Path params:
- `id` = notification id

Success response:
- Returns `200 OK` with no body on success.

### PATCH /api/notifications/mark-all-read
Success response:
- Returns `200 OK` with no body.

---

## 6. User endpoints

### GET /api/users/cmpl
Query params:
- `page` (default `1`)
- `pageSize` (default `20`)
- `search` (optional)

Success response:
- Paged list of CMPL users.

### GET /api/users/cmpl/{id}
Path params:
- `id` = CMPL user id

### GET /api/users/hods
Query params:
- `page`, `pageSize`, `search`

### GET /api/users/hods/{id}
Path params:
- `id` = HOD id

### GET /api/users
Query params:
- `page`, `pageSize`, `search`

### GET /api/users/{id}
Path params:
- `id` = portal user id

### POST /api/users
Request body:
```json
{
  "cmplUserId": 12,
  "role": "Operator",
  "location": "Main Office"
}
```

### PUT /api/users/{id}
Path params:
- `id` = portal user id

Request body:
- Same shape as `POST /api/users`.

### DELETE /api/users/{id}
Path params:
- `id` = portal user id

---

## 7. Department endpoints

### GET /api/departments
Query params:
- `page`, `pageSize`, `search`

### GET /api/departments/{id}
Path params:
- `id` = department id

### PUT /api/departments/{id}
Path params:
- `id` = department id

Request body:
```json
{
  "name": "IT",
  "hodId": "2"
}
```

### DELETE /api/departments/{id}
Path params:
- `id` = department id

---

## 8. HOD cart endpoints

### GET /api/hod-cart
Query params:
- `page` (default `1`)
- `pageSize` (default `20`)

### POST /api/hod-cart/items/{itemId}/approve
Path params:
- `itemId`

Request body:
```json
{
  "reason": "Approved by HOD",
  "comments": "Looks good"
}
```

### POST /api/hod-cart/items/{itemId}/reject
Path params:
- `itemId`

Request body:
```json
{
  "reason": "Rejected due to missing justification",
  "comments": null
}
```

### POST /api/hod-cart/requests/{requestId}/approve-all
Path params:
- `requestId`

Request body:
```json
{
  "reason": "Approve all items in request",
  "comments": "All items validated"
}
```

---

## 9. Operator cart endpoints

### GET /api/operator-cart
Query params:
- `page` (default `1`)
- `pageSize` (default `20`)

### POST /api/operator-cart/items/{itemId}/approve
Path params:
- `itemId`

Request body:
```json
{
  "reason": "Approved by operator",
  "comments": "Ready for provisioning"
}
```

### POST /api/operator-cart/items/{itemId}/reject
Path params:
- `itemId`

Request body:
```json
{
  "reason": "Rejected by operator",
  "comments": null
}
```

### POST /api/operator-cart/items/{itemId}/revoke
Path params:
- `itemId`

Request body:
```json
{
  "reason": "Revoked due to policy update",
  "comments": null
}
```

### PATCH /api/operator-cart/items/{itemId}/access-type
Path params:
- `itemId`

Request body:
```json
{
  "accessType": "ReadWrite"
}
```

---

## 10. Folder mapping endpoints

### GET /api/folder-mappings
Query params:
- `page`, `pageSize`, `search`

### GET /api/folder-mappings/{id}
Path params:
- `id` = folder mapping id

### POST /api/folder-mappings
Request body:
```json
{
  "folderPath": "\\\\server\\share\\folder",
  "primaryHodId": "1",
  "primaryHodName": "HOD One",
  "primaryHodEmail": "hod1@example.com",
  "secondaryHodId": "2",
  "secondaryHodName": "HOD Two",
  "secondaryHodEmail": "hod2@example.com"
}
```

### PUT /api/folder-mappings/{id}
Path params:
- `id` = folder mapping id

Request body:
- Same shape as `POST /api/folder-mappings`.

### DELETE /api/folder-mappings/{id}
Path params:
- `id` = folder mapping id

---

## 11. Common payload model snippets

### `SubmitAccessRequestDto`
```json
{
  "reqTo": 0,
  "isAgreed": true,
  "items": [
    {
      "folderPath": "string",
      "accessType": "Read",
      "reason": "string"
    }
  ]
}
```

### `ItemActionDto`
```json
{
  "reason": "string",
  "comments": "string or null"
}
```

### `OverrideAccessTypeDto`
```json
{
  "accessType": "ReadWrite"
}
```

### `UpsertPortalUserDto`
```json
{
  "cmplUserId": 0,
  "role": "Operator",
  "location": "string"
}
```

### `UpsertDepartmentDto`
```json
{
  "name": "string",
  "hodId": "string or null"
}
```

---

## 12. Suggested next step

If you want, the next improvement would be to add this as an automated Swagger/OpenAPI reference and generate example payloads directly from the DTO classes for better maintainability.
