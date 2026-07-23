package com.food.ordering.system.customer.service.application.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.food.ordering.system.customer.service.application.handler.CustomerGlobalExceptionHandler;
import com.food.ordering.system.customer.service.dataaccess.customer.entity.CustomerEntity;
import com.food.ordering.system.customer.service.dataaccess.customer.repository.CustomerJpaRepository;
import com.food.ordering.system.customer.service.domain.create.CreateCustomerCommand;
import com.food.ordering.system.customer.service.domain.create.CreateCustomerResponse;
import com.food.ordering.system.customer.service.domain.exception.CustomerDomainException;
import com.food.ordering.system.customer.service.domain.ports.input.service.CustomerApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CustomerControllerTest {

    private final CustomerApplicationService customerApplicationService = mock(CustomerApplicationService.class);
    private final CustomerJpaRepository customerJpaRepository = mock(CustomerJpaRepository.class);
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private final MockMvc mockMvc = MockMvcBuilders
            .standaloneSetup(new CustomerController(customerApplicationService, customerJpaRepository))
            .setControllerAdvice(new CustomerGlobalExceptionHandler())
            .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
            .build();

    private final UUID CUSTOMER_ID = UUID.randomUUID();

    @BeforeEach
    void resetMock() {
        reset(customerApplicationService, customerJpaRepository);
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
                .andExpect(status().isCreated())
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
                .andExpect(jsonPath("$.detail").value("Could not save customer with id " + CUSTOMER_ID));
    }

    @Test
    void getAllCustomers_returnsEveryRowFromTheJpaRepository() throws Exception {
        CustomerEntity entity = CustomerEntity.builder()
                .id(CUSTOMER_ID)
                .username("jdoe")
                .firstName("John")
                .lastName("Doe")
                .build();
        when(customerJpaRepository.findAll()).thenReturn(List.of(entity));

        mockMvc.perform(get("/customers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].customerId").value(CUSTOMER_ID.toString()))
                .andExpect(jsonPath("$[0].username").value("jdoe"))
                .andExpect(jsonPath("$[0].firstName").value("John"))
                .andExpect(jsonPath("$[0].lastName").value("Doe"));
    }

    @Test
    void getAllCustomers_returnsEmptyListWhenNoneExist() throws Exception {
        when(customerJpaRepository.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/customers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }
}
