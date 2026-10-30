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
}

export interface BattleMove {
  id: string;
  name: string;
  type: string;
  power: number;
  accuracy: number;
  damageClass: 'physical' | 'special';
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}
