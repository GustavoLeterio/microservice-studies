# E-commerce Microservices

Estudo de microserviços com Spring Boot, Spring Cloud e Docker: clientes, produtos, carrinho, Config Server, Eureka, API Gateway, Prometheus e Grafana.

A documentação do código está em um site Angular na pasta `documentation-website`. Ele explica o que cada serviço faz, a estrutura do código, a arquitetura e lista endpoints, respostas e erros.

## Subir o site de documentação (Docker)

Na raiz deste repositório, junto com o restante do compose:

1. Tenha o Docker instalado e em execução.
2. Suba só o site (ou o stack inteiro, omitindo o nome do serviço):

```bash
docker compose up -d --build documentation-website
```

3. Abra no navegador: [http://localhost:4200](http://localhost:4200)

4. Para parar só o site:

```bash
docker compose stop documentation-website
```

## Subir o site sem Docker (desenvolvimento)

1. `cd documentation-website`
2. `npm install`
3. `npm start`
4. Abrir [http://localhost:4200](http://localhost:4200)
