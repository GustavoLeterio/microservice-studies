// Trechos reais das classes Java (imports omitidos para leitura).

// ---------- customer-microservice ----------

export const CUSTOMER_APPLICATION = `
@SpringBootApplication
public class CustomerMicroserviceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CustomerMicroserviceApplication.class, args);
    }
}
`;

export const CUSTOMER_ENTITY = `
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document
public class Customer {
    @Id
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String city;
}
`;

export const CUSTOMER_REPOSITORY = `
public interface CustomerRepository extends MongoRepository<Customer, String> {

}
`;

export const CUSTOMER_CONTROLLER = `
@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService service;

    @GetMapping("/{customerId}")
    public ResponseEntity<CustomerResponse> getCustomerById(@PathVariable String customerId) {
        return ResponseEntity.ok(service.getCustomerById(customerId));
    }
    @GetMapping("/all")
    public ResponseEntity<List<CustomerResponse>> getAllCustomers() {
        return ResponseEntity.ok(service.getAllCustomers());
    }

    @PostMapping()
    public ResponseEntity<String> createCustomer(@Valid @RequestBody CustomerRequest entity) {
        return ResponseEntity.ok(service.createCustomer(entity));
    }

    @PutMapping("/{customerId}")
    public ResponseEntity<Void> updateCustomer(@Valid @RequestBody CustomerRequest entity,
         @PathVariable String customerId) {
        ResponseEntity.ok(service.updateCustomer(entity, customerId));
        return ResponseEntity.accepted().build();
    }

    @DeleteMapping("/{customerId}")
    public ResponseEntity<Void> deleteCustomer( @Valid @PathVariable String customerId) {
        service.deleteCustomer(customerId);
        return ResponseEntity.accepted().build();
    }
}
`;

export const CUSTOMER_SERVICE = `
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository repository;
    private final CustomerMapper mapper;

    public String createCustomer(CustomerRequest customer) {
        Customer entity = repository.save(mapper.toCustomer(customer));
        return entity.getId();
    }

    public String updateCustomer(CustomerRequest customer, String customerId) {
        repository.findById(customerId).orElseThrow(() -> new CustomerNotFoundException("Customer not found with id: " + customerId));
        Customer entity = mapper.toCustomer(customer);
        entity.setId(customerId);
        repository.save(entity);
        return customerId;
    }

    public CustomerResponse getCustomerById(String customerId) {
        return repository.findById(customerId)
                .map(mapper::toCustomerResponse)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with id: " + customerId));
    }

    public List<CustomerResponse> getAllCustomers() {
        return repository
                .findAll().stream()
                .map(mapper::toCustomerResponse)
                .toList();
    }

    public void deleteCustomer(String customerId) {
        repository.findById(customerId).orElseThrow(() -> new CustomerNotFoundException("Customer not found with id: " + customerId));
        repository.deleteById(customerId);
    }
}
`;

export const CUSTOMER_MAPPER = `
@Component
public class CustomerMapper {

    public Customer toCustomer(CustomerRequest request) {
        return Customer.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .phone(request.phone())
                .address(request.address())
                .city(request.city())
                .build();
    }

    public CustomerResponse toCustomerResponse(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .firstName(customer.getFirstName())
                .lastName(customer.getLastName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .city(customer.getCity())
                .build();
    }
}
`;

export const CUSTOMER_REQUEST = `
public record CustomerRequest(
        @NotBlank(message = "First name is required")
        String firstName,
        @NotBlank(message = "Last name is required")
        String lastName,
        @Email(message = "Invalid email address")
        @NotBlank(message = "Email is required")
        String email,
        String phone,
        String address,
        String city) {

}
`;

export const CUSTOMER_RESPONSE = `
@Builder
public record CustomerResponse(
                String id,
                String firstName,
                String lastName,
                String email,
                String phone,
                String address,
                String city) {
}
`;

export const CUSTOMER_NOT_FOUND_EXCEPTION = `
@EqualsAndHashCode (callSuper = true)
@Data
public class CustomerNotFoundException extends RuntimeException {
    private final String message;
}
`;

export const CUSTOMER_EXCEPTION_HANDLER = `
@RestControllerAdvice
@Primary
@Slf4j
public class CustomerExceptionHandler extends GlobalExceptionHandler {

    @ExceptionHandler(CustomerNotFoundException.class)
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public ErrorResponse handleCustomerNotFoundException(CustomerNotFoundException ex) {
        Map<String, String> errors = Map.of("customer", ex.getMessage());
        log.warn("Customer not found: {}", errors.toString());
        return new ErrorResponse(errors, LocalDateTime.now().toString(), "/");
    }
}
`;

// ---------- product-microservice ----------

export const CATEGORY_ENTITY = `
@Entity
@Table(name = "categories")
// @Data is not used because it may cause performance issues because of the lazy
// loading of the entities
// Instead I'm using the getters and setters to avoid the performance issues
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {
    @Id
    @GeneratedValue
    private Integer id;
    @Column (unique = true, nullable = false)
    private String name;
    private String description;
    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    private List<Product> products;
}
`;

export const PRODUCT_ENTITY = `
@Entity
@Table(name = "products")
// @Data is not used because it may cause performance issues because of the lazy loading of the entities
// Instead I'm using the getters and setters to avoid the performance issues
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue
    private Integer id;
    @Column (nullable = false)
    @NotNull (message = "Product name is required")
    private String name;
    private String description;
    @Column (nullable = false)
    @NotNull (message = "Product price is required")
    private double price;
    @Column (nullable = false)
    @NotNull (message = "Product stock is required")
    private Integer stock;
    private String imageUrl;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @PrePersist
    public void prePersist() {
        if(this.stock == null) {
            this.stock = 0;
        }
    }
}
`;

export const CATEGORY_REPOSITORY = `
public interface CategoryRepository extends JpaRepository<Category, Integer> {
    Optional<Category> findByName(String name);
}
`;

export const PRODUCT_REPOSITORY = `
public interface ProductRepository extends JpaRepository<Product, Integer> {

    Optional<List<Product>> findByCategoryId(Integer categoryId);

}
`;

export const CATEGORY_CONTROLLER = `
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService service;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(service.getAllCategories());
    }
    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getCategoryById(id));
    }

    @PostMapping
    public ResponseEntity<Integer> createCategory(@Valid  @RequestBody(required = true) CategoryRequest request) {
        return ResponseEntity.ok(service.createCategory(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<Integer> updateCategory(@PathVariable Integer id, @Valid @RequestBody(required = true) CategoryRequest request) {
        return ResponseEntity.ok(service.updateCategory(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Integer id) {
        service.deleteCategory(id);
        return ResponseEntity.ok().build();
    }
}
`;

export const CATEGORY_SERVICE = `
@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository repository;
    private final CategoryMapper mapper;

    public CategoryResponse getCategoryById(Integer id) {
        return mapper.toCategoryResponse(repository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id)));
    }

    public List<CategoryResponse> getAllCategories() {
        return repository.findAll().stream()
                .map(mapper::toCategoryResponse)
                .toList();
    }

    public Integer createCategory(CategoryRequest request) {
        repository.findByName(request.name()).ifPresent(category -> {
            throw new CategoryAlreadyExistsException("Category with name " + request.name() + " already exists");
        });
        return repository.save(mapper.toCategory(request)).getId();
    }

    public Integer updateCategory(Integer id, CategoryRequest request) {
        repository.findById(id).orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id));
        return repository.save(mapper.toCategory(request, id)).getId();
    }

    public void deleteCategory(Integer id) {
        repository.findById(id).orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id));
        repository.deleteById(id);
    }
}
`;

export const CATEGORY_MAPPER = `
@Service
@RequiredArgsConstructor
public class CategoryMapper {
    private final ProductMapper productMapper;

    public Category toCategory(CategoryRequest categoryRequest, Integer id) {
        return Category.builder()
                .id(id)
                .name(categoryRequest.name())
                .description(categoryRequest.description())
                .build();
    }

    public Category toCategory(CategoryRequest categoryRequest) {
        return toCategory(categoryRequest, null);
    }

    public CategoryResponse toCategoryResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getProducts().stream()
                        .map(productMapper::toProductResponse)
                        .toList());
    }
}
`;

export const CATEGORY_DTOS = `
public record CategoryRequest (
    String name,
    String description
) {

}

public record CategoryResponse (
    Integer id,
    String name,
    String description,
    List<ProductResponse> products
) {

}
`;

export const PRODUCT_CONTROLLER = `
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ProductResponse>> getProductsByCategoryId(@PathVariable Integer categoryId) {
        return ResponseEntity.ok(productService.getProductsByCategoryId(categoryId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Integer id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Integer> updateProduct(@PathVariable Integer id, @RequestBody @Valid ProductRequest productRequest) {
        return ResponseEntity.ok(productService.updateProduct(id, productRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Integer id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<Integer> createProduct(@RequestBody @Valid ProductRequest productRequest) {
        return ResponseEntity.ok(productService.createProduct(productRequest));
    }
}
`;

export const PRODUCT_SERVICE = `
@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository repository;
    private final ProductMapper mapper;
    private final CategoryService categoryService;

    public ProductResponse getProductById(Integer id) {
        return repository.findById(id)
            .map(mapper::toProductResponse)
            .orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + id));
    }

    public List<ProductResponse> getProductsByCategoryId(Integer categoryId) {
        categoryService.getCategoryById(categoryId); // Check if the category exists
        return repository.findByCategoryId(categoryId).orElseThrow(() -> new ProductNotFoundException("Products not found with category id: " + categoryId)).stream()
            .map(mapper::toProductResponse)
            .toList();
    }

    public List<ProductResponse> getAllProducts() {
        return repository.findAll().stream()
            .map(mapper::toProductResponse)
            .toList();
    }

    public Integer createProduct(ProductRequest productRequest) {
        categoryService.getCategoryById(productRequest.categoryId()); // Check if the category exists
        return repository.save(mapper.toProduct(productRequest)).getId();
    }

    public Integer updateProduct(Integer id, ProductRequest productRequest) {
        repository.findById(id).orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + id));
        categoryService.getCategoryById(productRequest.categoryId()); // Check if the category exists
        return repository.save(mapper.toProduct(productRequest, id)).getId();
    }

    public void deleteProduct(Integer id) {
        repository.findById(id).orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + id));
        repository.deleteById(id);
    }
}
`;

export const PRODUCT_MAPPER = `
@Service
@RequiredArgsConstructor
public class ProductMapper {
    public ProductResponse toProductResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getImageUrl(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getCategory().getDescription());
    }

    public Product toProduct(ProductRequest productRequest) {
        return toProduct(productRequest, null);
    }

    public Product toProduct(ProductRequest productRequest, Integer id) {
        return new Product(
                id,
                productRequest.name(),
                productRequest.description(),
                productRequest.price(),
                productRequest.stock(),
                productRequest.imageUrl(),
                Category.builder().id(productRequest.categoryId()).build());
    }
}
`;

export const PRODUCT_REQUEST = `
public record ProductRequest (
    @NotBlank (message = "Product name is required")
    String name,
    String description,
    @NotNull (message = "Product price is required")
    Double price,
    @NotNull (message = "Product stock is required")
    Integer stock,
    String imageUrl,
    Integer categoryId
) {}
`;

export const PRODUCT_RESPONSE = `
public record ProductResponse (
    Integer id,
    String name,
    String description,
    double price,
    Integer stock,
    String imageUrl,
    Integer categoryId,
    String categoryName,
    String categoryDescription
) {}
`;

export const PRODUCT_EXCEPTIONS = `
@EqualsAndHashCode(callSuper = true)
@Data
public class CategoryAlreadyExistsException extends RuntimeException {
    private final String message;
}

@EqualsAndHashCode (callSuper = true)
@Data
public class CategoryNotFoundException extends RuntimeException {
    private final String message;
}

@EqualsAndHashCode (callSuper = true)
@Data
public class ProductNotFoundException extends RuntimeException {
    private final String message;
}
`;

export const SERVICE_EXCEPTION_HANDLER = `
@RestControllerAdvice
@Primary
@Slf4j
public class ServiceExceptionHandler extends GlobalExceptionHandler {

    @ExceptionHandler(CategoryAlreadyExistsException.class)
    @ResponseStatus(value = HttpStatus.CONFLICT)
    public ErrorResponse handleCategoryAlreadyExistsException(CategoryAlreadyExistsException ex) {
        Map<String, String> errors = Map.of("category", ex.getMessage());
        log.warn("Category already exists: {}", errors.toString());
        return new ErrorResponse(errors, LocalDateTime.now().toString(), "/");
    }

    @ExceptionHandler(CategoryNotFoundException.class)
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public ErrorResponse handleCategoryNotFoundException(CategoryNotFoundException ex) {
        Map<String, String> errors = Map.of("category", ex.getMessage());
        log.warn("Category not found: {}", errors.toString());
        return new ErrorResponse(errors, LocalDateTime.now().toString(), "/");
    }

    @ExceptionHandler(ProductNotFoundException.class)
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public ErrorResponse handleProductNotFoundException(ProductNotFoundException ex) {
        Map<String, String> errors = Map.of("product", ex.getMessage());
        log.warn("Product not found: {}", errors.toString());
        return new ErrorResponse(errors, LocalDateTime.now().toString(), "/");
    }
}
`;

// ---------- cart-microservice ----------

export const CART_APPLICATION = `
@SpringBootApplication
@EnableFeignClients
public class CartMicroserviceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CartMicroserviceApplication.class, args);
    }
}
`;

export const CART_ENTITY = `
@Document
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart {
    @Id
    private String customerId;
    private List<Item> items;

    public void addItem(Item newItem) {
        Optional<Item> itemMatch = this.items.stream().filter(i -> i.getProductId() == newItem.getProductId())
                .findFirst();

        if (!itemMatch.isEmpty())
            throw new CartException("Item already exists in cart with product id: "
                    + newItem.getProductId() +
                    ". Use /{customerId}/items/{productId} to change the item quantity. "
                    , HttpStatus.BAD_REQUEST);

        this.items.add(newItem);
    }

    public void changeItemQuantityFromCart(Item item) {
        Optional<Item> itemMatch = this.items.stream().filter(i -> i.getProductId() == item.getProductId())
                .findFirst();
        if (itemMatch.isEmpty())
            throw new CartException("Item not found in cart with product id: " + item.getProductId(),
                    HttpStatus.NOT_FOUND);

        itemMatch.get().setQuantity(item.getQuantity());
    }

    public void removeItem(Integer productId) {
        this.items.removeIf(i -> i.getProductId() == productId);
    }
}
`;

export const ITEM_ENTITY = `
@Document
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Item {
    @NotNull(message = "Product ID is required")
    private Integer productId;
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be greater than or equal to 1")
    private Integer quantity;
}
`;

export const CART_REPOSITORY = `
public interface CartRepository extends MongoRepository<Cart, String> {
    Optional<Cart> findByCustomerId(String customerId);
}
`;

export const CART_CONTROLLER = `
@RestController
@RequestMapping("/api/v1/carts/{customerId}")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping()
    public ResponseEntity<Cart> getOrCreateCart(@PathVariable String customerId) {
        return ResponseEntity.ok(cartService.getOrCreateCart(customerId));
    }

    @PatchMapping("/empty")
    public ResponseEntity<Cart> emptyCart(@PathVariable String customerId) {
        return ResponseEntity.ok(cartService.emptyCart(customerId));
    }

    @PostMapping("/items/add")
    public ResponseEntity<Cart> addItemToCart(@PathVariable String customerId,
            @Valid @RequestBody Item item) {
        return ResponseEntity.ok(cartService.addItemToCart(customerId, item));
    }

    @PatchMapping("/items/change")
    public ResponseEntity<Cart> changeItemQuantityFromCart(@PathVariable String customerId,
            @Valid @RequestBody Item item) {
        return ResponseEntity.ok(cartService.changeItemQuantityFromCart(customerId, item));
    }

    @PatchMapping("/items/remove/{productId}")
    public ResponseEntity<Cart> removeItemFromCart(@PathVariable String customerId,
            @PathVariable Integer productId) {
        return ResponseEntity.ok(cartService.removeItemFromCart(customerId, productId));
    }
}
`;

export const CART_SERVICE = `
@Service
@RequiredArgsConstructor
public class CartService {

    private final ProductClient productClient;
    private final CustomerClient customerClient;
    private final CartRepository cartRepository;

    public Cart getOrCreateCart(String customerId) {
        validateIfCustomerExists(customerId);
        return cartRepository.findById(customerId).orElseGet(() -> {
            Cart cart = new Cart(customerId, List.of());
            return cartRepository.save(cart);
        });
    }

    public Cart addItemToCart(String customerId, Item item) {
        validateIfItemCanBePersisted(customerId, item);
        Cart cart = getOrCreateCart(customerId);
        cart.addItem(new Item(item.getProductId(), item.getQuantity()));
        return cartRepository.save(cart);
    }

    public Cart changeItemQuantityFromCart(String customerId, Item item) {
        validateIfItemCanBePersisted(customerId, item);
        Cart cart = getOrCreateCart(customerId);
        cart.changeItemQuantityFromCart(item);
        return cartRepository.save(cart);
    }

    public Cart removeItemFromCart(String customerId, Integer productId) {
        Cart cart = getOrCreateCart(customerId);
        cart.removeItem(productId);
        return cartRepository.save(cart);
    }

    public Cart emptyCart(String customerId) {
        Cart cart = getOrCreateCart(customerId);
        cart.setItems(List.of());
        return cartRepository.save(cart);
    }

    private void validateIfItemCanBePersisted(String customerId, Item item) {
        validateIfCustomerExists(customerId);
        ProductResponse productResponse = productClient.getProductById(item.getProductId())
                .orElseThrow(() -> new ProductNotFoundException(item.getProductId()));
        if (item.getQuantity() > productResponse.stock())
            throw new CartException(
                    "Product stock is not enough for product with id: " + item.getProductId(),
                    HttpStatus.BAD_REQUEST);
    }

    private void validateIfCustomerExists(String customerId) {
        customerClient.getCustomerById(customerId).orElseThrow(() -> new CustomerNotFoundException(customerId));
    }
}
`;

export const CART_VALIDATIONS = `
private void validateIfItemCanBePersisted(String customerId, Item item) {
    validateIfCustomerExists(customerId);
    ProductResponse productResponse = productClient.getProductById(item.getProductId())
            .orElseThrow(() -> new ProductNotFoundException(item.getProductId()));
    if (item.getQuantity() > productResponse.stock())
        throw new CartException(
                "Product stock is not enough for product with id: " + item.getProductId(),
                HttpStatus.BAD_REQUEST);
}

private void validateIfCustomerExists(String customerId) {
    customerClient.getCustomerById(customerId).orElseThrow(() -> new CustomerNotFoundException(customerId));
}
`;

export const CUSTOMER_CLIENT = `
import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "CUSTOMER-MICROSERVICE")
public interface CustomerClient {

    @GetMapping("/api/v1/customers/{id}")
    Optional<CustomerResponse> getCustomerById(@PathVariable("id") String customerId);
}
`;

export const PRODUCT_CLIENT = `
import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "PRODUCT-MICROSERVICE")
public interface ProductClient {

    @GetMapping("/api/v1/products/{id}")
    Optional<ProductResponse> getProductById(@PathVariable("id") Integer productId);
}
`;

export const CART_REMOTE_DTOS = `
// Cópias locais dos contratos dos outros serviços (o cart não depende do código deles)
public record CustomerResponse(
    String id,
    String firstName,
    String lastName,
    String email,
    String phone,
    String address,
    String city
) {

}

public record ProductResponse(
    Integer id,
    String name,
    String description,
    double price,
    Integer stock,
    String imageUrl,
    Integer categoryId,
    String categoryName,
    String categoryDescription
) {

}
`;

export const CART_EXCEPTIONS = `
@Getter
public class CartException extends RuntimeException {
    private final HttpStatus httpStatus;
    public CartException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }
}

public class CustomerNotFoundException extends RuntimeException {
    public CustomerNotFoundException(String customerId) {
        super("Customer not found with id: " + customerId);
    }
}

public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Integer productId) {
        super("Product not found with id: " + productId);
    }
}
`;

export const CART_EXCEPTION_HANDLER = `
@Slf4j
@RestControllerAdvice
public class CartExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(FeignException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleFeignException(FeignException ex) {
        log.warn("FeignException: {}", ex.getMessage());
        return new ErrorResponse(Map.of("error", ex.getMessage()), LocalDateTime.now().toString(), "/api/v1/carts");
    }

    @ExceptionHandler(CartException.class)
    public ResponseEntity<ErrorResponse> handleCartException(CartException ex) {
        log.warn("CartException: {}", ex.getMessage());
        return ResponseEntity.status(ex.getHttpStatus().value()).body(new ErrorResponse(Map.of("error", ex.getMessage()), LocalDateTime.now().toString(), "/api/v1/carts"));
    }

    @ExceptionHandler(CustomerNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleCustomerNotFoundException(CustomerNotFoundException ex) {
        log.warn("CustomerNotFoundException: {}", ex.getMessage());
        return new ErrorResponse(Map.of("error", ex.getMessage()), LocalDateTime.now().toString(), "/api/v1/customer");
    }

    @ExceptionHandler(ProductNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleProductNotFoundException(ProductNotFoundException ex) {
        log.warn("ProductNotFoundException: {}", ex.getMessage());
        return new ErrorResponse(Map.of("error", ex.getMessage()), LocalDateTime.now().toString(), "/api/v1/product");
    }
}
`;

// ---------- common-exceptions ----------

export const ERROR_RESPONSE = `
package com.gustavoleterio.microservices.common_exceptions;

import java.util.Map;

public record ErrorResponse(Map<String, String> errors, String timestamp, String path) {

}
`;

export const GLOBAL_EXCEPTION_HANDLER = `
@Component
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        log.warn("Method argument not valid: {}", ex.toString());
        return new ErrorResponse(errors, LocalDateTime.now().toString(), "/");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        Map<String, String> errors = new HashMap<>();
        errors.put("error", "Request body is missing");
        log.warn("Request body is missing: {}", ex.toString());
        return new ErrorResponse(errors, LocalDateTime.now().toString(), "/");
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleException(Exception ex) {
        Map<String, String> errors = new HashMap<>();
        errors.put("error", "An unexpected error occurred");
        log.error("An unexpected error occurred: {}", ex.toString());
        return new ErrorResponse(errors, LocalDateTime.now().toString(), "/");
    }
}
`;

export const COMMON_EXCEPTIONS_TEST = `
@SpringBootTest
class CommonExceptionsApplicationTests {

    @Test
    void contextLoads() {
    }
}
`;

// ---------- plataforma ----------

export const CONFIG_SERVER_APPLICATION = `
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
`;

export const DISCOVERY_SERVER_APPLICATION = `
@SpringBootApplication
@EnableEurekaServer
public class DiscoveryServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(DiscoveryServerApplication.class, args);
    }
}
`;

export const API_GATEWAY_APPLICATION = `
@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
`;
