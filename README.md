# Construcción de API REST base para proyecto de aula

## Descripción

Este proyecto académico tiene como objetivo construir una API REST propia basada en Pokémon, utilizando PokeAPI como fuente externa, PostgreSQL como base de datos interna y Prisma como ORM. La API permite almacenar, consultar, actualizar y eliminar registros de Pokémon, y sirve como base sólida para pruebas de software en curso.

## Tecnologías utilizadas

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Prisma ORM
- Axios
- Jest
- Supertest
- dotenv
- CORS
- Swagger UI
- ESLint
- Prettier

## Arquitectura

La aplicación sigue una arquitectura por capas:

- Routes: definición de endpoints
- Controllers: recepción y respuesta HTTP
- Services: lógica de negocio
- Repositories: acceso a Prisma/PostgreSQL
- Validators: validación de entradas con Zod
- Middlewares: manejo de errores y rutas no encontradas
- Config: configuración de entorno y Swagger
- Types: tipos compartidos

## Requisitos

- Node.js 20+
- PostgreSQL 15+
- npm
- Docker (opcional)

## Instalación

1. Clona el repositorio.
2. Instala las dependencias:

```bash
npm install
```

## Configuración de variables de entorno

Crea un archivo `.env` copiando el ejemplo:

```bash
cp .env.example .env
```

Ejemplo de contenido:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pokemon_db"
POKEAPI_BASE_URL="https://pokeapi.co/api/v2"
```

## Configuración de PostgreSQL

1. Crea una base de datos llamada `pokemon_db`.
2. Asegúrate de que PostgreSQL esté corriendo localmente.
3. Ajusta `DATABASE_URL` en el archivo `.env`.

## Migraciones Prisma

Genera el cliente de Prisma y aplica migraciones:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Seed de los 151 Pokémon

Para importar los 151 Pokémon desde PokeAPI a PostgreSQL:

```bash
npm run seed
```

Este script:

- recorre los IDs del 1 al 151
- consulta PokeAPI
- transforma la respuesta
- guarda o actualiza cada Pokémon en PostgreSQL
- evita duplicados con upsert

## Ejecución en desarrollo

```bash
npm run dev
```

## Ejecución con Docker

```bash
docker compose up -d
```

## Endpoints

### GET /api/pokemon

Obtiene todos los Pokémon con paginación, búsqueda por nombre, ordenamiento y filtros.

Ejemplos:

```http
GET /api/pokemon
GET /api/pokemon?page=1&limit=20
GET /api/pokemon?name=pika
GET /api/pokemon?sort=name&order=asc
```

### GET /api/pokemon/:id

Obtiene un Pokémon por su id.

### POST /api/pokemon

Crea un Pokémon manualmente.

### PUT /api/pokemon/:id

Actualiza un Pokémon existente.

### DELETE /api/pokemon/:id

Elimina un Pokémon.

## Swagger

La documentación Swagger estará disponible en:

```http
http://localhost:3000/api-docs
```

## Ejecución de pruebas

```bash
npm test
```

Las pruebas unitarias/de API usan mocks de Prisma y no requieren una base de datos. Para ejecutar las pruebas de integración contra PostgreSQL dentro de Docker:

```bash
docker compose build api
docker compose up -d db
docker compose run --rm api npm run prisma:generate
docker compose run --rm api npm run prisma:migrate
docker compose run --rm api npm run test:integration
```

La estrategia completa y los casos cubiertos están documentados en [docs/ESTRATEGIA-PRUEBAS.md](docs/ESTRATEGIA-PRUEBAS.md).

Para ejecutar los casos manualmente en Postman y preparar las capturas de evidencia, consulta [docs/GUIA-PRUEBAS-MANUALES.md](docs/GUIA-PRUEBAS-MANUALES.md).

## Estructura del proyecto

```text
pokemon-api/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── types/
│   ├── app.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
│   └── pokemon.test.ts
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── README.md
└── ...
```

## Ejemplos de request

### Crear Pokémon

```http
POST /api/pokemon
Content-Type: application/json

{
  "id": 152,
  "name": "pokemon-test",
  "photo": "https://example.com/image.png",
  "hp": 50,
  "attack": 50,
  "defense": 50,
  "special_attack": 50,
  "special_defense": 50,
  "speed": 50
}
```

### Obtener Pokémon

```http
GET /api/pokemon/25
```

### Actualizar Pokémon

```http
PUT /api/pokemon/25
Content-Type: application/json

{
  "name": "pikachu-updated",
  "hp": 40,
  "attack": 60,
  "defense": 45,
  "special_attack": 55,
  "special_defense": 55,
  "speed": 95
}
```

## Notas importantes

- PokeAPI se usa solo para la carga inicial y la actualización de datos.
- La API principal trabaja sobre PostgreSQL.
- La lógica de negocio está separada en capas.
- Los errores se manejan con respuestas JSON consistentes.
