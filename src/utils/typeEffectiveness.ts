const typeChart: Record<
  string,
  { superEffective?: string[]; notVeryEffective?: string[]; immune?: string[] }
> = {
  normal: { notVeryEffective: ['rock'], immune: ['ghost'] },
  fire: {
    superEffective: ['grass', 'ice', 'bug'],
    notVeryEffective: ['fire', 'water', 'rock', 'dragon'],
  },
  water: {
    superEffective: ['fire', 'ground', 'rock'],
    notVeryEffective: ['water', 'grass', 'dragon'],
  },
  electric: {
    superEffective: ['water', 'flying'],
    notVeryEffective: ['electric', 'grass', 'dragon'],
    immune: ['ground'],
  },
  grass: {
    superEffective: ['water', 'ground', 'rock'],
    notVeryEffective: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon'],
  },
  ice: {
    superEffective: ['grass', 'ground', 'flying', 'dragon'],
    notVeryEffective: ['water', 'ice'],
  },
  fighting: {
    superEffective: ['normal', 'ice', 'rock'],
    notVeryEffective: ['poison', 'flying', 'psychic', 'bug'],
    immune: ['ghost'],
  },
  poison: {
    superEffective: ['grass', 'bug'],
    notVeryEffective: ['poison', 'ground', 'rock', 'ghost'],
  },
  ground: {
    superEffective: ['fire', 'electric', 'poison', 'rock'],
    notVeryEffective: ['grass', 'bug'],
    immune: ['flying'],
  },
  flying: {
    superEffective: ['grass', 'fighting', 'bug'],
    notVeryEffective: ['electric', 'rock'],
  },
  psychic: { superEffective: ['fighting', 'poison'], notVeryEffective: ['psychic'] },
  bug: {
    superEffective: ['grass', 'psychic', 'poison'],
    notVeryEffective: ['fire', 'fighting', 'flying', 'ghost'],
  },
  rock: {
    superEffective: ['fire', 'ice', 'flying', 'bug'],
    notVeryEffective: ['fighting', 'ground'],
  },
  ghost: { superEffective: ['ghost'], immune: ['normal', 'psychic'] },
  dragon: { superEffective: ['dragon'], notVeryEffective: ['fire', 'water', 'electric', 'grass'] },
};

export function isGenerationOneType(type: string): boolean {
  return Object.prototype.hasOwnProperty.call(typeChart, type.toLowerCase());
}

export function getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  const attackType = moveType.toLowerCase();
  const chart = typeChart[attackType];

  if (!chart) {
    throw new Error(`Unsupported Generation I move type: ${moveType}`);
  }

  return defenderTypes.reduce((multiplier, defenderType) => {
    const type = defenderType.toLowerCase();

    if (chart.immune?.includes(type)) {
      return 0;
    }

    if (chart.superEffective?.includes(type)) {
      return multiplier * 2;
    }

    if (chart.notVeryEffective?.includes(type)) {
      return multiplier * 0.5;
    }

    return multiplier;
  }, 1);
}
