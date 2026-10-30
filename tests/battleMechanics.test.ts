import { BattleMove, Combatant } from '../src/types/battle';
import { calculateDamage, resolveAttack } from '../src/services/battleMechanics.service';
import { getTypeEffectiveness } from '../src/utils/typeEffectiveness';
import { Pokemon } from '../src/types/pokemon';

const createPokemon = (overrides: Partial<Pokemon> = {}): Pokemon => ({
  id: 1,
  name: 'test-pokemon',
  photo: 'https://example.com/pokemon.png',
  hp: 100,
  attack: 60,
  defense: 50,
  special_attack: 70,
  special_defense: 65,
  speed: 50,
  types: ['fire'],
  ...overrides,
});

const createCombatant = (pokemon: Pokemon): Combatant => ({
  pokemon,
  currentHp: pokemon.hp,
  moves: [],
});

const createMove = (overrides: Partial<BattleMove> = {}): BattleMove => ({
  id: 'flamethrower',
  name: 'Flamethrower',
  type: 'fire',
  power: 90,
  accuracy: 100,
  damageClass: 'special',
  ...overrides,
});

describe('battle mechanics', () => {
  it('applies STAB and multiplies effectiveness for dual types', () => {
    expect(getTypeEffectiveness('fire', ['grass', 'ice'])).toBe(4);
    const defender = createCombatant(createPokemon({ types: ['grass'] }));
    const withStab = calculateDamage(
      createCombatant(createPokemon({ types: ['fire'] })),
      defender,
      createMove(),
      () => 0.99,
    );
    const withoutStab = calculateDamage(
      createCombatant(createPokemon({ types: ['water'] })),
      defender,
      createMove(),
      () => 0.99,
    );

    expect(withStab.damage).toBeGreaterThan(withoutStab.damage);
  });

  it('applies resistance and Generation I immunities', () => {
    expect(getTypeEffectiveness('fire', ['water'])).toBe(0.5);
    expect(getTypeEffectiveness('normal', ['ghost'])).toBe(0);
    expect(getTypeEffectiveness('ghost', ['psychic'])).toBe(0);
    expect(getTypeEffectiveness('electric', ['ground'])).toBe(0);
  });

  it('applies the Generation I Bug and Poison weaknesses in both directions', () => {
    expect(getTypeEffectiveness('bug', ['poison'])).toBe(2);
    expect(getTypeEffectiveness('poison', ['bug'])).toBe(2);
  });

  it('does not damage when a move misses', () => {
    const attacker = createCombatant(createPokemon());
    const defender = createCombatant(createPokemon({ name: 'defender', types: ['grass'] }));
    const result = resolveAttack(attacker, defender, createMove({ accuracy: 50 }), () => 0.9);

    expect(result.hit).toBe(false);
    expect(result.damage).toBe(0);
    expect(defender.currentHp).toBe(100);
  });

  it('uses Special as both special attack and defense in Generation I', () => {
    const attacker = createCombatant(createPokemon({ special_attack: 70 }));
    const defender = createCombatant(
      createPokemon({ special_attack: 35, special_defense: 100, types: ['grass'] }),
    );
    const differentModernDefense = createCombatant(
      createPokemon({ special_attack: 35, special_defense: 1, types: ['grass'] }),
    );

    expect(calculateDamage(attacker, defender, createMove(), () => 0.99)).toEqual(
      calculateDamage(attacker, differentModernDefense, createMove(), () => 0.99),
    );
  });

  it('applies the documented critical-hit chance and multiplier', () => {
    const attacker = createCombatant(createPokemon({ speed: 512 }));
    const regularAttacker = createCombatant(createPokemon({ speed: 50 }));
    const defender = createCombatant(createPokemon({ types: ['grass'] }));
    const criticalRolls = [0, 0.99];
    const regularRolls = [0.99, 0.99];
    const critical = calculateDamage(
      attacker,
      defender,
      createMove(),
      () => criticalRolls.shift() ?? 0.99,
    );
    const regular = calculateDamage(
      regularAttacker,
      defender,
      createMove(),
      () => regularRolls.shift() ?? 0.99,
    );

    expect(critical.critical).toBe(true);
    expect(critical.damage).toBeGreaterThan(regular.damage);
    expect(regular.critical).toBe(false);
  });

  it('caps damage at remaining HP and keeps HP at zero', () => {
    const attacker = createCombatant(createPokemon({ attack: 200, special_attack: 200 }));
    const defender = createCombatant(createPokemon({ hp: 1, types: ['grass'] }));
    const result = resolveAttack(attacker, defender, createMove(), () => 0.99);

    expect(result.damage).toBeGreaterThan(0);
    expect(defender.currentHp).toBe(0);
  });
});
