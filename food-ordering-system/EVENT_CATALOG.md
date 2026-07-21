# Event Catalog — food-ordering-system

Doc 5 (async event design) deliverable. Covers every event flowing through Kafka in this system: producer, consumer(s), transport, and classification against the Notification / ECST / Event Sourcing taxonomy.

All 4 saga events below already qualify as **Event-Carried State Transfer (ECST)** — full payload, no callback needed by the consumer — which is the correct default for anything crossing a service boundary. Nothing needs to migrate.

| Event | Producer | Topic | Consumer | Transport | Type |
|---|---|---|---|---|---|
| Payment requested/cancelled | order-service (`payment_outbox` table) | `debezium.order.payment_outbox` | payment-service | Outbox → Debezium CDC → Kafka | ECST |
| Payment completed/cancelled/failed | payment-service (`order_outbox` table) | `debezium.payment.order_outbox` | order-service | Outbox → Debezium CDC → Kafka | ECST |
| Restaurant approval requested | order-service (`restaurant_approval_outbox` table) | `debezium.order.restaurant_approval_outbox` | restaurant-service | Outbox → Debezium CDC → Kafka | ECST |
| Restaurant approved/rejected | restaurant-service (`order_outbox` table) | `debezium.restaurant.order_outbox` | order-service | Outbox → Debezium CDC → Kafka | ECST |
| Customer created | customer-service | `customer` | order-service (local read copy) | Direct `KafkaTemplate` produce | ECST |

## Domain vs. integration event separation

Already correctly separated in code, not just by convention:
- `OrderDataMapper.orderCreatedEventToOrderPaymentEventPayload(...)` (order-service) translates the internal `Order` aggregate into `OrderPaymentEventPayload` before it's serialized into the outbox row's `payload` JSON column — the internal entity never gets serialized directly.
- Each outbox row's `payload` is deserialized on the consuming side into its own Avro model (`PaymentRequestAvroModel`, etc.) — a contract type distinct from both the producer's domain model and the raw Debezium CDC envelope.

## Tolerant Reader

Already satisfied. `KafkaMessageHelper.getOrderEventPayload` deserializes the outbox `payload` JSON via the plain injected Spring-autoconfigured `ObjectMapper`, and nothing in the codebase re-enables `FAIL_ON_UNKNOWN_PROPERTIES` (Spring Boot's Jackson autoconfiguration ships it disabled) — a producer adding a new field to a payload won't break existing consumers.

## Choreography chain length

Longest chain is order → payment (2 hops: request, response) and order → restaurant (2 hops), both independently triggered from the same order-created event, not chained through each other. Well under the 2-3 hop threshold where a switch to explicit orchestration would be worth considering — no action needed. (Doc 10 covers the saga's state machine and compensation logic in depth.)

## Outbox: manual poller, not CDC-vs-manual tossup

This system already uses Debezium CDC (not a manual poller) for all 4 saga events — the more advanced of the two options Doc 5 asks to evaluate, appropriate given 4 services are already publishing this way. Manual-poller-vs-CDC is a closed question here, not a pending decision.

## Primitive fit (queue vs. pub-sub vs. stream)

All 5 topics are genuinely pub-sub/stream shaped (a saga step's event has exactly one real consumer today, but the CDC-tailed design means any future consumer can subscribe independently and replay from any retained offset) - Kafka is the right primitive for all of them. No forced "queue on top of a stream" pattern found.

## Async request-reply

No case of a synchronous call standing in for what's conceptually a request-reply found — every cross-service interaction in this system already goes through the choreographed saga's async event exchange. Not applicable.
