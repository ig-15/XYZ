
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import configuration
const config = require('../shared/config');
const { errorHandler, notFoundHandler } = require('../shared/middleware/error');

// Import routes
const parkingRoutes = require('./routes/parkings');

// Initialize express app
const app = express();

// Middleware
app.use(cors(config.CORS));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Parking Service API',
      version: '1.0.0',
      description: 'API documentation for the Parking Service',
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
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
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/parkings', parkingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'parking-service' });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Parking Service running on port ${PORT}`);
});

module.exports = app;
