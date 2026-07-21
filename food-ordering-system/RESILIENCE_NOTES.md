# Resilience Notes — food-ordering-system

Doc 9 deliverable.

## Why most of this doc doesn't apply the way it usually would

The classic resilience stack (timeout → retry → circuit breaker → bulkhead) is designed around **synchronous service-to-service calls**. This system doesn't have any: order/payment/restaurant only ever talk to each other through Kafka (via the outbox), never via direct REST. There's no `RestTemplate`/`WebClient`/Feign call between these 3 services to put a circuit breaker around - Circuit Breaker, Bulkhead, and Retry-with-jitter (Fases 2-4) are consequently **not applicable** here, not skipped. The only synchronous entry points are the 2 client-facing REST endpoints (`POST /orders`, `POST /customers`), and neither calls another service synchronously to serve its response.

Where this system's real resilience surface is: Kafka consumer failure handling (Doc 4), and the database connection pool. Both covered below.

## Kafka consumer resilience: done in Doc 4

Bounded retry (3 attempts, 1s backoff, then skip) via the shared `DefaultErrorHandler` in `KafkaConsumerConfig`, plus producer idempotence. Not repeating here - see Doc 4.

## HikariCP pool sizing: made explicit

Was relying entirely on Hikari's implicit default (10 connections per service). Made it explicit in all 4 `application.yml` so it's a documented decision, not an accident - and to state the multiplication that already made it safe: 4 services × 10 = 40 connections against Postgres's `max_connections=200` (see Doc 2's compose config), leaving headroom for the Debezium connector's own replication slots and any manual psql session. Not tuning the *number* up or down beyond making it explicit - that needs real load data (concurrent order throughput) this pass has no way to generate.

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 30000
```

## The real gap: no saga timeout / stuck-order detection

Confirmed by reading every `@Scheduled` job in the codebase: the only scheduled jobs are the 3 `*OutboxCleanerScheduler` classes, and all 3 only ever look at outbox rows already in a **terminal** saga state (`SUCCEEDED`, `FAILED`, `COMPENSATED`) to delete them. Nothing watches rows still in `STARTED`/`PROCESSING`.

Concretely: if payment-service crashes after consuming the payment-request event but before writing its response outbox row, order-service's order sits in `PENDING` forever with nothing to notice or act on it - no timeout, no alert, no compensating cancellation. This is a real, load-bearing gap in an otherwise well-built choreographed saga (the outbox + idempotent-producer + bounded-retry-consumer pieces are all solid; this is the one piece missing).

Not implementing the fix here: a saga timeout scheduler is fundamentally a saga-design decision (what's the right timeout per saga step? does it retry once more or go straight to compensation? does compensation re-use the existing cancellation path or need a new one?) that belongs with the rest of the saga's state-machine logic - see Doc 10, which covers exactly this.
