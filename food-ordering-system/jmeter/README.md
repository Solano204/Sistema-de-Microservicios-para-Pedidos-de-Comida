# JMeter Load Test

`food-ordering-load-test.jmx` exercises the create-order saga (order -> payment -> restaurant approval)
end to end against a running stack (docker-compose or local services).

## Prerequisites

Start the full stack first (infra + all 4 services), e.g.:

```
docker compose -f infrastructure/docker-compose/docker-compose-food-ordering.yml up -d
```

## What it does

1. **Setup thread group** (runs once): `POST /customers` on customer-service, creating the customer
   with id `d215b5f8-0249-4dc5-89a3-51fd148cfb41` — this id already has a 50,000.00 credit entry
   seeded in `payment-service/init-data.sql`, and the restaurant/product ids used below are the
   ones seeded in `restaurant-service/init-data.sql` (active restaurant, available product at
   price 1.00). This lets the saga actually complete successfully instead of failing on missing
   reference data.
2. **Main thread group** ("Place Orders"): each iteration does
   - `POST /orders` on order-service to place an order,
   - waits `saga.wait.ms` for the async saga (Kafka + outbox/Debezium) to progress,
   - `POST /orders/{trackingId}` -> `GET /orders/{trackingId}` to read back status.

## Running

```
cd jmeter
jmeter -n -t food-ordering-load-test.jmx -l results.jtl -e -o report/
```

## Parameters (override with `-J`)

| Property         | Default                              | Meaning                                |
|------------------|---------------------------------------|-----------------------------------------|
| `order.host`     | localhost                             | order-service host                      |
| `order.port`     | 8181                                   | order-service port                      |
| `customer.host`  | localhost                             | customer-service host                   |
| `customer.port`  | 8184                                   | customer-service port                   |
| `customer.id`    | d215b5f8-0249-4dc5-89a3-51fd148cfb41   | seeded customer with sufficient credit  |
| `restaurant.id`  | d215b5f8-0249-4dc5-89a3-51fd148cfb45   | seeded active restaurant                |
| `product.id`     | d215b5f8-0249-4dc5-89a3-51fd148cfb48   | seeded available product (price 1.00)   |
| `order.price`    | 1.00                                   | must match product price x quantity     |
| `threads`        | 5                                      | concurrent virtual users                |
| `rampup`         | 5                                      | ramp-up seconds                         |
| `loops`          | 10                                     | iterations per thread                   |
| `saga.wait.ms`   | 3000                                   | wait before checking order status       |

Example with higher concurrency:

```
jmeter -n -t food-ordering-load-test.jmx -Jthreads=50 -Jrampup=20 -Jloops=100 -l results.jtl -e -o report/
```

Note: since every iteration reuses the same seeded customer's credit balance, don't run so many
total orders that `price * threads * loops` exceeds the seeded 50,000.00 credit, or later
iterations will start failing payment validation (that's a correctness signal from the system,
not a test-plan bug).
