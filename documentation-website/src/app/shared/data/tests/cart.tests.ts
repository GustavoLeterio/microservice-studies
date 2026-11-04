import { docTest } from './doc-test';
import { DocTest } from './test.models';

const DOMAIN =
  'microservices/cart-microservice/src/test/java/com/gustavoleterio/microservices/cart_microservice/cart/CartTest.java';
const SERVICE =
  'microservices/cart-microservice/src/test/java/com/gustavoleterio/microservices/cart_microservice/cart/CartServiceTest.java';
const CONTROLLER =
  'microservices/cart-microservice/src/test/java/com/gustavoleterio/microservices/cart_microservice/cart/CartControllerTest.java';

const MODULE = 'cart-microservice' as const;

export const CART_TESTS: DocTest[] = [
  docTest(
    'cart-dom-sanity',
    MODULE,
    'CartTest',
    'largeIdsAreDistinctInstances',
    {
      pt: 'Os ids 1000 são objetos diferentes com o mesmo valor.',
      en: 'The ids 1000 are different objects with the same value.',
    },
    {
      pt: 'Fora do cache -128..127, Integer == falha e equals passa. Se o JDK cacheasse 1000, os testes seguintes não provariam a comparação.',
      en: 'Outside the -128..127 cache, Integer == fails and equals passes. If the JDK cached 1000, the following tests would not prove the comparison.',
    },
    `assertThat(LARGE_ID_A).isNotSameAs(LARGE_ID_B).isEqualTo(LARGE_ID_B);`,
    DOMAIN,
  ),
  docTest(
    'cart-dom-01',
    MODULE,
    'CartTest',
    'addItemWorksWhenCartWasCreatedWithImmutableList',
    {
      pt: 'add funciona num carrinho criado com List.of().',
      en: 'add works on a cart created with List.of().',
    },
    {
      pt: 'List.of é imutável. O domínio precisa copiar para uma lista mutável. Regressão: o primeiro item derrubava o carrinho.',
      en: 'List.of is immutable. The domain has to copy into a mutable list. Regression: the first item used to crash the cart.',
    },
    `Cart cart = new Cart("c1", List.of());

cart.addItem(new Item(1, 2));

assertThat(cart.getItems()).hasSize(1);`,
    DOMAIN,
    'CART-DOM-01',
  ),
  docTest(
    'cart-dom-after-empty',
    MODULE,
    'CartTest',
    'addItemWorksAfterSetItemsWithImmutableList',
    {
      pt: 'add funciona depois de setItems(List.of()).',
      en: 'add works after setItems(List.of()).',
    },
    {
      pt: 'É o cenário do emptyCart: esvaziar com lista imutável e adicionar de novo. O carrinho fica só com o produto 2.',
      en: 'This is the emptyCart scenario: clear with an immutable list and add again. The cart keeps only product 2.',
    },
    `cart.setItems(List.of());
cart.addItem(new Item(2, 1));

assertThat(cart.getItems()).extracting(Item::getProductId).containsExactly(2);`,
    DOMAIN,
  ),
  docTest(
    'cart-dom-null-items',
    MODULE,
    'CartTest',
    'nullItemsBehaveAsEmptyCart',
    {
      pt: 'Items null viram lista vazia e aceitam add.',
      en: 'Null items become an empty list and accept add.',
    },
    {
      pt: 'Documento Mongo sem o campo não pode dar NullPointerException no get nem no add.',
      en: 'A Mongo document without the field must not throw NullPointerException on get or add.',
    },
    `Cart cart = new Cart("c1", null);

assertThat(cart.getItems()).isNotNull().isEmpty();
cart.addItem(new Item(1, 1));
assertThat(cart.getItems()).hasSize(1);`,
    DOMAIN,
  ),
  docTest(
    'cart-dom-builder',
    MODULE,
    'CartTest',
    'builderDefaultsToMutableEmptyList',
    {
      pt: 'O builder sem items produz uma lista mutável vazia.',
      en: 'The builder without items yields a mutable empty list.',
    },
    {
      pt: 'Cart.builder().customerId("c1") é o carrinho novo do service. O add tem que funcionar nessa instância.',
      en: 'Cart.builder().customerId("c1") is the new cart from the service. add has to work on that instance.',
    },
    `Cart cart = Cart.builder().customerId("c1").build();

cart.addItem(new Item(1, 1));

assertThat(cart.getItems()).hasSize(1);`,
    DOMAIN,
  ),
  docTest(
    'cart-dom-05',
    MODULE,
    'CartTest',
    'addItemRejectsDuplicateWithSmallId',
    {
      pt: 'Produto duplicado devolve 400 e a mensagem manda usar PATCH /items/change.',
      en: 'A duplicate product returns 400 and the message points to PATCH /items/change.',
    },
    {
      pt: 'Duplicata não soma quantidade. A lista continua com 1 item e a mensagem cita o id, PATCH e /items/change.',
      en: 'A duplicate does not add quantities. The list stays at 1 item and the message cites the id, PATCH, and /items/change.',
    },
    `assertThatThrownBy(() -> cart.addItem(new Item(5, 3)))
        .isInstanceOfSatisfying(CartException.class, e -> {
            assertThat(e.getHttpStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(e.getMessage()).contains("5").contains("PATCH").contains("/items/change");
        });
assertThat(cart.getItems()).hasSize(1);`,
    DOMAIN,
    'CART-DOM-05',
  ),
  docTest(
    'cart-dom-02',
    MODULE,
    'CartTest',
    'addItemRejectsDuplicateWithLargeId',
    {
      pt: 'Duplicata é rejeitada mesmo com id fora do cache de Integer.',
      en: 'A duplicate is rejected even when the id is outside the Integer cache.',
    },
    {
      pt: 'LARGE_ID_A já está no carrinho e LARGE_ID_B tem o mesmo valor em outro objeto. Comparar com == deixaria a duplicata entrar.',
      en: 'LARGE_ID_A is already in the cart and LARGE_ID_B has the same value in another object. Comparing with == would let the duplicate in.',
    },
    `assertThatThrownBy(() -> cart.addItem(new Item(LARGE_ID_B, 1)))
        .isInstanceOf(CartException.class);
assertThat(cart.getItems()).hasSize(1);`,
    DOMAIN,
    'CART-DOM-02',
  ),
  docTest(
    'cart-dom-03',
    MODULE,
    'CartTest',
    'changeQuantityFindsItemWithLargeId',
    {
      pt: 'change acha o item quando o id está fora do cache de Integer.',
      en: 'change finds the item when the id is outside the Integer cache.',
    },
    {
      pt: 'A quantidade vai para 7. O mesmo bug de == quebraria a troca de quantidade, não só o add.',
      en: 'Quantity becomes 7. The same == bug would break quantity change, not only add.',
    },
    `cart.changeItemQuantityFromCart(new Item(LARGE_ID_B, 7));

assertThat(cart.getItems()).singleElement().extracting(Item::getQuantity).isEqualTo(7);`,
    DOMAIN,
    'CART-DOM-03',
  ),
  docTest(
    'cart-dom-change-missing',
    MODULE,
    'CartTest',
    'changeQuantityFailsWhenItemMissing',
    {
      pt: 'change de produto que não está no carrinho devolve 404 e não altera a quantidade.',
      en: 'change of a product that is not in the cart returns 404 and does not change the quantity.',
    },
    {
      pt: 'A mensagem contém o id "2". O item 1 permanece com quantidade 1. Ausência no change é 404, não insert.',
      en: 'The message contains the id "2". Item 1 stays at quantity 1. Absence on change is 404, not an insert.',
    },
    `assertThatThrownBy(() -> cart.changeItemQuantityFromCart(new Item(2, 5)))
        .isInstanceOfSatisfying(CartException.class, e -> {
            assertThat(e.getHttpStatus()).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(e.getMessage()).contains("2");
        });
assertThat(cart.getItems()).singleElement().extracting(Item::getQuantity).isEqualTo(1);`,
    DOMAIN,
  ),
  docTest(
    'cart-dom-04',
    MODULE,
    'CartTest',
    'removeItemWorksWithLargeId',
    {
      pt: 'remove tira o produto mesmo com id fora do cache de Integer.',
      en: 'remove drops the product even with an id outside the Integer cache.',
    },
    {
      pt: 'Remove o 1000 e sobra o produto 2. == deixaria o item grande no carrinho.',
      en: 'It removes 1000 and product 2 remains. == would leave the large id in the cart.',
    },
    `cart.removeItem(LARGE_ID_B);

assertThat(cart.getItems()).extracting(Item::getProductId).containsExactly(2);`,
    DOMAIN,
    'CART-DOM-04',
  ),
  docTest(
    'cart-dom-remove-missing',
    MODULE,
    'CartTest',
    'removeItemOfMissingProductIsNoOp',
    {
      pt: 'remove de produto ausente deixa o carrinho igual.',
      en: 'remove of a missing product leaves the cart unchanged.',
    },
    {
      pt: 'Remove é idempotente. Tirar o 99 de um carrinho que só tem o 1 não é erro.',
      en: 'Remove is idempotent. Taking 99 out of a cart that only has 1 is not an error.',
    },
    `cart.removeItem(99);

assertThat(cart.getItems()).hasSize(1);`,
    DOMAIN,
  ),
  docTest(
    'cart-dom-remove-one',
    MODULE,
    'CartTest',
    'removeItemKeepsOtherProducts',
    {
      pt: 'remove tira só o produto pedido.',
      en: 'remove drops only the requested product.',
    },
    {
      pt: 'De 1, 2 e 3 sai o 2. Os outros permanecem, na ordem.',
      en: 'From 1, 2, and 3, 2 leaves. The others stay, in order.',
    },
    `cart.removeItem(2);

assertThat(cart.getItems()).extracting(Item::getProductId).containsExactly(1, 3);`,
    DOMAIN,
  ),
  docTest(
    'cart-svc-01',
    MODULE,
    'CartServiceTest',
    'getOrCreateCartReturnsExisting',
    {
      pt: 'get devolve o carrinho persistido e não salva outro.',
      en: 'get returns the persisted cart and does not save a new one.',
    },
    {
      pt: 'Segunda visita do cliente não pode criar um carrinho paralelo. isSameAs e never().save travam isso.',
      en: 'A second visit must not create a parallel cart. isSameAs and never().save lock that.',
    },
    `Cart result = service.getOrCreateCart(CUSTOMER_ID);

assertThat(result).isSameAs(cart);
verify(cartRepository, never()).save(any());`,
    SERVICE,
    'CART-SVC-01',
  ),
  docTest(
    'cart-svc-create-empty',
    MODULE,
    'CartServiceTest',
    'getOrCreateCartCreatesEmptyCart',
    {
      pt: 'get cria e salva um carrinho vazio quando nenhum existe.',
      en: 'get creates and saves an empty cart when none exists.',
    },
    {
      pt: 'Primeira visita. customerId é o da request, items começa vazio e save é chamado.',
      en: 'First visit. customerId is the one from the request, items start empty, and save is called.',
    },
    `Cart result = service.getOrCreateCart(CUSTOMER_ID);

assertThat(result.getCustomerId()).isEqualTo(CUSTOMER_ID);
assertThat(result.getItems()).isEmpty();
verify(cartRepository).save(result);`,
    SERVICE,
  ),
  docTest(
    'cart-svc-unknown-customer',
    MODULE,
    'CartServiceTest',
    'getOrCreateCartUnknownCustomer',
    {
      pt: 'Cliente desconhecido é rejeitado antes do repositório.',
      en: 'An unknown customer is rejected before the repository.',
    },
    {
      pt: 'Não cria carrinho para quem não existe. CustomerNotFoundException cita "ghost" e o repositório não é tocado.',
      en: 'No cart is created for someone who does not exist. CustomerNotFoundException cites "ghost" and the repository is not touched.',
    },
    `when(customerClient.getCustomerById("ghost")).thenReturn(Optional.empty());

assertThatThrownBy(() -> service.getOrCreateCart("ghost"))
        .isInstanceOf(CustomerNotFoundException.class)
        .hasMessageContaining("ghost");
verifyNoInteractions(cartRepository);`,
    SERVICE,
  ),
  docTest(
    'cart-svc-02',
    MODULE,
    'CartServiceTest',
    'addItemToBrandNewCart',
    {
      pt: 'O primeiro item num carrinho novo é gravado com produto e quantidade.',
      en: 'The first item on a brand new cart is stored with product and quantity.',
    },
    {
      pt: 'Regressão: List.of() derrubava esse add. Complementa o CART-DOM-01 no service, que é quem cria o carrinho vazio.',
      en: 'Regression: List.of() used to crash this add. It complements CART-DOM-01 in the service, which is what creates the empty cart.',
    },
    `Cart result = service.addItemToCart(CUSTOMER_ID, new Item(10, 2));

assertThat(result.getItems()).singleElement().satisfies(i -> {
    assertThat(i.getProductId()).isEqualTo(10);
    assertThat(i.getQuantity()).isEqualTo(2);
});`,
    SERVICE,
    'CART-SVC-02',
  ),
  docTest(
    'cart-svc-04',
    MODULE,
    'CartServiceTest',
    'addItemToExistingCart',
    {
      pt: 'add em carrinho existente acrescenta o produto e persiste.',
      en: 'add on an existing cart appends the product and persists.',
    },
    {
      pt: 'A ordem fica produto 1 e depois 2. save recebe o mesmo carrinho.',
      en: 'The order is product 1 and then 2. save receives that same cart.',
    },
    `Cart result = service.addItemToCart(CUSTOMER_ID, new Item(2, 3));

assertThat(result.getItems()).extracting(Item::getProductId).containsExactly(1, 2);
verify(cartRepository).save(result);`,
    SERVICE,
    'CART-SVC-04',
  ),
  docTest(
    'cart-svc-stock-boundary',
    MODULE,
    'CartServiceTest',
    'addItemAcceptsQuantityEqualToStock',
    {
      pt: 'Quantidade igual ao estoque é aceita.',
      en: 'A quantity equal to the available stock is accepted.',
    },
    {
      pt: 'O limite é inclusivo. Estoque 5 e pedido 5 gravam quantidade 5.',
      en: 'The boundary is inclusive. Stock 5 and a request of 5 store quantity 5.',
    },
    `Cart result = service.addItemToCart(CUSTOMER_ID, new Item(10, 5));

assertThat(result.getItems()).singleElement().extracting(Item::getQuantity).isEqualTo(5);`,
    SERVICE,
  ),
  docTest(
    'cart-svc-03',
    MODULE,
    'CartServiceTest',
    'addItemRejectsInsufficientStock',
    {
      pt: 'Quantidade acima do estoque é 400 e não persiste.',
      en: 'A quantity above stock is 400 and nothing is persisted.',
    },
    {
      pt: 'Estoque 5 e pedido 6 lançam CartException BAD_REQUEST citando o produto 10. never().save evita gravar o item inválido.',
      en: 'Stock 5 and a request of 6 throw CartException BAD_REQUEST citing product 10. never().save avoids storing the invalid item.',
    },
    `assertThatThrownBy(() -> service.addItemToCart(CUSTOMER_ID, new Item(10, 6)))
        .isInstanceOfSatisfying(CartException.class, e -> {
            assertThat(e.getHttpStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(e.getMessage()).contains("10");
        });
verify(cartRepository, never()).save(any());`,
    SERVICE,
    'CART-SVC-03',
  ),
  docTest(
    'cart-svc-null-stock',
    MODULE,
    'CartServiceTest',
    'addItemWithNullStockIsRejectedGracefully',
    {
      pt: 'Estoque null é tratado como sem estoque e devolve 400.',
      en: 'A null stock is treated as out of stock and returns 400.',
    },
    {
      pt: 'quantity > stock com stock null seria NullPointerException. O serviço responde 400 e não salva.',
      en: 'quantity > stock with a null stock would be a NullPointerException. The service answers 400 and does not save.',
    },
    `assertThatThrownBy(() -> service.addItemToCart(CUSTOMER_ID, new Item(10, 1)))
        .isInstanceOfSatisfying(CartException.class,
                e -> assertThat(e.getHttpStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
verify(cartRepository, never()).save(any());`,
    SERVICE,
  ),
  docTest(
    'cart-svc-05',
    MODULE,
    'CartServiceTest',
    'addItemUnknownProduct',
    {
      pt: 'Produto ausente no catálogo lança ProductNotFoundException.',
      en: 'A product missing from the catalog throws ProductNotFoundException.',
    },
    {
      pt: 'Optional vazio do Feign vira exceção com "99" e não há save. O carrinho não guarda referência solta.',
      en: 'An empty Optional from Feign becomes an exception containing "99" and there is no save. The cart does not keep a dangling reference.',
    },
    `when(productClient.getProductById(99)).thenReturn(Optional.empty());

assertThatThrownBy(() -> service.addItemToCart(CUSTOMER_ID, new Item(99, 1)))
        .isInstanceOf(ProductNotFoundException.class)
        .hasMessageContaining("99");
verify(cartRepository, never()).save(any());`,
    SERVICE,
    'CART-SVC-05',
  ),
  docTest(
    'cart-svc-customer-first',
    MODULE,
    'CartServiceTest',
    'addItemUnknownCustomerDoesNotQueryProducts',
    {
      pt: 'Cliente desconhecido não dispara a consulta de produto.',
      en: 'An unknown customer does not trigger the product lookup.',
    },
    {
      pt: 'A ordem é cliente, depois produto. verifyNoInteractions(productClient) evita chamada Feign inútil.',
      en: 'The order is customer, then product. verifyNoInteractions(productClient) avoids a useless Feign call.',
    },
    `when(customerClient.getCustomerById("ghost")).thenReturn(Optional.empty());

assertThatThrownBy(() -> service.addItemToCart("ghost", new Item(1, 1)))
        .isInstanceOf(CustomerNotFoundException.class);
verifyNoInteractions(productClient);
verify(cartRepository, never()).save(any());`,
    SERVICE,
  ),
  docTest(
    'cart-svc-duplicate',
    MODULE,
    'CartServiceTest',
    'addItemDuplicateProduct',
    {
      pt: 'Produto já no carrinho é 400 e não persiste.',
      en: 'A product already in the cart is 400 and is not persisted.',
    },
    {
      pt: 'A regra do domínio sobe até o service, que também não pode dar save numa duplicata.',
      en: 'The domain rule reaches the service, which also must not save a duplicate.',
    },
    `assertThatThrownBy(() -> service.addItemToCart(CUSTOMER_ID, new Item(10, 2)))
        .isInstanceOfSatisfying(CartException.class,
                e -> assertThat(e.getHttpStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
verify(cartRepository, never()).save(any());`,
    SERVICE,
  ),
  docTest(
    'cart-svc-copy',
    MODULE,
    'CartServiceTest',
    'addItemStoresCopyOfRequestItem',
    {
      pt: 'O item gravado é uma cópia: mudar o request depois não altera o carrinho.',
      en: 'The stored item is a copy: changing the request afterwards does not change the cart.',
    },
    {
      pt: 'O request HTTP não pode ser a mesma instância da lista persistida. setQuantity(100) no request deixa o carrinho com 2.',
      en: 'The HTTP request must not be the same instance as the persisted list. setQuantity(100) on the request leaves the cart at 2.',
    },
    `Item request = new Item(10, 2);
Cart result = service.addItemToCart(CUSTOMER_ID, request);
request.setQuantity(100);

assertThat(result.getItems()).singleElement().extracting(Item::getQuantity).isEqualTo(2);`,
    SERVICE,
  ),
  docTest(
    'cart-svc-feign',
    MODULE,
    'CartServiceTest',
    'feignFailureIsPropagated',
    {
      pt: 'FeignException sai do service do jeito que entrou, e nada é salvo.',
      en: 'FeignException leaves the service as it arrived, and nothing is saved.',
    },
    {
      pt: 'Quem traduz 500 downstream para 502 é o handler. O service não engole nem reescreve a falha do Feign.',
      en: 'The handler is what translates a downstream 500 into 502. The service neither swallows nor rewrites the Feign failure.',
    },
    `FeignException failure = feignException(500);
when(productClient.getProductById(10)).thenThrow(failure);

assertThatThrownBy(() -> service.addItemToCart(CUSTOMER_ID, new Item(10, 1))).isSameAs(failure);
verify(cartRepository, never()).save(any());`,
    SERVICE,
  ),
  docTest(
    'cart-svc-change',
    MODULE,
    'CartServiceTest',
    'changeQuantityHappyPath',
    {
      pt: 'change atualiza a quantidade dentro do estoque e persiste.',
      en: 'change updates the quantity within stock and persists.',
    },
    {
      pt: 'Quantidade 1 vira 8, com estoque 8. O save confirma a troca.',
      en: 'Quantity 1 becomes 8, with stock 8. save confirms the change.',
    },
    `Cart result = service.changeItemQuantityFromCart(CUSTOMER_ID, new Item(10, 8));

assertThat(result.getItems()).singleElement().extracting(Item::getQuantity).isEqualTo(8);
verify(cartRepository).save(result);`,
    SERVICE,
  ),
  docTest(
    'cart-svc-06',
    MODULE,
    'CartServiceTest',
    'changeQuantityItemNotInCart',
    {
      pt: 'change de produto que existe no catálogo e não está no carrinho é 404.',
      en: 'change of a product that exists in the catalog but is not in the cart is 404.',
    },
    {
      pt: 'Diferente do add: aqui a ausência não insere. Não há save.',
      en: 'Unlike add: absence here does not insert. There is no save.',
    },
    `assertThatThrownBy(() -> service.changeItemQuantityFromCart(CUSTOMER_ID, new Item(10, 2)))
        .isInstanceOfSatisfying(CartException.class,
                e -> assertThat(e.getHttpStatus()).isEqualTo(HttpStatus.NOT_FOUND));
verify(cartRepository, never()).save(any());`,
    SERVICE,
    'CART-SVC-06',
  ),
  docTest(
    'cart-svc-change-stock',
    MODULE,
    'CartServiceTest',
    'changeQuantityAboveStock',
    {
      pt: 'change acima do estoque conserva a quantidade antiga.',
      en: 'change above stock keeps the old quantity.',
    },
    {
      pt: 'Era 1, pede 4 com estoque 3. A exceção acontece, o item segue 1 e não há save.',
      en: 'It was 1, the request is 4 with stock 3. The exception is thrown, the item stays at 1, and there is no save.',
    },
    `assertThatThrownBy(() -> service.changeItemQuantityFromCart(CUSTOMER_ID, new Item(10, 4)))
        .isInstanceOf(CartException.class);
assertThat(cart.getItems()).singleElement().extracting(Item::getQuantity).isEqualTo(1);
verify(cartRepository, never()).save(any());`,
    SERVICE,
  ),
  docTest(
    'cart-svc-remove',
    MODULE,
    'CartServiceTest',
    'removeItemHappyPath',
    {
      pt: 'remove tira o produto e persiste o carrinho.',
      en: 'remove drops the product and persists the cart.',
    },
    {
      pt: 'De 1 e 2 fica 2. O save grava a lista já sem o item.',
      en: 'From 1 and 2, 2 remains. save stores the list already without the item.',
    },
    `Cart result = service.removeItemFromCart(CUSTOMER_ID, 1);

assertThat(result.getItems()).extracting(Item::getProductId).containsExactly(2);
verify(cartRepository).save(result);`,
    SERVICE,
  ),
  docTest(
    'cart-svc-remove-missing',
    MODULE,
    'CartServiceTest',
    'removeItemMissingProduct',
    {
      pt: 'remove de produto ausente devolve o carrinho igual e não chama o catálogo.',
      en: 'remove of a missing product returns the cart unchanged and does not call the catalog.',
    },
    {
      pt: 'Remove não precisa do product service. verifyNoInteractions(productClient) documenta isso.',
      en: 'Remove does not need the product service. verifyNoInteractions(productClient) documents that.',
    },
    `Cart result = service.removeItemFromCart(CUSTOMER_ID, 99);

assertThat(result.getItems()).hasSize(1);
verifyNoInteractions(productClient);`,
    SERVICE,
  ),
  docTest(
    'cart-svc-remove-new',
    MODULE,
    'CartServiceTest',
    'removeItemOnBrandNewCart',
    {
      pt: 'remove num carrinho recém-criado devolve items vazio.',
      en: 'remove on a cart that was just created returns an empty items list.',
    },
    {
      pt: 'A lista vazia imutável do create não pode estourar no remove.',
      en: 'The immutable empty list from create must not crash on remove.',
    },
    `Cart result = service.removeItemFromCart(CUSTOMER_ID, 1);

assertThat(result.getItems()).isEmpty();`,
    SERVICE,
  ),
  docTest(
    'cart-svc-empty',
    MODULE,
    'CartServiceTest',
    'emptyCartHappyPath',
    {
      pt: 'emptyCart zera os itens e persiste.',
      en: 'emptyCart clears the items and persists.',
    },
    {
      pt: 'Dois itens viram lista vazia e há save. Esvaziar é uma escrita, não só uma view.',
      en: 'Two items become an empty list and there is a save. Emptying is a write, not only a view.',
    },
    `Cart result = service.emptyCart(CUSTOMER_ID);

assertThat(result.getItems()).isEmpty();
verify(cartRepository).save(result);`,
    SERVICE,
  ),
  docTest(
    'cart-svc-empty-then-add',
    MODULE,
    'CartServiceTest',
    'emptyThenAddWorks',
    {
      pt: 'Um carrinho esvaziado aceita um item novo.',
      en: 'An emptied cart accepts a new item.',
    },
    {
      pt: 'Regressão: setItems(List.of()) fazia o add seguinte estourar. Depois do empty, o add do produto 2 deixa só esse produto.',
      en: 'Regression: setItems(List.of()) made the next add crash. After empty, adding product 2 leaves only that product.',
    },
    `service.emptyCart(CUSTOMER_ID);
Cart result = service.addItemToCart(CUSTOMER_ID, new Item(2, 1));

assertThat(result).isSameAs(cart);
assertThat(result.getItems()).extracting(Item::getProductId).containsExactly(2);`,
    SERVICE,
  ),
  docTest(
    'cart-svc-empty-unknown',
    MODULE,
    'CartServiceTest',
    'emptyCartUnknownCustomer',
    {
      pt: 'emptyCart de cliente desconhecido não persiste e não chama produto.',
      en: 'emptyCart of an unknown customer does not persist and does not call product.',
    },
    {
      pt: 'A checagem de cliente vale em toda escrita, inclusive esvaziar. Não há save nem Feign de produto.',
      en: 'The customer check applies to every write, including empty. There is no save and no product Feign call.',
    },
    `when(customerClient.getCustomerById("ghost")).thenReturn(Optional.empty());

assertThatThrownBy(() -> service.emptyCart("ghost")).isInstanceOf(CustomerNotFoundException.class);
verify(cartRepository, never()).save(any());
verify(productClient, never()).getProductById(anyInt());`,
    SERVICE,
  ),
  docTest(
    'cart-ctl-01',
    MODULE,
    'CartControllerTest',
    'getCart',
    {
      pt: 'GET devolve customerId, productId e quantity.',
      en: 'GET returns customerId, productId, and quantity.',
    },
    {
      pt: 'Contrato JSON do carrinho. O serviço está mockado: o assunto é a serialização.',
      en: 'JSON contract of the cart. The service is mocked: the subject is serialization.',
    },
    `when(service.getOrCreateCart("customer-1")).thenReturn(cartWith(new Item(1, 2)));

mockMvc.perform(get(BASE))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.customerId").value("customer-1"))
        .andExpect(jsonPath("$.items[0].productId").value(1))
        .andExpect(jsonPath("$.items[0].quantity").value(2));`,
    CONTROLLER,
    'CART-CTL-01',
  ),
  docTest(
    'cart-ctl-add',
    MODULE,
    'CartControllerTest',
    'addItem',
    {
      pt: 'POST /items/add repassa productId 7 e quantity 3 ao service.',
      en: 'POST /items/add forwards productId 7 and quantity 3 to the service.',
    },
    {
      pt: 'Garante o binding JSON, não só o status. O verify exige os dois valores no Item.',
      en: 'It checks JSON binding, not only the status. verify requires both values on the Item.',
    },
    `mockMvc.perform(post(BASE + "/items/add").contentType(MediaType.APPLICATION_JSON)
        .content("{\\"productId\\":7,\\"quantity\\":3}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].productId").value(7));

verify(service).addItemToCart(eq("customer-1"), argThat(i -> i.getProductId() == 7 && i.getQuantity() == 3));`,
    CONTROLLER,
  ),
  docTest(
    'cart-ctl-change',
    MODULE,
    'CartControllerTest',
    'changeItem',
    {
      pt: 'PATCH /items/change devolve a quantity nova.',
      en: 'PATCH /items/change returns the new quantity.',
    },
    {
      pt: 'O endpoint de troca é distinto do add. Quantity 9 volta no JSON.',
      en: 'The change endpoint is distinct from add. Quantity 9 comes back in the JSON.',
    },
    `mockMvc.perform(patch(BASE + "/items/change").contentType(MediaType.APPLICATION_JSON)
        .content("{\\"productId\\":7,\\"quantity\\":9}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].quantity").value(9));`,
    CONTROLLER,
  ),
  docTest(
    'cart-ctl-04',
    MODULE,
    'CartControllerTest',
    'removeItem',
    {
      pt: 'PATCH /items/remove/{productId} delega o id e devolve items vazio.',
      en: 'PATCH /items/remove/{productId} forwards the id and returns an empty items list.',
    },
    {
      pt: 'O productId vai no path, não no body. Remove 7 esvazia o JSON de items.',
      en: 'productId travels in the path, not in the body. Removing 7 empties the items JSON.',
    },
    `when(service.removeItemFromCart("customer-1", 7)).thenReturn(cartWith());

mockMvc.perform(patch(BASE + "/items/remove/7"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items").isEmpty());`,
    CONTROLLER,
    'CART-CTL-04',
  ),
  docTest(
    'cart-ctl-empty',
    MODULE,
    'CartControllerTest',
    'emptyCart',
    {
      pt: 'PATCH /empty devolve o carrinho sem itens.',
      en: 'PATCH /empty returns the cart with no items.',
    },
    {
      pt: 'Esvaziar é um endpoint próprio. O JSON de items fica vazio.',
      en: 'Emptying is its own endpoint. The items JSON is empty.',
    },
    `when(service.emptyCart("customer-1")).thenReturn(cartWith());

mockMvc.perform(patch(BASE + "/empty"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items").isEmpty());`,
    CONTROLLER,
  ),
  docTest(
    'cart-ctl-add-invalid',
    MODULE,
    'CartControllerTest',
    'addRejectsInvalidItem',
    {
      pt: 'POST /items/add rejeita quantidade 0, negativa, ausente, productId ausente e objeto vazio.',
      en: 'POST /items/add rejects quantity 0, a negative quantity, a missing quantity, a missing productId, and an empty object.',
    },
    {
      pt: 'Cada caso é 400 e o service não é chamado. A validação do Item mora no controller.',
      en: 'Each case is 400 and the service is not called. Item validation lives in the controller.',
    },
    `@ParameterizedTest(name = "add rejects {0}")
@MethodSource("invalidItems")
void addRejectsInvalidItem(String description, String json) throws Exception {
    mockMvc.perform(post(BASE + "/items/add").contentType(MediaType.APPLICATION_JSON).content(json))
            .andExpect(status().isBadRequest());
    verifyNoInteractions(service);
}`,
    CONTROLLER,
  ),
  docTest(
    'cart-ctl-change-invalid',
    MODULE,
    'CartControllerTest',
    'changeRejectsInvalidItem',
    {
      pt: 'PATCH /items/change rejeita os mesmos bodies inválidos do add.',
      en: 'PATCH /items/change rejects the same invalid bodies as add.',
    },
    {
      pt: 'Os dois endpoints compartilham a validação do Item. Cobrir só o add deixaria o change aberto.',
      en: 'Both endpoints share Item validation. Covering only add would leave change open.',
    },
    `@ParameterizedTest(name = "change rejects {0}")
@MethodSource("invalidItems")
void changeRejectsInvalidItem(String description, String json) throws Exception {
    mockMvc.perform(patch(BASE + "/items/change").contentType(MediaType.APPLICATION_JSON).content(json))
            .andExpect(status().isBadRequest());
    verify(service, never()).changeItemQuantityFromCart(any(), any());
}`,
    CONTROLLER,
  ),
  docTest(
    'cart-ctl-cart-exception',
    MODULE,
    'CartControllerTest',
    'cartExceptionKeepsStatusAndPath',
    {
      pt: 'CartException conserva o próprio status e o path da request.',
      en: 'CartException keeps its own status and the request path.',
    },
    {
      pt: '"not enough stock" com BAD_REQUEST vira 400, errors.error com essa frase e path .../items/add.',
      en: '"not enough stock" with BAD_REQUEST becomes 400, errors.error with that sentence, and path .../items/add.',
    },
    `when(service.addItemToCart(eq("customer-1"), any(Item.class)))
        .thenThrow(new CartException("not enough stock", HttpStatus.BAD_REQUEST));

mockMvc.perform(post(BASE + "/items/add").contentType(MediaType.APPLICATION_JSON)
        .content("{\\"productId\\":1,\\"quantity\\":1}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.error").value("not enough stock"))
        .andExpect(jsonPath("$.path").value(BASE + "/items/add"));`,
    CONTROLLER,
  ),
  docTest(
    'cart-ctl-cart-404',
    MODULE,
    'CartControllerTest',
    'cartExceptionNotFound',
    {
      pt: 'CartException 404 continua 404.',
      en: 'A CartException 404 stays 404.',
    },
    {
      pt: 'Item fora do carrinho no change é 404. O handler não pode achatar todo CartException em 400.',
      en: 'An item missing from the cart on change is 404. The handler must not flatten every CartException into 400.',
    },
    `when(service.changeItemQuantityFromCart(eq("customer-1"), any(Item.class)))
        .thenThrow(new CartException("Item not found in cart with product id: 1", HttpStatus.NOT_FOUND));

mockMvc.perform(patch(BASE + "/items/change").contentType(MediaType.APPLICATION_JSON)
        .content("{\\"productId\\":1,\\"quantity\\":1}"))
        .andExpect(status().isNotFound());`,
    CONTROLLER,
  ),
  docTest(
    'cart-ctl-customer-404',
    MODULE,
    'CartControllerTest',
    'customerNotFound',
    {
      pt: 'CustomerNotFoundException devolve 404 com a mensagem e o path da request.',
      en: 'CustomerNotFoundException returns 404 with the message and the request path.',
    },
    {
      pt: 'O path sai da request, não de uma string fixa no handler. A mensagem cita customer-1.',
      en: 'The path comes from the request, not from a string hardcoded in the handler. The message cites customer-1.',
    },
    `when(service.getOrCreateCart("customer-1")).thenThrow(new CustomerNotFoundException("customer-1"));

mockMvc.perform(get(BASE))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.errors.error").value("Customer not found with id: customer-1"))
        .andExpect(jsonPath("$.path").value(BASE));`,
    CONTROLLER,
  ),
  docTest(
    'cart-ctl-product-404',
    MODULE,
    'CartControllerTest',
    'productNotFound',
    {
      pt: 'ProductNotFoundException devolve 404 com o path do add.',
      en: 'ProductNotFoundException returns 404 with the add path.',
    },
    {
      pt: 'O 404 de produto no carrinho usa a URI do endpoint que falhou, não um path genérico.',
      en: 'The product 404 on the cart uses the URI of the endpoint that failed, not a generic path.',
    },
    `when(service.addItemToCart(eq("customer-1"), any(Item.class))).thenThrow(new ProductNotFoundException(42));

mockMvc.perform(post(BASE + "/items/add").contentType(MediaType.APPLICATION_JSON)
        .content("{\\"productId\\":42,\\"quantity\\":1}"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.path").value(BASE + "/items/add"));`,
    CONTROLLER,
  ),
  docTest(
    'cart-hnd-01',
    MODULE,
    'CartControllerTest',
    'downstreamNotFoundIs404',
    {
      pt: 'Feign 404 continua 404.',
      en: 'A Feign 404 stays 404.',
    },
    {
      pt: 'Regressão: todo FeignException virava 400. O status downstream de "não achei" tem que atravessar.',
      en: 'Regression: every FeignException used to become 400. The downstream "not found" status has to cross through.',
    },
    `when(service.getOrCreateCart("customer-1")).thenThrow(CartServiceTest.feignException(404));

mockMvc.perform(get(BASE))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.path").value(BASE));`,
    CONTROLLER,
    'CART-HND-01',
  ),
  docTest(
    'cart-hnd-4xx',
    MODULE,
    'CartControllerTest',
    'downstreamClientErrorIsPropagated',
    {
      pt: 'Outro 4xx downstream atravessa. Feign 409 devolve 409.',
      en: 'Another downstream 4xx crosses through. Feign 409 returns 409.',
    },
    {
      pt: 'O handler não recolhe todo erro de cliente do outro serviço num único 400.',
      en: 'The handler does not collapse every client error from the other service into a single 400.',
    },
    `when(service.getOrCreateCart("customer-1")).thenThrow(CartServiceTest.feignException(409));

mockMvc.perform(get(BASE)).andExpect(status().isConflict());`,
    CONTROLLER,
  ),
  docTest(
    'cart-hnd-502',
    MODULE,
    'CartControllerTest',
    'downstreamServerErrorIs502',
    {
      pt: '5xx downstream vira 502, com a mensagem do status e sem o body do outro serviço.',
      en: 'A downstream 5xx becomes 502, with the status message and without the other service body.',
    },
    {
      pt: 'O carrinho não finge que o erro é dele (não é 500 local) e não repassa o corpo downstream.',
      en: 'The cart does not pretend the error is its own (it is not a local 500) and does not forward the downstream body.',
    },
    `when(service.getOrCreateCart("customer-1")).thenThrow(CartServiceTest.feignException(500));

mockMvc.perform(get(BASE))
        .andExpect(status().isBadGateway())
        .andExpect(jsonPath("$.errors.error").value("Downstream service failed with status 500"));`,
    CONTROLLER,
  ),
  docTest(
    'cart-hnd-503',
    MODULE,
    'CartControllerTest',
    'downstreamUnavailableIs503',
    {
      pt: 'Downstream sem status HTTP vira 503.',
      en: 'A downstream call with no HTTP status becomes 503.',
    },
    {
      pt: 'RetryableException com status -1 (connection refused) é serviço caído, diferente de um serviço que respondeu 500.',
      en: 'RetryableException with status -1 (connection refused) is a service that is down, different from a service that answered 500.',
    },
    `FeignException unreachable = new RetryableException(
        -1, "connection refused", Request.HttpMethod.GET, (Long) null, request);
when(service.getOrCreateCart("customer-1")).thenThrow(unreachable);

mockMvc.perform(get(BASE))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.errors.error").value("Downstream service is unavailable"));`,
    CONTROLLER,
  ),
];
