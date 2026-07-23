# Food Ordering System — Service Descriptions

## order-service (port 8181)
Owns order lifecycle (`PENDING` → `PAID` → `APPROVED` / cancellation). Exposes `POST /orders` to place an order and `GET /orders/{trackingId}` to check status. Publishes payment and restaurant-approval requests via its transactional outbox (`payment_outbox`, `restaurant_approval_outbox` tables tailed by Debezium) and reacts to their responses to drive the saga forward or compensate.

## payment-service (port 8182)
Validates and debits/credits customer balance for an order, seeded with initial credit via `init-data.sql`. Consumes payment-request events, writes its own outbox response, and publishes back to order-service through the same outbox → Debezium → Kafka path.

## restaurant-service (port 8183)
Holds restaurant and product data (availability, price) and approves or rejects an order on behalf of the restaurant. Seeded with an active restaurant and available product for testing/load-testing. Consumes restaurant-approval-request events and responds via its own outbox.

## customer-service (port 8184)
Owns customer records. Exposes `POST /customers` to create a customer and publishes a `customer` event to Kafka on creation, consumed by order-service to keep a local read copy for order validation.

## common
Shared library (domain primitives, application-layer base classes, generic JPA data-access helpers, generic Kafka messaging helpers) used by all four services to avoid duplicating cross-cutting code.

## infrastructure
- **kafka** — Kafka producer/consumer config and the Avro-generated `kafka-model` classes shared by every service.
- **outbox** — the transactional outbox scheduler/poller abstraction each service's data-access module builds on.
- **saga** — `SagaStep`, `SagaStatus`, `SagaConstants` — the choreographed-saga contract order-service implements to drive payment and restaurant approval.
- **docker-compose** — the full local stack: Postgres, Zookeeper, a 3-broker Kafka cluster, Schema Registry, the Debezium connector (+ its plugin volume), Kafka UI, and all 4 services.

## jmeter
`food-ordering-load-test.jmx` — seeds a customer/restaurant/product, then drives concurrent order placement through the live saga and polls tracking status back, with configurable thread count, ramp-up, and loop count.
