package com.food.ordering.system.order.service.dataaccess.idempotency.repository;

import com.food.ordering.system.order.service.dataaccess.idempotency.entity.IdempotentOrderRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface IdempotentOrderRequestJpaRepository extends JpaRepository<IdempotentOrderRequestEntity, UUID> {
}
