-- CreateTable
CREATE TABLE "pokemon" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "hp" INTEGER NOT NULL,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "special_attack" INTEGER NOT NULL,
    "special_defense" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pokemon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pokemon_name_key" ON "pokemon"("name");
