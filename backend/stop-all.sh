
#!/bin/bash

# Kill all node processes running the services
echo "Stopping all services..."

# Find and kill node processes
pkill -f "node ./auth-service/server.js" 
pkill -f "node ./user-service/server.js" 
pkill -f "node ./parking-service/server.js" 
pkill -f "node ./car-entry-service/server.js" 
pkill -f "node ./reporting-service/server.js" 

echo "All services stopped!"
