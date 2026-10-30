CREATE TABLE "battle_sessions" (
    "id" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "battle_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "battle_sessions_expires_at_idx" ON "battle_sessions"("expires_at");
