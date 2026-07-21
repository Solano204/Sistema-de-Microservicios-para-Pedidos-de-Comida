package com.food.ordering.system.restaurant.service.application.rest;

import com.food.ordering.system.dataaccess.restaurant.entity.RestaurantEntity;
import com.food.ordering.system.dataaccess.restaurant.repository.RestaurantJpaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Read-only admin/browse endpoint - restaurant-service has no other REST surface
 * (it's Kafka-only for the actual saga). Queries order_restaurant_m_view directly
 * via the same RestaurantJpaRepository order-service already uses to validate
 * orders, bypassing the domain layer entirely since this is pure presentation,
 * not a saga concern. A restaurant with zero products won't appear (the view is
 * an inner join across restaurants/products/restaurant_products).
 */
@Slf4j
@RestController
@Tag(name = "Restaurants")
@RequestMapping(value = "/restaurants", produces = "application/vnd.api.v1+json")
public class RestaurantCatalogController {

    private final RestaurantJpaRepository restaurantJpaRepository;

    public RestaurantCatalogController(RestaurantJpaRepository restaurantJpaRepository) {
        this.restaurantJpaRepository = restaurantJpaRepository;
    }

    @Operation(summary = "List every restaurant with its available products")
    @GetMapping
    public List<RestaurantSummaryResponse> getAllRestaurants() {
        List<RestaurantEntity> rows = restaurantJpaRepository.findAll();
        log.info("Returning restaurant catalog ({} restaurant-product rows)", rows.size());

        Map<UUID, List<RestaurantEntity>> byRestaurant = rows.stream()
                .collect(Collectors.groupingBy(RestaurantEntity::getRestaurantId, LinkedHashMap::new, Collectors.toList()));

        return byRestaurant.values().stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    private RestaurantSummaryResponse toSummary(List<RestaurantEntity> restaurantRows) {
        RestaurantEntity first = restaurantRows.get(0);
        List<ProductSummaryResponse> products = restaurantRows.stream()
                .map(row -> ProductSummaryResponse.builder()
                        .productId(row.getProductId())
                        .name(row.getProductName())
                        .price(row.getProductPrice())
                        .available(Boolean.TRUE.equals(row.getProductAvailable()))
                        .build())
                .collect(Collectors.toList());

        return RestaurantSummaryResponse.builder()
                .restaurantId(first.getRestaurantId())
                .name(first.getRestaurantName())
                .active(Boolean.TRUE.equals(first.getRestaurantActive()))
                .products(products)
                .build();
    }
}
