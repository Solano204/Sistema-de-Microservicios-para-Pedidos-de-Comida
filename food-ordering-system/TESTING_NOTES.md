# Testing Notes — food-ordering-system

Doc 7 deliverable.

## Pyramid audit

| Service | Unit (domain-core) | Component/application | Integration | E2E |
|---|---|---|---|---|
| order-service | `OrderTest` | `OrderApplicationServiceTest`, `OrderControllerTest` | `OrderPaymentSagaTest` (fixed this pass, see below) | jmeter load test drives the real saga end-to-end |
| payment-service | `PaymentDomainServiceImplTest` | `PaymentRequestMessageListenerTest` | none | - |
| restaurant-service | `RestaurantDomainServiceImplTest` | `RestaurantApprovalRequestMessageListenerTest` | none | - |
| customer-service | `CustomerDomainServiceImplTest` | `CustomerApplicationServiceTest`, `CustomerControllerTest` | none | - |

Reasonable shape overall - not the "ice cream cone" anti-pattern (unit coverage exists at every layer for every service). The gap is integration: only order-service had one, and it silently depended on a real Postgres at `localhost:5432` rather than an ephemeral container - the exact anti-pattern this doc's Fase 3 exists to catch.

## Fixed: OrderPaymentSagaTest → Testcontainers

This test (`testDoublePayment`, `testDoublePaymentWithThreads`, `testDoublePaymentWithLatch`) is a genuinely good concurrency test - it fires the same payment response at the saga from two threads simultaneously and asserts the optimistic-locking version column prevents a corrupted double-processed outbox row. It just had no test isolation: it boots the full `OrderServiceApplication` context against whatever `spring.datasource.url` the default `application.yml` points at (a real local Postgres), with no override anywhere in `src/test/resources`.

Added `AbstractIntegrationTest` (Testcontainers `PostgreSQLContainer`, same `postgres:17.2-alpine` tag as the compose stack, wired via `@DynamicPropertySource` - not `@ServiceConnection`, since that annotation needs Spring Boot 3.1+ and this project is on 3.0.5) and made `OrderPaymentSagaTest` extend it. `spring.sql.init.mode=ALWAYS` still fires against the container the same way it fires against the real dev Postgres, so `init-schema.sql` provisions the container's schema automatically - no separate test-schema setup needed, and the existing `@Sql`-driven seed/cleanup scripts work unchanged.

Kafka is not containerized for this test: `@KafkaListener` container startup in Spring Kafka doesn't block context refresh on broker availability (it retries in the background), and the saga logic under test here never touches Kafka directly - only the outbox table - so a real broker isn't needed for this specific test to be meaningful.

## Not replicated to the other 3 services this pass

Same `AbstractIntegrationTest` pattern applies directly to payment-service and restaurant-service (both have an outbox + JPA persistence layer identical in shape to order-service's). Not doing it now because there's no existing integration test to convert there yet, unlike order-service - writing 2-3 new integration tests from scratch per service is a bigger, more speculative addition than fixing one that already existed and already encoded a real, valuable scenario. Worth doing as a deliberate follow-up, one pilot at a time per this doc's own guidance, rather than mechanically stamped out here.

## Component tests

`OrderControllerTest`/`CustomerControllerTest` already exist as the component-test layer (isolate one service's REST surface with mocked application-service dependencies) - no gap found here.
