
#!/bin/bash

# Set environment variables for different ports
export AUTH_PORT=3001
export USER_PORT=3002
export PARKING_PORT=3003
export CAR_ENTRY_PORT=3004
export REPORTING_PORT=3005

# Start Auth Service
echo "Starting Auth Service on port $AUTH_PORT..."
cd auth-service
PORT=$AUTH_PORT nohup npm start > ./auth.log 2>&1 &
cd ..

# Wait a moment before starting the next service
sleep 2

# Start User Service
echo "Starting User Service on port $USER_PORT..."
cd user-service
PORT=$USER_PORT nohup npm start > ./user.log 2>&1 &
cd ..

# Wait a moment before starting the next service
sleep 2

# Start Parking Service
echo "Starting Parking Service on port $PARKING_PORT..."
cd parking-service
PORT=$PARKING_PORT nohup npm start > ./parking.log 2>&1 &
cd ..

# Wait a moment before starting the next service
sleep 2

# Start Car Entry Service
echo "Starting Car Entry Service on port $CAR_ENTRY_PORT..."
cd car-entry-service
PORT=$CAR_ENTRY_PORT PARKING_SERVICE_URL=http://localhost:$PARKING_PORT nohup npm start > ./car-entry.log 2>&1 &
cd ..

# Wait a moment before starting the next service
sleep 2

# Start Reporting Service
echo "Starting Reporting Service on port $REPORTING_PORT..."
cd reporting-service
PORT=$REPORTING_PORT nohup npm start > ./reporting.log 2>&1 &
cd ..

echo "All services started successfully!"
echo "Auth Service: http://localhost:$AUTH_PORT/api-docs"
echo "User Service: http://localhost:$USER_PORT/api-docs"
echo "Parking Service: http://localhost:$PARKING_PORT/api-docs"
echo "Car Entry Service: http://localhost:$CAR_ENTRY_PORT/api-docs"
echo "Reporting Service: http://localhost:$REPORTING_PORT/api-docs"
