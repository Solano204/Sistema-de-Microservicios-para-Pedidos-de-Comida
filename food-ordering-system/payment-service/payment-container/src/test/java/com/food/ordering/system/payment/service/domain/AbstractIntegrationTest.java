package com.food.ordering.system.payment.service.domain;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

// Same fix as order-service's AbstractIntegrationTest (see TESTING_NOTES.md): this service's
// application.yml points spring.datasource.url at a real local Postgres
// (jdbc:postgresql://localhost:5432/...), which is exactly what PaymentRequestMessageListenerTest
// was silently depending on before this. Same postgres:17.2-alpine image as
// infrastructure/docker-compose and as order-service's own container, and spring.sql.init.mode=ALWAYS
// (see application.yml) still fires init-schema.sql/init-data.sql against this container on context
// startup the same way it does against the real dev Postgres - no separate test schema setup needed.
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
                POSTGRES.getJdbcUrl() + "&currentSchema=payment&binaryTransfer=true&reWriteBatchedInserts=true&stringtype=unspecified");
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
}
