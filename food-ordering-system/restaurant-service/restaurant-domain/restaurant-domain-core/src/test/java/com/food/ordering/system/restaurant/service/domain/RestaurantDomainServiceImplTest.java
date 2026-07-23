package com.food.ordering.system.restaurant.service.domain;

import com.food.ordering.system.domain.valueobject.Money;
import com.food.ordering.system.domain.valueobject.OrderId;
import com.food.ordering.system.domain.valueobject.OrderStatus;
import com.food.ordering.system.domain.valueobject.ProductId;
import com.food.ordering.system.domain.valueobject.RestaurantId;
import com.food.ordering.system.restaurant.service.domain.entity.OrderDetail;
import com.food.ordering.system.restaurant.service.domain.entity.Product;
import com.food.ordering.system.restaurant.service.domain.entity.Restaurant;
import com.food.ordering.system.restaurant.service.domain.event.OrderApprovalEvent;
import com.food.ordering.system.restaurant.service.domain.event.OrderApprovedEvent;
import com.food.ordering.system.restaurant.service.domain.event.OrderRejectedEvent;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class RestaurantDomainServiceImplTest {

    private final RestaurantDomainService restaurantDomainService = new RestaurantDomainServiceImpl();

    private Product availableProduct() {
        return Product.builder()
                .productId(new ProductId(UUID.randomUUID()))
                .name("Pizza")
                .price(new Money(new BigDecimal("50.00")))
                .quantity(2)
                .available(true)
                .build();
    }

    private Restaurant restaurantWith(OrderStatus orderStatus, Money totalAmount, List<Product> products) {
        return Restaurant.builder()
                .restaurantId(new RestaurantId(UUID.randomUUID()))
                .active(true)
                .orderDetail(OrderDetail.builder()
                        .orderId(new OrderId(UUID.randomUUID()))
                        .orderStatus(orderStatus)
                        .totalAmount(totalAmount)
                        .products(products)
                        .build())
                .build();
    }

    @Test
    void validateOrder_approved_whenPaidAvailableAndPriceMatches() {
        Product product = availableProduct();
        Restaurant restaurant = restaurantWith(OrderStatus.PAID, new Money(new BigDecimal("100.00")), List.of(product));
        List<String> failureMessages = new ArrayList<>();

        OrderApprovalEvent event = restaurantDomainService.validateOrder(restaurant, failureMessages);

        assertTrue(failureMessages.isEmpty());
        assertInstanceOf(OrderApprovedEvent.class, event);
        assertNotNull(restaurant.getOrderApproval());
    }

    @Test
    void validateOrder_rejected_whenOrderNotPaid() {
        Product product = availableProduct();
        Restaurant restaurant = restaurantWith(OrderStatus.PENDING, new Money(new BigDecimal("100.00")), List.of(product));
        List<String> failureMessages = new ArrayList<>();

        OrderApprovalEvent event = restaurantDomainService.validateOrder(restaurant, failureMessages);

        assertFalse(failureMessages.isEmpty());
        assertInstanceOf(OrderRejectedEvent.class, event);
        assertTrue(failureMessages.get(0).contains("Payment is not completed"));
    }

    @Test
    void validateOrder_rejected_whenProductNotAvailable() {
        Product product = Product.builder()
                .productId(new ProductId(UUID.randomUUID()))
                .name("Pizza")
                .price(new Money(new BigDecimal("50.00")))
                .quantity(2)
                .available(false)
                .build();
        Restaurant restaurant = restaurantWith(OrderStatus.PAID, new Money(new BigDecimal("100.00")), List.of(product));
        List<String> failureMessages = new ArrayList<>();

        restaurantDomainService.validateOrder(restaurant, failureMessages);

        assertTrue(failureMessages.stream().anyMatch(m -> m.contains("is not available")));
    }

    @Test
    void validateOrder_rejected_whenPriceTotalMismatch() {
        Product product = availableProduct();
        // orderDetail total (999) does not match product price(50) * quantity(2) = 100
        Restaurant restaurant = restaurantWith(OrderStatus.PAID, new Money(new BigDecimal("999.00")), List.of(product));
        List<String> failureMessages = new ArrayList<>();

        restaurantDomainService.validateOrder(restaurant, failureMessages);

        assertTrue(failureMessages.stream().anyMatch(m -> m.contains("Price total is not correct")));
    }
}
