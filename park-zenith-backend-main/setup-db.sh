
#!/bin/bash

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Set default values if not provided in .env
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_DATABASE=${DB_DATABASE:-parking_management}

echo "Setting up database for Parking Management System..."

# Create the database if it doesn't exist
psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -c "CREATE DATABASE $DB_DATABASE;" || true

# Run the setup script
psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -f database/setup.sql

echo "Database setup completed!"
