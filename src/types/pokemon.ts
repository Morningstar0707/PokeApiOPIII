export interface Pokemon {
  id: number;
  name: string;
  photo: string;
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
  types: string[];
  created_at?: Date;
  updated_at?: Date;
}

export interface PokemonCreateInput {
  id: number;
  name: string;
  photo: string;
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
  types?: string[];
}

export interface PokemonUpdateInput {
  name?: string;
  photo?: string;
  hp?: number;
  attack?: number;
  defense?: number;
  special_attack?: number;
  special_defense?: number;
  speed?: number;
  types?: string[];
}

export interface PagedPokemonResponse {
  success: true;
  data: Pokemon[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type PokemonSortField = 'id' | 'name' | 'hp' | 'attack' | 'defense' | 'special_attack' | 'special_defense' | 'speed';

export interface PokemonQueryParams {
  page?: number;
  limit?: number;
  name?: string;
  sort?: PokemonSortField;
  order?: 'asc' | 'desc';
}
