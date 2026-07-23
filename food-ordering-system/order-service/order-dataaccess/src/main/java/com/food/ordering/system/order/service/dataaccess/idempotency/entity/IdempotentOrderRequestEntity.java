package com.food.ordering.system.order.service.dataaccess.idempotency.entity;

import com.food.ordering.system.domain.valueobject.OrderStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "idempotency_key", schema = "order")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IdempotentOrderRequestEntity {
    @Id
    private UUID idempotencyKey;
    private UUID orderTrackingId;
    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus;
    private String message;
    private ZonedDateTime createdAt;
}
