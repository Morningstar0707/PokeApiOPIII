const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');

const EXPECTED_POKEMON_COUNT = 151;

async function main() {
  const prisma = new PrismaClient();
  let currentCount;

  try {
    await prisma.$connect();
    currentCount = await prisma.pokemon.count();
  } finally {
    await prisma.$disconnect();
  }

  if (currentCount >= EXPECTED_POKEMON_COUNT) {
    console.log(`Pokédex lista: ${currentCount} Pokémon registrados.`);
    return;
  }

  console.log(
    `Pokédex incompleta (${currentCount}/${EXPECTED_POKEMON_COUNT}); cargando datos iniciales desde PokeAPI...`,
  );

  const result = spawnSync(process.execPath, ['dist/prisma/seed.js'], {
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return;
  }

  const verifyPrisma = new PrismaClient();

  try {
    const seededCount = await verifyPrisma.pokemon.count();
    if (seededCount < EXPECTED_POKEMON_COUNT) {
      throw new Error(
        `La carga terminó con ${seededCount}/${EXPECTED_POKEMON_COUNT} Pokémon en la base de datos.`,
      );
    }
  } finally {
    await verifyPrisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('No se pudo preparar la Pokédex:', error);
  process.exitCode = 1;
});
