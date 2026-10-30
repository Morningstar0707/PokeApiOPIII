import request from 'supertest';
import app from '../src/app';
import { AppError } from '../src/middlewares/errorHandler';
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
      new AppError('BATTLE_DATA_UNAVAILABLE', 'PokeAPI no est? disponible.', 503),
    );

    const response = await request(app)
      .post('/api/battles')
      .send({ playerOnePokemonId: 25, playerTwoPokemonId: 4 });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('BATTLE_DATA_UNAVAILABLE');
  });
});
