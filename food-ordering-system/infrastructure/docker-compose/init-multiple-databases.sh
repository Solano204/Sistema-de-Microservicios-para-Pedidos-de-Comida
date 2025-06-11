#!/bin/bash
set -e

# Function to create schema if it doesn't exist
create_schema() {
    local schema=$1
    echo "Creating schema '$schema'"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        CREATE SCHEMA IF NOT EXISTS $schema;
        GRANT ALL PRIVILEGES ON SCHEMA $schema TO $POSTGRES_USER;
EOSQL
}

# Create schemas for each service
create_schema "customer"
create_schema "order"
create_schema "payment"
create_schema "restaurant"

echo "All schemas created successfully!"