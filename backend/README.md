
# XYZ Ltd Parking Management System - Backend

A comprehensive microservice-based backend system for parking management.

## Architecture

This system consists of five independent microservices:

1. **Auth Service** - Handles authentication and authorization
2. **User Service** - Manages user operations and role management
3. **Parking Service** - Handles parking lot operations and availability
4. **Car Entry Service** - Manages car entry/exit and ticket generation
5. **Reporting Service** - Provides analytics and reporting functionality

## Getting Started

### Prerequisites

- Node.js v14+
- PostgreSQL 13+
- Docker (optional)

### Environment Setup

Each microservice requires its own `.env` file with the following variables:

```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=parking_management
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1d
CORS_ORIGIN=*
```

Adjust the values as needed for your environment.

### Installation & Running

1. Clone the repository
2. Install dependencies for each service:

```bash
cd auth-service && npm install
cd ../user-service && npm install
cd ../parking-service && npm install
cd ../car-entry-service && npm install
cd ../reporting-service && npm install
```

3. Start each service:

```bash
cd auth-service && npm run start
cd ../user-service && npm run start
cd ../parking-service && npm run start
cd ../car-entry-service && npm run start
cd ../reporting-service && npm run start
```

## API Documentation

Swagger UI is available for each service at the `/api-docs` endpoint when the services are running.

## Database Setup

Run the SQL scripts in the `database` directory to set up the necessary tables and relationships.

## Security

- JWT-based authentication
- Role-based access control
- Input validation
- CORS protection
