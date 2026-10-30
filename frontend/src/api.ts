import type { ApiResponse, Battle, Pokemon } from './types';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('No se pudo conectar con la API. Comprueba que el servidor esté activo.');
  }

  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error('La API devolvió una respuesta inválida.');
  }
  if (!response.ok || !payload.success) {
    throw new ApiRequestError(
      payload.error?.message ?? 'Ocurrió un error inesperado.',
      payload.error?.code ?? 'API_ERROR',
      response.status,
    );
  }

  return payload.data;
}

export async function getPokemon(): Promise<Pokemon[]> {
  return request<Pokemon[]>('/api/pokemon?limit=151&sort=id&order=asc');
}

export function createBattle(playerOnePokemonId: number, playerTwoPokemonId: number) {
  return request<Battle>('/api/battles', {
    method: 'POST',
    body: JSON.stringify({ playerOnePokemonId, playerTwoPokemonId }),
  });
}

export function getBattle(battleId: string) {
  return request<Battle>('/api/battles/' + battleId);
}

export function takeTurn(battleId: string, playerOneMoveId: string) {
  return request<Battle>(`/api/battles/${battleId}/turns`, {
    method: 'POST',
    body: JSON.stringify({ playerOneMoveId }),
  });
}
