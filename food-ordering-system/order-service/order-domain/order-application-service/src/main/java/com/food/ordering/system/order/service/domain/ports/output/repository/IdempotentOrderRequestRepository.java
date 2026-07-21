package com.food.ordering.system.order.service.domain.ports.output.repository;

import com.food.ordering.system.order.service.domain.dto.create.CreateOrderResponse;

import java.util.Optional;
import java.util.UUID;

public interface IdempotentOrderRequestRepository {

    Optional<CreateOrderResponse> findCachedResponse(UUID idempotencyKey);

    void save(UUID idempotencyKey, CreateOrderResponse response);
}
