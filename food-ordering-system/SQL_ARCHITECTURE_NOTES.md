# SQL Architecture Notes — food-ordering-system

Doc 6 deliverable. My role here is "collaborator with full authority" (this is your own project, not a team codebase) — findings below were applied directly where safe; the one bigger structural call (Flyway) is documented but not switched on.

## Database-per-service: satisfied, via schema isolation

One Postgres instance, but 4 separate schemas (`order`, `payment`, `restaurant`, `customer`), each service's datasource pinned to its own schema exclusively via `currentSchema=`. No service's JPA layer reaches into another schema. Where order-service needs customer data, it keeps its own local `customers` read-copy populated by consuming the `customer` Kafka event - a real materialized read model, not a cross-schema join. This is the correct pattern; nothing to change.

## Outbox + Inbox

Outbox: already formalized via Debezium CDC (see Doc 4), stronger than a manual poller. Inbox (consumer-side dedup): no formal inbox table, but `PaymentRequestKafkaListener` catches the Postgres unique-constraint violation on reprocessing and no-ops - that IS a lightweight inbox pattern, just implicit (the DB unique index *is* the dedup record) rather than a named `processed_message_ids` table. Works, but only as visible as whoever reads that catch block. Leaving as-is; a formal inbox table would be the next step if this consumer's exception handling ever needs to change hands.

## Indexes fixed this pass

Found by cross-referencing every `findBy...` JpaRepository method against its table's actual indexes - Postgres doesn't auto-index FK columns, and none of these had explicit ones:

| Table | Column(s) | Query it backs | Why it mattered |
|---|---|---|---|
| `order.orders` | `tracking_id` (unique) | `GET /orders/{trackingId}` | The single most-hit read path in the service, unindexed |
| `payment.payments` | `order_id` | Every payment request/cancellation | Hit on every saga step |
| `payment.credit_history` | `customer_id` | Credit history lookup | Table grows one row per transaction, unbounded - highest-value fix of the three |
| `payment.credit_entry` | `customer_id` (unique) | Credit balance lookup | Real key even though PK is a separate synthetic `id` |
| `restaurant.restaurant_products` | `(restaurant_id, product_id)` | Product availability/price check on every order | FK alone doesn't index in Postgres |

## Expand-Contract migrations: NOT satisfied - flagged, not fixed

`init-schema.sql` in each service does `DROP SCHEMA ... CASCADE` and rebuilds from scratch, run on **every single startup** (`spring.sql.init.mode: ALWAYS`). There's no Flyway/Liquibase - no migration history, no expand-contract, and every restart destroys all data. This is fine for a throwaway local demo loop but is exactly the anti-pattern this phase exists to catch, and it's a real risk if this ever points at anything you want to keep data in between runs.

**Not switching this on** in this pass, deliberately: converting to Flyway changes actual runtime behavior (data starts *persisting* across restarts instead of resetting), and your jmeter load test (`food-ordering-load-test.jmx`) may be relying on the current reset-every-boot behavior to seed clean state each run. That's a decision for you to make consciously, not something that should change silently underneath an existing test workflow I can't run to check.

To adopt Flyway when ready: add `flyway-core` to each `*-container/pom.xml`, move each `init-schema.sql` (already updated with the indexes above) into `src/main/resources/db/migration/V1__init.sql` with the `DROP SCHEMA` line removed (V1 only needs `CREATE`, since Flyway won't rerun a version it's already applied), and drop `spring.sql.init.mode`/`schema-locations` in favor of Flyway's own defaults.

## Isolation levels / concurrency

`credit_entry.version` (optimistic locking column) already exists and is used - correct choice for the balance-mutation path that's genuinely contended (concurrent payment requests against the same customer's credit). No gap found here.

## Connection pooling / read replicas / partitioning / CQRS / Event Sourcing

Not applicable at this scale: single Postgres instance, low connection count per service (no pooler needed beyond HikariCP's own default pool), no read-heavy reporting path that would justify a read replica, and no table here has a partitioning-worthy volume or a real event-sourcing-grade audit requirement. Documenting as explicitly evaluated and correctly skipped, not as an oversight.
