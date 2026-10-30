import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prisma';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    pokemon: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

const mockedPrisma = prisma as unknown as {
  pokemon: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    upsert: jest.Mock;
    deleteMany: jest.Mock;
  };
  $disconnect: jest.Mock;
};

describe('Pokemon API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedPrisma.pokemon.findMany.mockResolvedValue([
      {
        id: 25,
        name: 'pikachu',
        photo: 'https://example.com/pikachu.png',
        hp: 35,
        attack: 55,
        defense: 40,
        special_attack: 50,
        special_defense: 50,
        speed: 90,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    mockedPrisma.pokemon.count.mockResolvedValue(1);
    mockedPrisma.pokemon.findUnique.mockImplementation(async ({ where }: { where: { id?: number } }) => {
      if (where.id === 25) {
        return {
          id: 25,
          name: 'pikachu',
          photo: 'https://example.com/pikachu.png',
          hp: 35,
          attack: 55,
          defense: 40,
          special_attack: 50,
          special_defense: 50,
          speed: 90,
          created_at: new Date(),
          updated_at: new Date(),
        };
      }

      return null;
    });
    mockedPrisma.pokemon.findFirst.mockResolvedValue(null);
    mockedPrisma.pokemon.create.mockImplementation(async ({ data }) => data);
    mockedPrisma.pokemon.update.mockImplementation(async ({ data }) => ({
      id: 25,
      name: data.name ?? 'pikachu',
      photo: data.photo ?? 'https://example.com/pikachu.png',
      hp: data.hp ?? 35,
      attack: data.attack ?? 55,
      defense: data.defense ?? 40,
      special_attack: data.special_attack ?? 50,
      special_defense: data.special_defense ?? 50,
      speed: data.speed ?? 90,
      created_at: new Date(),
      updated_at: new Date(),
    }));
    mockedPrisma.pokemon.delete.mockResolvedValue({
      id: 25,
      name: 'pikachu',
      photo: 'https://example.com/pikachu.png',
      hp: 35,
      attack: 55,
      defense: 40,
      special_attack: 50,
      special_defense: 50,
      speed: 90,
      created_at: new Date(),
      updated_at: new Date(),
    });
    mockedPrisma.pokemon.upsert.mockResolvedValue({
      id: 25,
      name: 'pikachu',
      photo: 'https://example.com/pikachu.png',
      hp: 35,
      attack: 55,
      defense: 40,
      special_attack: 50,
      special_defense: 50,
      speed: 90,
      created_at: new Date(),
      updated_at: new Date(),
    });
  });

  it('GET /api/pokemon returns all pokemons', async () => {
    const response = await request(app).get('/api/pokemon');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('GET /api/pokemon applies pagination, filtering and sorting parameters', async () => {
    mockedPrisma.pokemon.findMany.mockResolvedValueOnce([]);
    mockedPrisma.pokemon.count.mockResolvedValueOnce(0);

    const response = await request(app).get(
      '/api/pokemon?page=2&limit=5&name=char&sort=name&order=desc',
    );

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 0,
      totalPages: 0,
    });
    expect(mockedPrisma.pokemon.findMany).toHaveBeenCalledWith({
      where: { name: { contains: 'char', mode: 'insensitive' } },
      orderBy: { name: 'desc' },
      skip: 5,
      take: 5,
    });
  });

  it('GET /api/pokemon rejects invalid query parameters', async () => {
    const response = await request(app).get('/api/pokemon?page=0&limit=invalid');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/pokemon/:id returns an existing pokemon', async () => {
    const response = await request(app).get('/api/pokemon/25');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('pikachu');
  });

  it('GET /api/pokemon/:id returns 404 for missing pokemon', async () => {
    mockedPrisma.pokemon.findUnique.mockResolvedValueOnce(null);

    const response = await request(app).get('/api/pokemon/999999');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('GET /api/pokemon/:id rejects a non-positive or non-numeric id', async () => {
    const invalidIds = ['0', 'abc'];

    for (const id of invalidIds) {
      const response = await request(app).get(`/api/pokemon/${id}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_POKEMON_ID');
    }
  });

  it('POST /api/pokemon creates a valid pokemon', async () => {
    const pokemon = {
      id: 152,
      name: 'pokemon-test',
      photo: 'https://example.com/image.png',
      hp: 50,
      attack: 50,
      defense: 50,
      special_attack: 50,
      special_defense: 50,
      speed: 50,
    };

    mockedPrisma.pokemon.findUnique.mockResolvedValueOnce(null);
    mockedPrisma.pokemon.findFirst.mockResolvedValueOnce(null);
    mockedPrisma.pokemon.create.mockResolvedValueOnce({
      ...pokemon,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app).post('/api/pokemon').send(pokemon);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('pokemon-test');
  });

  it('POST /api/pokemon rejects invalid data', async () => {
    const response = await request(app).post('/api/pokemon').send({
      id: 153,
      name: '',
      photo: 'invalid-url',
      hp: -1,
      attack: 50,
      defense: 50,
      special_attack: 50,
      special_defense: 50,
      speed: 50,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/pokemon rejects duplicate id', async () => {
    mockedPrisma.pokemon.findUnique.mockResolvedValueOnce({
      id: 25,
      name: 'pikachu',
      photo: 'https://example.com/pikachu.png',
      hp: 35,
      attack: 55,
      defense: 40,
      special_attack: 50,
      special_defense: 50,
      speed: 90,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app).post('/api/pokemon').send({
      id: 25,
      name: 'another-pikachu',
      photo: 'https://example.com/other.png',
      hp: 30,
      attack: 40,
      defense: 40,
      special_attack: 50,
      special_defense: 50,
      speed: 60,
    });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/pokemon rejects a duplicate name', async () => {
    mockedPrisma.pokemon.findUnique.mockResolvedValueOnce(null);
    mockedPrisma.pokemon.findFirst.mockResolvedValueOnce({ id: 25 });

    const response = await request(app).post('/api/pokemon').send({
      id: 152,
      name: 'pikachu',
      photo: 'https://example.com/other.png',
      hp: 50,
      attack: 50,
      defense: 50,
      special_attack: 50,
      special_defense: 50,
      speed: 50,
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('POKEMON_NAME_ALREADY_EXISTS');
  });

  it('PUT /api/pokemon/:id updates an existing pokemon', async () => {
    mockedPrisma.pokemon.findUnique.mockResolvedValueOnce({
      id: 25,
      name: 'pikachu',
      photo: 'https://example.com/pikachu.png',
      hp: 35,
      attack: 55,
      defense: 40,
      special_attack: 50,
      special_defense: 50,
      speed: 90,
      created_at: new Date(),
      updated_at: new Date(),
    });
    mockedPrisma.pokemon.update.mockResolvedValueOnce({
      id: 25,
      name: 'pikachu-updated',
      photo: 'https://example.com/pikachu.png',
      hp: 40,
      attack: 60,
      defense: 45,
      special_attack: 55,
      special_defense: 55,
      speed: 95,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app).put('/api/pokemon/25').send({
      name: 'pikachu-updated',
      hp: 40,
      attack: 60,
      defense: 45,
      special_attack: 55,
      special_defense: 55,
      speed: 95,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('pikachu-updated');
  });

  it('PUT /api/pokemon/:id returns 404 for missing pokemon', async () => {
    mockedPrisma.pokemon.findUnique.mockResolvedValueOnce(null);

    const response = await request(app).put('/api/pokemon/999999').send({ hp: 10 });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('PUT /api/pokemon/:id rejects an unknown field', async () => {
    const response = await request(app).put('/api/pokemon/25').send({ unknown: 'field' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PUT /api/pokemon/:id rejects a duplicate name', async () => {
    mockedPrisma.pokemon.findUnique.mockResolvedValueOnce({
      id: 25,
      name: 'pikachu',
    });
    mockedPrisma.pokemon.findFirst.mockResolvedValueOnce({ id: 6, name: 'charizard' });

    const response = await request(app).put('/api/pokemon/25').send({ name: 'charizard' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('POKEMON_NAME_ALREADY_EXISTS');
  });

  it('DELETE /api/pokemon/:id deletes an existing pokemon', async () => {
    mockedPrisma.pokemon.findUnique.mockResolvedValueOnce({
      id: 25,
      name: 'pikachu',
      photo: 'https://example.com/pikachu.png',
      hp: 35,
      attack: 55,
      defense: 40,
      special_attack: 50,
      special_defense: 50,
      speed: 90,
      created_at: new Date(),
      updated_at: new Date(),
    });
    mockedPrisma.pokemon.delete.mockResolvedValueOnce({
      id: 25,
      name: 'pikachu',
      photo: 'https://example.com/pikachu.png',
      hp: 35,
      attack: 55,
      defense: 40,
      special_attack: 50,
      special_defense: 50,
      speed: 90,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app).delete('/api/pokemon/25');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('DELETE /api/pokemon/:id returns 404 for missing pokemon', async () => {
    mockedPrisma.pokemon.findUnique.mockResolvedValueOnce(null);

    const response = await request(app).delete('/api/pokemon/999999');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('returns health information and API documentation routes', async () => {
    const healthResponse = await request(app).get('/health');
    const docsResponse = await request(app).get('/api-docs');

    expect(healthResponse.status).toBe(200);
    expect(healthResponse.body).toEqual({ success: true, message: 'API is healthy' });
    expect(docsResponse.status).toBe(301);
    expect(docsResponse.headers.location).toBe('/api-docs/');
  });

  it('returns a structured error for an unknown route', async () => {
    const response = await request(app).get('/api/unknown');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('validates negative stats', async () => {
    const response = await request(app).post('/api/pokemon').send({
      id: 153,
      name: 'negative-stats',
      photo: 'https://example.com/negative.png',
      hp: -1,
      attack: 50,
      defense: 50,
      special_attack: 50,
      special_defense: 50,
      speed: 50,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('validates empty name', async () => {
    const response = await request(app).post('/api/pokemon').send({
      id: 154,
      name: '   ',
      photo: 'https://example.com/empty.png',
      hp: 50,
      attack: 50,
      defense: 50,
      special_attack: 50,
      special_defense: 50,
      speed: 50,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
