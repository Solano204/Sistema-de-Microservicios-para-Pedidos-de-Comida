#!/bin/sh
# Registers/updates the 4 Debezium outbox connectors via Kafka Connect's REST
# API. Runs once as a one-shot compose service (see debezium-connector-init).
#
# Uses PUT /connectors/{name}/config, which creates the connector if it's
# missing and OVERWRITES its config if it already exists - unlike a
# POST-based "create if missing" script (the old approach in start-up.sh),
# this always converges the running connector onto whatever config is below,
# even if it was registered earlier under an older version of this file. A
# POST + ignore-409 script would silently keep serving a stale config forever
# since "already exists" looks like success.
#
# database.hostname is "postgres" (the compose service name), not
# "host.docker.internal" like the old start-up.sh script used - this
# container and Postgres are on the same compose network, so it reaches
# Postgres directly rather than bouncing out to the Docker host.
#
# message.key.columns overrides Debezium's default Kafka message key, which
# is otherwise the outbox table's own primary key (`id` - a fresh random UUID
# per row). That default silently breaks per-saga ordering: two outbox rows
# for the SAME saga_id (e.g. an original payment-request row followed later
# by a cancellation row) would key differently and can land on different
# partitions, where the 3 concurrent consumer threads (concurrency-level: 3)
# have no ordering guarantee across them - a later compensating event could
# be processed before the original request it's compensating for. Keying by
# saga_id instead means every event for the same saga always lands on the
# same partition and is processed in commit order by a single thread.

set -eu

CONNECT="http://kafka-debezium-connector:8083"
POSTGRES_PASSWORD="$(cat /run/secrets/postgres_password)"

echo "Waiting for Kafka Connect to accept connections..."
until curl -sf -o /dev/null "$CONNECT/connectors"; do
  sleep 3
done
echo "Kafka Connect ready."

reg() {
  name="$1"
  config="$2"
  resp=$(curl -s -o /tmp/resp.txt -w "%{http_code}" \
    -X PUT "$CONNECT/connectors/$name/config" \
    -H "Content-Type: application/json" \
    -d "$config")
  case $resp in
    200) echo "  [UPDATED] $name" ;;
    201) echo "  [CREATED] $name" ;;
    *)   echo "  [WARN]    $name HTTP $resp: $(cat /tmp/resp.txt)" ;;
  esac
}

connector_config() {
  table="$1"
  slot="$2"
  cat << EOF
{
  "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
  "tasks.max": "1",
  "database.hostname": "postgres",
  "database.port": "5432",
  "database.user": "postgres",
  "database.password": "$POSTGRES_PASSWORD",
  "database.dbname": "postgres",
  "topic.prefix": "debezium",
  "table.include.list": "$table",
  "message.key.columns": "$table:saga_id",
  "slot.name": "$slot",
  "plugin.name": "pgoutput",
  "tombstones.on.delete": "false",
  "auto.create.topics.enable": "false",
  "auto.register.schemas": "false"
}
EOF
}

reg "order-payment-connector"    "$(connector_config order.payment_outbox            order_payment_outbox_slot)"
reg "order-restaurant-connector" "$(connector_config order.restaurant_approval_outbox order_restaurant_approval_outbox_slot)"
reg "payment-order-connector"    "$(connector_config payment.order_outbox            payment_order_outbox_slot)"
reg "restaurant-order-connector" "$(connector_config restaurant.order_outbox         restaurant_order_outbox_slot)"

echo "Connector registration complete."
