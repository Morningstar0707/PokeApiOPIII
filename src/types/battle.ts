import { Pokemon } from './pokemon';

export type MoveDamageClass = 'physical' | 'special';

export interface BattleMove {
  id: string;
  name: string;
  type: string;
  power: number;
  accuracy: number;
  damageClass: MoveDamageClass;
}

export interface Combatant {
  pokemon: Pokemon;
  currentHp: number;
  moves: BattleMove[];
}

export interface BattleActionResult {
  attacker: string;
  move: string;
  hit: boolean;
  damage: number;
  critical: boolean;
  effectiveness: number;
  message: string;
}

export interface Battle {
  id: string;
  status: 'active' | 'finished';
  turn: number;
  playerOne: Combatant;
  playerTwo: Combatant;
  winner?: string;
  loser?: string;
  history: BattleActionResult[];
}

export interface PokemonCombatData {
  types: string[];
  moves: BattleMove[];
}
