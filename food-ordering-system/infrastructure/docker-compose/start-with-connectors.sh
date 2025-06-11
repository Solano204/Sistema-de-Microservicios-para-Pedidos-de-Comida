#!/bin/bash
set -e

echo "🚀 Starting Debezium Connect with auto-connector setup..."

# Start Kafka Connect in background
/docker-entrypoint.sh start &
CONNECT_PID=$!

# Wait for Kafka Connect to be ready
echo "⏳ Waiting for Kafka Connect to start..."
while ! curl -s http://localhost:8083/connectors > /dev/null; do
  echo "Waiting for Kafka Connect..."
  sleep 5
done

echo "✅ Kafka Connect is ready!"

# Auto-create connectors from configuration files
if [ -d "/kafka/connect/connector-configs" ]; then
  echo "🔧 Auto-creating connectors..."
  for config_file in /kafka/connect/connector-configs/*.json; do
    if [ -f "$config_file" ]; then
      connector_name=$(basename "$config_file" .json)
      echo "Creating connector: $connector_name"
      curl -X POST \
        -H "Content-Type: application/json" \
        --data @"$config_file" \
        http://localhost:8083/connectors || echo "Failed to create $connector_name"
    fi
  done
fi

echo "🎉 Debezium Connect setup complete!"

# Wait for the main process
wait $CONNECT_PID