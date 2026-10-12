# documentation-website

Site Angular (NgModules + Sass) com a documentação deste repositório.

## Docker

Pela raiz do repositório (compose principal):

```bash
docker compose up -d --build documentation-website
```

Ou só nesta pasta:

1. Docker instalado e em execução
2. `docker compose up --build`
3. Abrir [http://localhost:4200](http://localhost:4200)
4. Parar com `docker compose down`

Sem Compose:

```bash
docker build -t documentation-website .
docker run --rm -p 4200:80 documentation-website
```

## Desenvolvimento local

1. `npm install`
2. `npm start`
3. Abrir [http://localhost:4200](http://localhost:4200)
