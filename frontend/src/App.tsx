import { useEffect, useMemo, useState } from 'react';
import { ApiRequestError, createBattle, getBattle, getPokemon, takeTurn } from './api';
import type { Battle, BattleMove, Pokemon } from './types';

const typeNames: Record<string, string> = {
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  electric: 'Eléctrico',
  grass: 'Planta',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
};

const typeIcons: Record<string, string> = {
  normal: '✦',
  fire: '♨',
  water: '◉',
  electric: 'ϟ',
  grass: '❋',
  ice: '❄',
  fighting: '✊',
  poison: '☠',
  ground: '▰',
  flying: '✧',
  psychic: '◉',
  bug: '◈',
  rock: '◆',
  ghost: '☾',
  dragon: '♢',
};

const typeClasses: Record<string, string> = {
  normal: 'type-normal',
  fire: 'type-fire',
  water: 'type-water',
  electric: 'type-electric',
  grass: 'type-grass',
  ice: 'type-ice',
  fighting: 'type-fighting',
  poison: 'type-poison',
  ground: 'type-ground',
  flying: 'type-flying',
  psychic: 'type-psychic',
  bug: 'type-bug',
  rock: 'type-rock',
  ghost: 'type-ghost',
  dragon: 'type-dragon',
};

function formatName(name: string) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatNumber(id: number) {
  return `#${String(id).padStart(3, '0')}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`type-badge ${typeClasses[type] ?? 'type-normal'}`}>
      <span aria-hidden="true">{typeIcons[type] ?? '✦'}</span>
      {typeNames[type] ?? formatName(type)}
    </span>
  );
}

function StatBar({
  label,
  current,
  maximum,
  variant,
}: {
  label: string;
  current: number;
  maximum: number;
  variant?: 'player' | 'danger';
}) {
  const percentage = maximum > 0 ? Math.max(0, Math.min(100, (current / maximum) * 100)) : 0;
  const color =
    variant === 'danger' || percentage <= 20
      ? 'hp-critical'
      : percentage <= 50
        ? 'hp-warning'
        : 'hp-healthy';

  return (
    <div className={`stat-panel ${variant === 'player' ? 'stat-panel-player' : ''}`}>
      <div className="stat-heading">
        <span className="stat-label">{label}</span>
        <span className="hp-icon" aria-hidden="true">
          HP
        </span>
      </div>
      <div
        className="hp-track"
        role="progressbar"
        aria-label={`Salud de ${label}`}
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={maximum}
      >
        <span className={`hp-fill ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="hp-numbers">
        <span>
          {current} <small>/ {maximum} PS</small>
        </span>
        <span className="hp-percent">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

function PokemonOption({
  pokemon,
  selected,
  disabled,
  onClick,
}: {
  pokemon: Pokemon;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`pokemon-option ${selected ? 'pokemon-option-selected' : ''}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
    >
      <img src={pokemon.photo} alt="" loading="lazy" />
      <span className="option-copy">
        <span className="option-number">{formatNumber(pokemon.id)}</span>
        <span className="option-name">{formatName(pokemon.name)}</span>
        <span className="option-types">
          {pokemon.types.slice(0, 2).map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </span>
      </span>
      {selected && (
        <span className="selected-mark" aria-label="Seleccionado">
          ✓
        </span>
      )}
    </button>
  );
}

function MoveButton({
  move,
  disabled,
  onSelect,
}: {
  move: BattleMove;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`move-button ${disabled ? 'move-button-disabled' : ''}`}
      type="button"
      onClick={onSelect}
      disabled={disabled}
    >
      <span className="move-type-mark">{typeIcons[move.type] ?? '✦'}</span>
      <span className="move-copy">
        <strong>{formatName(move.name)}</strong>
        <span>
          {typeNames[move.type] ?? formatName(move.type)} ·{' '}
          {move.damageClass === 'physical' ? 'Físico' : 'Especial'} · {move.accuracy}% precisión
        </span>
      </span>
      <span className="move-power">
        <small>POW</small>
        {move.power}
      </span>
    </button>
  );
}

function App() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loadingPokemon, setLoadingPokemon] = useState(true);
  const [apiError, setApiError] = useState('');
  const [search, setSearch] = useState('');
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [rivalId, setRivalId] = useState<number | null>(null);
  const [battle, setBattle] = useState<Battle | null>(null);
  const [busy, setBusy] = useState(false);
  const [battleError, setBattleError] = useState('');
  const [lastActionCount, setLastActionCount] = useState(0);
  const [firstAttacker, setFirstAttacker] = useState<'player' | 'rival' | null>(null);

  useEffect(() => {
    let active = true;
    getPokemon()
      .then((list) => {
        if (active) {
          setPokemon(list);
          setPlayerId(list.find((entry) => entry.id === 25)?.id ?? list[0]?.id ?? null);
          setRivalId(list.find((entry) => entry.id === 6)?.id ?? list[1]?.id ?? null);
        }
      })
      .catch((error: unknown) => {
        if (active) setApiError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoadingPokemon(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredPokemon = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pokemon;
    return pokemon.filter(
      (entry) =>
        entry.name.includes(query) ||
        String(entry.id).includes(query) ||
        entry.types.some((type) => type.includes(query)),
    );
  }, [pokemon, search]);

  const playerPokemon = battle?.playerOne.pokemon ?? pokemon.find((entry) => entry.id === playerId);
  const rivalPokemon = battle?.playerTwo.pokemon ?? pokemon.find((entry) => entry.id === rivalId);
  const recentActions = battle?.history.slice(lastActionCount) ?? [];
  const battleFinished = battle?.status === 'finished';

  async function beginBattle() {
    if (playerId === null || rivalId === null) return;
    setBusy(true);
    setBattleError('');
    try {
      const newBattle = await createBattle(playerId, rivalId);
      setBattle(newBattle);
      setLastActionCount(0);
    } catch (error) {
      setBattleError(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function chooseMove(move: BattleMove) {
    if (!battle || busy || battle.status !== 'active') return;
    setBusy(true);
    setFirstAttacker(
      battle.playerOne.pokemon.speed === battle.playerTwo.pokemon.speed
        ? Math.random() < 0.5
          ? 'player'
          : 'rival'
        : battle.playerOne.pokemon.speed > battle.playerTwo.pokemon.speed
          ? 'player'
          : 'rival',
    );
    setBattleError('');
    setLastActionCount(battle.history.length);
    try {
      const updatedBattle = await takeTurn(battle.id, move.id);
      setBattle(updatedBattle);
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'BATTLE_CONFLICT') {
        try {
          setBattle(await getBattle(battle.id));
        } catch {
          // Keep the original conflict message visible if the refresh also fails.
        }
      }
      setBattleError(getErrorMessage(error));
    } finally {
      setBusy(false);
      setFirstAttacker(null);
    }
  }

  function resetBattle() {
    setBattle(null);
    setBattleError('');
    setLastActionCount(0);
    setFirstAttacker(null);
  }

  return (
    <main className="game-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Pokémon, inicio">
          <span className="brand-ball" aria-hidden="true">
            <i />
          </span>
          <span className="brand-title">
            POKÉMON<span> BATTLE CLUB</span>
          </span>
        </a>
        <div className="topbar-right">
          <span className="gen-label">
            <span className="live-dot" /> KANTO · GENERACIÓN I
          </span>
          <span className="topbar-divider" />
          <span className="trainer-label">
            <span className="trainer-avatar">✦</span> ENTRENADOR
          </span>
        </div>
      </header>

      <div className="page-content">
        {!battle ? (
          <section className="lobby">
            <div className="intro">
              <span className="eyebrow">
                <span /> EL CAMPO DE BATALLA TE ESPERA
              </span>
              <h1>
                Elige tu equipo.
                <br />
                <span>Hazte leyenda.</span>
              </h1>
              <p>
                Selecciona dos Pokémon de Kanto. El más veloz ataca primero. ¿Listo para combatir?
              </p>
            </div>

            {apiError ? (
              <div className="error-card" role="alert">
                <span className="error-symbol">!</span>
                <div>
                  <strong>No pudimos conectar con la Pokédex</strong>
                  <p>{apiError}</p>
                </div>
                <button
                  type="button"
                  className="retry-button"
                  onClick={() => window.location.reload()}
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <>
                <div className="selection-grid">
                  <section className="selection-panel">
                    <div className="selection-panel-head">
                      <div className="trainer-heading">
                        <span className="trainer-icon player-icon">P1</span>
                        <div>
                          <span className="panel-kicker">TU EQUIPO</span>
                          <h2>Entrenador</h2>
                        </div>
                      </div>
                      <span className="selection-step">
                        01 <i>/ 02</i>
                      </span>
                    </div>
                    <div className="chosen-preview">
                      {loadingPokemon ? (
                        <div className="preview-skeleton" />
                      ) : playerPokemon ? (
                        <>
                          <div className="preview-image">
                            <img src={playerPokemon.photo} alt={formatName(playerPokemon.name)} />
                          </div>
                          <div className="preview-info">
                            <span className="preview-number">
                              {formatNumber(playerPokemon.id)} · POKÉMON
                            </span>
                            <strong>{formatName(playerPokemon.name)}</strong>
                            <div className="type-row">
                              {playerPokemon.types.map((type) => (
                                <TypeBadge key={type} type={type} />
                              ))}
                            </div>
                            <span className="base-hp">
                              PS BASE <b>{playerPokemon.hp}</b>
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="empty-preview">Selecciona tu Pokémon</p>
                      )}
                    </div>
                    <label className="search-box">
                      <span>⌕</span>
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar por nombre, tipo o número..."
                        aria-label="Buscar Pokémon"
                      />
                      <kbd>151</kbd>
                    </label>
                    <div className="pokemon-list" aria-label="Pokémon disponibles">
                      {loadingPokemon ? (
                        <div className="loading-list">
                          Cargando la Pokédex de Kanto
                          <span className="loader" />
                        </div>
                      ) : (
                        filteredPokemon.map((entry) => (
                          <PokemonOption
                            key={entry.id}
                            pokemon={entry}
                            selected={entry.id === playerId}
                            disabled={entry.id === rivalId}
                            onClick={() => setPlayerId(entry.id)}
                          />
                        ))
                      )}
                      {!loadingPokemon && filteredPokemon.length === 0 && (
                        <p className="empty-list">No encontramos Pokémon con ese nombre.</p>
                      )}
                    </div>
                    <div className="list-footer">
                      <span>{filteredPokemon.length} POKÉMON</span>
                      <span>DATOS DE LA POKÉDEX</span>
                    </div>
                  </section>

                  <div className="versus-column" aria-hidden="true">
                    <span className="versus-line" />
                    <span className="versus-badge">VS</span>
                    <span className="versus-line" />
                    <span className="versus-caption">
                      EL RETO
                      <br />
                      COMIENZA
                    </span>
                  </div>

                  <section className="selection-panel rival-panel">
                    <div className="selection-panel-head">
                      <div className="trainer-heading">
                        <span className="trainer-icon rival-icon">CPU</span>
                        <div>
                          <span className="panel-kicker">RIVAL DE KANTO</span>
                          <h2>Contrincante</h2>
                        </div>
                      </div>
                      <span className="selection-step">
                        02 <i>/ 02</i>
                      </span>
                    </div>
                    <div className="chosen-preview">
                      {loadingPokemon ? (
                        <div className="preview-skeleton" />
                      ) : rivalPokemon ? (
                        <>
                          <div className="preview-image">
                            <img src={rivalPokemon.photo} alt={formatName(rivalPokemon.name)} />
                          </div>
                          <div className="preview-info">
                            <span className="preview-number">
                              {formatNumber(rivalPokemon.id)} · POKÉMON
                            </span>
                            <strong>{formatName(rivalPokemon.name)}</strong>
                            <div className="type-row">
                              {rivalPokemon.types.map((type) => (
                                <TypeBadge key={type} type={type} />
                              ))}
                            </div>
                            <span className="base-hp">
                              PS BASE <b>{rivalPokemon.hp}</b>
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="empty-preview">Selecciona el Pokémon rival</p>
                      )}
                    </div>
                    <label className="search-box">
                      <span>⌕</span>
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Busca un rival para el desafío..."
                        aria-label="Buscar Pokémon rival"
                      />
                      <kbd>151</kbd>
                    </label>
                    <div className="pokemon-list" aria-label="Pokémon para el rival">
                      {loadingPokemon ? (
                        <div className="loading-list">
                          Preparando el desafío
                          <span className="loader" />
                        </div>
                      ) : (
                        filteredPokemon.map((entry) => (
                          <PokemonOption
                            key={entry.id}
                            pokemon={entry}
                            selected={entry.id === rivalId}
                            disabled={entry.id === playerId}
                            onClick={() => setRivalId(entry.id)}
                          />
                        ))
                      )}
                    </div>
                    <div className="list-footer">
                      <span>ELIGE TU RIVAL</span>
                      <span>UN RETO A TU MEDIDA</span>
                    </div>
                  </section>
                </div>

                <div className="lobby-bottom">
                  <div className="rules-note">
                    <span className="rules-icon">✦</span>
                    <span>
                      <strong>Combate por turnos</strong>
                      <small>
                        La velocidad decide quién golpea primero. El rival elegirá sus movimientos.
                      </small>
                    </span>
                  </div>
                  <button
                    className="start-button"
                    type="button"
                    onClick={beginBattle}
                    disabled={
                      loadingPokemon ||
                      busy ||
                      playerId === null ||
                      rivalId === null ||
                      playerId === rivalId
                    }
                  >
                    {busy ? (
                      <>
                        <span className="button-spinner" /> PREPARANDO...
                      </>
                    ) : (
                      <>
                        COMENZAR COMBATE <span>→</span>
                      </>
                    )}
                  </button>
                </div>
                {battleError && (
                  <p className="inline-error" role="alert">
                    {battleError}
                  </p>
                )}
              </>
            )}
          </section>
        ) : (
          <section className="battle-page">
            <div className="battle-titlebar">
              <div>
                <span className="eyebrow">
                  <span /> ESTADIO DE KANTO
                </span>
                <h1>¡Un combate Pokémon!</h1>
              </div>
              <div className={`battle-status ${battleFinished ? 'status-finished' : ''}`}>
                <span />
                {battleFinished ? 'COMBATE FINALIZADO' : 'COMBATE EN CURSO'}
              </div>
            </div>

            <div className="battlefield">
              <div className="field-sky">
                <div className="field-glow" />
                <div className="cloud cloud-one" />
                <div className="cloud cloud-two" />
                <div className="cloud cloud-three" />
              </div>
              <div className="field-platform platform-rival">
                <span />
              </div>
              <div className="field-platform platform-player">
                <span />
              </div>
              <div className="field-scenery scenery-left">
                <i />
                <i />
                <i />
              </div>
              <div className="field-scenery scenery-right">
                <i />
                <i />
                <i />
              </div>

              {rivalPokemon && (
                <>
                  <div className="battle-hud hud-rival">
                    <div className="hud-name-row">
                      <strong>{formatName(rivalPokemon.name)}</strong>
                      <span>Lv. 50</span>
                    </div>
                    <StatBar
                      label="RIVAL"
                      current={battle.playerTwo.currentHp}
                      maximum={rivalPokemon.hp}
                    />
                    <div className="hud-types">
                      {rivalPokemon.types.map((type) => (
                        <TypeBadge key={type} type={type} />
                      ))}
                    </div>
                  </div>
                  <img
                    className={`battle-sprite sprite-rival ${battle.playerTwo.currentHp === 0 ? 'sprite-fainted' : ''} ${firstAttacker === 'rival' ? 'sprite-attacking' : ''}`}
                    src={rivalPokemon.photo}
                    alt={formatName(rivalPokemon.name)}
                  />
                </>
              )}

              {playerPokemon && (
                <>
                  <div className="battle-hud hud-player">
                    <div className="hud-name-row">
                      <strong>{formatName(playerPokemon.name)}</strong>
                      <span>Lv. 50</span>
                    </div>
                    <StatBar
                      label="TU POKÉMON"
                      current={battle.playerOne.currentHp}
                      maximum={playerPokemon.hp}
                      variant="player"
                    />
                    <div className="hud-types">
                      {playerPokemon.types.map((type) => (
                        <TypeBadge key={type} type={type} />
                      ))}
                    </div>
                  </div>
                  <img
                    className={`battle-sprite sprite-player ${battle.playerOne.currentHp === 0 ? 'sprite-fainted' : ''} ${firstAttacker === 'player' ? 'sprite-attacking' : ''}`}
                    src={playerPokemon.photo}
                    alt={formatName(playerPokemon.name)}
                  />
                </>
              )}

              <div className="field-label field-label-rival">
                <span>ENTRENADOR RIVAL</span>
                <i>✦ ✦ ✦</i>
              </div>
              <div className="field-label field-label-player">
                <span>TU POKÉMON</span>
                <i>✦ ✦ ✦</i>
              </div>
              <div className="battlefield-footer">
                <span>◉ KANTO LEAGUE</span>
                <span>NO. 001 — 151</span>
              </div>
            </div>

            {battleFinished ? (
              <div className="result-card">
                <span className="result-trophy">🏆</span>
                <div className="result-copy">
                  <span className="panel-kicker">COMBATE TERMINADO</span>
                  <h2>
                    {battle.winner === playerPokemon?.name ? '¡Victoria!' : '¡Fin del combate!'}
                  </h2>
                  <p>
                    {battle.winner === playerPokemon?.name
                      ? `¡${formatName(battle.winner ?? '')} es el campeón de la arena!`
                      : `${formatName(battle.winner ?? '')} ganó el combate. ¡La revancha te espera!`}
                  </p>
                  {recentActions.map((action, index) => (
                    <small key={`${battle.turn}-${index}`}>{action.message}</small>
                  ))}
                </div>
                <button className="start-button result-button" type="button" onClick={resetBattle}>
                  NUEVO COMBATE <span>→</span>
                </button>
              </div>
            ) : (
              <div className="battle-console">
                <div className="console-topline">
                  <span className="console-turn">
                    TURNO <b>{String(battle.turn + 1).padStart(2, '0')}</b>
                  </span>
                  <span className="console-prompt">
                    <i />{' '}
                    {busy
                      ? 'Resolviendo movimientos...'
                      : `¿Qué hará ${formatName(playerPokemon?.name ?? '')}?`}
                  </span>
                  <span className="console-hint">ELIGE UN MOVIMIENTO</span>
                </div>
                <div className="console-content">
                  <div className="move-grid">
                    {battle.playerOne.moves.map((move) => (
                      <MoveButton
                        key={move.id}
                        move={move}
                        disabled={busy || battleFinished}
                        onSelect={() => void chooseMove(move)}
                      />
                    ))}
                  </div>
                  <div className="combat-log" aria-live="polite">
                    <div className="log-heading">
                      <span>REGISTRO DE COMBATE</span>
                      <span className="log-live">
                        <i /> LIVE
                      </span>
                    </div>
                    {recentActions.length ? (
                      recentActions.map((action, index) => (
                        <div
                          className={`log-entry ${action.attacker === playerPokemon?.name ? 'log-player' : 'log-rival'}`}
                          key={`${battle.turn}-${index}-${action.move}`}
                        >
                          <span className="log-bullet">
                            {action.attacker === playerPokemon?.name ? '›' : '‹'}
                          </span>
                          <div>
                            <strong>{action.message}</strong>
                            {action.hit && (
                              <small>
                                {action.critical ? 'GOLPE CRÍTICO · ' : ''}
                                {action.effectiveness > 1
                                  ? 'SÚPER EFECTIVO · '
                                  : action.effectiveness > 0 && action.effectiveness < 1
                                    ? 'POCO EFECTIVO · '
                                    : ''}
                                {action.damage} PS DE DAÑO
                              </small>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="log-empty">
                        El combate está por comenzar.
                        <br />
                        ¡Elige tu primer movimiento!
                      </p>
                    )}
                    {battleError && (
                      <p className="inline-error" role="alert">
                        {battleError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="battle-actions">
              <button type="button" className="back-button" onClick={resetBattle}>
                ← CAMBIAR EQUIPO
              </button>
              <span>
                <i /> COMBATE 1 VS 1 · KANTO
              </span>
            </div>
          </section>
        )}
      </div>

      <footer className="site-footer">
        <span>© 2026 POKÉMON BATTLE CLUB</span>
        <span>
          HECHO PARA ENTRENADORES <b>◆</b>
        </span>
        <span>DATOS DE POKÉMON · GEN I</span>
      </footer>
    </main>
  );
}

export default App;
