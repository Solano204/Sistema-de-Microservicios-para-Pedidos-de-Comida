package com.food.ordering.system.customer.service.application.rest;

import com.food.ordering.system.customer.service.dataaccess.customer.entity.CustomerEntity;
import com.food.ordering.system.customer.service.dataaccess.customer.repository.CustomerJpaRepository;
import com.food.ordering.system.customer.service.domain.create.CreateCustomerCommand;
import com.food.ordering.system.customer.service.domain.create.CreateCustomerResponse;
import com.food.ordering.system.customer.service.domain.ports.input.service.CustomerApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@Tag(name = "Customers")
@RequestMapping(value = "/customers", produces = "application/vnd.api.v1+json")
public class CustomerController {

    private final CustomerApplicationService customerApplicationService;
    private final CustomerJpaRepository customerJpaRepository;

    public CustomerController(CustomerApplicationService customerApplicationService,
                               CustomerJpaRepository customerJpaRepository) {
        this.customerApplicationService = customerApplicationService;
        this.customerJpaRepository = customerJpaRepository;
    }

    @Operation(summary = "Register a customer")
    @PostMapping
    public ResponseEntity<CreateCustomerResponse> createCustomer(@RequestBody CreateCustomerCommand
                                                                             createCustomerCommand) {
        log.info("Creating customer with username: {}", createCustomerCommand.getUsername());
        CreateCustomerResponse response = customerApplicationService.createCustomer(createCustomerCommand);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{customerId}")
                .buildAndExpand(response.getCustomerId())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "List every registered customer")
    @GetMapping
    public List<CustomerSummaryResponse> getAllCustomers() {
        List<CustomerEntity> customers = customerJpaRepository.findAll();
        log.info("Returning {} customers", customers.size());
        return customers.stream()
                .map(entity -> CustomerSummaryResponse.builder()
                        .customerId(entity.getId())
                        .username(entity.getUsername())
                        .firstName(entity.getFirstName())
                        .lastName(entity.getLastName())
                        .build())
                .collect(Collectors.toList());
    }

}
