package com.food.ordering.system.order.service.domain;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

// Spring Boot is on 3.0.5 here, which predates the @ServiceConnection
// annotation (added in 3.1) - wiring the container's JDBC URL in manually via
// @DynamicPropertySource instead, which works on any Spring Boot 2.4+/3.x.
//
// Same Postgres image/version as infrastructure/docker-compose (17.2-alpine)
// so this doesn't test against a subtly different engine than what actually
// runs locally. spring.sql.init.mode=ALWAYS (see application.yml) still
// fires against this container on context startup exactly like it does
// against the real dev Postgres, so init-schema.sql provisions the schema
// here too - no separate test schema setup needed.
@Testcontainers
public abstract class AbstractIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17.2-alpine")
            .withDatabaseName("postgres")
            .withUsername("postgres")
            .withPassword("admin");

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () ->
                POSTGRES.getJdbcUrl() + "&currentSchema=order&binaryTransfer=true&reWriteBatchedInserts=true&stringtype=unspecified");
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
}
