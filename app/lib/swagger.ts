export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'BOLAXO Admin API',
    description: 'Production-ready REST API for admin dashboard',
    version: '1.0.0',
    contact: {
      name: 'BOLAXO Support',
      email: 'support@bolagsportalen.se'
    }
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      description: 'API Server'
    }
  ],
  paths: {
    '/api/admin/users': {
      get: {
        summary: 'List all users',
        description: 'Fetch users with filtering, searching, sorting, and pagination',
        tags: ['Users'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by email, name, company' },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['seller', 'buyer', 'broker'] } },
          { name: 'verified', in: 'query', schema: { type: 'boolean' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['createdAt', 'email', 'name'] } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } }
        ],
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: { type: 'array' },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        pages: { type: 'integer' },
                        hasMore: { type: 'boolean' }
                      }
                    },
                    stats: { type: 'object' }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          429: { description: 'Too many requests' }
        }
      },
      patch: {
        summary: 'Update user',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  verified: { type: 'boolean' },
                  bankIdVerified: { type: 'boolean' },
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  region: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'User updated' },
          401: { description: 'Unauthorized' },
          429: { description: 'Too many requests' }
        }
      },
      delete: {
        summary: 'Delete user',
        tags: ['Users'],
        parameters: [{ name: 'userId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'User deleted' },
          401: { description: 'Unauthorized' },
          429: { description: 'Too many requests' }
        }
      }
    },
    '/api/admin/listings': {
      get: {
        summary: 'List all listings',
        tags: ['Listings'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'active', 'sold', 'archived'] } },
          { name: 'verified', in: 'query', schema: { type: 'boolean' } }
        ],
        responses: {
          200: { description: 'Success' },
          401: { description: 'Unauthorized' },
          429: { description: 'Too many requests' }
        }
      }
    },
    '/api/admin/transactions': {
      get: {
        summary: 'List all transactions',
        tags: ['Transactions'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'stage', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Success' },
          401: { description: 'Unauthorized' },
          429: { description: 'Too many requests' }
        }
      }
    },
    '/api/admin/dashboard-stats': {
      get: {
        summary: 'Get dashboard statistics',
        description: 'Returns comprehensive platform statistics including users, listings, transactions, and analytics',
        tags: ['Dashboard'],
        responses: {
          200: { description: 'Dashboard stats' },
          401: { description: 'Unauthorized' },
          429: { description: 'Too many requests' }
        }
      }
    },
    '/api/admin/fraud-detection': {
      get: {
        summary: 'Detect fraud and suspicious users',
        description: 'Analyze users for fraud patterns with risk scoring',
        tags: ['Fraud Detection'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'riskLevel', in: 'query', schema: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['bot', 'fraud', 'suspicious'] } }
        ],
        responses: {
          200: { description: 'Fraud detection results' },
          401: { description: 'Unauthorized' },
          429: { description: 'Too many requests' }
        }
      }
    },
    '/api/admin/support-tickets': {
      get: {
        summary: 'List support tickets',
        tags: ['Support'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'] } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] } },
          { name: 'category', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Support tickets' },
          401: { description: 'Unauthorized' },
          429: { description: 'Too many requests' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      adminToken: {
        type: 'apiKey',
        in: 'cookie',
        name: 'adminToken',
        description: 'Admin authentication token stored in cookies'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string' },
          verified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Listing: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          companyName: { type: 'string' },
          revenue: { type: 'number' },
          status: { type: 'string' },
          views: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          stage: { type: 'string' },
          agreedPrice: { type: 'number' },
          progress: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  security: [{ adminToken: [] }]
}

/**
 * Generate Swagger HTML
 */
export function generateSwaggerHTML() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>BOLAXO Admin API Documentation</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css">
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui.js"></script>
        <script>
          const ui = SwaggerUIBundle({
            url: "/api/swagger-spec",
            dom_id: '#swagger-ui',
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
            layout: "StandaloneLayout"
          })
        </script>
      </body>
    </html>
  `
}
