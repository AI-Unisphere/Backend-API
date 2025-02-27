import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerOptions } from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'UniSphere API Documentation',
            version: '1.0.0',
            description: 'API documentation for the UniSphere procurement platform',
            contact: {
                name: 'UniSphere Support',
                email: 'support@unisphere.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
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
                Bid: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        rfpId: { type: 'string', format: 'uuid' },
                        vendorId: { type: 'string', format: 'uuid' },
                        status: { 
                            type: 'string',
                            enum: ['DRAFT', 'SUBMITTED', 'EVALUATED', 'ACCEPTED', 'REJECTED']
                        },
                        proposalDocument: { type: 'string' },
                        evaluationScore: { type: 'number', format: 'float' },
                        shortEvaluation: { type: 'string' },
                        longEvaluation: { type: 'string' },
                        submissionDate: { type: 'string', format: 'date-time' },
                        evaluationDate: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                RFP: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        title: { type: 'string' },
                        shortDescription: { type: 'string' },
                        longDescription: { type: 'string' },
                        budget: { type: 'number' },
                        timelineStartDate: { type: 'string', format: 'date-time' },
                        timelineEndDate: { type: 'string', format: 'date-time' },
                        submissionDeadline: { type: 'string', format: 'date-time' },
                        status: {
                            type: 'string',
                            enum: ['DRAFT', 'PUBLISHED', 'CLOSED', 'AWARDED']
                        },
                        categoryId: { type: 'string', format: 'uuid' },
                        createdById: { type: 'string', format: 'uuid' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                }
            }
        },
        security: [{
            bearerAuth: []
        }],
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'RFPs', description: 'RFP management endpoints' },
            { name: 'Bids', description: 'Bid management endpoints' },
            { name: 'Categories', description: 'Category management endpoints' },
            { name: 'Users', description: 'User management endpoints' }
        ]
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);

// Swagger UI options
export const swaggerUiOptions: SwaggerOptions = {
    explorer: true,
    swaggerOptions: {
        persistAuthorization: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "UniSphere API Documentation"
}; 