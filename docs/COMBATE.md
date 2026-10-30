# Módulo de combate

## Alcance actual

La interfaz React se encuentra en `frontend/` y ofrece una pantalla de selección de Pokémon con búsqueda por nombre, tipo o número, y una arena responsive con salud, tipos, movimientos, registro de acciones y pantalla de resultado. El jugador selecciona un movimiento; el rival controlado por la aplicación elige uno de sus movimientos disponibles. La interfaz consume únicamente la API del proyecto para consultar los Pokémon y resolver las acciones del combate.

La API ofrece combates 1 contra 1 en `POST /api/battles`, `GET /api/battles/:id` y `POST /api/battles/:id/turns`. Para iniciar una batalla se envían `playerOnePokemonId` y `playerTwoPokemonId`, ambos existentes en `/api/pokemon`. Cada turno recibe el movimiento del jugador; el servidor elige al azar un movimiento permitido del rival. Las acciones se ejecutan según Velocidad y se omite la acción del Pokémon que ya fue derrotado.

Las partidas se almacenan en PostgreSQL y vencen tres horas después de su último turno. Varias instancias pueden consultar la misma partida. Cada turno se guarda con control de versión para rechazar escrituras simultáneas sobre un estado desactualizado.

## Datos y reglas

- Los Pokémon y estadísticas se obtienen de PostgreSQL, reutilizando sus identificadores. El campo `types` se guarda desde la importación de PokeAPI; para registros previos sin tipos, el inicio de batalla los consulta a PokeAPI.
- Los movimientos se consultan de PokeAPI en tiempo de creación de batalla: se priorizan movimientos de nivel de primera generación hasta el nivel 50 y se ofrecen hasta cuatro movimientos con poder, precisión y tipo soportados. No se copian los movimientos a los registros de Pokémon.
- El nivel utilizado es 50. Los puntos de salud máximos y actuales se inicializan con la estadística base `hp`.
- La fórmula es la aproximación indicada en la especificación. Se trunca el daño final hacia abajo y se aplica un mínimo de 1 cuando un ataque no es inmune; la inmunidad siempre causa cero.
- Los movimientos físicos usan Ataque y Defensa; los especiales usan Ataque Especial del atacante y Ataque Especial del defensor, como representación de la estadística Especial única de primera generación.
- El STAB multiplica por 1,5; la variación es aleatoria de 0,85 a 1,00. Los críticos usan velocidad base / 512 como probabilidad y multiplican el daño por 1,5. Los modificadores y la probabilidad están centralizados en `battleMechanics.service.ts`.
- La precisión se comprueba antes del cálculo del daño. El atacante con mayor Velocidad actúa primero y un empate se resuelve aleatoriamente.

## Ejemplos HTTP

```http
POST /api/battles
Content-Type: application/json

{"playerOnePokemonId":25,"playerTwoPokemonId":4}
```

La respuesta contiene el identificador de batalla, los dos participantes, salud, tipos y movimientos disponibles. Para resolver un turno:

```http
POST /api/battles/{id}/turns
Content-Type: application/json

{"playerOneMoveId":"thunderbolt"}
```

Los identificadores de movimiento deben ser elegidos de la lista que devolvió la batalla. La salud y el resultado se calculan y conservan en el servidor; el cliente no envía daño ni estado de combate.

## Migración y pruebas

Aplicar migraciones y regenerar Prisma antes de ejecutar la aplicación:

```bash
npm run prisma:generate
npx prisma migrate deploy
```

Para desarrollo local, ejecuta `npm run dev` y `npm run dev:client` en terminales separadas. Para producción, `npm run build` compila el servidor y la interfaz; `npm start` sirve la aplicación web en la raíz y mantiene los endpoints disponibles bajo `/api`.

La lógica de combate se prueba con `npm test -- --runTestsByPath tests/battleMechanics.test.ts`; las pruebas existentes se ejecutan con `npm test`.
