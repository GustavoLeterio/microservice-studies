package com.gustavoleterio.microservices.product_microservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:postgresql://localhost:5432/product_db",
		"spring.datasource.username=root",
		"spring.datasource.password=pass"
})
class ProductMicroserviceApplicationTests {

	@Test
	void contextLoads() {
	}

}
