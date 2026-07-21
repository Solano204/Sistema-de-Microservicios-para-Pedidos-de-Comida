package com.food.ordering.system.order.service.application.rest;

import com.food.ordering.system.order.service.dataaccess.order.entity.OrderEntity;
import com.food.ordering.system.order.service.dataaccess.order.repository.OrderJpaRepository;
import com.food.ordering.system.order.service.domain.dto.create.CreateOrderCommand;
import com.food.ordering.system.order.service.domain.dto.create.CreateOrderResponse;
import com.food.ordering.system.order.service.domain.dto.track.TrackOrderQuery;
import com.food.ordering.system.order.service.domain.dto.track.TrackOrderResponse;
import com.food.ordering.system.order.service.domain.ports.input.service.OrderApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@Tag(name = "Orders")
@RequestMapping(value = "/orders", produces = "application/vnd.api.v1+json")
public class OrderController {

    private final OrderApplicationService orderApplicationService;
    private final OrderJpaRepository orderJpaRepository;

    public OrderController(OrderApplicationService orderApplicationService,
                            OrderJpaRepository orderJpaRepository) {
        this.orderApplicationService = orderApplicationService;
        this.orderJpaRepository = orderJpaRepository;
    }

    @Operation(summary = "Place an order",
            description = "Creates an order and starts the payment/restaurant-approval saga. " +
                    "Optional Idempotency-Key header for safe retries.")
    @PostMapping
    public ResponseEntity<CreateOrderResponse> createOrder(
            @RequestBody CreateOrderCommand createOrderCommand,
            @RequestHeader(value = "Idempotency-Key", required = false) UUID idempotencyKey) {
        log.info("Creating order for customer: {} at restaurant: {}", createOrderCommand.getCustomerId(),
                createOrderCommand.getRestaurantId());
        CreateOrderResponse createOrderResponse = orderApplicationService.createOrder(createOrderCommand, idempotencyKey);
        log.info("Order created with tracking id: {}", createOrderResponse.getOrderTrackingId());

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{trackingId}")
                .buildAndExpand(createOrderResponse.getOrderTrackingId())
                .toUri();
        return ResponseEntity.created(location).body(createOrderResponse);
    }

    @Operation(summary = "Track an order's status")
    @GetMapping("/{trackingId}")
    public ResponseEntity<TrackOrderResponse> getOrderByTrackingId(@PathVariable UUID trackingId) {
       TrackOrderResponse trackOrderResponse =
               orderApplicationService.trackOrder(TrackOrderQuery.builder().orderTrackingId(trackingId).build());
       log.info("Returning order status with tracking id: {}", trackOrderResponse.getOrderTrackingId());
       return  ResponseEntity.ok(trackOrderResponse);
    }

    @Operation(summary = "List every order")
    @GetMapping
    public List<OrderSummaryResponse> getAllOrders() {
        List<OrderEntity> orders = orderJpaRepository.findAll();
        log.info("Returning {} orders", orders.size());
        return orders.stream()
                .map(entity -> OrderSummaryResponse.builder()
                        .orderTrackingId(entity.getTrackingId())
                        .customerId(entity.getCustomerId())
                        .restaurantId(entity.getRestaurantId())
                        .price(entity.getPrice())
                        .orderStatus(entity.getOrderStatus())
                        .build())
                .collect(Collectors.toList());
    }
}
