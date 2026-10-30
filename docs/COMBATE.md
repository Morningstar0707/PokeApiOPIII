# Módulo de combate

## Alcance actual

La interfaz React se encuentra en `frontend/` y ofrece una pantalla de selección de Pokémon con búsqueda por nombre, tipo o número, y una arena responsive con salud, tipos, movimientos, registro de acciones y pantalla de resultado. El jugador selecciona un movimiento; el rival controlado por la aplicación elige uno de sus movimientos disponibles. La interfaz consume únicamente la API del proyecto para consultar los Pokémon y resolver las acciones del combate.

La API ofrece combates 1 contra 1 en `POST /api/battles`, `GET /api/battles/:id` y `POST /api/battles/:id/turns`. Para iniciar una batalla se envían `playerOnePokemonId` y `playerTwoPokemonId`, ambos existentes en `/api/pokemon`. Cada turno recibe el movimiento del jugador; el servidor elige al azar un movimiento permitido del rival. Las acciones se ejecutan según Velocidad y se omite la acción del Pokémon que ya fue derrotado.

Las partidas se almacenan en PostgreSQL y vencen tres horas después de su último turno. Varias instancias pueden consultar la misma partida. Cada turno se guarda con control de versión para rechazar escrituras simultáneas sobre un estado desactualizado.

## Arquitectura y decisiones

La interfaz React/Vite solo presenta el combate y envía identificadores de Pokémon y movimientos. Express valida las solicitudes; `BattleService` coordina turnos y estado, `battleMechanics.service.ts` calcula los ataques y `typeEffectiveness.ts` contiene la tabla de tipos. Esta separación permite probar las reglas sin depender de la interfaz.

Se conserva TypeScript, React, Express y Prisma porque ya son la base del proyecto: así el módulo reutiliza la API y los tipos existentes en lugar de crear otro servicio. PostgreSQL guarda los Pokémon y las sesiones de combate. Jest/Supertest prueban la lógica y el contrato HTTP.

El combate es de una persona contra la CPU. La persona escoge su movimiento y el servidor elige al azar uno de los movimientos válidos del rival. La velocidad determina quién actúa primero; un empate se decide al azar.

## Datos y reglas

- Los Pokémon y estadísticas se obtienen de PostgreSQL, reutilizando sus identificadores. El campo `types` se guarda desde la importación de PokeAPI; para registros previos sin tipos, el inicio de batalla los consulta a PokeAPI.
- En el primer combate de cada Pokémon, se consultan los movimientos aprendidos por nivel en Gen I hasta nivel 50. Se ofrecen hasta cuatro movimientos con poder, precisión y tipo soportados. No se copian a los registros del Pokémon.
- Los datos validados de movimientos se guardan en `pokemon_combat_cache`. Cada Pokémon solo necesita consultarse en PokeAPI la primera vez; el caché sobrevive a reinicios porque está en PostgreSQL. Un Pokémon aún no cacheado requiere conexión a PokeAPI. Si el servicio externo falla, la API devuelve `503 BATTLE_DATA_UNAVAILABLE` y no guarda datos incompletos.
- El nivel utilizado es 50. Los puntos de salud máximos y actuales se inicializan con la estadística base `hp`.
- La fórmula es la aproximación indicada en la especificación. Se trunca el daño final hacia abajo y se aplica un mínimo de 1 cuando un ataque no es inmune; la inmunidad siempre causa cero.
- Los movimientos físicos usan Ataque y Defensa; los especiales usan Ataque Especial del atacante y Ataque Especial del defensor, como representación de la estadística Especial única de primera generación.
- El STAB multiplica por 1,5; la variación es aleatoria de 0,85 a 1,00. Los críticos usan velocidad base / 512 como probabilidad y multiplican el daño por 1,5. Los modificadores y la probabilidad están centralizados en `battleMechanics.service.ts`.
- La tabla usa los tipos de primera generación: Bicho y Veneno se afectan mutuamente con efectividad ×2; también conserva la inmunidad de Psíquico a movimientos Fantasma propia de Gen I.
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
