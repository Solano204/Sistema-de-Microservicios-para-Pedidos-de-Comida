package com.food.ordering.system.customer.service.domain;

import com.food.ordering.system.customer.service.domain.create.CreateCustomerCommand;
import com.food.ordering.system.customer.service.domain.create.CreateCustomerResponse;
import com.food.ordering.system.customer.service.domain.entity.Customer;
import com.food.ordering.system.customer.service.domain.exception.CustomerDomainException;
import com.food.ordering.system.customer.service.domain.ports.input.service.CustomerApplicationService;
import com.food.ordering.system.customer.service.domain.ports.output.repository.CustomerRepository;
import com.food.ordering.system.domain.valueobject.CustomerId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;

@SpringBootTest(classes = CustomerTestConfiguration.class)
class CustomerApplicationServiceTest {

    @Autowired
    private CustomerApplicationService customerApplicationService;

    @Autowired
    private CustomerRepository customerRepository;

    private final UUID CUSTOMER_ID = UUID.randomUUID();

    private CreateCustomerCommand command() {
        return CreateCustomerCommand.builder()
                .customerId(CUSTOMER_ID)
                .username("jdoe")
                .firstName("John")
                .lastName("Doe")
                .build();
    }

    @BeforeEach
    void resetMocks() {
        reset(customerRepository);
    }

    @Test
    void createCustomer_success() {
        when(customerRepository.createCustomer(any(Customer.class)))
                .thenReturn(new Customer(new CustomerId(CUSTOMER_ID), "jdoe", "John", "Doe"));

        CreateCustomerResponse response = customerApplicationService.createCustomer(command());

        assertEquals(CUSTOMER_ID, response.getCustomerId());
        assertEquals("Customer saved successfully!", response.getMessage());
    }

    @Test
    void createCustomer_throwsWhenRepositoryFailsToSave() {
        when(customerRepository.createCustomer(any(Customer.class))).thenReturn(null);

        assertThrows(CustomerDomainException.class, () -> customerApplicationService.createCustomer(command()));
    }
}
