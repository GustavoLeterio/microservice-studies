package com.gustavoleterio.microservices.customer_microservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "spring.mongodb.uri=mongodb://localhost:27017/customer_db")
class CustomerMicroserviceApplicationTests {

	@Test
	void contextLoads() {
	}

}
