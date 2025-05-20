#!/bin/bash

# Load environment variables
source .env

# Check if nodemon is installed
if ! command -v nodemon &> /dev/null; then
  echo "nodemon is not installed. Installing..."
  npm install -g nodemon
fi

# Function to start a service
start_service() {
  local service_name=$1
  local port=$2
  local service_dir=$3

  echo "Starting $service_name on port $port..."
  cd $service_dir
  PORT=$port nodemon server.js &
  cd ..
  echo "$service_name started with PID $!"
}

# Create a .env file for each service if it doesn't exist
create_env_file() {
  local service_dir=$1
  local port=$2
  local db_name=$3

  if [ ! -f "$service_dir/.env" ]; then
    echo "Creating .env file for $service_dir..."
    cat > $service_dir/.env << EOF
NODE_ENV=development
PORT=$port
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
DB_DATABASE=$db_name
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=$JWT_EXPIRATION
CORS_ORIGIN=$CORS_ORIGIN
EOF
  fi
}

# Create .env files for each service
create_env_file "auth-service" $AUTH_SERVICE_PORT $AUTH_DB_NAME
create_env_file "user-service" $USER_SERVICE_PORT $USER_DB_NAME
create_env_file "parking-service" $PARKING_SERVICE_PORT $PARKING_DB_NAME
create_env_file "car-entry-service" $CAR_ENTRY_SERVICE_PORT $CAR_ENTRY_DB_NAME
create_env_file "reporting-service" $REPORTING_SERVICE_PORT $REPORTING_DB_NAME

# Start each service
start_service "Auth Service" $AUTH_SERVICE_PORT "auth-service"
start_service "User Service" $USER_SERVICE_PORT "user-service"
start_service "Parking Service" $PARKING_SERVICE_PORT "parking-service"
start_service "Car Entry Service" $CAR_ENTRY_SERVICE_PORT "car-entry-service"
start_service "Reporting Service" $REPORTING_SERVICE_PORT "reporting-service"

echo "All services started. Press Ctrl+C to stop all services."

# Wait for user to press Ctrl+C
wait
