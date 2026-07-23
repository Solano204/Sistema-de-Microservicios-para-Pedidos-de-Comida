package com.food.ordering.system.order.service.application.rest;

import com.food.ordering.system.domain.valueobject.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class OrderSummaryResponse {
    private final UUID orderTrackingId;
    private final UUID customerId;
    private final UUID restaurantId;
    private final BigDecimal price;
    private final OrderStatus orderStatus;
}
