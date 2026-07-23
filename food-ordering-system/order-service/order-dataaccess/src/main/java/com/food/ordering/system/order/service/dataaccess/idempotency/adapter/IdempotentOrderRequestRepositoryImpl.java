package com.food.ordering.system.order.service.dataaccess.idempotency.adapter;

import com.food.ordering.system.order.service.dataaccess.idempotency.entity.IdempotentOrderRequestEntity;
import com.food.ordering.system.order.service.dataaccess.idempotency.repository.IdempotentOrderRequestJpaRepository;
import com.food.ordering.system.order.service.domain.dto.create.CreateOrderResponse;
import com.food.ordering.system.order.service.domain.ports.output.repository.IdempotentOrderRequestRepository;
import org.springframework.stereotype.Component;

import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.UUID;

@Component
public class IdempotentOrderRequestRepositoryImpl implements IdempotentOrderRequestRepository {

    private final IdempotentOrderRequestJpaRepository jpaRepository;

    public IdempotentOrderRequestRepositoryImpl(IdempotentOrderRequestJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<CreateOrderResponse> findCachedResponse(UUID idempotencyKey) {
        return jpaRepository.findById(idempotencyKey)
                .map(entity -> CreateOrderResponse.builder()
                        .orderTrackingId(entity.getOrderTrackingId())
                        .orderStatus(entity.getOrderStatus())
                        .message(entity.getMessage())
                        .build());
    }

    @Override
    public void save(UUID idempotencyKey, CreateOrderResponse response) {
        jpaRepository.save(IdempotentOrderRequestEntity.builder()
                .idempotencyKey(idempotencyKey)
                .orderTrackingId(response.getOrderTrackingId())
                .orderStatus(response.getOrderStatus())
                .message(response.getMessage())
                .createdAt(ZonedDateTime.now())
                .build());
    }
}
