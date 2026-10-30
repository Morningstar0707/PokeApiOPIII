# Estrategia de pruebas de La Poke API

## Objetivo

Verificar que la API REST mantiene su contrato HTTP, valida las entradas, aplica las reglas de negocio y responde correctamente ante operaciones exitosas y errores esperados.

## Alcance del plan minimo

La suite cubre la capa de API mediante Jest y Supertest. Prisma se aisla con dobles de prueba para que los casos sean deterministas y se concentren en HTTP, validacion y reglas de negocio.

### Escenarios cubiertos

| Area | Casos principales | Resultado esperado |
| --- | --- | --- |
| Disponibilidad | `GET /health` | HTTP 200 y respuesta saludable |
| Consulta | listar y consultar por id | HTTP 200 con contrato `success` y `data` |
| Paginacion | `page` y `limit` | `skip`, `take` y metadatos correctos |
| Filtrado y orden | `name`, `sort`, `order` | Consulta con los parametros esperados |
| Validacion | datos invalidos, ids invalidos y query invalida | HTTP 400 y `VALIDATION_ERROR` o error de dominio |
| Creacion | payload valido | HTTP 201 |
| Conflictos | id o nombre duplicado | HTTP 409 |
| Actualizacion | payload parcial valido | HTTP 200 |
| Eliminacion | registro existente | HTTP 200 |
| No encontrado | id inexistente o ruta desconocida | HTTP 404 |
| Documentacion | `GET /api-docs` | redireccion HTTP 301 a `/api-docs/` |

## Criterios de aceptacion

- Todas las pruebas automatizadas deben pasar.
- Cada endpoint CRUD debe tener al menos un caso exitoso y uno de error.
- Las respuestas de error deben conservar `success: false` y un codigo identificable.
- La paginacion debe comprobar tanto la respuesta como los parametros enviados al repositorio.
- La suite debe poder ejecutarse sin una base de datos externa.

## Ejecucion

Instalar dependencias y ejecutar las pruebas:

```bash
npm install
npm test
```

Ejecutar solo la suite de la API:

```bash
npm test -- --runInBand tests/pokemon.test.ts
```

Verificar compilacion:

```bash
npm run build
```

## Siguiente nivel recomendado

Como segunda capa, ejecutar pruebas de integracion contra PostgreSQL en Docker. Esas pruebas deben validar migraciones, persistencia real, seed y consultas de paginacion sin mocks. Deben ejecutarse en una base de datos de prueba aislada para no alterar los datos de desarrollo.

## Ejecucion de integracion en Docker

Desde la raiz del proyecto:

```bash
docker compose build api
docker compose up -d db
docker compose run --rm api npm run prisma:generate
docker compose run --rm api npm run prisma:migrate
docker compose run --rm api npm run test:integration
```

La prueba de integracion usa los identificadores `9001` y `9002`, limpia esos registros antes y despues, y verifica persistencia real, paginacion, filtro, actualizacion y eliminacion.