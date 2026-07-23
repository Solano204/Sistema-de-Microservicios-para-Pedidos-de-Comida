package com.food.ordering.system.restaurant.service.application.rest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class ProductSummaryResponse {
    private final UUID productId;
    private final String name;
    private final BigDecimal price;
    private final boolean available;
}
