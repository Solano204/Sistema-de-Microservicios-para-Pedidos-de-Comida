package com.food.ordering.system.customer.service.domain;

import com.food.ordering.system.customer.service.domain.entity.Customer;
import com.food.ordering.system.customer.service.domain.event.CustomerCreatedEvent;
import com.food.ordering.system.domain.valueobject.CustomerId;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;

class CustomerDomainServiceImplTest {

    private final CustomerDomainService customerDomainService = new CustomerDomainServiceImpl();

    @Test
    void validateAndInitiateCustomer_returnsCreatedEventForGivenCustomer() {
        Customer customer = new Customer(new CustomerId(UUID.randomUUID()), "jdoe", "John", "Doe");

        CustomerCreatedEvent event = customerDomainService.validateAndInitiateCustomer(customer);

        assertNotNull(event);
        assertSame(customer, event.getCustomer());
        assertEquals("jdoe", event.getCustomer().getUsername());
    }
}
