package com.food.ordering.system.order.service.application.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.food.ordering.system.domain.valueobject.OrderStatus;
import com.food.ordering.system.order.service.application.exception.handler.OrderGlobalExceptionHandler;
import com.food.ordering.system.order.service.domain.dto.create.CreateOrderCommand;
import com.food.ordering.system.order.service.domain.dto.create.CreateOrderResponse;
import com.food.ordering.system.order.service.domain.dto.create.OrderAddress;
import com.food.ordering.system.order.service.domain.dto.create.OrderItem;
import com.food.ordering.system.order.service.domain.dto.track.TrackOrderResponse;
import com.food.ordering.system.order.service.domain.exception.OrderDomainException;
import com.food.ordering.system.order.service.domain.exception.OrderNotFoundException;
import com.food.ordering.system.order.service.domain.ports.input.service.OrderApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class OrderControllerTest {

    private final OrderApplicationService orderApplicationService = mock(OrderApplicationService.class);
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new OrderController(orderApplicationService))
            .setControllerAdvice(new OrderGlobalExceptionHandler())
            .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
            .build();

    private final UUID CUSTOMER_ID = UUID.randomUUID();
    private final UUID RESTAURANT_ID = UUID.randomUUID();
    private final UUID PRODUCT_ID = UUID.randomUUID();
    private final UUID TRACKING_ID = UUID.randomUUID();

    private CreateOrderCommand createOrderCommand() {
        return CreateOrderCommand.builder()
                .customerId(CUSTOMER_ID)
                .restaurantId(RESTAURANT_ID)
                .address(OrderAddress.builder().street("street_1").postalCode("1000AB").city("Paris").build())
                .price(new BigDecimal("50.00"))
                .items(List.of(OrderItem.builder()
                        .productId(PRODUCT_ID)
                        .quantity(1)
                        .price(new BigDecimal("50.00"))
                        .subTotal(new BigDecimal("50.00"))
                        .build()))
                .build();
    }

    @BeforeEach
    void resetMock() {
        org.mockito.Mockito.reset(orderApplicationService);
    }

    @Test
    void createOrder_returnsOkWithTrackingId() throws Exception {
        when(orderApplicationService.createOrder(any())).thenReturn(CreateOrderResponse.builder()
                .orderTrackingId(TRACKING_ID)
                .orderStatus(OrderStatus.PENDING)
                .message("Order created successfully")
                .build());

        mockMvc.perform(post("/orders")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createOrderCommand())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderTrackingId").value(TRACKING_ID.toString()))
                .andExpect(jsonPath("$.orderStatus").value("PENDING"))
                .andExpect(jsonPath("$.message").value("Order created successfully"));
    }

    @Test
    void createOrder_returnsBadRequest_whenDomainValidationFails() throws Exception {
        when(orderApplicationService.createOrder(any()))
                .thenThrow(new OrderDomainException("Total price: 50.00 is not equal to Order items total: 40.00!"));

        mockMvc.perform(post("/orders")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createOrderCommand())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Total price: 50.00 is not equal to Order items total: 40.00!"));
    }

    @Test
    void trackOrder_returnsOk() throws Exception {
        when(orderApplicationService.trackOrder(any())).thenReturn(TrackOrderResponse.builder()
                .orderTrackingId(TRACKING_ID)
                .orderStatus(OrderStatus.PAID)
                .failureMessages(List.of())
                .build());

        mockMvc.perform(get("/orders/{trackingId}", TRACKING_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderTrackingId").value(TRACKING_ID.toString()))
                .andExpect(jsonPath("$.orderStatus").value("PAID"));
    }

    @Test
    void trackOrder_returnsNotFound_whenOrderMissing() throws Exception {
        when(orderApplicationService.trackOrder(any()))
                .thenThrow(new OrderNotFoundException("Order with tracking id " + TRACKING_ID + " not found!"));

        mockMvc.perform(get("/orders/{trackingId}", TRACKING_ID))
                .andExpect(status().isNotFound());
    }
}
