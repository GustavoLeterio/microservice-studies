import { cards, code, columns, flow, list, note, page, section, table, tabs, text, tip, warn } from '../../shared/content/blocks';
import { c, link } from '../../shared/content/html';
import {
  CART_CONTROLLER,
  CART_SERVICE,
  CATEGORY_ENTITY,
  CUSTOMER_CLIENT,
  CUSTOMER_CONTROLLER,
  CUSTOMER_ENTITY,
  CUSTOMER_MAPPER,
  CUSTOMER_REPOSITORY,
  CUSTOMER_SERVICE,
  PRODUCT_CLIENT,
  PRODUCT_ENTITY,
} from '../../shared/content/snippets/java.snippets';

export const PAGES = {
  conceito: page(
    'O que fazem e como fazem',
    'Microserviço, neste projeto, é um processo Spring Boot com o próprio banco, o próprio POM e o próprio container — conversando com os outros só por HTTP.',
    section(
      'o-que-e',
      'O que é um microserviço aqui',
      text(
        `Cada serviço de negócio empacota um <strong>bounded context</strong>: clientes, catálogo ou carrinho. Não compartilham tabelas. Compartilham só contratos HTTP, o JAR ${c('common-exceptions')} e a plataforma (Config, Eureka, Gateway).`,
      ),
      table(
        ['Princípio', 'Como aparece no código'],
        [
          ['Um processo, um deploy', 'Módulo Maven + Dockerfile + serviço no Compose.'],
          ['Database per service', 'customer_db e cart_db no Mongo; product_db no Postgres. Mesmo servidor Mongo, bancos lógicos diferentes.'],
          ['API como contrato', `Controllers REST em ${c('/api/v1/...')}; o cart não importa classes do customer, só ${c('CustomerResponse')} local + Feign.`],
          ['Independência de escala', `product e cart sem porta publicada, prontos para ${c('--scale')}.`],
        ],
      ),
    ),
    section(
      'como-faz',
      'Como cada um faz o seu trabalho',
      columns(
        {
          title: 'customer-microservice',
          blocks: [
            text('CRUD MongoDB. Não chama ninguém. É chamado pelo gateway e pelo cart.'),
            list([`${c('CustomerController')} → ${c('CustomerService')} → ${c('CustomerRepository')}`, `Exceção de domínio: ${c('CustomerNotFoundException')}`]),
          ],
        },
        {
          title: 'product-microservice',
          blocks: [
            text('Dois aggregates JPA: Category e Product. Valida nome único de categoria e existência da categoria ao criar produto.'),
            list([`Dois controllers (${c('/categories')}, ${c('/products')})`, '409 em categoria duplicada no POST']),
          ],
        },
        {
          title: 'cart-microservice',
          blocks: [
            text('Orquestra. Antes de gravar, pergunta ao customer se o cliente existe e ao product se há estoque.'),
            list([`${c('@FeignClient')} + LoadBalancer`, `Documento Cart com ${c('_id = customerId')}`]),
          ],
        },
      ),
      tip(
        `Tecnologias, dependências Maven, endpoints e erros de cada um estão nas fichas do ${link('/explorador', 'Explorador')}. Esta página cobre o desenho; as fichas cobrem o contrato.`,
      ),
    ),
    section(
      'criar',
      'Criar um serviço novo',
      text(
        `O checklist completo (módulo Maven, YAML no Config Server, rota no gateway, Compose, scrape no Prometheus) está em ${link('/guias/novo-microservico', 'Criar um novo microserviço')}.`,
      ),
    ),
  ),

  'camadas-mvc': page(
    'Camadas (MVC)',
    'Os três serviços de negócio seguem o mesmo recorte: Controller → Service → Repository, com Mapper e records na borda HTTP. Não é MVC de view server-side — é a variação REST do Spring.',
    section(
      'pacote',
      'Package by feature',
      text(
        `Em vez de ${c('controller/')}, ${c('service/')}, o código agrupa por funcionalidade: ${c('customer/')}, ${c('product/')}, ${c('cart/')}. Exceções ficam em ${c('exceptions/')}.`,
      ),
      table(
        ['Camada', 'Anotação típica', 'Responsabilidade'],
        [
          ['Controller', `${c('@RestController')} + ${c('@RequestMapping')}`, `HTTP: status, path, ${c('@Valid')}. Sem regra de negócio.`],
          ['Service', `${c('@Service')}`, 'Casos de uso, orquestração, lançar exceções de domínio.'],
          ['Repository', `${c('MongoRepository')} / ${c('JpaRepository')}`, 'Acesso a dados. Interfaces, sem implementação.'],
          ['Mapper', `${c('@Component')}`, 'Request → entidade → Response. Isola o modelo de persistência do JSON.'],
          ['DTO', `${c('record')}`, 'Contrato HTTP. Request valida; Response só carrega dados.'],
        ],
      ),
    ),
    section(
      'fluxo',
      'Exemplo: criar um cliente',
      flow([
        { label: 'POST /api/v1/customers', sub: 'JSON + @Valid', tone: 'external' },
        { label: 'CustomerController', sub: 'delega' },
        { label: 'CustomerService', sub: 'save' },
        { label: 'CustomerMapper', sub: 'Request → Document' },
        { label: 'MongoDB', sub: 'customer_db', tone: 'data' },
      ]),
      tabs(
        { label: 'Controller', blocks: [code('java', CUSTOMER_CONTROLLER, 'CustomerController.java')] },
        { label: 'Service', blocks: [code('java', CUSTOMER_SERVICE, 'CustomerService.java')] },
        { label: 'Mapper', blocks: [code('java', CUSTOMER_MAPPER, 'CustomerMapper.java')] },
      ),
      note(
        `O ${c('updateCustomer')} do controller chama o service e ignora o retorno (${c('ResponseEntity.ok(...)')} sem ${c('return')}), devolvendo 202. O serviço em si funciona; o 200 do ${c('ok')} nunca sai.`,
      ),
    ),
  ),

  persistencia: page(
    'Persistência',
    'Dois estilos no mesmo sistema: documentos MongoDB (customer e cart) e entidades JPA no PostgreSQL (product). Cada serviço só enxerga o próprio banco.',
    section(
      'mongo',
      'MongoDB (customer e cart)',
      text(
        `${c('@Document')} + ${c('MongoRepository<T, String>')}. O id do cliente é ObjectId gerado; o id do carrinho é o ${c('customerId')} (o documento é o próprio carrinho daquele cliente).`,
      ),
      tabs(
        { label: 'Customer', blocks: [code('java', CUSTOMER_ENTITY, 'Customer.java'), code('java', CUSTOMER_REPOSITORY, 'CustomerRepository.java')] },
        {
          label: 'Product (JPA)',
          blocks: [
            code('java', CATEGORY_ENTITY, 'Category.java'),
            code('java', PRODUCT_ENTITY, 'Product.java'),
            text(`Relação ${c('@OneToMany')} / ${c('@ManyToOne')} com ${c('FetchType.LAZY')}. ${c('@Data')} foi evitado nas entidades justamente por causa do lazy loading.`),
          ],
        },
      ),
    ),
    section(
      'jpa',
      'PostgreSQL / JPA',
      list([
        `${c('ddl-auto: update')} — o Hibernate cria/altera tabelas na subida. Adequado ao estudo, não a produção.`,
        `Nome de categoria ${c('unique + nullable = false')}. O POST trata duplicata com 409; o PUT não trata e vira 500.`,
        `${c('findByCategoryId')} no ${c('ProductRepository')} alimenta ${c('GET /api/v1/products/category/{id}')}.`,
      ]),
      warn(
        `Remover uma categoria que ainda tem produtos quebra a FK e cai no catch-all 500 do ${c('GlobalExceptionHandler')}. Ver ${link('/guias/pontos-de-atencao', 'Pontos de atenção')}.`,
      ),
    ),
  ),

  comunicacao: page(
    'Comunicação entre serviços',
    'Só o cart-microservice fala com outros microserviços. A chamada é síncrona, HTTP, declarativa (OpenFeign), balanceada no cliente com instâncias do Eureka.',
    section(
      'feign',
      'OpenFeign',
      text(
        `${c('@EnableFeignClients')} na classe main. Cada cliente declara o <strong>nome Eureka</strong> (em maiúsculas, o jeito que o Eureka registra) e o path do endpoint remoto.`,
      ),
      code('java', CUSTOMER_CLIENT, 'CustomerClient.java'),
      code('java', PRODUCT_CLIENT, 'ProductClient.java'),
      code('java', CART_SERVICE, 'CartService.java', 'Toda mutação passa por validateIfCustomerExists / validateIfItemCanBePersisted.'),
    ),
    section(
      'lb',
      'LoadBalancer no cliente',
      text(
        `O POM do cart declara ${c('spring-cloud-starter-loadbalancer')}. Na prática: Feign pergunta ao Eureka “quem é CUSTOMER-MICROSERVICE?”, o LoadBalancer escolhe uma instância (round-robin) e dispara o HTTP. Isso é balanceamento ${link('/arquitetura/load-balancer', 'client-side')} e tráfego ${link('/arquitetura/trafego', 'leste-oeste')}.`,
      ),
      flow(
        [
          { label: 'cart :8093' },
          { label: 'Feign', sub: 'CUSTOMER-MICROSERVICE', tone: 'platform' },
          { label: 'Eureka', tone: 'platform' },
          { label: 'customer :8091' },
        ],
        'O gateway não participa desta chamada.',
      ),
    ),
    section(
      'falha',
      'Quando o outro serviço falha',
      text(
        `Um 404 remoto vira ${c('FeignException')}, tratada no ${c('CartExceptionHandler')} como 400 (não 404). Serviço fora do ar / sem instância no Eureka tende a 503 do LoadBalancer, também encapsulado. Detalhe dos corpos em ${link('/explorador/servicos/cart-microservice', 'ficha do cart')}.`,
      ),
    ),
  ),

  endpoints: page(
    'Endpoints',
    'Convenções REST usadas pelos três serviços e pelo gateway. A lista completa, com exemplos de resposta e erro, está no catálogo.',
    section(
      'convencoes',
      'Convenções',
      list([
        `Prefixo ${c('/api/v1/')} + recurso no plural.`,
        `JSON em quase tudo. Exceção: POST de customer devolve o id como ${c('text/plain')}.`,
        'Ids: String (Mongo) em customer/cart; Integer (JPA) em product/category.',
        'O gateway replica os mesmos paths — o cliente externo não precisa saber o host interno.',
      ]),
      table(
        ['Serviço', 'Base', 'Via gateway'],
        [
          ['customer', `${c('/api/v1/customers')}`, 'http://localhost:8222/api/v1/customers'],
          ['product', `${c('/api/v1/products')} e ${c('/api/v1/categories')}`, 'http://localhost:8222/api/v1/products'],
          ['cart', `${c('/api/v1/carts/{customerId}')}`, 'http://localhost:8222/api/v1/carts/{id}'],
        ],
      ),
      cards([
        {
          title: 'Catálogo filtrável',
          link: '/explorador/endpoints',
          html: 'Todas as rotas de negócio com corpo, respostas e erros.',
        },
        {
          title: 'Swagger agregado',
          link: '/observabilidade/swagger-no-gateway',
          html: 'UI em http://localhost:8222/swagger-ui.html.',
        },
      ]),
    ),
    section(
      'cart',
      'Detalhe do cart',
      text(
        `Mutações de item usam ${c('PATCH')} (empty, change, remove) e ${c('POST .../items/add')}. Não há DELETE de item: a remoção é patch no recurso carrinho. ${c('GET')} cria o carrinho vazio se ainda não existir.`,
      ),
      code('java', CART_CONTROLLER, 'CartController.java'),
    ),
  ),

  'respostas-e-erros': page(
    'Respostas e erros',
    'Dois formatos convivem: o record ErrorResponse da lib interna (customer/product) e ProblemDetail / erro padrão do Boot (cart e algumas rotas).',
    section(
      'sucesso',
      'Sucesso',
      table(
        ['Caso', 'Status típico', 'Corpo'],
        [
          ['GET lista/item', '200', 'JSON do Response / entidade Cart'],
          ['POST customer', '200', 'id em texto'],
          ['POST product/category', '200', 'id numérico'],
          ['PUT customer', '202 Accepted', 'vazio'],
          ['DELETE customer', '202', 'vazio'],
          ['DELETE product/category', '200', 'vazio'],
        ],
      ),
    ),
    section(
      'error-response',
      'ErrorResponse (customer e product)',
      text(`Herdado de ${link('/codigo/common-exceptions', 'common-exceptions')}:`),
      code(
        'json',
        `{
  "errors": { "email": "Invalid email address" },
  "timestamp": "2026-10-08T12:00:00.000",
  "path": "/"
}`,
      ),
      list([
        `400 validação (${c('MethodArgumentNotValidException')}) — um item por campo.`,
        `400 corpo ausente — ${c('{ "error": "Request body is missing" }')}.`,
        `404 de domínio — chave ${c('customer')}, ${c('product')} ou ${c('category')}.`,
        '409 categoria duplicada.',
        `500 catch-all — também engole 404 de rota inexistente e 405. Ver ${link('/codigo/captura-de-exceptions', 'Captura de exceptions')}.`,
      ]),
    ),
    section(
      'cart-erros',
      'Cart',
      text(
        `O ${c('CartExceptionHandler')} estende ${c('ResponseEntityExceptionHandler')} (não o GlobalExceptionHandler). Feign vira 400. ${c('CartException')} usa o status que ela mesma carrega (400 ou 404). Validação de ${c('Item')} sai como ProblemDetail.`,
      ),
      warn(
        `${c('List.of()')} no carrinho recém-criado deixa a lista imutável. O primeiro ${c('addItem')} lança ${c('UnsupportedOperationException')} e o Boot responde 500 pelo ${c('/error')}.`,
      ),
    ),
  ),
};
