package com.food.ordering.system.customer.service.application.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.food.ordering.system.customer.service.application.handler.CustomerGlobalExceptionHandler;
import com.food.ordering.system.customer.service.domain.create.CreateCustomerCommand;
import com.food.ordering.system.customer.service.domain.create.CreateCustomerResponse;
import com.food.ordering.system.customer.service.domain.exception.CustomerDomainException;
import com.food.ordering.system.customer.service.domain.ports.input.service.CustomerApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CustomerControllerTest {

    private final CustomerApplicationService customerApplicationService = mock(CustomerApplicationService.class);
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new CustomerController(customerApplicationService))
            .setControllerAdvice(new CustomerGlobalExceptionHandler())
            .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
            .build();

    private final UUID CUSTOMER_ID = UUID.randomUUID();

    @BeforeEach
    void resetMock() {
        reset(customerApplicationService);
    }

    private CreateCustomerCommand command() {
        return CreateCustomerCommand.builder()
                .customerId(CUSTOMER_ID)
                .username("jdoe")
                .firstName("John")
                .lastName("Doe")
                .build();
    }

    @Test
    void createCustomer_returnsOk() throws Exception {
        when(customerApplicationService.createCustomer(any()))
                .thenReturn(CreateCustomerResponse.builder()
                        .customerId(CUSTOMER_ID)
                        .message("Customer saved successfully!")
                        .build());

        mockMvc.perform(post("/customers")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(command())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerId").value(CUSTOMER_ID.toString()))
                .andExpect(jsonPath("$.message").value("Customer saved successfully!"));
    }

    @Test
    void createCustomer_returnsBadRequest_whenDomainExceptionThrown() throws Exception {
        when(customerApplicationService.createCustomer(any()))
                .thenThrow(new CustomerDomainException("Could not save customer with id " + CUSTOMER_ID));

        mockMvc.perform(post("/customers")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(command())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Could not save customer with id " + CUSTOMER_ID));
    }
}
