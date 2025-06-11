#!/bin/bash
echo "🚀 Setting up complete Kafka + Debezium environment..."

# Create necessary directories
mkdir -p volumes/kafka/broker-{1,2,3}
mkdir -p connector-configs

# Build and start everything
docker-compose build
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

echo "✅ Environment ready!"
echo "🌐 Kafka UI: http://localhost:9000"
echo "🔧 Debezium Connect: http://localhost:8083"
echo "📊 Schema Registry: http://localhost:8081"

# Show connector status
echo "📋 Available connectors:"
curl -s http://localhost:8083/connector-plugins | jq '.[].class' || echo "Waiting for connectors..."