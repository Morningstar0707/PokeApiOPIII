import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prisma';

const testPokemon = [
  {
    id: 9001,
    name: 'integration-bulbasaur',
    photo: 'https://example.com/integration-bulbasaur.png',
    hp: 45,
    attack: 49,
    defense: 49,
    special_attack: 65,
    special_defense: 65,
    speed: 45,
  },
  {
    id: 9002,
    name: 'integration-pikachu',
    photo: 'https://example.com/integration-pikachu.png',
    hp: 35,
    attack: 55,
    defense: 40,
    special_attack: 50,
    special_defense: 50,
    speed: 90,
  },
];

describe('Pokemon API integration tests', () => {
  beforeAll(async () => {
    await prisma.pokemon.deleteMany({
      where: { id: { in: testPokemon.map((pokemon) => pokemon.id) } },
    });
  });

  afterAll(async () => {
    await prisma.pokemon.deleteMany({
      where: { id: { in: testPokemon.map((pokemon) => pokemon.id) } },
    });
    await prisma.$disconnect();
  });

  it('persists and retrieves a Pokemon through the real database', async () => {
    const createResponse = await request(app).post('/api/pokemon').send(testPokemon[0]);

    expect(createResponse.status).toBe(201);

    const getResponse = await request(app).get(`/api/pokemon/${testPokemon[0].id}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data).toMatchObject(testPokemon[0]);
  });

  it('lists persisted records with real pagination and filtering', async () => {
    await request(app).post('/api/pokemon').send(testPokemon[1]);

    const response = await request(app).get(
      '/api/pokemon?page=1&limit=1&name=integration&sort=id&order=asc',
    );

    expect(response.status).toBe(200);
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(9001);
  });

  it('updates and deletes a persisted record', async () => {
    const updateResponse = await request(app)
      .put(`/api/pokemon/${testPokemon[0].id}`)
      .send({ name: 'integration-bulbasaur-updated', hp: 50 });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data).toMatchObject({
      id: 9001,
      name: 'integration-bulbasaur-updated',
      hp: 50,
    });

    const deleteResponse = await request(app).delete(`/api/pokemon/${testPokemon[0].id}`);

    expect(deleteResponse.status).toBe(200);
    await expect(
      prisma.pokemon.findUnique({ where: { id: testPokemon[0].id } }),
    ).resolves.toBeNull();
  });
});