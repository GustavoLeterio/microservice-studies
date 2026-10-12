# Site de documentação

Aplicação Angular que documenta o estudo de microserviços deste repositório: o domínio de e-commerce (clientes, produtos e carrinho), a infraestrutura Spring Cloud, o Docker Compose e a observabilidade.

O conteúdo usa trechos reais do código Java, YAML e Dockerfiles — não é um tutorial genérico. A ideia é abrir o site, seguir a sidebar e entender o que cada pasta do projeto faz.

## O que o site cobre

A leitura segue um caminho: orientar → navegar o sistema → aprofundar → guias.

| Seção | O que você encontra |
|---|---|
| **Visão geral** | Domínio, mapa da arquitetura, stack com versões e como executar o compose |
| **Explorador** | Catálogo vivo de serviços, endpoints, respostas HTTP e erros |
| **Microserviços** | Bounded context, camadas MVC, persistência, Feign e contratos REST |
| **Estrutura do código** | Maven multi-módulo, lib `common-exceptions`, records, Lombok e `.env` |
| **Arquitetura** | Config Server, Eureka, API Gateway, load balancer e tráfego N-S / L-O |
| **Docker** | Imagens, Dockerfile multi-stage, Compose, volumes e `.dockerignore` |
| **Observabilidade** | Actuator, Prometheus, Grafana, logs, Springdoc e Swagger no gateway |
| **Guias** | Como criar um serviço novo, pontos de atenção e glossário |

O **Explorador** é o catálogo operacional: mapa dos componentes, ficha de cada serviço (porta, tecnologias, dependências) e lista filtrável de rotas com payloads e erros.

## Funcionalidades

- Sidebar por tópicos, com busca que indexa páginas, serviços e endpoints (ignora acentos).
- Diagrama da arquitetura, blocos de código com highlight e botão de copiar.
- Tema claro/escuro persistido no `localStorage`.
- Lazy loading por feature (`loadChildren`) e SPA servida pelo Nginx em produção (`try_files` → `index.html`).

## Tecnologias do site

| Tecnologia | Uso |
|---|---|
| **Angular 22** | SPA com **NgModules** (não standalone), roteamento e lazy loading |
| **TypeScript ~6** | Tipagem do app e dos modelos de documentação |
| **Sass (SCSS)** | Estilos globais (`tokens`, `base`, `prose`, tema de código) e por componente |
| **RxJS** | Eventos do router e interop com signals (`takeUntilDestroyed`) |
| **Angular Signals** | Estado da navegação, tema e UI da sidebar |
| **highlight.js** | Syntax highlight dos trechos Java, YAML, Docker, XML etc. |
| **Node.js 22** | Build da imagem Docker (`npm ci` + `ng build`) |
| **Nginx (Alpine)** | Serve o `dist` estático na porta 80 do container |
| **Docker** | Build multi-stage: Node compila, Nginx entrega |

No código, features ficam em `src/app/features/` (um módulo por seção). Layout, sidebar, busca e tema ficam em `core/`. Componentes de documentação (`code-block`, `callout`, `tabs`, diagrama) ficam em `shared/`. O catálogo do explorador está em `shared/data/system/`.

## Subir com Docker

Pela **raiz** do repositório (compose principal, porta `DOCUMENTATION_WEBSITE_PORT`, padrão 4200):

```bash
docker compose up -d --build documentation-website
```

Só nesta pasta:

```bash
docker compose up --build
```

Sem Compose:

```bash
docker build -t documentation-website .
docker run --rm -p 4200:80 documentation-website
```

Abra [http://localhost:4200](http://localhost:4200). Para parar: `docker compose down` (nesta pasta) ou `docker compose stop documentation-website` (na raiz).

A imagem usa dois estágios: `node:22-alpine` gera `dist/documentation-website/browser`; `nginx:alpine` copia o `nginx.conf` e os arquivos estáticos.

## Desenvolvimento local

Requer Node.js (o lockfile foi gerado com npm 11).

```bash
npm install
npm start
```

O `ng serve` sobe em [http://localhost:4200](http://localhost:4200) com hot reload.

```bash
npm run build   # saída em dist/
```
