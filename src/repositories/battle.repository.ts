import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { Battle } from '../types/battle';

export interface StoredBattle {
  battle: Battle;
  version: number;
}

class BattleRepository {
  private serialize(battle: Battle): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(battle)) as Prisma.InputJsonValue;
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.battleSession.deleteMany({
      where: { expires_at: { lte: new Date() } },
    });
    return result.count;
  }

  async create(battle: Battle, ttlMs: number): Promise<void> {
    await prisma.battleSession.create({
      data: {
        id: battle.id,
        state: this.serialize(battle),
        expires_at: new Date(Date.now() + ttlMs),
      },
    });
  }

  async findById(id: string): Promise<StoredBattle | null> {
    const record = await prisma.battleSession.findUnique({ where: { id } });

    if (!record) {
      return null;
    }

    const now = new Date();
    if (record.expires_at.getTime() <= now.getTime()) {
      await prisma.battleSession.deleteMany({
        where: { id, expires_at: { lte: now } },
      });
      return null;
    }

    return {
      battle: record.state as unknown as Battle,
      version: record.version,
    };
  }

  async update(battle: Battle, version: number, ttlMs: number): Promise<boolean> {
    const now = new Date();
    const result = await prisma.battleSession.updateMany({
      where: {
        id: battle.id,
        version,
        expires_at: { gt: now },
      },
      data: {
        state: this.serialize(battle),
        version: { increment: 1 },
        expires_at: new Date(now.getTime() + ttlMs),
      },
    });

    return result.count === 1;
  }
}

export default new BattleRepository();
