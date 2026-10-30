# Construcción de API REST base para proyecto de aula

## Descripción

Este proyecto académico tiene como objetivo construir una API REST propia basada en Pokémon, utilizando PokeAPI como fuente externa, PostgreSQL como base de datos interna y Prisma como ORM. La API permite almacenar, consultar, actualizar y eliminar registros de Pokémon, y sirve como base sólida para pruebas de software en curso.

## Tecnologías utilizadas

- Node.js
- React
- Vite
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

Crea `.env` a partir de `.env.example` y configura la URL de una base PostgreSQL disponible. Prisma requiere `DATABASE_URL`; tener el archivo de ejemplo no basta si no has creado `.env`.

```bash
cp .env.example .env
```

En PowerShell:

```powershell
Copy-Item .env.example .env
```

Abre `.env` y sustituye los datos de conexión por tus credenciales locales. El formato general de la URL es:

```env
DATABASE_URL="postgresql://USUARIO:CONTRASENA@localhost:5432/pokemon_db?schema=public"
```

Reemplaza `USUARIO` y `CONTRASENA` por los valores de tu PostgreSQL. No compartas ni subas el archivo `.env`.

Ejemplo de contenido:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pokemon_db"
POKEAPI_BASE_URL="https://pokeapi.co/api/v2"
```

En producción, configura API_WRITE_KEY con un secreto aleatorio de al menos 32 caracteres para proteger las rutas de creación, actualización y eliminación de Pokémon. Envía la cabecera Authorization con el formato Bearer seguido de la clave. Configura también CORS_ORIGINS con el origen de tu interfaz.

## Configuración de PostgreSQL

1. Crea una base de datos llamada `pokemon_db`.
2. Asegúrate de que PostgreSQL esté corriendo localmente.
3. Ajusta `DATABASE_URL` en el archivo `.env`.

## Migraciones Prisma

Genera el cliente de Prisma y aplica migraciones:

```bash
npm run prisma:generate
npx prisma migrate deploy
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
- valida la conexión a PostgreSQL antes de consultar la API
- informa cuántos registros guardó realmente y termina con error si no logra guardar los 151

## Ejecución en desarrollo

```bash
npm run dev
```

En otra terminal, inicia la interfaz web con recarga en caliente:

```bash
npm run dev:client
```

La aplicación de combate quedará disponible en `http://localhost:5173`. El servidor API sirve la versión compilada de la interfaz en `http://localhost:3000` después de ejecutar `npm run build`.

## Ejecución con Docker

Solo necesitas tener Docker Desktop instalado y abierto. No hace falta instalar Node.js ni PostgreSQL en el computador.

```bash
docker compose up -d --build
```

La primera ejecución construye la aplicación, inicia PostgreSQL, aplica las migraciones y carga los 151 Pokémon desde PokeAPI. Cuando termine, abre <http://localhost:3000> para jugar. La carga inicial necesita conexión a internet.

La base de datos queda guardada en un volumen de Docker. Al volver a ejecutar `docker compose up -d`, conserva los datos y no vuelve a descargar los Pokémon. Para ver el arranque y posibles errores:

```bash
docker compose logs -f api
```

Para detener el juego sin borrar la base de datos:

```bash
docker compose down
```

Para compartirlo, sube el proyecto a un repositorio y envíale el enlace. Tu amigo necesita Docker Desktop instalado y abierto; luego ejecuta:

```bash
git clone <URL-del-repositorio>
cd <carpeta-del-proyecto>
docker compose up -d --build
```

Después abre <http://localhost:3000>. Si ese puerto ya está ocupado, define `APP_PORT=3001` en `.env` y entra a <http://localhost:3001>. PostgreSQL solo es accesible dentro de Docker, así que no interfiere con una instalación local de PostgreSQL en el puerto 5432.

Para borrar también la base de datos y empezar de cero, ejecuta `docker compose down -v`. Esto elimina los datos guardados.

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

## Interfaz de combate

La aplicación web de combate se ejecuta en `http://localhost:3000` al iniciar el servidor. Para desarrollo con recarga en caliente, ejecuta la API con `npm run dev` y la interfaz con `npm run dev:client`; Vite estará disponible en `http://localhost:5173` y enviará las peticiones `/api` a la API local.

La interfaz permite elegir ambos Pokémon, buscar en la Pokédex, iniciar el combate, seleccionar movimientos, ver el registro de acciones, salud y resultado. Los endpoints del módulo están disponibles en `/api/battles`.

Consulta las reglas y limitaciones de la lógica en [docs/COMBATE.md](docs/COMBATE.md).

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
docker compose run --rm api npm run prisma:deploy
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
├── frontend/
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── api.ts
│       └── styles.css
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
