import { db } from "@/db";
import { loadingSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getUserLoadingSessions(userId: string) {
  const sessions = await db.query.loadingSessions.findMany({
    where: eq(loadingSessions.userId, userId),
    with: {
      station: true,
    },
    orderBy: [desc(loadingSessions.startTime)],
  });

  return sessions;
}

interface CreateLoadingSessionInput {
  userId: string;
  stationId: number;
  startTime?: string;
  endTime?: string;
}

export async function createLoadingSession(data: CreateLoadingSessionInput) {
  const values: {
    userId: string;
    stationId: number;
    startTime: Date;
    endTime?: Date;
  } = {
    userId: data.userId,
    stationId: data.stationId,
    startTime: data.startTime ? new Date(data.startTime) : new Date(),
  };

  if (data.endTime) {
    values.endTime = new Date(data.endTime);
  }

  const [session] = await db
    .insert(loadingSessions)
    .values(values)
    .returning();

  return session;
}

interface UpdateLoadingSessionInput {
  id: number;
  stationId: number;
  startTime?: string;
  endTime?: string;
}

export async function updateLoadingSession(data: UpdateLoadingSessionInput) {
  const values: {
    stationId: number;
    startTime?: Date;
    endTime?: Date | null;
  } = {
    stationId: data.stationId,
  };

  if (data.startTime) {
    values.startTime = new Date(data.startTime);
  }

  if (data.endTime !== undefined) {
    values.endTime = data.endTime ? new Date(data.endTime) : null;
  }

  const [session] = await db
    .update(loadingSessions)
    .set(values)
    .where(eq(loadingSessions.id, data.id))
    .returning();

  return session;
}

export async function deleteLoadingSession(id: number) {
  await db
    .delete(loadingSessions)
    .where(eq(loadingSessions.id, id));
}
