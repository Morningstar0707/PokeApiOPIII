# Guía de pruebas manuales del combate

Esta guía complementa las pruebas automatizadas con una revisión visual de la partida. No reemplaza las pruebas deterministas de fórmulas; los casos de precisión y efectividad se cubren de forma reproducible en `tests/battleMechanics.test.ts`.

## Preparación

1. Abre Docker Desktop.
2. Desde la raíz del proyecto, inicia la aplicación:

   ```bash
   docker compose up -d --build
   ```

3. Revisa `docker compose logs -f api` hasta que termine la importación inicial.
4. Abre <http://localhost:3000>.

La primera batalla de cada Pokémon consulta sus movimientos en PokeAPI y los guarda en PostgreSQL. Las siguientes partidas reutilizan ese caché.

## Lista de comprobación

| Caso | Acción | Resultado esperado | Evidencia sugerida |
|---|---|---|---|
| UI-01 | Busca y selecciona un Pokémon en cada panel. | Las búsquedas son independientes y cada lado muestra su selección. | `seleccion.png` |
| UI-02 | Inicia el combate. | Se muestran sprites, nombres, tipos, PS actuales/máximos y movimientos con tipo, potencia y precisión. | `seleccion-movimientos.png` |
| UI-03 | Escoge uno de tus movimientos. | El registro muestra primero la acción del Pokémon más veloz. La CPU elige al azar un movimiento válido del rival. | `combate-finalizado.png` |
| UI-04 | Continúa hasta que un Pokémon llegue a cero PS. | La barra llega a cero, se identifica ganador y derrotado, y no se aceptan más movimientos. | `combate-finalizado.png` |
| UI-05 | Reinicia y disputa otra partida con los mismos Pokémon. | Sus movimientos se leen del caché de PostgreSQL; no se vuelve a consultar PokeAPI para ellos. | Captura de los logs/API si se requiere evidencia técnica. |

Guarda las capturas tomadas durante la ejecución en `docs/evidencias-combate/` y enlázalas en el informe de pruebas. No marques una captura como evidencia hasta haberla tomado en una ejecución real.

## Evidencias capturadas

La revisión en navegador contra la instancia Docker aislada generó estas capturas reales:

- [Selección de Pokémon](evidencias-combate/seleccion.png)
- [Arena y movimientos disponibles](evidencias-combate/seleccion-movimientos.png)
- [Resultado de un combate finalizado](evidencias-combate/combate-finalizado.png)

## Verificaciones deterministas

Los siguientes resultados se prueban automáticamente, porque dependen de azar y una comprobación manual no garantiza reproducibilidad:

- Movimiento que falla por precisión: no causa daño.
- STAB, daño neutral, supereficaz y poco eficaz.
- Inmunidades de primera generación, incluida la inmunidad de Psíquico frente a Fantasma.
- Efectividad ×2 entre Bicho y Veneno en ambas direcciones; efectividad acumulada en tipos duales.
- Crítico, límite inferior de daño y PS nunca negativos.
- Fin del combate, rechazo de turnos posteriores y selección aleatoria de movimiento por la CPU.
- Error 503 controlado cuando PokeAPI no responde y rechazo de datos incompletos.
