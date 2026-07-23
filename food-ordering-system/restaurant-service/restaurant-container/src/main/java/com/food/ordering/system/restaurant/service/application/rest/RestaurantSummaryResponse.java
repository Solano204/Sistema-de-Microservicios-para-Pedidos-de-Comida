package com.food.ordering.system.restaurant.service.application.rest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class RestaurantSummaryResponse {
    private final UUID restaurantId;
    private final String name;
    private final boolean active;
    private final List<ProductSummaryResponse> products;
}
