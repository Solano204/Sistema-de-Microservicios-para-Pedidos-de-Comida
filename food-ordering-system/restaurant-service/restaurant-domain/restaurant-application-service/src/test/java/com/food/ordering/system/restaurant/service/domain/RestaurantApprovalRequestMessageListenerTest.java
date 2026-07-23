package com.food.ordering.system.restaurant.service.domain;

import com.food.ordering.system.domain.valueobject.Money;
import com.food.ordering.system.domain.valueobject.OrderApprovalStatus;
import com.food.ordering.system.domain.valueobject.OrderId;
import com.food.ordering.system.domain.valueobject.ProductId;
import com.food.ordering.system.domain.valueobject.RestaurantId;
import com.food.ordering.system.domain.valueobject.RestaurantOrderStatus;
import com.food.ordering.system.outbox.OutboxStatus;
import com.food.ordering.system.restaurant.service.domain.dto.RestaurantApprovalRequest;
import com.food.ordering.system.restaurant.service.domain.entity.OrderApproval;
import com.food.ordering.system.restaurant.service.domain.entity.OrderDetail;
import com.food.ordering.system.restaurant.service.domain.entity.Product;
import com.food.ordering.system.restaurant.service.domain.entity.Restaurant;
import com.food.ordering.system.restaurant.service.domain.exception.RestaurantNotFoundException;
import com.food.ordering.system.restaurant.service.domain.outbox.model.OrderOutboxMessage;
import com.food.ordering.system.restaurant.service.domain.ports.input.message.listener.RestaurantApprovalRequestMessageListener;
import com.food.ordering.system.restaurant.service.domain.ports.output.repository.OrderApprovalRepository;
import com.food.ordering.system.restaurant.service.domain.ports.output.repository.OrderOutboxRepository;
import com.food.ordering.system.restaurant.service.domain.ports.output.repository.RestaurantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest(classes = RestaurantTestConfiguration.class)
class RestaurantApprovalRequestMessageListenerTest {

    @Autowired
    private RestaurantApprovalRequestMessageListener restaurantApprovalRequestMessageListener;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private OrderApprovalRepository orderApprovalRepository;

    @Autowired
    private OrderOutboxRepository orderOutboxRepository;

    private final UUID RESTAURANT_ID = UUID.randomUUID();
    private final UUID ORDER_ID = UUID.randomUUID();
    private final UUID PRODUCT_ID = UUID.randomUUID();
    private final UUID SAGA_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        reset(restaurantRepository, orderApprovalRepository, orderOutboxRepository);
        when(orderOutboxRepository.findByTypeAndSagaIdAndOutboxStatus(anyString(), any(UUID.class), any(OutboxStatus.class)))
                .thenReturn(Optional.empty());
        when(orderApprovalRepository.save(any(OrderApproval.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderOutboxRepository.save(any(OrderOutboxMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private RestaurantApprovalRequest request(BigDecimal price) {
        return RestaurantApprovalRequest.builder()
                .id(UUID.randomUUID().toString())
                .sagaId(SAGA_ID.toString())
                .restaurantId(RESTAURANT_ID.toString())
                .orderId(ORDER_ID.toString())
                .restaurantOrderStatus(RestaurantOrderStatus.PAID)
                .products(List.of(Product.builder().productId(new ProductId(PRODUCT_ID)).quantity(1).build()))
                .price(price)
                .createdAt(Instant.now())
                .build();
    }

    private Restaurant existingActiveRestaurant() {
        return Restaurant.builder()
                .restaurantId(new RestaurantId(RESTAURANT_ID))
                .active(true)
                .orderDetail(OrderDetail.builder()
                        .orderId(new OrderId(ORDER_ID))
                        .products(List.of(com.food.ordering.system.restaurant.service.domain.entity.Product.builder()
                                .productId(new ProductId(PRODUCT_ID))
                                .name("Pizza")
                                .price(new Money(new BigDecimal("50.00")))
                                .quantity(1)
                                .available(true)
                                .build()))
                        .build())
                .build();
    }

    @Test
    void approveOrder_approvesWhenPriceMatchesAndProductAvailable() {
        when(restaurantRepository.findRestaurantInformation(any(Restaurant.class)))
                .thenReturn(Optional.of(existingActiveRestaurant()));

        restaurantApprovalRequestMessageListener.approveOrder(request(new BigDecimal("50.00")));

        ArgumentCaptor<OrderApproval> captor = ArgumentCaptor.forClass(OrderApproval.class);
        verify(orderApprovalRepository).save(captor.capture());
        assertEquals(OrderApprovalStatus.APPROVED, captor.getValue().getApprovalStatus());
        verify(orderOutboxRepository).save(any(OrderOutboxMessage.class));
    }

    @Test
    void approveOrder_rejectsWhenPriceDoesNotMatch() {
        when(restaurantRepository.findRestaurantInformation(any(Restaurant.class)))
                .thenReturn(Optional.of(existingActiveRestaurant()));

        restaurantApprovalRequestMessageListener.approveOrder(request(new BigDecimal("999.00")));

        ArgumentCaptor<OrderApproval> captor = ArgumentCaptor.forClass(OrderApproval.class);
        verify(orderApprovalRepository).save(captor.capture());
        assertEquals(OrderApprovalStatus.REJECTED, captor.getValue().getApprovalStatus());
    }

    @Test
    void approveOrder_throwsWhenRestaurantNotFound() {
        when(restaurantRepository.findRestaurantInformation(any(Restaurant.class)))
                .thenReturn(Optional.empty());

        assertThrows(RestaurantNotFoundException.class,
                () -> restaurantApprovalRequestMessageListener.approveOrder(request(new BigDecimal("50.00"))));
        verifyNoInteractions(orderApprovalRepository);
    }

    @Test
    void approveOrder_isIdempotent_whenOutboxMessageAlreadyCompleted() {
        when(orderOutboxRepository.findByTypeAndSagaIdAndOutboxStatus(anyString(), any(UUID.class), any(OutboxStatus.class)))
                .thenReturn(Optional.of(OrderOutboxMessage.builder().id(UUID.randomUUID()).build()));

        restaurantApprovalRequestMessageListener.approveOrder(request(new BigDecimal("50.00")));

        verifyNoInteractions(restaurantRepository);
        verify(orderApprovalRepository, never()).save(any());
    }
}
