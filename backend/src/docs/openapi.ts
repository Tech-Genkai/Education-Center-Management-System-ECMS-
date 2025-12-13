import { PROFILE_IMAGE_DEFAULT_URL } from '../constants/media.ts';

const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ECMS Backend API',
    version: '1.0.0',
    description: 'Profile endpoints for Education Center Management System'
  },
  servers: [
    { url: 'http://localhost:5000', description: 'Local' }
  ],
  tags: [
    { name: 'Profile', description: 'Profile management endpoints' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      ProfilePicture: {
        type: 'object',
        properties: {
          url: { type: 'string', example: PROFILE_IMAGE_DEFAULT_URL },
          storagePath: { type: 'string', example: 'images/profile/uploads/123.png' },
          isDefault: { type: 'boolean', example: true },
          uploadedAt: { type: 'string', format: 'date-time' }
        }
      },
      UserProfile: {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'objectId' },
          displayName: { type: 'string' },
          avatarUrl: { type: 'string' },
          profilePicture: { $ref: '#/components/schemas/ProfilePicture' },
          bio: { type: 'string' }
        }
      },
      UploadResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Profile image uploaded successfully' },
          url: { type: 'string', example: '/static/images/profile/uploads/123.png' },
          storagePath: { type: 'string', example: 'images/profile/uploads/123.png' },
          profile: { $ref: '#/components/schemas/UserProfile' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          error: { type: 'string' },
          allowedTypes: { type: 'array', items: { type: 'string' } },
          maxBytes: { type: 'number' }
        }
      }
    }
  },
  paths: {
    '/api/profile': {
      get: {
        tags: ['Profile'],
        summary: 'Get profile by userId',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'objectId' }
          }
        ],
        responses: {
          '200': {
            description: 'Profile found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { profile: { $ref: '#/components/schemas/UserProfile' } }
                }
              }
            }
          },
          '400': { description: 'Invalid userId', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Forbidden' },
          '404': { description: 'Profile not found' },
          '500': { description: 'Server error' }
        }
      }
    },
    '/api/profile/avatar': {
      post: {
        tags: ['Profile'],
        summary: 'Upload profile avatar',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image', 'userId'],
                properties: {
                  userId: { type: 'string', format: 'objectId' },
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'JPEG, PNG, or WEBP. Size ≤ 2MB (4MB for admin/teacher). Dimensions 128-1024 px (128-2048 for admin/teacher).'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Upload succeeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/UploadResponse' } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '500': { description: 'Server error' }
        }
      },
      delete: {
        tags: ['Profile'],
        summary: 'Delete avatar and revert to default',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId: { type: 'string', format: 'objectId' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Reverted to default avatar', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } } } },
          '400': { description: 'Invalid userId' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Profile not found' },
          '500': { description: 'Server error' }
        }
      }
    }
  }
};

export default openapiSpec;
