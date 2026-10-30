import { randomUUID } from 'crypto';
import { AppError } from '../middlewares/errorHandler';
import battleRepository, { StoredBattle } from '../repositories/battle.repository';
import pokemonRepository from '../repositories/pokemon.repository';
import { Battle, Combatant } from '../types/battle';
import { isGenerationOneType } from '../utils/typeEffectiveness';
import { resolveAttack } from './battleMechanics.service';
import pokeApiService from './pokeApi.service';

class BattleService {
  private readonly battleTtlMs = 3 * 60 * 60 * 1000;

  async create(playerOnePokemonId: number, playerTwoPokemonId: number): Promise<Battle> {
    const [playerOnePokemon, playerTwoPokemon] = await Promise.all([
      pokemonRepository.findById(playerOnePokemonId),
      pokemonRepository.findById(playerTwoPokemonId),
    ]);

    if (!playerOnePokemon || !playerTwoPokemon) {
      throw new AppError('POKEMON_NOT_FOUND', 'Both Pokémon must exist in the project API', 404);
    }

    const [playerOneData, playerTwoData] = await Promise.all([
      pokeApiService.getPokemonCombatData(playerOnePokemonId),
      pokeApiService.getPokemonCombatData(playerTwoPokemonId),
    ]);
    const playerOne = this.createCombatant(playerOnePokemon, playerOneData);
    const playerTwo = this.createCombatant(playerTwoPokemon, playerTwoData);

    const battle: Battle = {
      id: randomUUID(),
      status: 'active',
      turn: 0,
      playerOne,
      playerTwo,
      history: [],
    };

    await battleRepository.deleteExpired();
    await battleRepository.create(battle, this.battleTtlMs);
    return battle;
  }

  async getById(id: string): Promise<Battle> {
    const storedBattle = await this.findStoredBattle(id);
    return storedBattle.battle;
  }

  async takeTurn(id: string, playerOneMoveId: string): Promise<Battle> {
    const storedBattle = await this.findStoredBattle(id);
    const battle = storedBattle.battle;

    if (battle.status !== 'active') {
      throw new AppError('BATTLE_FINISHED', 'This battle has already finished', 409);
    }

    const playerOneMove = this.getSelectedMove(battle.playerOne, playerOneMoveId);
    const playerTwoMove = this.chooseComputerMove(battle.playerTwo);
    const firstIsPlayerOne =
      battle.playerOne.pokemon.speed === battle.playerTwo.pokemon.speed
        ? Math.random() < 0.5
        : battle.playerOne.pokemon.speed > battle.playerTwo.pokemon.speed;
    const actions = firstIsPlayerOne
      ? [
          [battle.playerOne, battle.playerTwo, playerOneMove],
          [battle.playerTwo, battle.playerOne, playerTwoMove],
        ]
      : [
          [battle.playerTwo, battle.playerOne, playerTwoMove],
          [battle.playerOne, battle.playerTwo, playerOneMove],
        ];

    battle.turn += 1;
    for (const [attacker, defender, move] of actions as [
      Combatant,
      Combatant,
      typeof playerOneMove,
    ][]) {
      if (attacker.currentHp <= 0 || defender.currentHp <= 0) {
        continue;
      }

      const result = resolveAttack(attacker, defender, move);
      battle.history.push(result);

      if (defender.currentHp <= 0) {
        battle.status = 'finished';
        battle.winner = attacker.pokemon.name;
        battle.loser = defender.pokemon.name;
        break;
      }
    }

    const saved = await battleRepository.update(
      battle,
      storedBattle.version,
      this.battleTtlMs,
    );
    if (!saved) {
      throw new AppError(
        'BATTLE_CONFLICT',
        'The battle changed during this turn. Reload its state and try again.',
        409,
      );
    }

    return battle;
  }

  private async findStoredBattle(id: string): Promise<StoredBattle> {
    const storedBattle = await battleRepository.findById(id);
    if (!storedBattle) {
      throw new AppError('BATTLE_NOT_FOUND', 'Battle not found or expired', 404);
    }

    return storedBattle;
  }

  private chooseComputerMove(combatant: Combatant) {
    const index = Math.floor(Math.random() * combatant.moves.length);
    return combatant.moves[index];
  }

  private createCombatant(
    pokemon: NonNullable<Awaited<ReturnType<typeof pokemonRepository.findById>>>,
    data: Awaited<ReturnType<typeof pokeApiService.getPokemonCombatData>>,
  ): Combatant {
    const types = pokemon.types.length > 0 ? pokemon.types : data.types;

    if (
      types.length === 0 ||
      data.moves.length === 0 ||
      pokemon.hp <= 0 ||
      !types.every(isGenerationOneType)
    ) {
      throw new AppError(
        'INCOMPLETE_BATTLE_DATA',
        'Required battle data is missing for ' + pokemon.name,
        503,
      );
    }

    return {
      pokemon: { ...pokemon, types },
      currentHp: pokemon.hp,
      moves: data.moves,
    };
  }

  private getSelectedMove(combatant: Combatant, moveId: string) {
    const move = combatant.moves.find((availableMove) => availableMove.id === moveId);

    if (!move) {
      throw new AppError(
        'INVALID_BATTLE_MOVE',
        moveId + ' is not available to ' + combatant.pokemon.name,
        400,
      );
    }

    return move;
  }
}

export default new BattleService();
