import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq, desc, and, ne, gt } from "drizzle-orm";

export async function getUserLoadingSessions(userId: string) {
  const userSessions = await db.query.sessions.findMany({
    where: eq(sessions.userId, userId),
    with: {
      station: true,
    },
    orderBy: [desc(sessions.startTime)],
  });

  return userSessions;
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
    .insert(sessions)
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
    .update(sessions)
    .set(values)
    .where(eq(sessions.id, data.id))
    .returning();

  return session;
}

export async function deleteLoadingSession(id: number) {
  await db
    .delete(sessions)
    .where(eq(sessions.id, id));
}

/**
 * Checks if a session would overlap with existing sessions for the same station
 * Sessions must have at least 5 minutes gap between them
 * @param stationId The station ID to check
 * @param startTime Start time of the session
 * @param endTime End time of the session (optional)
 * @param excludeSessionId Session ID to exclude from check (for updates)
 * @returns true if there's an overlap, false otherwise
 */
export async function checkSessionOverlap(
  stationId: number,
  startTime: Date,
  endTime: Date | null,
  excludeSessionId?: number
): Promise<boolean> {
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  // Add 5-minute buffer to start and end times
  const bufferedStart = new Date(startTime.getTime() - FIVE_MINUTES_MS);
  const bufferedEnd = endTime
    ? new Date(endTime.getTime() + FIVE_MINUTES_MS)
    : new Date(startTime.getTime() + FIVE_MINUTES_MS);

  // Build the where clause
  const whereConditions = [eq(sessions.stationId, stationId)];

  // Exclude the current session if updating
  if (excludeSessionId !== undefined) {
    whereConditions.push(ne(sessions.id, excludeSessionId));
  }

  // Get all sessions for this station (excluding the current one if updating)
  const existingSessions = await db.query.sessions.findMany({
    where: and(...whereConditions),
  });

  // Check for overlaps
  for (const existingSession of existingSessions) {
    const existingStart = new Date(existingSession.startTime);
    const existingEnd = existingSession.endTime
      ? new Date(existingSession.endTime)
      : new Date(existingStart.getTime() + FIVE_MINUTES_MS); // Assume 5 min if no end time

    // Check if there's an overlap considering the 5-minute buffer
    // Sessions overlap if:
    // - New session starts before existing ends AND
    // - New session ends after existing starts
    if (bufferedStart < existingEnd && bufferedEnd > existingStart) {
      return true; // Overlap detected
    }
  }

  return false; // No overlap
}

/**
 * Finds the next session for a station after a given start time and calculates
 * the maximum allowed end time (with 5-minute gap)
 * @param stationId The station ID to check
 * @param startTime Start time of the session
 * @param excludeSessionId Session ID to exclude from check (for updates)
 * @returns The maximum allowed end time, or null if no constraint
 */
export async function findMaxEndTime(
  stationId: number,
  startTime: Date,
  excludeSessionId?: number
): Promise<Date | null> {
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  // Build the where clause to find sessions starting after our start time
  const whereConditions = [
    eq(sessions.stationId, stationId),
    gt(sessions.startTime, startTime),
  ];

  // Exclude the current session if updating
  if (excludeSessionId !== undefined) {
    whereConditions.push(ne(sessions.id, excludeSessionId));
  }

  // Get the next session after this start time
  const nextSessions = await db.query.sessions.findMany({
    where: and(...whereConditions),
    orderBy: [sessions.startTime], // Get the earliest one
    limit: 1,
  });

  if (nextSessions.length === 0) {
    return null; // No next session, no constraint
  }

  const nextSession = nextSessions[0];
  const nextSessionStart = new Date(nextSession.startTime);

  // Maximum end time is 5 minutes before the next session starts
  const maxEndTime = new Date(nextSessionStart.getTime() - FIVE_MINUTES_MS);

  return maxEndTime;
}

/**
 * Finds the next available start time for a session at a station
 * Considers sessions that overlap with or are too close to the requested start time
 * @param stationId The station ID to check
 * @param requestedStartTime The desired start time
 * @param excludeSessionId Session ID to exclude from check (for updates)
 * @returns The next available start time (5 minutes after conflicting sessions), or null if requested time is available
 */
export async function findNextAvailableStartTime(
  stationId: number,
  requestedStartTime: Date,
  excludeSessionId?: number
): Promise<Date | null> {
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  // Build the where clause
  const whereConditions = [eq(sessions.stationId, stationId)];
  if (excludeSessionId !== undefined) {
    whereConditions.push(ne(sessions.id, excludeSessionId));
  }

  // Get all sessions for this station
  const existingSessions = await db.query.sessions.findMany({
    where: and(...whereConditions),
    orderBy: [sessions.startTime],
  });

  let latestConflictingEndTime: Date | null = null;

  // Check for sessions that conflict with the requested start time
  for (const existingSession of existingSessions) {
    const existingStart = new Date(existingSession.startTime);
    const existingEnd = existingSession.endTime
      ? new Date(existingSession.endTime)
      : new Date(existingStart.getTime() + FIVE_MINUTES_MS);

    // A session conflicts if it ends after (or within 5 minutes before) the requested start time
    // AND starts before (or within 5 minutes after) the requested start time
    const conflictThreshold = new Date(requestedStartTime.getTime() + FIVE_MINUTES_MS);
    
    if (existingEnd > requestedStartTime && existingStart < conflictThreshold) {
      // This session conflicts - track the latest ending time
      if (!latestConflictingEndTime || existingEnd > latestConflictingEndTime) {
        latestConflictingEndTime = existingEnd;
      }
    }
  }

  // If there's a conflict, return 5 minutes after the latest conflicting session ends
  if (latestConflictingEndTime) {
    return new Date(latestConflictingEndTime.getTime() + FIVE_MINUTES_MS);
  }

  return null; // No conflict, requested time is available
}
