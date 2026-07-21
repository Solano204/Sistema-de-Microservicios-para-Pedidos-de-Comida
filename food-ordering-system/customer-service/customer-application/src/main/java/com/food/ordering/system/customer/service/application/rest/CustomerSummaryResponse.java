package com.food.ordering.system.customer.service.application.rest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class CustomerSummaryResponse {
    private final UUID customerId;
    private final String username;
    private final String firstName;
    private final String lastName;
}
