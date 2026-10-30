import battleService from '../src/services/battle.service';
import pokemonRepository from '../src/repositories/pokemon.repository';
import battleRepository from '../src/repositories/battle.repository';
import pokeApiService from '../src/services/pokeApi.service';
import { Battle } from '../src/types/battle';
import { Pokemon } from '../src/types/pokemon';

jest.mock('../src/repositories/pokemon.repository', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findCombatData: jest.fn(),
    saveCombatData: jest.fn(),
  },
}));

jest.mock('../src/repositories/battle.repository', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    deleteExpired: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../src/services/pokeApi.service', () => ({
  __esModule: true,
  default: { getPokemonCombatData: jest.fn() },
}));

const createPokemon = (overrides: Partial<Pokemon> = {}): Pokemon => ({
  id: 1,
  name: 'slowmon',
  photo: 'https://example.com/pokemon.png',
  hp: 100,
  attack: 60,
  defense: 50,
  special_attack: 70,
  special_defense: 65,
  speed: 10,
  types: ['normal'],
  ...overrides,
});

const combatData = {
  types: ['normal'],
  moves: [
    {
      id: 'weak-hit',
      name: 'Weak Hit',
      type: 'normal',
      power: 10,
      accuracy: 100,
      damageClass: 'physical' as const,
    },
    {
      id: 'finisher',
      name: 'Finisher',
      type: 'normal',
      power: 500,
      accuracy: 100,
      damageClass: 'physical' as const,
    },
  ],
};

const mockedRepository = pokemonRepository as jest.Mocked<typeof pokemonRepository>;
const mockedBattleRepository = battleRepository as jest.Mocked<typeof battleRepository>;
const mockedPokeApi = pokeApiService as jest.Mocked<typeof pokeApiService>;
let storedBattle: Battle | null = null;
let storedVersion = 0;

describe('battle service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
    storedBattle = null;
    storedVersion = 0;
    mockedBattleRepository.deleteExpired.mockResolvedValue(0);
    mockedBattleRepository.create.mockImplementation(async (battle) => {
      storedBattle = battle;
      storedVersion = 0;
    });
    mockedBattleRepository.findById.mockImplementation(async (id) =>
      storedBattle?.id === id ? { battle: storedBattle, version: storedVersion } : null,
    );
    mockedBattleRepository.update.mockImplementation(async (battle, version) => {
      if (!storedBattle || storedVersion !== version) return false;
      storedBattle = battle;
      storedVersion += 1;
      return true;
    });
    mockedRepository.findById.mockImplementation(async (id) =>
      id === 1
        ? createPokemon({ id: 1, name: 'slowmon', hp: 1, speed: 10 })
        : createPokemon({ id: 2, name: 'fastmon', speed: 100 }),
    );
    mockedRepository.findCombatData.mockResolvedValue(null);
    mockedRepository.saveCombatData.mockResolvedValue(undefined);
    mockedPokeApi.getPokemonCombatData.mockResolvedValue(combatData);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves actions by Speed and ends the battle immediately when a Pokémon faints', async () => {
    const battle = await battleService.create(1, 2);
    const result = await battleService.takeTurn(battle.id, 'weak-hit');

    expect(result.history).toHaveLength(1);
    expect(result.history[0].attacker).toBe('fastmon');
    expect(result.status).toBe('finished');
    expect(result.winner).toBe('fastmon');
    expect(result.loser).toBe('slowmon');
    expect(result.playerOne.currentHp).toBe(0);
    await expect(battleService.takeTurn(battle.id, 'weak-hit')).rejects.toMatchObject({
      code: 'BATTLE_FINISHED',
      statusCode: 409,
    });
  });

  it('rejects moves not provided for that participant', async () => {
    const battle = await battleService.create(1, 2);

    await expect(battleService.takeTurn(battle.id, 'not-available')).rejects.toMatchObject({
      code: 'INVALID_BATTLE_MOVE',
      statusCode: 400,
    });
    expect(battle.turn).toBe(0);
  });

  it('reports a controlled error when a selected Pok?mon does not exist', async () => {
    mockedRepository.findById.mockResolvedValueOnce(null);

    await expect(battleService.create(999, 2)).rejects.toMatchObject({
      code: 'POKEMON_NOT_FOUND',
      statusCode: 404,
    });
  });

  it('maps PokeAPI failures to a controlled 503 response error', async () => {
    mockedPokeApi.getPokemonCombatData.mockRejectedValueOnce(new Error('request timed out'));

    await expect(battleService.create(1, 2)).rejects.toMatchObject({
      code: 'BATTLE_DATA_UNAVAILABLE',
      statusCode: 503,
    });
  });

  it('uses persistent combat data when it is already cached', async () => {
    mockedRepository.findCombatData.mockResolvedValue(combatData);

    await battleService.create(1, 2);

    expect(mockedPokeApi.getPokemonCombatData).not.toHaveBeenCalled();
    expect(mockedRepository.saveCombatData).not.toHaveBeenCalled();
  });

  it('stores newly loaded combat data for later battles', async () => {
    await battleService.create(1, 2);

    expect(mockedRepository.saveCombatData).toHaveBeenCalledWith(1, combatData);
    expect(mockedRepository.saveCombatData).toHaveBeenCalledWith(2, combatData);
  });

  it('rejects incomplete combat data with a controlled error', async () => {
    mockedPokeApi.getPokemonCombatData.mockResolvedValueOnce({ types: [], moves: [] });

    await expect(battleService.create(1, 2)).rejects.toMatchObject({
      code: 'INCOMPLETE_BATTLE_DATA',
      statusCode: 503,
    });
    expect(mockedRepository.saveCombatData).not.toHaveBeenCalledWith(1, { types: [], moves: [] });
  });

  it('keeps the rival CPU selecting one of its own random moves', async () => {
    mockedPokeApi.getPokemonCombatData
      .mockResolvedValueOnce(combatData)
      .mockResolvedValueOnce({
        types: ['normal'],
        moves: [
          combatData.moves[0],
          { ...combatData.moves[1], id: 'cpu-pick', name: 'CPU Pick' },
        ],
      });

    const battle = await battleService.create(1, 2);
    const result = await battleService.takeTurn(battle.id, 'weak-hit');

    expect(result.history[0]).toMatchObject({ attacker: 'fastmon', move: 'CPU Pick' });
  });
});
