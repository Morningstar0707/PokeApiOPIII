# Informe de pruebas del módulo de combate

## Ejecución automatizada

Fecha de ejecución: 2026-10-29.

Comando:

```bash
npm test -- --runInBand
```

Resultado observado: **4 suites aprobadas; 37 pruebas aprobadas; 0 fallidas**.

| Suite | Casos | Resultado |
|---|---|---|
| `tests/battleMechanics.test.ts` | STAB, efectividad dual, Bicho/Veneno, resistencia, inmunidades, precisión, estadística Especial, críticos y límite de PS. | Aprobada |
| `tests/battle.service.test.ts` | Orden por velocidad, cierre y bloqueo del combate, movimiento inválido, Pokémon inexistente, PokeAPI no disponible, datos incompletos, lectura/escritura del caché y elección aleatoria de la CPU. | Aprobada |
| `tests/battle.api.test.ts` | Rechazo de IDs fuera de Gen I y contrato HTTP 503 para datos de combate no disponibles. | Aprobada |
| `tests/pokemon.test.ts` | Contrato y validación de los endpoints existentes de la Pokédex. | Aprobada |

## Cobertura de los casos obligatorios de la especificación

| Caso | Verificación | Resultado |
|---|---|---|
| Seleccionar dos Pokémon válidos | Servicio de combate; repositorio y PokeAPI simulados. | Aprobado a nivel de servicio; la consulta real a PostgreSQL se valida aparte. |
| Mostrar nombre, imagen, tipo y PS | Interfaz React y guía manual `GUIA-PRUEBAS-COMBATE.md`. | Requiere comprobación visual en navegador. |
| Movimiento válido actualiza PS | Servicio y mecánica de ataque. | Aprobado |
| Fallo de precisión no causa daño | Prueba determinista de `resolveAttack`. | Aprobado |
| STAB y sin STAB | Prueba comparativa de daño. | Aprobado |
| Ataque supereficaz | Tabla de efectividad y multiplicador dual. | Aprobado |
| Ataque poco eficaz | Resistencia Fuego contra Agua. | Aprobado |
| Inmunidad Gen I | Normal/Fantasma, Fantasma/Psíquico y Eléctrico/Tierra. | Aprobado |
| PS no negativos | Daño limitado a los PS restantes. | Aprobado |
| Fin al llegar a cero | Estado terminado con ganador y derrotado. | Aprobado |
| Rechazar acciones posteriores | Error de dominio `BATTLE_FINISHED` con HTTP 409. | Aprobado |
| Error o datos faltantes de PokeAPI | Error controlado 503 y validación de datos antes de guardarlos. | Aprobado |

## Verificaci?n real en Docker y evidencia visual

Se levant? una instancia Docker Compose temporal con un volumen y puerto aislados del entorno de desarrollo. Las migraciones terminaron, el seed carg? `151/151` Pok?mon y `GET /health` respondi? correctamente. Se cre? una batalla real por HTTP con cuatro movimientos por participante, se resolvi? un turno y se confirm? que dos Pok?mon quedaron guardados en `pokemon_combat_cache`. La prueba visual del navegador termin? un combate y dej? evidencia de selecci?n, movimientos y resultado en `docs/evidencias-combate/`.

- `seleccion.png`: los dos paneles permiten escoger por separado y muestran los datos b?sicos.
- `seleccion-movimientos.png`: muestra salud, tipos, potencia, clase y precisi?n de movimientos.
- `combate-finalizado.png`: muestra PS actualizados, ganador y registro de una acci?n de la CPU.

## Alcance de las pruebas automatizadas

La suite predeterminada usa mocks para mantener reproducibles las pruebas. El arranque y una partida s? se comprobaron contra PostgreSQL real en Docker; la suite CRUD de integraci?n `tests/pokemon.integration.test.ts` no se ejecut? en esta revisi?n. Los casos aleatorios de precisi?n, efectividad y cr?ticos se cubren con valores controlados en las pruebas unitarias.
