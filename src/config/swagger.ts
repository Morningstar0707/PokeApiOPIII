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
  components: {
    securitySchemes: {
      WriteApiKey: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API_WRITE_KEY',
      },
    },
  },
  paths: {
    '/api/battles': {
      post: {
        summary: 'Iniciar un combate entre dos Pokémon',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: { playerOnePokemonId: 25, playerTwoPokemonId: 4 },
            },
          },
        },
        responses: {
          201: { description: 'Combate iniciado con movimientos disponibles' },
          400: { description: 'Identificadores inválidos o Pokémon repetido' },
          404: { description: 'Pokémon no encontrado' },
          503: { description: 'Datos de combate incompletos o no disponibles' },
        },
      },
    },
    '/api/battles/{id}': {
      get: {
        summary: 'Consultar el estado de un combate',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Estado del combate' },
          404: { description: 'Combate no encontrado o expirado' },
        },
      },
    },
    '/api/battles/{id}/turns': {
      post: {
        summary: 'Enviar el movimiento del jugador y resolver la respuesta del rival',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: { playerOneMoveId: 'thunderbolt' },
            },
          },
        },
        responses: {
          200: { description: 'Turno resuelto y estado actualizado' },
          400: { description: 'Movimiento inválido o no disponible' },
          404: { description: 'Combate no encontrado o expirado' },
          409: { description: 'Combate finalizado o turno concurrente' },
        },
      },
    },
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
        security: [{ WriteApiKey: [] }],
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
          401: { description: 'Clave de escritura inválida' },
          503: { description: 'Autenticación de escritura no configurada' },
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
        security: [{ WriteApiKey: [] }],
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
          401: { description: 'Clave de escritura inválida' },
          503: { description: 'Autenticación de escritura no configurada' },
        },
      },
      delete: {
        summary: 'Eliminar un Pokémon por id',
        security: [{ WriteApiKey: [] }],
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
          401: { description: 'Clave de escritura inválida' },
          503: { description: 'Autenticación de escritura no configurada' },
        },
      },
    },
  },
};

export default swaggerDocument;
