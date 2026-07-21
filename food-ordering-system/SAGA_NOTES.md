# Saga Deep Audit — food-ordering-system

Doc 10 deliverable. Unlike most of the other docs, this one is mostly **confirmation** - this saga is genuinely well-built. Documenting why, and the one real gap.

## Step classification (Fase 1)

| Step | Type | Why |
|---|---|---|
| Order creation (`PENDING`) | Pivot | Money hasn't moved yet, but the order now exists and is visible via `GET /orders/{trackingId}` - not silently discardable |
| Payment completion (`PENDING` → `PAID`) | Pivot | Money has moved. Everything after this point is compensated, never silently rolled back |
| Restaurant approval (`PAID` → `APPROVED`) | Pivot | Restaurant capacity/acceptance recorded |
| Payment failure/cancellation | Compensable | `initCancel` → `CANCELLING` → `cancel` → `CANCELLED` - a real, explicit compensating transition, not a delete |
| Restaurant rejection | Compensable | Triggers the same payment-cancellation compensation via `OrderPaymentSaga.rollback` |

`CANCELLING` is the compensating-in-progress state - the codebase already has a name for "compensation started but not confirmed yet," not just a binary paid/cancelled flag.

## Compensation design (Fase 2) - already follows all 3 rules

1. **Never fails silently**: `Order.cancel()` guards its precondition (`CANCELLING` or `PENDING` only) and throws `OrderDomainException` on an invalid transition rather than applying a bad state change.
2. **Semantic undo, not literal rollback**: cancellation is a real state transition (`CANCELLING` → `CANCELLED`) with `failureMessages` recorded, not a row delete - the order and the reason it failed both stay auditable.
3. **Reordering considered**: payment is requested before restaurant approval specifically so the compensable, easily-reversed step (restaurant capacity) never has to compensate for the harder-to-reverse one (money) - the harder step goes first, by design, not incidentally.

## Isolation countermeasures (Fase 3) - Semantic Lock and Commutative Updates both already present

- **Semantic Lock**: `OrderStatus` is a real guarded state machine - `approve()`, `initCancel()`, `cancel()` all check current state before transitioning and throw rather than allow an invalid jump (e.g. `approve()` requires `PAID`, refuses everything else). This *is* the semantic-lock pattern, just not named that in the code.
- **Commutative updates**: payment balance changes go through `credit_history` (append-only ledger of DEBIT/CREDIT rows) rather than overwriting `credit_entry.total_credit_amount` directly with an absolute value - deltas, not absolute sets, which is exactly what avoids lost-update races on concurrent payment processing.
- **Reread Value / optimistic locking**: `credit_entry.version` and the outbox tables' own `version` column - both used, both tested (`OrderPaymentSagaTest`'s concurrent-thread tests, now Testcontainers-backed per Doc 7).

No entity found needing all 4 contramedidas simultaneously - no signal that any part of this saga should be pulled back into a single-service ACID transaction instead.

## Orchestrator / saga log (Fase 4)

No dedicated orchestrator - choreographed via Kafka, and the saga log the master prompt asks for already exists implicitly: each outbox table's `saga_status` column (`STARTED`/`PROCESSING`/`COMPENSATING`/`SUCCEEDED`/`FAILED`/`COMPENSATED`) persisted **before** the corresponding Kafka publish, in the same transaction as the state change that triggered it. Recovery-on-crash already works by construction: `OrderPaymentSaga.process`/`rollback` both check the outbox row's current `SagaStatus` before acting and no-op if it's already past the expected state (`"already processed"` / `"already rolled backed"` log lines) - so a redelivered message after a mid-saga crash doesn't reapply a step twice.

## Idempotency (Fase 7) - already correct

Every saga step handler (`OrderPaymentSaga.process`, `.rollback`, and their restaurant-side counterparts) does a check-then-act against the outbox row's current `SagaStatus` before touching anything, exactly the "ID + dedup table" pattern this phase asks for - the outbox table doubles as that dedup table, no separate mechanism needed.

## Timeouts (Fase 8) - the one real gap, carried over from Doc 9

No step has an explicit timeout. Confirmed by reading every `@Scheduled` job in the codebase: the only ones are the 3 outbox cleaners, which only touch rows already in a terminal `SagaStatus`. A saga stuck in `STARTED`/`PROCESSING` (payment-service crashes after consuming the request, before writing its response) has nothing watching it - the order sits in `PENDING` forever.

**Design for the fix (not implemented this pass)**:
- A scheduler queries `payment_outbox` for rows with `saga_status IN (STARTED, PROCESSING)` and `created_at` older than a threshold (start with 5 minutes - order creation → payment response should be fast; tune from real latency data later).
- On timeout, the safe action is **not** a local cancel: order-service can't tell locally whether payment-service actually completed the payment and only the *response* got lost, versus payment-service never having processed it at all - blindly cancelling in the first case would leave a completed payment with no matching order. The safe move is to re-publish the same payment-request outbox row (same `saga_id`, so payment-service's own idempotent-consumer check - the unique constraint on `(type, saga_id, payment_status, outbox_status)` - naturally no-ops if it already processed the original) and only escalate to compensation after a second, longer timeout with no response.
- This is genuinely a saga-design decision (exact thresholds, one nudge vs. several, when to give up and compensate vs. alert a human) that deserves its own deliberate pass rather than a guessed implementation bolted on here.

## Testing (Fase 9)

`OrderPaymentSagaTest` already covers the concurrent-double-processing case well (Testcontainers-backed as of Doc 7). Not present: a test per individual failure mode (payment FAILED vs CANCELLED, restaurant rejection triggering payment compensation) - the domain-core unit tests (`OrderTest`) cover the state-machine guards in isolation, but nothing exercises the full `OrderPaymentSaga.rollback` path against a real database. Worth adding once the timeout scheduler above exists, so both can be tested together against the same Testcontainers base class.

## Monitoring (Fase 10)

Ties directly to the outbox/CDC tracing gap in Doc 8 - once each outbox row carries its trace context, "how long has this saga been in `PROCESSING`" becomes a queryable span duration instead of something you'd have to infer from `created_at`/`processed_at` timestamps by hand. Documented there, not duplicated here.
