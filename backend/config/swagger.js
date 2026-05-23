const swaggerJsDoc = require('swagger-jsdoc');

/**
 * Swagger Documentation Configuration
 */

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Little Flower English School ERP API Documentation',
      version: '1.0.0',
      description: 'API documentation for the School ERP backend system.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Paths to files containing OpenAPI definitions
  apis: ['./routes/*.js', './controllers/*.js'],
};

const specs = swaggerJsDoc(options);

module.exports = specs;
