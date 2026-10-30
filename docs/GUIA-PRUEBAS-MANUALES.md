# Guia de pruebas manuales

Esta guia permite ejecutar y evidenciar manualmente los casos principales de La Poke API usando Postman. Antes de comenzar, la API debe estar levantada en `http://localhost:3000`.

## Preparacion

Ejecuta desde la raiz del proyecto:

```bash
docker compose build api
docker compose up -d db
docker compose run --rm api npm run prisma:deploy
docker compose run --rm api npm run seed
docker compose up -d api
```

Comprueba que la API responda en:

```text
http://localhost:3000/health
```

## Casos para Postman

En cada caso, toma una captura donde se vea la URL, el metodo, el status HTTP y el cuerpo de respuesta.

### Caso 1: disponibilidad

- Metodo: `GET`
- URL: `http://localhost:3000/health`
- Esperado: `200` y `success: true`
- Captura: respuesta de salud de la API.

### Caso 2: listar con paginacion

- Metodo: `GET`
- URL: `http://localhost:3000/api/pokemon?page=1&limit=5`
- Esperado: `200`, cinco elementos como maximo y objeto `pagination`.
- Captura: `data` y metadatos `page`, `limit`, `total` y `totalPages`.

### Caso 3: buscar y ordenar

- Metodo: `GET`
- URL: `http://localhost:3000/api/pokemon?name=char&sort=name&order=asc`
- Esperado: `200` y resultados cuyo nombre contiene el filtro.
- Captura: parametros y resultados filtrados.

### Caso 4: consultar por id

- Metodo: `GET`
- URL: `http://localhost:3000/api/pokemon/25`
- Esperado: `200` y el Pokemon con id 25.
- Captura: identificador y objeto devuelto.

### Caso 5: crear un Pokemon

- Metodo: `POST`
- URL: `http://localhost:3000/api/pokemon`
- Header: `Content-Type: application/json`
- Body raw JSON:

```json
{
  "id": 9152,
  "name": "postman-test",
  "photo": "https://example.com/postman-test.png",
  "hp": 50,
  "attack": 50,
  "defense": 50,
  "special_attack": 50,
  "special_defense": 50,
  "speed": 50
}
```

- Esperado: `201` y `success: true`.
- Captura: request y respuesta creada.

### Caso 6: validar datos incorrectos

- Metodo: `POST`
- URL: `http://localhost:3000/api/pokemon`
- Body: usa el caso anterior, cambia `name` por `""` y `hp` por `-1`.
- Esperado: `400`, `success: false` y `VALIDATION_ERROR`.
- Captura: error de validacion.

### Caso 7: actualizar

- Metodo: `PUT`
- URL: `http://localhost:3000/api/pokemon/9152`
- Header: `Content-Type: application/json`
- Body raw JSON:

```json
{
  "name": "postman-test-updated",
  "hp": 60
}
```

- Esperado: `200` y los valores actualizados.
- Captura: request parcial y respuesta.

### Caso 8: eliminar

- Metodo: `DELETE`
- URL: `http://localhost:3000/api/pokemon/9152`
- Esperado: `200` y mensaje de eliminacion exitosa.
- Captura: status y mensaje.

### Caso 9: recurso inexistente

- Metodo: `GET`
- URL: `http://localhost:3000/api/pokemon/999999`
- Esperado: `404`, `success: false` y `POKEMON_NOT_FOUND`.
- Captura: respuesta de error.

### Caso 10: ruta inexistente

- Metodo: `GET`
- URL: `http://localhost:3000/api/no-existe`
- Esperado: `404`, `success: false` y `ROUTE_NOT_FOUND`.
- Captura: error estructurado.

## Evidencia automatizada en Docker

Para la captura de la suite automatizada:

```bash
docker compose build api
docker compose up -d db
docker compose run --rm api npm run prisma:deploy
docker compose run --rm api npm run test:integration
```

La consola debe mostrar `3 passed` y `3 tests passed`. Para la suite de API aislada:

```bash
docker compose run --rm api npm test
```

La consola debe mostrar `20 passed`.