import { BattleMove, Combatant } from '../types/battle';
import { getTypeEffectiveness } from '../utils/typeEffectiveness';

const CRITICAL_HIT_MULTIPLIER = 1.5;
const RANDOM_DAMAGE_MIN = 0.85;
const CRITICAL_HIT_DIVISOR = 512;
const BATTLE_LEVEL = 50;

export interface DamageResult {
  damage: number;
  critical: boolean;
  effectiveness: number;
}

export function calculateDamage(
  attacker: Combatant,
  defender: Combatant,
  move: BattleMove,
  random: () => number = Math.random,
): DamageResult {
  const effectiveness = getTypeEffectiveness(move.type, defender.pokemon.types);

  if (effectiveness === 0) {
    return { damage: 0, critical: false, effectiveness };
  }

  const isCritical = random() < attacker.pokemon.speed / CRITICAL_HIT_DIVISOR;
  const attack =
    move.damageClass === 'physical' ? attacker.pokemon.attack : attacker.pokemon.special_attack;
  const defense =
    move.damageClass === 'physical' ? defender.pokemon.defense : defender.pokemon.special_attack;
  const safeDefense = Math.max(defense, 1);
  const baseDamage = (((2 * BATTLE_LEVEL) / 5 + 2) * move.power * attack) / safeDefense / 50 + 2;
  const stab = attacker.pokemon.types.some((type) => type.toLowerCase() === move.type.toLowerCase())
    ? 1.5
    : 1;
  const variation = RANDOM_DAMAGE_MIN + random() * (1 - RANDOM_DAMAGE_MIN);
  const criticalMultiplier = isCritical ? CRITICAL_HIT_MULTIPLIER : 1;
  const damage = Math.max(
    1,
    Math.floor(baseDamage * stab * effectiveness * variation * criticalMultiplier),
  );

  return { damage, critical: isCritical, effectiveness };
}

export function resolveAttack(
  attacker: Combatant,
  defender: Combatant,
  move: BattleMove,
  random: () => number = Math.random,
) {
  if (random() >= move.accuracy / 100) {
    return {
      attacker: attacker.pokemon.name,
      move: move.name,
      hit: false,
      damage: 0,
      critical: false,
      effectiveness: 1,
      message: `${attacker.pokemon.name} usó ${move.name}, pero falló.`,
    };
  }

  const result = calculateDamage(attacker, defender, move, random);
  const damageApplied = Math.min(result.damage, defender.currentHp);
  defender.currentHp = Math.max(0, defender.currentHp - damageApplied);

  const effectivenessText =
    result.effectiveness === 0
      ? ' No tuvo efecto.'
      : result.effectiveness > 1
        ? ' ¡Es supereficaz!'
        : result.effectiveness < 1
          ? ' No es muy eficaz.'
          : '';
  const criticalText = result.critical ? ' ¡Golpe crítico!' : '';

  return {
    attacker: attacker.pokemon.name,
    move: move.name,
    hit: true,
    damage: damageApplied,
    critical: result.critical,
    effectiveness: result.effectiveness,
    message: `${attacker.pokemon.name} usó ${move.name} e hizo ${damageApplied} puntos de daño.${effectivenessText}${criticalText}`,
  };
}
