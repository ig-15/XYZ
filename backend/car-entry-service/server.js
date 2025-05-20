
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import configuration
const config = require('../shared/config');
const { errorHandler, notFoundHandler } = require('../shared/middleware/error');

// Import routes
const entryRoutes = require('./routes/entries');
const ticketRoutes = require('./routes/tickets');
const carRoutes = require('./routes/cars');

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
      title: 'Car Entry Service API',
      version: '1.0.0',
      description: 'API documentation for the Car Entry Service',
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
app.use('/api/entries', entryRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/cars', carRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'car-entry-service' });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Car Entry Service running on port ${PORT}`);
});

module.exports = app;