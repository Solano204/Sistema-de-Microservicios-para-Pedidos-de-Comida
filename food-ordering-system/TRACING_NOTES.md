# Distributed Tracing Notes — food-ordering-system

Doc 8 deliverable. Zipkin config is adapted from `NEXUS/docker-compose-prod.yml` and `NEXUS/nexus-tracing-common`, not copied verbatim - two real differences in this project changed the right shape:

1. **Storage**: NEXUS's Zipkin runs against Elasticsearch (`STORAGE_TYPE: elasticsearch`) because it's a much bigger, longer-lived platform. This project's Zipkin uses the default in-memory store - no reason to stand up Elasticsearch just for local trace data that doesn't need to survive a restart.
2. **Kafka trace propagation mechanism**: NEXUS's `KafkaTracePropagation` utility does *manual* header injection/extraction because several NEXUS services build their own Kafka factories AND mix tracing bridges. This project's 4 services all use one consistent bridge (Brave), so the simpler, built-in fix applies: `KafkaTemplate.setObservationEnabled(true)` / `ContainerProperties.setObservationEnabled(true)` on the shared hand-rolled factories in `infrastructure/kafka` (added this pass) gets Spring Kafka to inject/extract B3 headers automatically, without porting NEXUS's manual utility class.

## What's covered now

- **REST spans**: automatic once `micrometer-tracing-bridge-brave` + `zipkin-reporter-brave` are on the classpath (added to all 4 `*-container/pom.xml`) - `POST /orders`, `GET /orders/{trackingId}`, `POST /customers` all get traced with zero extra code.
- **`customer` topic**: `CustomerCreatedEventKafkaPublisher` (customer-service) → `CustomerKafkaListener` (order-service) - this is the one path where the Spring app itself is both the Kafka producer and consumer, so the `setObservationEnabled(true)` fix above covers it end-to-end.
- **Sampling**: `management.tracing.sampling.probability: 1.0` in all 4 `application.yml` - 100% in local dev, as this doc recommends. Lower it before pointing at anything shared/persistent.
- **Log correlation**: Spring Boot's default logging pattern already includes `traceId`/`spanId` once `micrometer-tracing-bridge-brave` is present (Boot wires this into the default `logback` pattern automatically) - no separate change needed.

## What's NOT covered - the outbox/CDC gap

The other 4 topics (`debezium.order.payment_outbox`, `debezium.payment.order_outbox`, `debezium.order.restaurant_approval_outbox`, `debezium.restaurant.order_outbox`) are published by **Debezium**, not by this app's `KafkaTemplate` - a trace context written by the app never reaches Kafka for these, because the actual producer is a separate process (Kafka Connect) reading the outbox table asynchronously, well after the app's request-scoped span has already ended. `setObservationEnabled` cannot fix this; it only instruments records this app's own KafkaTemplate sends directly.

A saga that flows order → payment → order → restaurant → order today shows up in Zipkin as 3-4 *disconnected* traces (one per hop that goes through the outbox), not one continuous trace - each outbox-driven consumer starts a fresh root span because there's no incoming trace header to extract.

**The fix** (not implemented this pass - real schema + connector + code changes across 3 services, better done as its own deliberate piece of work):

1. Add a `trace_b3` column to each of the 4 outbox tables (`payment_outbox`, `restaurant_approval_outbox`, both `order_outbox` tables).
2. At the point each outbox row is built (`PaymentOutboxHelper`, the restaurant-service equivalent, `OrderSagaHelper`/`OrderCreateHelper`), write the current span's B3 context into that column - a no-op when there's no active span, same as NEXUS's `OutboxEntry.attachTraceContext`.
3. In `register-connectors.sh`, add to each connector config:
   ```json
   "transforms": "headerFrom",
   "transforms.headerFrom.type": "org.apache.kafka.connect.transforms.HeaderFrom$Value",
   "transforms.headerFrom.fields": "trace_b3",
   "transforms.headerFrom.headers": "b3",
   "transforms.headerFrom.operation": "copy"
   ```
   This is deliberately **not** the same mechanism NEXUS uses (`transforms.outbox.table.fields.additional.placement`) - that option only exists on Debezium's `EventRouter` SMT, which this project's connectors don't use (see Doc 4 - the existing hand-rolled outbox-unwrapping in each `*KafkaListener` depends on receiving the raw CDC `Envelope`, and switching to EventRouter would change that envelope shape and break every listener). `HeaderFrom$Value` is the general-purpose Kafka Connect SMT that copies a field to a header for any connector, EventRouter or not - the right tool for this project's actual connector shape.
4. In each of the 6 `@KafkaListener` methods, extract the `b3` header and start/continue a span before processing (the same pattern as NEXUS's `KafkaTracePropagation.extractAndStartSpan`, minus the manual-propagation machinery this project doesn't need for its consistent-bridge REST/direct-Kafka paths).

Flagging this as a real, understood gap rather than leaving it implicit.
