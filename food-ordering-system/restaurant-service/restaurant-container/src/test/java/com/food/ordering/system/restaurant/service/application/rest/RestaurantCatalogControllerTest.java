package com.food.ordering.system.restaurant.service.application.rest;

import com.food.ordering.system.dataaccess.restaurant.entity.RestaurantEntity;
import com.food.ordering.system.dataaccess.restaurant.repository.RestaurantJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RestaurantCatalogControllerTest {

    private final RestaurantJpaRepository restaurantJpaRepository = mock(RestaurantJpaRepository.class);
    private final MockMvc mockMvc =
            MockMvcBuilders.standaloneSetup(new RestaurantCatalogController(restaurantJpaRepository)).build();

    private final UUID RESTAURANT_ID = UUID.randomUUID();
    private final UUID PRODUCT_ID_1 = UUID.randomUUID();
    private final UUID PRODUCT_ID_2 = UUID.randomUUID();

    @BeforeEach
    void resetMock() {
        reset(restaurantJpaRepository);
    }

    private RestaurantEntity row(UUID productId, String productName, String price, boolean available) {
        return RestaurantEntity.builder()
                .restaurantId(RESTAURANT_ID)
                .restaurantName("restaurant_1")
                .restaurantActive(true)
                .productId(productId)
                .productName(productName)
                .productPrice(new BigDecimal(price))
                .productAvailable(available)
                .build();
    }

    @Test
    void getAllRestaurants_groupsFlatRowsByRestaurantIntoNestedProducts() throws Exception {
        when(restaurantJpaRepository.findAll()).thenReturn(List.of(
                row(PRODUCT_ID_1, "product_1", "25.00", false),
                row(PRODUCT_ID_2, "product_2", "1.00", true)
        ));

        mockMvc.perform(get("/restaurants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].restaurantId").value(RESTAURANT_ID.toString()))
                .andExpect(jsonPath("$[0].name").value("restaurant_1"))
                .andExpect(jsonPath("$[0].active").value(true))
                .andExpect(jsonPath("$[0].products.length()").value(2))
                .andExpect(jsonPath("$[0].products[0].productId").value(PRODUCT_ID_1.toString()))
                .andExpect(jsonPath("$[0].products[0].available").value(false))
                .andExpect(jsonPath("$[0].products[1].productId").value(PRODUCT_ID_2.toString()))
                .andExpect(jsonPath("$[0].products[1].available").value(true));
    }

    @Test
    void getAllRestaurants_returnsEmptyListWhenNoneExist() throws Exception {
        when(restaurantJpaRepository.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/restaurants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }
}
