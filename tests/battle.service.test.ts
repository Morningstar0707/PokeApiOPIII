import battleService from '../src/services/battle.service';
import pokemonRepository from '../src/repositories/pokemon.repository';
import battleRepository from '../src/repositories/battle.repository';
import pokeApiService from '../src/services/pokeApi.service';
import { Battle } from '../src/types/battle';
import { Pokemon } from '../src/types/pokemon';

jest.mock('../src/repositories/pokemon.repository', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
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
    await expect(battleService.takeTurn(battle.id, 'weak-hit')).rejects.toThrow(
      'This battle has already finished',
    );
  });

  it('rejects moves not provided for that participant', async () => {
    const battle = await battleService.create(1, 2);

    await expect(battleService.takeTurn(battle.id, 'not-available')).rejects.toThrow(
      'not available to slowmon',
    );
    expect(battle.turn).toBe(0);
  });

  it('reports a controlled error when a selected Pokémon does not exist', async () => {
    mockedRepository.findById.mockResolvedValueOnce(null);

    await expect(battleService.create(999, 2)).rejects.toThrow(
      'Both Pokémon must exist in the project API',
    );
  });
});
