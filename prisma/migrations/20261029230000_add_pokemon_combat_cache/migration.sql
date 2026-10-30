CREATE TABLE "pokemon_combat_cache" (
    "pokemon_id" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pokemon_combat_cache_pkey" PRIMARY KEY ("pokemon_id")
);

ALTER TABLE "pokemon_combat_cache"
ADD CONSTRAINT "pokemon_combat_cache_pokemon_id_fkey"
FOREIGN KEY ("pokemon_id") REFERENCES "pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
