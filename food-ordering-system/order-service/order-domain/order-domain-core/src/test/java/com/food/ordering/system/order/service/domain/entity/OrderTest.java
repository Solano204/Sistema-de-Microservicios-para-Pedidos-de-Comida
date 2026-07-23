package com.food.ordering.system.order.service.domain.entity;

import com.food.ordering.system.domain.valueobject.OrderId;
import com.food.ordering.system.domain.valueobject.OrderStatus;
import com.food.ordering.system.order.service.domain.exception.OrderDomainException;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class OrderTest {

    private Order paidOrder() {
        return Order.builder()
                .orderId(new OrderId(UUID.randomUUID()))
                .orderStatus(OrderStatus.PAID)
                .build();
    }

    @Test
    void pay_transitionsPendingToPaid() {
        Order order = Order.builder()
                .orderId(new OrderId(UUID.randomUUID()))
                .orderStatus(OrderStatus.PENDING)
                .build();

        order.pay();

        assertEquals(OrderStatus.PAID, order.getOrderStatus());
    }

    @Test
    void pay_throwsWhenNotPending() {
        Order order = paidOrder();

        assertThrows(OrderDomainException.class, order::pay);
    }

    @Test
    void cancelFlow_filtersEmptyMessages_andAccumulatesAcrossCalls() {
        Order order = paidOrder();

        order.initCancel(new ArrayList<>(List.of("payment failed", "")));

        assertEquals(OrderStatus.CANCELLING, order.getOrderStatus());
        assertEquals(List.of("payment failed"), order.getFailureMessages());

        order.cancel(new ArrayList<>(List.of("restaurant rejected", "")));

        assertEquals(OrderStatus.CANCELLED, order.getOrderStatus());
        assertEquals(List.of("payment failed", "restaurant rejected"), order.getFailureMessages());
    }

    @Test
    void cancel_throwsWhenOrderStatusInvalid() {
        Order order = Order.builder()
                .orderId(new OrderId(UUID.randomUUID()))
                .orderStatus(OrderStatus.APPROVED)
                .build();

        assertThrows(OrderDomainException.class, () -> order.cancel(new ArrayList<>()));
    }
}
