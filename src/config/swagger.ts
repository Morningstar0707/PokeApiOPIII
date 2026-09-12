const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Pokemon API',
    version: '1.0.0',
    description: 'API REST base para proyecto de aula usando PokeAPI, PostgreSQL y Prisma.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local server',
    },
  ],
  paths: {
    '/api/pokemon': {
      get: {
        summary: 'Obtener todos los Pokémon',
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1 },
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 20 },
          },
          {
            in: 'query',
            name: 'name',
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'sort',
            schema: { type: 'string', default: 'id' },
          },
          {
            in: 'query',
            name: 'order',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          },
        ],
        responses: {
          200: { description: 'Lista de Pokémon' },
        },
      },
      post: {
        summary: 'Crear un Pokémon manualmente',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                id: 152,
                name: 'pokemon-test',
                photo: 'https://example.com/image.png',
                hp: 50,
                attack: 50,
                defense: 50,
                special_attack: 50,
                special_defense: 50,
                speed: 50,
              },
            },
          },
        },
        responses: {
          201: { description: 'Pokémon creado' },
          400: { description: 'Datos inválidos' },
          409: { description: 'Conflicto de nombre o id' },
        },
      },
    },
    '/api/pokemon/{id}': {
      get: {
        summary: 'Obtener un Pokémon por id',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: { description: 'Pokémon encontrado' },
          404: { description: 'Pokémon no encontrado' },
        },
      },
      put: {
        summary: 'Actualizar un Pokémon por id',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                name: 'pikachu-updated',
                hp: 40,
                attack: 60,
                defense: 45,
                special_attack: 55,
                special_defense: 55,
                speed: 95,
              },
            },
          },
        },
        responses: {
          200: { description: 'Pokémon actualizado' },
          404: { description: 'Pokémon no encontrado' },
        },
      },
      delete: {
        summary: 'Eliminar un Pokémon por id',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: { description: 'Pokémon eliminado' },
          404: { description: 'Pokémon no encontrado' },
        },
      },
    },
  },
};

export default swaggerDocument;
