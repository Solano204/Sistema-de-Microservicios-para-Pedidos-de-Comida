FOOD ORDERING SYSTEM — Event-Driven Microservices with Transactional Outbox + CDC

**Domain-Driven Microservices**: I designed a 4-service system (order, payment, restaurant, customer) using domain-driven design — each service split into `-domain`, `-application`, `-dataaccess`, `-messaging`, and `-container` modules on top of a shared `common` library — deployed via Docker Compose with its own PostgreSQL instance and a 3-broker Kafka cluster with Schema Registry.

**Transactional Outbox + Debezium CDC**: I implemented the transactional outbox pattern instead of dual-writing to the database and Kafka: each service writes its outbound event to a local outbox table in the same transaction as its business data, and a Debezium connector tails the Postgres write-ahead log to publish those rows to Kafka as Avro-encoded events — guaranteeing an event is published if and only if the business transaction actually committed.

**Choreographed Saga**: I built the order-creation flow as a choreographed saga across order → payment → restaurant-approval, coordinated entirely through Kafka events (no central orchestrator) with explicit `SagaStep`/`SagaStatus` state tracking, so a payment failure or a restaurant rejection correctly compensates the order back to a cancelled state.

**Idempotent, Schema-Governed Messaging**: I used Avro schemas registered in Confluent Schema Registry for every event contract (customer, payment request/response, restaurant-approval request/response, and each service's Debezium outbox topic), so producers and consumers can't silently drift on payload shape.

**Load-Tested Saga Path**: I built a JMeter plan that seeds a customer with credit and a restaurant with an available product, then drives concurrent `POST /orders` through the full async saga and polls order status back, to validate the pipeline under load rather than just a single happy-path request.

Technologies: Java 17, Spring Boot 3.0, Apache Kafka (3-broker cluster) + Confluent Schema Registry + Avro, Debezium (CDC), PostgreSQL, Docker Compose, JMeter, Maven multi-module (DDD-layered per service).
