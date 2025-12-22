# BOLAXO Admin API - Production Documentation

## 🚀 Overview

The BOLAXO Admin API is a production-ready REST API for managing the platform's admin dashboard. All endpoints are protected, rate-limited, and optimized for performance.

**Base URL:** `https://bolaxo-production.up.railway.app/api`

---

## 🔐 Authentication

All admin endpoints require an `adminToken` cookie:

```bash
curl -H "Cookie: adminToken=your-admin-token" \
  https://bolaxo-production.up.railway.app/api/admin/users
```

**Authentication Response:**
- `200`: Valid token, request processed
- `401`: Invalid or missing token
- `429`: Rate limit exceeded

---

## ⚡ Rate Limiting

All endpoints are rate-limited to prevent abuse:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Admin Endpoints | 100 requests | 1 minute |
| Auth Endpoints | 5 requests | 15 minutes |
| Search Endpoints | 60 requests | 1 minute |
| General Endpoints | 30 requests | 1 minute |
| Upload Endpoints | 3 requests | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1729951823000
Retry-After: 45
```

**429 Response:**
```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 45
}
```

---

## 📚 API Documentation

Interactive Swagger UI available at:
```
GET /api/swagger-ui
```

OpenAPI Specification available at:
```
GET /api/swagger-spec
```

---

## 📋 Endpoints

### Users Management

#### List Users
```
GET /api/admin/users
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Results per page (default: 20, max: 100)
- `search` (string): Search by email, name, or company name
- `role` (string): Filter by role (seller, buyer, broker)
- `verified` (boolean): Filter by email verification status
- `sortBy` (string): Sort field (createdAt, email, name)
- `sortOrder` (string): Sort order (asc, desc)

**Response:**
```json
{
  "users": [
    {
      "id": "user-123",
      "email": "seller@example.com",
      "name": "John Doe",
      "role": "seller",
      "verified": true,
      "bankIdVerified": true,
      "createdAt": "2025-10-27T10:00:00Z",
      "lastLoginAt": "2025-10-27T14:30:00Z",
      "_count": {
        "listings": 5,
        "valuations": 2
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasMore": true
  },
  "stats": {
    "total": 150,
    "sellers": 50,
    "buyers": 90,
    "verified": 120,
    "bankIdVerified": 45
  }
}
```

#### Update User
```
PATCH /api/admin/users
```

**Request Body:**
```json
{
  "userId": "user-123",
  "verified": true,
  "bankIdVerified": true,
  "name": "Updated Name",
  "phone": "+46701234567",
  "region": "Stockholm"
}
```

#### Delete User
```
DELETE /api/admin/users?userId=user-123
```

---

### Listings Management

#### List Listings
```
GET /api/admin/listings
```

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Results per page
- `search` (string): Search company name or title
- `status` (string): Filter by status (draft, active, sold, archived)
- `industry` (string): Filter by industry
- `location` (string): Filter by location
- `verified` (boolean): Filter by verification status
- `sortBy` (string): Sort field (createdAt, publishedAt, views, companyName)
- `sortOrder` (string): Sort order (asc, desc)

**Response includes:** Listing details, user info, counts

#### Update Listing
```
PATCH /api/admin/listings
```

#### Delete Listing
```
DELETE /api/admin/listings?listingId=listing-123
```

---

### Transactions

#### List Transactions
```
GET /api/admin/transactions
```

**Query Parameters:**
- `stage` (string): Filter by transaction stage (CREATED, NDA_SIGNED, etc.)
- `search` (string): Search by buyer/seller email or name
- `sortBy` (string): Sort field (createdAt, closingDate, agreedPrice)
- `sortOrder` (string): Sort order

**Response:** Includes transaction progress, milestones, documents

#### Update Transaction
```
PATCH /api/admin/transactions
```

---

### Payments

#### List Payments
```
GET /api/admin/payments
```

**Query Parameters:**
- `status` (string): Filter by payment status (PENDING, ESCROWED, RELEASED)
- `type` (string): Filter by payment type (UPFRONT, MILESTONE, FINAL)
- `minAmount` (number): Minimum amount filter
- `maxAmount` (number): Maximum amount filter
- `search` (string): Search by description or email

**Response:** Includes payment breakdown by type and status

#### Update Payment
```
PATCH /api/admin/payments
```

---

### Dashboard & Analytics

#### Dashboard Statistics
```
GET /api/admin/dashboard-stats
```

**Response includes:**
- User statistics (total, sellers, buyers, verified)
- Listing statistics (active, draft, sold, verified)
- NDA statistics
- Transaction statistics with values
- Payment statistics
- Conversion rates
- Top industries and regions
- Recent activities

**Performance:** Optimized with parallel queries (~100-200ms response time)

#### Sellers Analytics
```
GET /api/admin/sellers/analytics
```

**Query Parameters:**
- `search` (string): Filter sellers
- `status` (string): Seller status (new, active, inactive)
- `page` (integer): Pagination
- `limit` (integer): Results per page

**Response:** Seller performance scores, deal statistics, NDA metrics

#### Buyers Analytics
```
GET /api/admin/buyers/analytics
```

**Response:** Buyer quality scores, deal analysis, preferences

---

### Fraud Detection

#### List Suspicious Users
```
GET /api/admin/fraud-detection
```

**Query Parameters:**
- `riskLevel` (string): Filter by risk level (critical, high, medium, low)
- `type` (string): Filter by type (bot, fraud, suspicious)
- `page` (integer): Pagination
- `limit` (integer): Results per page

**Risk Scoring Factors:**
- New account with high activity (25 points)
- Unrealistic revenue claims (25 points)
- Duplicate content (15 points)
- High messaging without verification (15 points)
- Activity spikes (20 points)
- Missing verification (5 points)
- Listing spam (20 points)
- Transaction failure patterns (15 points)
- Abandoned accounts (8 points)

**Risk Levels:**
- Critical: ≥80 points
- High: 60-79 points
- Medium: 40-59 points
- Low: <40 points

#### Take Fraud Action
```
POST /api/admin/fraud-detection
```

**Request Body:**
```json
{
  "userId": "user-123",
  "action": "suspend|flag|investigate|approve",
  "notes": "Reason for action"
}
```

---

### NDA Tracking

#### List NDAs
```
GET /api/admin/nda-tracking
```

**Query Parameters:**
- `status` (string): Filter by status (pending, signed, approved, rejected)
- `search` (string): Search by email or company name
- `page` (integer): Pagination
- `limit` (integer): Results per page

**Response:** NDA details with expiration tracking and urgency levels

#### Update NDA
```
PATCH /api/admin/nda-tracking
```

**Request Body:**
```json
{
  "ndaId": "nda-123",
  "status": "signed|approved|rejected"
}
```

#### NDA Actions
```
POST /api/admin/nda-tracking
```

**Actions:**
- `remind`: Send reminder to buyer
- `resend`: Resend NDA document
- `extend`: Extend expiration by 14 days

---

### Support Tickets

#### List Support Tickets
```
GET /api/admin/support-tickets
```

**Query Parameters:**
- `status` (string): Filter by status (open, in_progress, resolved, closed)
- `priority` (string): Filter by priority (critical, high, medium, low)
- `category` (string): Filter by category
- `assignedTo` (string): Filter by assigned admin user ID
- `search` (string): Search by subject or description

**Response:** Ticket details with timeline and engagement metrics

#### Update Ticket
```
PATCH /api/admin/support-tickets
```

**Request Body:**
```json
{
  "ticketId": "ticket-123",
  "status": "in_progress",
  "priority": "high",
  "assignedTo": "admin-user-id"
}
```

#### Add Response
```
POST /api/admin/support-tickets
```

**Request Body:**
```json
{
  "ticketId": "ticket-123",
  "message": "Response message",
  "responderId": "admin-id",
  "responderEmail": "admin@example.com"
}
```

---

## 🛡️ Error Handling

### Error Response Format
```json
{
  "error": "Error message",
  "details": "Additional error information",
  "status": 400
}
```

### Common Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Invalid or missing token
- `404`: Not Found - Resource doesn't exist
- `429`: Rate Limit Exceeded
- `500`: Server Error

---

## 📊 Performance Optimizations

### Query Batching
Multiple database queries are batched using `Promise.all()` for parallel execution:
- Dashboard stats: 27 parallel queries (~100-200ms)
- Admin users: Optimized field selection
- Listings: Efficient filtering and pagination

### Field Selection
Only necessary fields are selected from the database to reduce payload size and improve response times.

### Indexes
Strategic database indexes on frequently filtered and sorted fields:
- Status fields
- Creation/update timestamps
- User IDs
- Transaction stages
- Payment status

### In-Memory Rate Limiting
Rate limiting is tracked in-memory with automatic cleanup of old entries, no external service required.

---

## 🔄 Pagination

All list endpoints support standard pagination:

```
GET /api/admin/users?page=1&limit=20
```

**Pagination Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasMore": true
  }
}
```

---

## 🧪 Testing

### cURL Examples

**List Users:**
```bash
curl -H "Cookie: adminToken=token123" \
  "https://bolaxo-production.up.railway.app/api/admin/users?page=1&limit=10"
```

**Update User:**
```bash
curl -X PATCH \
  -H "Cookie: adminToken=token123" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","verified":true}' \
  https://bolaxo-production.up.railway.app/api/admin/users
```

**Get Dashboard Stats:**
```bash
curl -H "Cookie: adminToken=token123" \
  https://bolaxo-production.up.railway.app/api/admin/dashboard-stats
```

---

## 📖 API Documentation UI

Interactive Swagger UI with try-it-out functionality:
```
https://bolaxo-production.up.railway.app/api/swagger-ui
```

---

## 🚨 Important Notes

1. All timestamps are in ISO 8601 format
2. Monetary values are in SEK (Swedish Kronor)
3. Rate limits reset based on time windows, not calendar periods
4. Deleted records are not returned in list endpoints
5. All queries require valid admin authentication

---

## 📞 Support

For API issues or questions:
- Email: support@bolaxo.se
- Documentation: `/api/swagger-ui`
- Status: Check `/api/admin/dashboard-stats` for system health
