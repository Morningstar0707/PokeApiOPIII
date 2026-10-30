import request from 'supertest';
import app from '../src/app';
import battleService from '../src/services/battle.service';

jest.mock('../src/services/battle.service', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    getById: jest.fn(),
    takeTurn: jest.fn(),
  },
}));

const mockedBattleService = battleService as jest.Mocked<typeof battleService>;

describe('Battle API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects Pokémon outside the first generation', async () => {
    const response = await request(app)
      .post('/api/battles')
      .send({ playerOnePokemonId: 25, playerTwoPokemonId: 152 });

    expect(response.status).toBe(400);
    expect(mockedBattleService.create).not.toHaveBeenCalled();
  });

  it('returns a controlled error when battle data cannot be loaded from PokeAPI', async () => {
    mockedBattleService.create.mockRejectedValueOnce(
      new Error('Unable to load battle data for Pokémon 25: service unavailable'),
    );

    const response = await request(app)
      .post('/api/battles')
      .send({ playerOnePokemonId: 25, playerTwoPokemonId: 4 });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('BATTLE_DATA_UNAVAILABLE');
  });
});
