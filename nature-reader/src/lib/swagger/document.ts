import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry } from './registry'

// IMPORTANT: Import all swagger path registration modules here to ensure registry.registerPath gets executed!
import './auth.swagger'
import './api.swagger'

export function getOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions)

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Nature Reader API',
      version: '1.0.0',
      description: 'Interactive API Documentation for Nature Reader project.'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server'
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ]
  })
}
