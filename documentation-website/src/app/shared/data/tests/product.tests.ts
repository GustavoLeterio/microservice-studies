import { docTest } from './doc-test';
import { DocTest } from './test.models';

const MAPPER_FILE =
  'microservices/product-microservice/src/test/java/com/gustavoleterio/microservices/product_microservice/product/MappersTest.java';
const PRODUCT_SERVICE =
  'microservices/product-microservice/src/test/java/com/gustavoleterio/microservices/product_microservice/product/ProductServiceTest.java';
const CATEGORY_SERVICE =
  'microservices/product-microservice/src/test/java/com/gustavoleterio/microservices/product_microservice/category/CategoryServiceTest.java';
const PRODUCT_CONTROLLER =
  'microservices/product-microservice/src/test/java/com/gustavoleterio/microservices/product_microservice/product/ProductControllerTest.java';
const CATEGORY_CONTROLLER =
  'microservices/product-microservice/src/test/java/com/gustavoleterio/microservices/product_microservice/category/CategoryControllerTest.java';

const MODULE = 'product-microservice' as const;

export const PRODUCT_TESTS: DocTest[] = [
  docTest(
    'prd-map-01',
    MODULE,
    'MappersTest',
    'toProduct',
    {
      pt: 'toProduct liga a categoria pelo id e conserva o id do produto.',
      en: 'toProduct links the category by id and keeps the product id.',
    },
    {
      pt: 'O update reaplica o id do path. A categoria no JPA é uma referência pelo id, não o objeto inteiro vindo do cliente.',
      en: 'Update reapplies the path id. The JPA category is a reference by id, not the whole object coming from the client.',
    },
    `Product product = productMapper.toProduct(
        new ProductRequest("Dune", "sci-fi", 9.9, 4, "http://img", 3), 8);

assertThat(product.getId()).isEqualTo(8);
assertThat(product.getCategory().getId()).isEqualTo(3);`,
    MAPPER_FILE,
    'PRD-MAP-01',
  ),
  docTest(
    'prd-map-no-id',
    MODULE,
    'MappersTest',
    'toProductWithoutId',
    {
      pt: 'toProduct sem id deixa o id nulo para o banco gerar.',
      en: 'toProduct without an id leaves the id null for the database to generate.',
    },
    {
      pt: 'No create a chave é do PostgreSQL. O mapper não pode inventar um id.',
      en: 'On create the key belongs to PostgreSQL. The mapper must not invent an id.',
    },
    `Product product = productMapper.toProduct(
        new ProductRequest("Dune", null, 9.9, 4, null, 3));

assertThat(product.getId()).isNull();`,
    MAPPER_FILE,
  ),
  docTest(
    'prd-map-response',
    MODULE,
    'MappersTest',
    'toProductResponse',
    {
      pt: 'toProductResponse achata id, nome e descrição da categoria no mesmo objeto.',
      en: 'toProductResponse flattens the category id, name, and description into the same object.',
    },
    {
      pt: 'O cliente do carrinho lê o produto sem um segundo request. A categoria não pode ficar só como entidade JPA.',
      en: 'The cart client reads the product without a second request. The category cannot stay as a JPA entity only.',
    },
    `ProductResponse response = productMapper.toProductResponse(product);

assertThat(response).isEqualTo(new ProductResponse(
        8, "Dune", "sci-fi", 9.9, 4, "http://img", 3, "Books", "All books"));`,
    MAPPER_FILE,
  ),
  docTest(
    'prd-map-no-category',
    MODULE,
    'MappersTest',
    'toProductResponseWithoutCategory',
    {
      pt: 'Produto sem categoria devolve categoryId e categoryName nulos.',
      en: 'A product without a category returns null categoryId and categoryName.',
    },
    {
      pt: 'Dado legado ou associação ausente não pode derrubar o GET com NullPointerException.',
      en: 'Legacy data or a missing association must not crash GET with a NullPointerException.',
    },
    `Product product = Product.builder().id(8).name("Dune").price(9.9).stock(4).build();

ProductResponse response = productMapper.toProductResponse(product);

assertThat(response.categoryId()).isNull();
assertThat(response.categoryName()).isNull();`,
    MAPPER_FILE,
  ),
  docTest(
    'cat-map-01',
    MODULE,
    'MappersTest',
    'toCategoryResponseWithNullProducts',
    {
      pt: 'Categoria sem lista de produtos devolve products vazio, não null.',
      en: 'A category with no products list returns an empty products array, not null.',
    },
    {
      pt: 'O JSON de categoria sempre tem array. Null obrigaria o cliente a tratar dois formatos.',
      en: 'Category JSON always has an array. Null would force the client to handle two shapes.',
    },
    `Category category = Category.builder().id(1).name("Books").description("d").build();

CategoryResponse response = categoryMapper.toCategoryResponse(category);

assertThat(response.products()).isNotNull().isEmpty();`,
    MAPPER_FILE,
    'CAT-MAP-01',
  ),
  docTest(
    'cat-map-products',
    MODULE,
    'MappersTest',
    'toCategoryResponseWithProducts',
    {
      pt: 'toCategoryResponse mapeia os produtos aninhados.',
      en: 'toCategoryResponse maps the nested products.',
    },
    {
      pt: 'O GET de categoria devolve o catálogo junto. O produto "Dune" tem que aparecer em products.',
      en: 'Category GET returns the catalog with it. The product "Dune" has to show up in products.',
    },
    `category.setProducts(List.of(
        Product.builder().id(5).name("Dune").price(1.0).stock(1).category(category).build()));

CategoryResponse response = categoryMapper.toCategoryResponse(category);

assertThat(response.products()).singleElement().extracting(ProductResponse::name).isEqualTo("Dune");`,
    MAPPER_FILE,
  ),
  docTest(
    'cat-map-to-category',
    MODULE,
    'MappersTest',
    'toCategory',
    {
      pt: 'toCategory conserva o id informado e copia nome e descrição.',
      en: 'toCategory keeps the given id and copies name and description.',
    },
    {
      pt: 'O update regrava a categoria sob o id do path. Nome e descrição vêm do request.',
      en: 'Update rewrites the category under the path id. Name and description come from the request.',
    },
    `Category category = categoryMapper.toCategory(new CategoryRequest("Books", "All books"), 4);

assertThat(category.getId()).isEqualTo(4);
assertThat(category.getName()).isEqualTo("Books");
assertThat(category.getDescription()).isEqualTo("All books");`,
    MAPPER_FILE,
  ),
  docTest(
    'prd-svc-01',
    MODULE,
    'ProductServiceTest',
    'getProductById',
    {
      pt: 'get mapeia o produto e a categoria: id, nome, preço, estoque, categoryId e categoryName.',
      en: 'get maps the product and its category: id, name, price, stock, categoryId, and categoryName.',
    },
    {
      pt: 'É o contrato que o carrinho consome. A categoria achatada faz parte da leitura, não só os campos do produto.',
      en: 'This is the contract the cart consumes. The flattened category is part of the read, not only the product fields.',
    },
    `when(repository.findById(1)).thenReturn(Optional.of(product(1)));

ProductResponse response = service.getProductById(1);

assertThat(response.price()).isEqualTo(10.5);
assertThat(response.stock()).isEqualTo(3);
assertThat(response.categoryId()).isEqualTo(1);
assertThat(response.categoryName()).isEqualTo("Books");`,
    PRODUCT_SERVICE,
    'PRD-SVC-01',
  ),
  docTest(
    'prd-svc-get-missing',
    MODULE,
    'ProductServiceTest',
    'getProductByIdNotFound',
    {
      pt: 'Produto inexistente lança ProductNotFoundException com o id na mensagem.',
      en: 'A missing product throws ProductNotFoundException with the id in the message.',
    },
    {
      pt: 'A mensagem exata "Product not found with id: 99" alimenta o 404 do handler.',
      en: 'The exact message "Product not found with id: 99" feeds the handler 404.',
    },
    `when(repository.findById(99)).thenReturn(Optional.empty());

assertThatThrownBy(() -> service.getProductById(99))
        .isInstanceOf(ProductNotFoundException.class)
        .hasMessage("Product not found with id: 99");`,
    PRODUCT_SERVICE,
  ),
  docTest(
    'prd-svc-list',
    MODULE,
    'ProductServiceTest',
    'getAllProducts',
    {
      pt: 'A lista mapeia todos os produtos.',
      en: 'The list maps every product.',
    },
    {
      pt: 'Ids 1 e 2 saem na ordem do repositório. A listagem não filtra nem reordena.',
      en: 'Ids 1 and 2 come out in repository order. The listing does not filter or reorder.',
    },
    `when(repository.findAll()).thenReturn(List.of(product(1), product(2)));

assertThat(service.getAllProducts()).extracting(ProductResponse::id).containsExactly(1, 2);`,
    PRODUCT_SERVICE,
  ),
  docTest(
    'prd-svc-02',
    MODULE,
    'ProductServiceTest',
    'getProductsByCategoryWithoutProducts',
    {
      pt: 'Categoria existente sem produtos devolve lista vazia.',
      en: 'An existing category with no products returns an empty list.',
    },
    {
      pt: '404 aqui seria mentira: a categoria existe, o catálogo dela é que está vazio.',
      en: 'A 404 here would be a lie: the category exists, its catalog is just empty.',
    },
    `categoryExists(1);
when(repository.findByCategoryId(1)).thenReturn(List.of());

assertThat(service.getProductsByCategoryId(1)).isEmpty();`,
    PRODUCT_SERVICE,
    'PRD-SVC-02',
  ),
  docTest(
    'prd-svc-by-category',
    MODULE,
    'ProductServiceTest',
    'getProductsByCategory',
    {
      pt: 'getProductsByCategoryId devolve os produtos da categoria.',
      en: 'getProductsByCategoryId returns the products of the category.',
    },
    {
      pt: 'Confere o filtro por categoria, que é a consulta que o catálogo expõe em GET /category/{id}.',
      en: 'Checks the filter by category, which is the query the catalog exposes on GET /category/{id}.',
    },
    `categoryExists(1);
when(repository.findByCategoryId(1)).thenReturn(List.of(product(1), product(2)));

assertThat(service.getProductsByCategoryId(1)).extracting(ProductResponse::id).containsExactly(1, 2);`,
    PRODUCT_SERVICE,
  ),
  docTest(
    'prd-svc-unknown-category',
    MODULE,
    'ProductServiceTest',
    'getProductsByUnknownCategory',
    {
      pt: 'Categoria desconhecida falha sem consultar produtos.',
      en: 'An unknown category fails without querying products.',
    },
    {
      pt: 'Falhar a categoria primeiro evita uma query inútil e um 200 vazio que pareceria catálogo válido.',
      en: 'Failing the category first avoids a useless query and an empty 200 that would look like a valid catalog.',
    },
    `categoryMissing(5);

assertThatThrownBy(() -> service.getProductsByCategoryId(5)).isInstanceOf(CategoryNotFoundException.class);
verifyNoInteractions(repository);`,
    PRODUCT_SERVICE,
  ),
  docTest(
    'prd-svc-create',
    MODULE,
    'ProductServiceTest',
    'createProduct',
    {
      pt: 'Create valida a categoria, persiste o produto mapeado e devolve o id gerado.',
      en: 'Create validates the category, persists the mapped product, and returns the generated id.',
    },
    {
      pt: 'Produto sem categoria não pode ser gravado. O save leva nome, preço 25, estoque 7 e category.id 1; o id devolvido é 42.',
      en: 'A product without a category must not be stored. Save carries name, price 25, stock 7, and category.id 1; the returned id is 42.',
    },
    `Integer id = service.createProduct(request(1));

assertThat(id).isEqualTo(42);
verify(categoryService).getCategoryById(1);
assertThat(captor.getValue().getName()).isEqualTo("New product");
assertThat(captor.getValue().getCategory().getId()).isEqualTo(1);`,
    PRODUCT_SERVICE,
  ),
  docTest(
    'prd-svc-create-unknown-category',
    MODULE,
    'ProductServiceTest',
    'createProductUnknownCategory',
    {
      pt: 'Create com categoria desconhecida falha e não salva.',
      en: 'Create with an unknown category fails and never saves.',
    },
    {
      pt: 'A referência JPA precisa existir antes do insert. never().save impede produto órfão.',
      en: 'The JPA reference has to exist before the insert. never().save stops an orphan product.',
    },
    `categoryMissing(9);

assertThatThrownBy(() -> service.createProduct(request(9))).isInstanceOf(CategoryNotFoundException.class);
verify(repository, never()).save(any());`,
    PRODUCT_SERVICE,
  ),
  docTest(
    'prd-svc-update',
    MODULE,
    'ProductServiceTest',
    'updateProduct',
    {
      pt: 'Update grava os dados novos sob o id do path.',
      en: 'Update saves the new data under the path id.',
    },
    {
      pt: 'O produto 5 continua com id 5 e recebe o nome novo. O path manda na chave, o body manda nos campos.',
      en: 'Product 5 keeps id 5 and receives the new name. The path owns the key, the body owns the fields.',
    },
    `Integer id = service.updateProduct(5, request(1));

assertThat(id).isEqualTo(5);
assertThat(captor.getValue().getId()).isEqualTo(5);
assertThat(captor.getValue().getName()).isEqualTo("New product");`,
    PRODUCT_SERVICE,
  ),
  docTest(
    'prd-svc-update-missing',
    MODULE,
    'ProductServiceTest',
    'updateProductNotFound',
    {
      pt: 'Update de produto inexistente falha antes de checar a categoria e não salva.',
      en: 'Updating a missing product fails before checking the category and never saves.',
    },
    {
      pt: 'A ordem importa: não faz sentido validar a categoria de um produto que não existe.',
      en: 'Order matters: there is no point validating the category of a product that does not exist.',
    },
    `when(repository.findById(5)).thenReturn(Optional.empty());

assertThatThrownBy(() -> service.updateProduct(5, request(1))).isInstanceOf(ProductNotFoundException.class);
verifyNoInteractions(categoryService);
verify(repository, never()).save(any());`,
    PRODUCT_SERVICE,
  ),
  docTest(
    'prd-svc-update-unknown-category',
    MODULE,
    'ProductServiceTest',
    'updateProductUnknownCategory',
    {
      pt: 'Update para uma categoria desconhecida falha e não salva.',
      en: 'Moving the product to an unknown category fails and never saves.',
    },
    {
      pt: 'O produto existe, a categoria 9 não. O save não pode apontar para uma FK inexistente.',
      en: 'The product exists, category 9 does not. Save must not point at a missing foreign key.',
    },
    `when(repository.findById(5)).thenReturn(Optional.of(product(5)));
categoryMissing(9);

assertThatThrownBy(() -> service.updateProduct(5, request(9))).isInstanceOf(CategoryNotFoundException.class);
verify(repository, never()).save(any());`,
    PRODUCT_SERVICE,
  ),
  docTest(
    'prd-svc-delete',
    MODULE,
    'ProductServiceTest',
    'deleteProduct',
    {
      pt: 'Delete remove o produto que existe.',
      en: 'Delete removes a product that exists.',
    },
    {
      pt: 'O efeito é deleteById(5), só depois de findById achar o produto.',
      en: 'The effect is deleteById(5), only after findById finds the product.',
    },
    `when(repository.findById(5)).thenReturn(Optional.of(product(5)));

service.deleteProduct(5);

verify(repository).deleteById(5);`,
    PRODUCT_SERVICE,
  ),
  docTest(
    'prd-svc-delete-missing',
    MODULE,
    'ProductServiceTest',
    'deleteProductNotFound',
    {
      pt: 'Delete de produto inexistente falha e não apaga.',
      en: 'Deleting a missing product fails and never deletes.',
    },
    {
      pt: 'O cliente recebe ProductNotFoundException em vez de um delete silencioso.',
      en: 'The client gets ProductNotFoundException instead of a silent delete.',
    },
    `when(repository.findById(5)).thenReturn(Optional.empty());

assertThatThrownBy(() -> service.deleteProduct(5)).isInstanceOf(ProductNotFoundException.class);
verify(repository, never()).deleteById(any());`,
    PRODUCT_SERVICE,
  ),
  docTest(
    'cat-svc-01',
    MODULE,
    'CategoryServiceTest',
    'createCategory',
    {
      pt: 'Create persiste nome e descrição e devolve o id gerado.',
      en: 'Create persists name and description and returns the generated id.',
    },
    {
      pt: 'O id 7 é o que o banco devolveu. Nome e descrição do request têm que estar no save.',
      en: 'Id 7 is what the database returned. The request name and description have to be on the save.',
    },
    `Integer id = service.createCategory(new CategoryRequest("Books", "All books"));

assertThat(id).isEqualTo(7);
assertThat(captor.getValue().getName()).isEqualTo("Books");
assertThat(captor.getValue().getDescription()).isEqualTo("All books");`,
    CATEGORY_SERVICE,
    'CAT-SVC-01',
  ),
  docTest(
    'cat-svc-duplicate',
    MODULE,
    'CategoryServiceTest',
    'createCategoryDuplicateName',
    {
      pt: 'Nome duplicado lança CategoryAlreadyExistsException e não salva.',
      en: 'A duplicate name throws CategoryAlreadyExistsException and never saves.',
    },
    {
      pt: 'A unicidade é regra de negócio, checada antes do banco. A mensagem contém "Books".',
      en: 'Uniqueness is a business rule, checked before the database. The message contains "Books".',
    },
    `when(repository.findByName("Books")).thenReturn(Optional.of(category(1, "Books")));

assertThatThrownBy(() -> service.createCategory(new CategoryRequest("Books", "x")))
        .isInstanceOf(CategoryAlreadyExistsException.class)
        .hasMessageContaining("Books");
verify(repository, never()).save(any());`,
    CATEGORY_SERVICE,
  ),
  docTest(
    'cat-svc-02',
    MODULE,
    'CategoryServiceTest',
    'getCategoryById',
    {
      pt: 'get mapeia id, nome e products vazio.',
      en: 'get maps id, name, and an empty products list.',
    },
    {
      pt: 'A leitura de uma categoria sem produtos ainda é 200 com array vazio, não ausência de campo.',
      en: 'Reading a category with no products is still a 200 with an empty array, not a missing field.',
    },
    `when(repository.findById(1)).thenReturn(Optional.of(category(1, "Books")));

CategoryResponse response = service.getCategoryById(1);

assertThat(response.id()).isEqualTo(1);
assertThat(response.name()).isEqualTo("Books");
assertThat(response.products()).isEmpty();`,
    CATEGORY_SERVICE,
    'CAT-SVC-02',
  ),
  docTest(
    'cat-svc-get-missing',
    MODULE,
    'CategoryServiceTest',
    'getCategoryByIdNotFound',
    {
      pt: 'Id desconhecido lança CategoryNotFoundException com o id na mensagem.',
      en: 'An unknown id throws CategoryNotFoundException with the id in the message.',
    },
    {
      pt: 'A mensagem "Category not found with id: 99" é o texto que o controller publica em errors.category.',
      en: 'The message "Category not found with id: 99" is the text the controller publishes in errors.category.',
    },
    `when(repository.findById(99)).thenReturn(Optional.empty());

assertThatThrownBy(() -> service.getCategoryById(99))
        .isInstanceOf(CategoryNotFoundException.class)
        .hasMessage("Category not found with id: 99");`,
    CATEGORY_SERVICE,
  ),
  docTest(
    'cat-svc-list',
    MODULE,
    'CategoryServiceTest',
    'getAllCategories',
    {
      pt: 'A lista mapeia todas as categorias.',
      en: 'The list maps every category.',
    },
    {
      pt: 'Nomes "Books" e "Toys" saem na ordem. O GET / de categoria depende desse mapeamento.',
      en: 'Names "Books" and "Toys" come out in order. Category GET / depends on this mapping.',
    },
    `when(repository.findAll()).thenReturn(List.of(category(1, "Books"), category(2, "Toys")));

assertThat(service.getAllCategories()).extracting(CategoryResponse::name).containsExactly("Books", "Toys");`,
    CATEGORY_SERVICE,
  ),
  docTest(
    'cat-svc-03',
    MODULE,
    'CategoryServiceTest',
    'updateCategory',
    {
      pt: 'Update grava o nome novo sob o id do path.',
      en: 'Update saves the new name under the path id.',
    },
    {
      pt: 'Books vira Novels e o id permanece 1. Renomear não cria outra categoria.',
      en: 'Books becomes Novels and the id stays 1. Renaming does not create another category.',
    },
    `Integer id = service.updateCategory(1, new CategoryRequest("Novels", "Fiction"));

assertThat(id).isEqualTo(1);
assertThat(captor.getValue().getId()).isEqualTo(1);
assertThat(captor.getValue().getName()).isEqualTo("Novels");`,
    CATEGORY_SERVICE,
    'CAT-SVC-03',
  ),
  docTest(
    'cat-svc-update-missing',
    MODULE,
    'CategoryServiceTest',
    'updateCategoryNotFound',
    {
      pt: 'Update de id desconhecido falha e não salva.',
      en: 'Updating an unknown id fails and never saves.',
    },
    {
      pt: 'Sem o documento, não há o que renomear. save não é chamado.',
      en: 'Without the document there is nothing to rename. save is not called.',
    },
    `when(repository.findById(99)).thenReturn(Optional.empty());

assertThatThrownBy(() -> service.updateCategory(99, new CategoryRequest("X", "y")))
        .isInstanceOf(CategoryNotFoundException.class);
verify(repository, never()).save(any());`,
    CATEGORY_SERVICE,
  ),
  docTest(
    'cat-svc-04',
    MODULE,
    'CategoryServiceTest',
    'updateCategoryToNameOfAnotherCategory',
    {
      pt: 'Renomear para o nome de outra categoria lança conflito e não salva.',
      en: 'Renaming to another category name throws a conflict and never saves.',
    },
    {
      pt: 'Books tentando virar Toys (id 2) é CategoryAlreadyExistsException. Sem isso, o unique do Postgres viraria 500.',
      en: 'Books trying to become Toys (id 2) is CategoryAlreadyExistsException. Without this, the Postgres unique constraint would become a 500.',
    },
    `when(repository.findById(1)).thenReturn(Optional.of(category(1, "Books")));
when(repository.findByName("Toys")).thenReturn(Optional.of(category(2, "Toys")));

assertThatThrownBy(() -> service.updateCategory(1, new CategoryRequest("Toys", "x")))
        .isInstanceOf(CategoryAlreadyExistsException.class)
        .hasMessageContaining("Toys");
verify(repository, never()).save(any());`,
    CATEGORY_SERVICE,
    'CAT-SVC-04',
  ),
  docTest(
    'cat-svc-keep-name',
    MODULE,
    'CategoryServiceTest',
    'updateCategoryKeepingOwnName',
    {
      pt: 'Manter o próprio nome e mudar só a descrição é permitido.',
      en: 'Keeping its own name and changing only the description is allowed.',
    },
    {
      pt: 'Achar "Books" apontando para a própria categoria 1 não é conflito. Evita o falso 409 de "já existe" contra si mesmo.',
      en: 'Finding "Books" pointing at category 1 itself is not a conflict. It avoids a false 409 of "already exists" against itself.',
    },
    `Integer id = service.updateCategory(1, new CategoryRequest("Books", "New description"));

assertThat(id).isEqualTo(1);
verify(repository).save(any(Category.class));`,
    CATEGORY_SERVICE,
  ),
  docTest(
    'cat-svc-delete',
    MODULE,
    'CategoryServiceTest',
    'deleteCategory',
    {
      pt: 'Delete remove a categoria que não tem produtos.',
      en: 'Delete removes a category that has no products.',
    },
    {
      pt: 'existsByCategoryId false libera o deleteById(1). A checagem acontece antes do banco.',
      en: 'existsByCategoryId false allows deleteById(1). The check happens before the database.',
    },
    `when(repository.findById(1)).thenReturn(Optional.of(category(1, "Books")));
when(productRepository.existsByCategoryId(1)).thenReturn(false);

service.deleteCategory(1);

verify(repository).deleteById(1);`,
    CATEGORY_SERVICE,
  ),
  docTest(
    'cat-svc-delete-missing',
    MODULE,
    'CategoryServiceTest',
    'deleteCategoryNotFound',
    {
      pt: 'Delete de id desconhecido falha e não apaga.',
      en: 'Deleting an unknown id fails and never deletes.',
    },
    {
      pt: 'O mesmo contrato dos outros deletes: achar primeiro, apagar depois.',
      en: 'The same contract as the other deletes: find first, delete after.',
    },
    `when(repository.findById(99)).thenReturn(Optional.empty());

assertThatThrownBy(() -> service.deleteCategory(99)).isInstanceOf(CategoryNotFoundException.class);
verify(repository, never()).deleteById(any());`,
    CATEGORY_SERVICE,
  ),
  docTest(
    'cat-svc-05',
    MODULE,
    'CategoryServiceTest',
    'deleteCategoryWithProducts',
    {
      pt: 'Categoria com produtos lança CategoryInUseException e não apaga.',
      en: 'A category with products throws CategoryInUseException and is not deleted.',
    },
    {
      pt: 'A falha é de negócio e menciona o id e "products". Ela aparece antes da foreign key do Postgres.',
      en: 'The failure is a business error and mentions the id and "products". It shows up before the Postgres foreign key.',
    },
    `when(productRepository.existsByCategoryId(1)).thenReturn(true);

assertThatThrownBy(() -> service.deleteCategory(1))
        .isInstanceOf(CategoryInUseException.class)
        .hasMessageContaining("1")
        .hasMessageContaining("products");
verify(repository, never()).deleteById(any());`,
    CATEGORY_SERVICE,
    'CAT-SVC-05',
  ),
  docTest(
    'cat-svc-with-products',
    MODULE,
    'CategoryServiceTest',
    'getCategoryByIdIncludesProducts',
    {
      pt: 'get inclui os produtos da categoria na resposta.',
      en: 'get includes the category products in the response.',
    },
    {
      pt: 'Cobre o caminho em que a lista não está vazia. O produto 10 volta com categoryName "Books".',
      en: 'Covers the path where the list is not empty. Product 10 comes back with categoryName "Books".',
    },
    `assertThat(response.products()).singleElement().satisfies(p -> {
    assertThat(p.id()).isEqualTo(10);
    assertThat(p.categoryName()).isEqualTo("Books");
});`,
    CATEGORY_SERVICE,
  ),
  docTest(
    'prd-ctl-01',
    MODULE,
    'ProductControllerTest',
    'getAll',
    {
      pt: 'GET / devolve a lista, com categoryName no primeiro item.',
      en: 'GET / returns the list, with categoryName on the first item.',
    },
    {
      pt: 'A categoria achatada tem que sobreviver ao JSON. Não basta o service mapear se o controller não serializa.',
      en: 'The flattened category has to survive JSON. Mapping in the service is not enough if the controller does not serialize it.',
    },
    `when(service.getAllProducts()).thenReturn(List.of(response(1), response(2)));

mockMvc.perform(get(BASE))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].categoryName").value("Books"));`,
    PRODUCT_CONTROLLER,
    'PRD-CTL-01',
  ),
  docTest(
    'prd-ctl-get',
    MODULE,
    'ProductControllerTest',
    'getById',
    {
      pt: 'GET /{id} devolve 200 com id e stock.',
      en: 'GET /{id} returns 200 with id and stock.',
    },
    {
      pt: 'Trava o JSON de um produto. Estoque faz parte do contrato que o carrinho usa para limitar quantidade.',
      en: 'Locks the JSON of one product. Stock is part of the contract the cart uses to limit quantity.',
    },
    `when(service.getProductById(1)).thenReturn(response(1));

mockMvc.perform(get(BASE + "/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(1))
        .andExpect(jsonPath("$.stock").value(4));`,
    PRODUCT_CONTROLLER,
  ),
  docTest(
    'prd-ctl-404',
    MODULE,
    'ProductControllerTest',
    'getByIdNotFound',
    {
      pt: 'GET de produto inexistente devolve 404, errors.product e o path real.',
      en: 'GET of a missing product returns 404, errors.product, and the real path.',
    },
    {
      pt: 'O campo do erro é product. O path é a URI /99, para o cliente localizar o recurso.',
      en: 'The error field is product. The path is the /99 URI, so the client can locate the resource.',
    },
    `when(service.getProductById(99)).thenThrow(new ProductNotFoundException("Product not found with id: 99"));

mockMvc.perform(get(BASE + "/99"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.errors.product").value("Product not found with id: 99"))
        .andExpect(jsonPath("$.path").value(BASE + "/99"));`,
    PRODUCT_CONTROLLER,
  ),
  docTest(
    'prd-ctl-bad-id',
    MODULE,
    'ProductControllerTest',
    'getByIdWithInvalidIdType',
    {
      pt: 'GET com id não numérico devolve 4xx.',
      en: 'GET with a non-numeric id returns 4xx.',
    },
    {
      pt: 'Regressão do COM-HND-05 no endpoint real: /abc com path Integer é erro de cliente, não 500.',
      en: 'Regression of COM-HND-05 on the real endpoint: /abc with an Integer path is a client error, not 500.',
    },
    `mockMvc.perform(get(BASE + "/abc")).andExpect(status().is4xxClientError());`,
    PRODUCT_CONTROLLER,
  ),
  docTest(
    'prd-ctl-category-empty',
    MODULE,
    'ProductControllerTest',
    'getByCategoryEmpty',
    {
      pt: 'GET /category/{id} sem produtos devolve 200 e lista de tamanho 0.',
      en: 'GET /category/{id} with no products returns 200 and a list of length 0.',
    },
    {
      pt: 'O controller não transforma lista vazia em 404. O vazio é o catálogo da categoria.',
      en: 'The controller does not turn an empty list into 404. Empty is that category catalog.',
    },
    `when(service.getProductsByCategoryId(1)).thenReturn(List.of());

mockMvc.perform(get(BASE + "/category/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));`,
    PRODUCT_CONTROLLER,
  ),
  docTest(
    'prd-ctl-category-404',
    MODULE,
    'ProductControllerTest',
    'getByCategoryNotFound',
    {
      pt: 'GET /category/{id} de categoria desconhecida devolve 404 em errors.category.',
      en: 'GET /category/{id} of an unknown category returns 404 in errors.category.',
    },
    {
      pt: 'Categoria inexistente e categoria sem produtos são respostas diferentes. Aqui o campo é category.',
      en: 'A missing category and a category with no products are different responses. Here the field is category.',
    },
    `when(service.getProductsByCategoryId(5))
        .thenThrow(new CategoryNotFoundException("Category not found with id: 5"));

mockMvc.perform(get(BASE + "/category/5"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.errors.category").value("Category not found with id: 5"));`,
    PRODUCT_CONTROLLER,
  ),
  docTest(
    'prd-ctl-02',
    MODULE,
    'ProductControllerTest',
    'create',
    {
      pt: 'POST devolve o id em texto.',
      en: 'POST returns the id as text.',
    },
    {
      pt: 'O corpo é "42", não um JSON. O contrato de create do produto é o mesmo estilo do cliente.',
      en: 'The body is "42", not JSON. Product create uses the same style of contract as customer.',
    },
    `when(service.createProduct(any(ProductRequest.class))).thenReturn(42);

mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
        .andExpect(status().isOk())
        .andExpect(content().string("42"));`,
    PRODUCT_CONTROLLER,
    'PRD-CTL-02',
  ),
  docTest(
    'prd-ctl-zero',
    MODULE,
    'ProductControllerTest',
    'createAcceptsZeroPriceAndStock',
    {
      pt: 'POST aceita preço 0 e estoque 0.',
      en: 'POST accepts price 0 and stock 0.',
    },
    {
      pt: 'Gratuito e sem estoque são limites válidos. O teste impede a validação de virar "maior que zero" por engano.',
      en: 'Free and out of stock are valid boundaries. The test stops validation from becoming "greater than zero" by mistake.',
    },
    `when(service.createProduct(any(ProductRequest.class))).thenReturn(1);

mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON)
        .content("{\\"name\\":\\"Free\\",\\"price\\":0,\\"stock\\":0,\\"categoryId\\":1}"))
        .andExpect(status().isOk());`,
    PRODUCT_CONTROLLER,
  ),
  docTest(
    'prd-ctl-invalid',
    MODULE,
    'ProductControllerTest',
    'createRejectsInvalidBody',
    {
      pt: 'POST rejeita nome vazio ou ausente, preço ou estoque ausentes, categoryId ausente e números negativos.',
      en: 'POST rejects a blank or missing name, a missing price or stock, a missing categoryId, and negative numbers.',
    },
    {
      pt: 'Cada caso é 400, com errors no campo e o serviço intocado. categoryId ausente e valores negativos são regressão: a categoria já foi opcional e negativo já foi aceito.',
      en: 'Each case is 400, with errors on the field and the service untouched. A missing categoryId and negative values are regressions: category used to be optional and negatives used to be accepted.',
    },
    `@ParameterizedTest(name = "POST rejects {0}")
@MethodSource("invalidBodies")
void createRejectsInvalidBody(String description, String field, String json) throws Exception {
    mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(json))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors." + field).exists())
            .andExpect(jsonPath("$.path").value(BASE));
    verifyNoInteractions(service);
}`,
    PRODUCT_CONTROLLER,
  ),
  docTest(
    'prd-ctl-unknown-category',
    MODULE,
    'ProductControllerTest',
    'createWithUnknownCategory',
    {
      pt: 'POST com categoria desconhecida devolve 404.',
      en: 'POST with an unknown category returns 404.',
    },
    {
      pt: 'CategoryNotFoundException no create tem que ser 404, não 500.',
      en: 'CategoryNotFoundException on create has to be 404, not 500.',
    },
    `when(service.createProduct(any(ProductRequest.class)))
        .thenThrow(new CategoryNotFoundException("Category not found with id: 1"));

mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
        .andExpect(status().isNotFound());`,
    PRODUCT_CONTROLLER,
  ),
  docTest(
    'prd-ctl-malformed',
    MODULE,
    'ProductControllerTest',
    'createWithMalformedJson',
    {
      pt: 'POST com JSON malformado devolve 400 e não chama o serviço.',
      en: 'POST with malformed JSON returns 400 and does not call the service.',
    },
    {
      pt: 'O parser quebra antes da regra de negócio. O serviço não vê um request pela metade.',
      en: 'The parser fails before the business rule. The service does not see a half-built request.',
    },
    `mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content("{\\"name\\":"))
        .andExpect(status().isBadRequest());

verifyNoInteractions(service);`,
    PRODUCT_CONTROLLER,
  ),
  docTest(
    'prd-ctl-03',
    MODULE,
    'ProductControllerTest',
    'update',
    {
      pt: 'PUT devolve o id em texto, com status 200.',
      en: 'PUT returns the id as text, with status 200.',
    },
    {
      pt: 'O update de produto responde 200 e o corpo "1", diferente do 202 vazio do cliente. O teste guarda essa diferença.',
      en: 'Product update answers 200 and the body "1", unlike the customer empty 202. The test keeps that difference.',
    },
    `when(service.updateProduct(eq(1), any(ProductRequest.class))).thenReturn(1);

mockMvc.perform(put(BASE + "/1").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
        .andExpect(status().isOk())
        .andExpect(content().string("1"));`,
    PRODUCT_CONTROLLER,
    'PRD-CTL-03',
  ),
  docTest(
    'prd-ctl-put-404',
    MODULE,
    'ProductControllerTest',
    'updateNotFound',
    {
      pt: 'PUT de produto inexistente devolve 404.',
      en: 'PUT of a missing product returns 404.',
    },
    {
      pt: 'ProductNotFoundException no update atravessa como 404.',
      en: 'ProductNotFoundException on update crosses as 404.',
    },
    `when(service.updateProduct(eq(99), any(ProductRequest.class)))
        .thenThrow(new ProductNotFoundException("Product not found with id: 99"));

mockMvc.perform(put(BASE + "/99").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
        .andExpect(status().isNotFound());`,
    PRODUCT_CONTROLLER,
  ),
  docTest(
    'prd-ctl-negative-stock',
    MODULE,
    'ProductControllerTest',
    'updateRejectsNegativeStock',
    {
      pt: 'PUT com estoque negativo devolve 400 e não chama o serviço.',
      en: 'PUT with negative stock returns 400 and does not call the service.',
    },
    {
      pt: 'errors.stock é "Product stock must not be negative". A validação vale no update, não só no create.',
      en: 'errors.stock is "Product stock must not be negative". Validation applies on update, not only on create.',
    },
    `mockMvc.perform(put(BASE + "/1").contentType(MediaType.APPLICATION_JSON)
        .content("{\\"name\\":\\"a\\",\\"price\\":1,\\"stock\\":-1,\\"categoryId\\":1}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.stock").value("Product stock must not be negative"));

verifyNoInteractions(service);`,
    PRODUCT_CONTROLLER,
  ),
  docTest(
    'prd-ctl-delete',
    MODULE,
    'ProductControllerTest',
    'deleteProduct',
    {
      pt: 'DELETE devolve 200 e chama deleteProduct com o id.',
      en: 'DELETE returns 200 and calls deleteProduct with the id.',
    },
    {
      pt: 'O delete de produto é 200, diferente do 202 do cliente. O teste fixa esse status.',
      en: 'Product delete is 200, unlike the customer 202. The test fixes that status.',
    },
    `mockMvc.perform(delete(BASE + "/1")).andExpect(status().isOk());

verify(service).deleteProduct(1);`,
    PRODUCT_CONTROLLER,
  ),
  docTest(
    'prd-ctl-delete-404',
    MODULE,
    'ProductControllerTest',
    'deleteNotFound',
    {
      pt: 'DELETE de produto inexistente devolve 404.',
      en: 'DELETE of a missing product returns 404.',
    },
    {
      pt: 'O handler traduz ProductNotFoundException no delete, não só no GET.',
      en: 'The handler translates ProductNotFoundException on delete, not only on GET.',
    },
    `doThrow(new ProductNotFoundException("Product not found with id: 99")).when(service).deleteProduct(99);

mockMvc.perform(delete(BASE + "/99")).andExpect(status().isNotFound());`,
    PRODUCT_CONTROLLER,
  ),
  docTest(
    'prd-ctl-500',
    MODULE,
    'ProductControllerTest',
    'unexpectedFailureIsGeneric500',
    {
      pt: 'Falha inesperada vira 500 genérico, sem a URL do banco.',
      en: 'An unexpected failure becomes a generic 500, without the database URL.',
    },
    {
      pt: 'jdbc:postgresql://secret-host não pode sair na resposta. O cliente vê "An unexpected error occurred".',
      en: 'jdbc:postgresql://secret-host must not leave in the response. The client sees "An unexpected error occurred".',
    },
    `when(service.getAllProducts()).thenThrow(new IllegalStateException("jdbc:postgresql://secret-host"));

mockMvc.perform(get(BASE))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.errors.error").value("An unexpected error occurred"));
// o corpo não contém "secret-host"`,
    PRODUCT_CONTROLLER,
  ),
  docTest(
    'cat-ctl-01',
    MODULE,
    'CategoryControllerTest',
    'getAll',
    {
      pt: 'GET / devolve as categorias com os produtos aninhados.',
      en: 'GET / returns the categories with nested products.',
    },
    {
      pt: '$[0].name é "Books" e $[0].products[0].name é "Dune". O aninhamento do mapper tem que aparecer no HTTP.',
      en: '$[0].name is "Books" and $[0].products[0].name is "Dune". The mapper nesting has to show up over HTTP.',
    },
    `mockMvc.perform(get(BASE))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].name").value("Books"))
        .andExpect(jsonPath("$[0].products[0].name").value("Dune"));`,
    CATEGORY_CONTROLLER,
    'CAT-CTL-01',
  ),
  docTest(
    'cat-ctl-get',
    MODULE,
    'CategoryControllerTest',
    'getById',
    {
      pt: 'GET /{id} devolve 200 e o id da categoria.',
      en: 'GET /{id} returns 200 and the category id.',
    },
    {
      pt: 'Caminho feliz da leitura. O id do path volta no JSON.',
      en: 'Happy path of the read. The path id comes back in the JSON.',
    },
    `when(service.getCategoryById(1)).thenReturn(new CategoryResponse(1, "Books", "All books", List.of()));

mockMvc.perform(get(BASE + "/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(1));`,
    CATEGORY_CONTROLLER,
  ),
  docTest(
    'cat-ctl-404',
    MODULE,
    'CategoryControllerTest',
    'getByIdNotFound',
    {
      pt: 'GET de categoria inexistente devolve 404, errors.category e o path.',
      en: 'GET of a missing category returns 404, errors.category, and the path.',
    },
    {
      pt: 'O campo category e o path /99 identificam o recurso que faltou.',
      en: 'The category field and the /99 path identify the resource that was missing.',
    },
    `when(service.getCategoryById(99)).thenThrow(new CategoryNotFoundException("Category not found with id: 99"));

mockMvc.perform(get(BASE + "/99"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.errors.category").value("Category not found with id: 99"))
        .andExpect(jsonPath("$.path").value(BASE + "/99"));`,
    CATEGORY_CONTROLLER,
  ),
  docTest(
    'cat-ctl-create',
    MODULE,
    'CategoryControllerTest',
    'create',
    {
      pt: 'POST devolve o id em texto.',
      en: 'POST returns the id as text.',
    },
    {
      pt: 'O corpo é "7". Create de categoria segue o mesmo contrato de id em texto do produto.',
      en: 'The body is "7". Category create follows the same text-id contract as product.',
    },
    `when(service.createCategory(any(CategoryRequest.class))).thenReturn(7);

mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
        .andExpect(status().isOk())
        .andExpect(content().string("7"));`,
    CATEGORY_CONTROLLER,
  ),
  docTest(
    'cat-ctl-02',
    MODULE,
    'CategoryControllerTest',
    'createDuplicate',
    {
      pt: 'POST com nome existente devolve 409 e errors.category.',
      en: 'POST with an existing name returns 409 and errors.category.',
    },
    {
      pt: 'Conflito de nome é 409, com a mensagem de negócio e o path da coleção.',
      en: 'A name conflict is 409, with the business message and the collection path.',
    },
    `when(service.createCategory(any(CategoryRequest.class)))
        .thenThrow(new CategoryAlreadyExistsException("Category with name Books already exists"));

mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.errors.category").value("Category with name Books already exists"))
        .andExpect(jsonPath("$.path").value(BASE));`,
    CATEGORY_CONTROLLER,
    'CAT-CTL-02',
  ),
  docTest(
    'cat-ctl-03',
    MODULE,
    'CategoryControllerTest',
    'createRejectsBlankName',
    {
      pt: 'POST rejeita nome ausente, vazio, só com espaços ou null.',
      en: 'POST rejects a missing, empty, blank, or null name.',
    },
    {
      pt: 'Regressão: CategoryRequest já não teve constraint, e o @Valid não fazia nada. errors.name é "Category name is required" e o serviço fica intocado.',
      en: 'Regression: CategoryRequest once had no constraint, and @Valid did nothing. errors.name is "Category name is required" and the service stays untouched.',
    },
    `@ParameterizedTest(name = "POST rejects body {0}")
@ValueSource(strings = { "{\\"description\\":\\"no name\\"}", "{\\"name\\":\\"\\"}", "{\\"name\\":\\"   \\"}", "{\\"name\\":null}" })
void createRejectsBlankName(String json) throws Exception {
    mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(json))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.name").value("Category name is required"));
    verifyNoInteractions(service);
}`,
    CATEGORY_CONTROLLER,
    'CAT-CTL-03',
  ),
  docTest(
    'cat-ctl-race',
    MODULE,
    'CategoryControllerTest',
    'createRaceConditionIs409',
    {
      pt: 'Violação de unique no banco, numa corrida, devolve 409 sem o texto do Postgres.',
      en: 'A unique violation in the database, from a race, returns 409 without the Postgres text.',
    },
    {
      pt: 'Duas requests passam no findByName ao mesmo tempo. A segunda falha no banco e ainda assim é conflito, não 500. "duplicate key" não sai na resposta.',
      en: 'Two requests pass findByName at the same time. The second fails in the database and is still a conflict, not 500. "duplicate key" does not leave in the response.',
    },
    `when(service.createCategory(any(CategoryRequest.class)))
        .thenThrow(new DataIntegrityViolationException("duplicate key value violates unique constraint"));

mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
        .andExpect(status().isConflict());
// o corpo não contém "duplicate key"`,
    CATEGORY_CONTROLLER,
  ),
  docTest(
    'cat-ctl-04',
    MODULE,
    'CategoryControllerTest',
    'update',
    {
      pt: 'PUT devolve o id em texto.',
      en: 'PUT returns the id as text.',
    },
    {
      pt: 'O corpo é "1" e o status é 200. Caminho feliz do rename.',
      en: 'The body is "1" and the status is 200. Happy path of the rename.',
    },
    `when(service.updateCategory(eq(1), any(CategoryRequest.class))).thenReturn(1);

mockMvc.perform(put(BASE + "/1").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
        .andExpect(status().isOk())
        .andExpect(content().string("1"));`,
    CATEGORY_CONTROLLER,
    'CAT-CTL-04',
  ),
  docTest(
    'cat-ctl-put-conflict',
    MODULE,
    'CategoryControllerTest',
    'updateToExistingNameIs409',
    {
      pt: 'PUT para um nome já usado devolve 409.',
      en: 'PUT to a name already in use returns 409.',
    },
    {
      pt: 'Esse caso já foi falha de banco e 500. CategoryAlreadyExistsException agora atravessa como conflito.',
      en: 'This case used to be a database failure and a 500. CategoryAlreadyExistsException now crosses as a conflict.',
    },
    `when(service.updateCategory(eq(1), any(CategoryRequest.class)))
        .thenThrow(new CategoryAlreadyExistsException("Category with name Books already exists"));

mockMvc.perform(put(BASE + "/1").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
        .andExpect(status().isConflict());`,
    CATEGORY_CONTROLLER,
  ),
  docTest(
    'cat-ctl-put-404',
    MODULE,
    'CategoryControllerTest',
    'updateNotFound',
    {
      pt: 'PUT de categoria inexistente devolve 404.',
      en: 'PUT of a missing category returns 404.',
    },
    {
      pt: 'CategoryNotFoundException no update é 404.',
      en: 'CategoryNotFoundException on update is 404.',
    },
    `when(service.updateCategory(eq(99), any(CategoryRequest.class)))
        .thenThrow(new CategoryNotFoundException("Category not found with id: 99"));

mockMvc.perform(put(BASE + "/99").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
        .andExpect(status().isNotFound());`,
    CATEGORY_CONTROLLER,
  ),
  docTest(
    'cat-ctl-put-blank',
    MODULE,
    'CategoryControllerTest',
    'updateRejectsBlankName',
    {
      pt: 'PUT com nome em branco devolve 400 e não chama o serviço.',
      en: 'PUT with a blank name returns 400 and does not call the service.',
    },
    {
      pt: 'A constraint de nome vale no update. O serviço não recebe um rename vazio.',
      en: 'The name constraint applies on update. The service does not receive an empty rename.',
    },
    `mockMvc.perform(put(BASE + "/1").contentType(MediaType.APPLICATION_JSON).content("{\\"name\\":\\" \\"}"))
        .andExpect(status().isBadRequest());

verifyNoInteractions(service);`,
    CATEGORY_CONTROLLER,
  ),
  docTest(
    'cat-ctl-delete',
    MODULE,
    'CategoryControllerTest',
    'deleteCategory',
    {
      pt: 'DELETE devolve 200 e chama deleteCategory.',
      en: 'DELETE returns 200 and calls deleteCategory.',
    },
    {
      pt: 'Caminho feliz: categoria sem produtos sai com 200.',
      en: 'Happy path: a category with no products leaves with 200.',
    },
    `mockMvc.perform(delete(BASE + "/1")).andExpect(status().isOk());

verify(service).deleteCategory(1);`,
    CATEGORY_CONTROLLER,
  ),
  docTest(
    'cat-ctl-delete-404',
    MODULE,
    'CategoryControllerTest',
    'deleteNotFound',
    {
      pt: 'DELETE de categoria inexistente devolve 404.',
      en: 'DELETE of a missing category returns 404.',
    },
    {
      pt: 'O 404 do delete usa a mesma exceção do GET.',
      en: 'The delete 404 uses the same exception as GET.',
    },
    `doThrow(new CategoryNotFoundException("Category not found with id: 99")).when(service).deleteCategory(99);

mockMvc.perform(delete(BASE + "/99")).andExpect(status().isNotFound());`,
    CATEGORY_CONTROLLER,
  ),
  docTest(
    'cat-ctl-in-use',
    MODULE,
    'CategoryControllerTest',
    'deleteCategoryInUseIs409',
    {
      pt: 'DELETE de categoria com produtos devolve 409 e a mensagem de negócio.',
      en: 'DELETE of a category that still has products returns 409 and the business message.',
    },
    {
      pt: 'errors.category explica que o id 1 não pode ser apagado porque tem produtos. O cliente vê a regra, não um erro de SQL.',
      en: 'errors.category explains that id 1 cannot be deleted because it has products. The client sees the rule, not an SQL error.',
    },
    `doThrow(new CategoryInUseException("Category with id 1 cannot be deleted because it has products"))
        .when(service).deleteCategory(1);

mockMvc.perform(delete(BASE + "/1"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.errors.category")
            .value("Category with id 1 cannot be deleted because it has products"));`,
    CATEGORY_CONTROLLER,
  ),
  docTest(
    'cat-ctl-fk',
    MODULE,
    'CategoryControllerTest',
    'deleteForeignKeyViolationIs409',
    {
      pt: 'Foreign key no delete devolve 409.',
      en: 'A foreign key on delete returns 409.',
    },
    {
      pt: 'Cobre o buraco entre o existsByCategoryId do serviço e um insert de produto concorrente. A violação de FK ainda é conflito, não 500.',
      en: 'Covers the gap between the service existsByCategoryId and a concurrent product insert. The foreign-key violation is still a conflict, not 500.',
    },
    `doThrow(new DataIntegrityViolationException("violates foreign key constraint"))
        .when(service).deleteCategory(1);

mockMvc.perform(delete(BASE + "/1")).andExpect(status().isConflict());`,
    CATEGORY_CONTROLLER,
  ),
];
