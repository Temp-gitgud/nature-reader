import { registry } from './registry'
import { z } from 'zod'
import {
  profileUpdateSchema,
  changePasswordSchema,
  postCreateSchema,
  postUpdateSchema,
  commentCreateSchema,
  reportCreateSchema,
  adminReportReviewSchema,
  adminPostReviewSchema,
  adminUserUpdateSchema
} from '../schemas/api.schema'

// =====================================
// SECURITY SCHEME (Bearer Token)
// =====================================
const securityScheme = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT'
})

// =====================================
// USER PROFILE & ACCOUNT
// =====================================
registry.registerPath({
  method: 'get',
  path: '/api/profile',
  summary: 'Fetch current profile details',
  tags: ['Profile'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Profile details fetched successfully' },
    401: { description: 'Unauthorized token' }
  }
})

registry.registerPath({
  method: 'put',
  path: '/api/profile',
  summary: 'Update current profile details',
  tags: ['Profile'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: profileUpdateSchema }
      }
    }
  },
  responses: {
    200: { description: 'Profile updated successfully' },
    400: { description: 'Validation failed' },
    401: { description: 'Unauthorized token' }
  }
})

registry.registerPath({
  method: 'patch',
  path: '/api/auth/password',
  summary: 'Update account password',
  tags: ['Profile'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: changePasswordSchema }
      }
    }
  },
  responses: {
    200: { description: 'Password updated successfully' },
    400: { description: 'Validation failed' },
    401: { description: 'Unauthorized' }
  }
})

registry.registerPath({
  method: 'delete',
  path: '/api/account',
  summary: 'Terminate account (cascade null comments/posts)',
  tags: ['Profile'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Account terminated successfully' },
    401: { description: 'Unauthorized' }
  }
})

// =====================================
// BOOKS & POSTS
// =====================================
registry.registerPath({
  method: 'get',
  path: '/api/posts',
  summary: 'List posts with pagination and filters',
  tags: ['Reviews & Posts'],
  responses: {
    200: { description: 'Paginated posts list retrieved' }
  }
})

registry.registerPath({
  method: 'post',
  path: '/api/posts',
  summary: 'Create a new review post and auto-link Book',
  tags: ['Reviews & Posts'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: postCreateSchema }
      }
    }
  },
  responses: {
    201: { description: 'Review post created' },
    400: { description: 'Validation failed' },
    401: { description: 'Unauthorized' }
  }
})

registry.registerPath({
  method: 'get',
  path: '/api/posts/{id}',
  summary: 'Fetch detailed post with book and comments count',
  tags: ['Reviews & Posts'],
  responses: {
    200: { description: 'Detailed review post details' },
    404: { description: 'Post not found' }
  }
})

registry.registerPath({
  method: 'put',
  path: '/api/posts/{id}',
  summary: 'Edit a review post',
  tags: ['Reviews & Posts'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: postUpdateSchema }
      }
    }
  },
  responses: {
    200: { description: 'Post updated' },
    403: { description: 'Forbidden. Not author or admin' },
    404: { description: 'Post not found' }
  }
})

registry.registerPath({
  method: 'delete',
  path: '/api/posts/{id}',
  summary: 'Delete a review post',
  tags: ['Reviews & Posts'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Post deleted successfully' },
    403: { description: 'Forbidden' },
    404: { description: 'Post not found' }
  }
})

// =====================================
// INTERACTIONS (Likes & Comments)
// =====================================
registry.registerPath({
  method: 'post',
  path: '/api/posts/{id}/like',
  summary: 'Like a review post',
  tags: ['Social Interactions'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Post liked' },
    400: { description: 'Already liked' }
  }
})

registry.registerPath({
  method: 'delete',
  path: '/api/posts/{id}/like',
  summary: 'Unlike a review post',
  tags: ['Social Interactions'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Post unliked' },
    400: { description: 'Not liked yet' }
  }
})

registry.registerPath({
  method: 'get',
  path: '/api/posts/{id}/comments',
  summary: 'Get paginated comments list',
  tags: ['Social Interactions'],
  responses: {
    200: { description: 'Comments list retrieved' }
  }
})

registry.registerPath({
  method: 'post',
  path: '/api/posts/{id}/comments',
  summary: 'Post a new comment',
  tags: ['Social Interactions'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: commentCreateSchema }
      }
    }
  },
  responses: {
    201: { description: 'Comment created successfully' },
    401: { description: 'Unauthorized' }
  }
})

registry.registerPath({
  method: 'delete',
  path: '/api/comments/{id}',
  summary: 'Delete a comment',
  tags: ['Social Interactions'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Comment deleted successfully' },
    403: { description: 'Forbidden' }
  }
})

registry.registerPath({
  method: 'post',
  path: '/api/posts/{id}/report',
  summary: 'Report post vioplation (with reason cross-field validation)',
  tags: ['Social Interactions'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: reportCreateSchema }
      }
    }
  },
  responses: {
    201: { description: 'Report submitted successfully' },
    400: { description: 'Validation failed or duplicate report' },
    401: { description: 'Unauthorized' }
  }
})

// =====================================
// ADMIN PANEL
// =====================================
registry.registerPath({
  method: 'get',
  path: '/api/admin/stats',
  summary: 'Retrieve dashboard metrics',
  tags: ['Admin Panel'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Stats data compiled' },
    403: { description: 'Forbidden. Admin role required' }
  }
})

registry.registerPath({
  method: 'get',
  path: '/api/admin/reports',
  summary: 'Fetch pending/resolved reports queue',
  tags: ['Admin Panel'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Moderation reports fetched' }
  }
})

registry.registerPath({
  method: 'patch',
  path: '/api/admin/reports/{id}',
  summary: 'Review and resolve post report',
  tags: ['Admin Panel'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: adminReportReviewSchema }
      }
    }
  },
  responses: {
    200: { description: 'Report action recorded' }
  }
})

registry.registerPath({
  method: 'patch',
  path: '/api/admin/posts/{id}/review',
  summary: 'Approve or Reject review post',
  tags: ['Admin Panel'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: adminPostReviewSchema }
      }
    }
  },
  responses: {
    200: { description: 'Post review recorded' }
  }
})

registry.registerPath({
  method: 'put',
  path: '/api/admin/users/{id}',
  summary: 'Edit user profile and system roles',
  tags: ['Admin Panel'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: adminUserUpdateSchema }
      }
    }
  },
  responses: {
    200: { description: 'User roles updated successfully' }
  }
})
