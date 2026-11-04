package com.gustavoleterio.microservices.cart_microservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "spring.mongodb.uri=mongodb://localhost:27017/cart_db")
class CartMicroserviceApplicationTests {

	@Test
	void contextLoads() {
	}

}
