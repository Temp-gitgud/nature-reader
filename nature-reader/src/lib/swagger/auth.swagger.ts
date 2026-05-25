import { registry } from './registry'
import { registerSchema, loginSchema } from '../schemas/auth.schema'
import { z } from 'zod'

// Register Path: /api/auth/register
registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  summary: 'Register a new user',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: registerSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Register success'
    },
    400: {
      description: 'Validation failed or sign-up error'
    }
  }
})

// Register Path: /api/auth/login
registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  summary: 'Log into account',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Login success'
    },
    401: {
      description: 'Invalid credentials'
    }
  }
})

// Register Path: /api/auth/logout
registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  summary: 'Log out current session',
  tags: ['Authentication'],
  responses: {
    200: {
      description: 'Logout success'
    },
    500: {
      description: 'Logout failure'
    }
  }
})
