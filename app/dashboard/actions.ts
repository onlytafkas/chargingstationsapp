"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createLoadingSession, updateLoadingSession, deleteLoadingSession, checkSessionOverlap, findNextAvailableStartTime } from "@/data/loading-sessions";
import { createStation, updateStation, deleteStation, checkStationHasSessions } from "@/data/stations";
import { revalidatePath } from "next/cache";

const createSessionSchema = z.object({
  stationId: z.number().int().positive("Station ID is required"),
  startTime: z.string(),
  endTime: z.string(),
});

interface CreateSessionInput {
  stationId: number;
  startTime: string;
  endTime: string;
}

export async function createSession(data: CreateSessionInput) {
  // 1. Check authentication
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  // 2. Validate input
  try {
    createSessionSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Invalid input" };
  }

  // 3. Check for session overlap and auto-adjust if needed
  let adjustmentMessage: string | undefined;
  try {
    let startTime = new Date(data.startTime);
    let endTime = data.endTime ? new Date(data.endTime) : null;

    // Calculate the duration to preserve it after adjustment
    const durationMs = endTime ? endTime.getTime() - startTime.getTime() : 0;

    // First check if there's an overlap
    const hasOverlap = await checkSessionOverlap(
      data.stationId,
      startTime,
      endTime
    );

    if (hasOverlap) {
      // Find the next available start time
      const nextAvailableStart = await findNextAvailableStartTime(
        data.stationId,
        startTime
      );

      if (nextAvailableStart) {
        // Auto-adjust to the next available time
        startTime = nextAvailableStart;
        
        // Recalculate end time with the same duration
        if (endTime) {
          endTime = new Date(startTime.getTime() + durationMs);
        }
        
        // Format the adjusted time for user display (HH:MM)
        const adjustedTime = startTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        
        // Update the data with adjusted times
        data.startTime = startTime.toISOString();
        if (endTime) {
          data.endTime = endTime.toISOString();
        }
        
        // Set message to return with success
        adjustmentMessage = `Your session was automatically adjusted to start at ${adjustedTime} to avoid conflicts.`;
      } else {
        // No available time slot found
        return { 
          error: "This time slot conflicts with another session. Please choose a different time." 
        };
      }
    }
  } catch (error) {
    console.error("Failed to check session overlap:", error);
    return { error: "Failed to validate session timing" };
  }

  // 4. Create session via data helper
  try {
    const session = await createLoadingSession({
      userId,
      stationId: data.stationId,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    // 5. Revalidate dashboard to show new session
    revalidatePath("/dashboard");

    return { success: true, data: session, message: adjustmentMessage };
  } catch (error) {
    console.error("Failed to create loading session:", error);
    return { error: "Failed to create charging session" };
  }
}

const updateSessionSchema = z.object({
  id: z.number(),
  stationId: z.number().int().positive("Station ID is required"),
  startTime: z.string(),
  endTime: z.string(),
});

interface UpdateSessionInput {
  id: number;
  stationId: number;
  startTime: string;
  endTime: string;
}

export async function updateSession(data: UpdateSessionInput) {
  // 1. Check authentication
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  // 2. Validate input
  try {
    updateSessionSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Invalid input" };
  }

  // 3. Check for session overlap and auto-adjust if needed
  let adjustmentMessage: string | undefined;
  try {
    let startTime = new Date(data.startTime);
    let endTime = data.endTime ? new Date(data.endTime) : null;

    // Calculate the duration to preserve it after adjustment
    const durationMs = endTime ? endTime.getTime() - startTime.getTime() : 0;

    // First check if there's an overlap
    const hasOverlap = await checkSessionOverlap(
      data.stationId,
      startTime,
      endTime,
      data.id // Exclude current session from overlap check
    );

    if (hasOverlap) {
      // Find the next available start time
      const nextAvailableStart = await findNextAvailableStartTime(
        data.stationId,
        startTime,
        data.id
      );

      if (nextAvailableStart) {
        // Auto-adjust to the next available time
        startTime = nextAvailableStart;
        
        // Recalculate end time with the same duration
        if (endTime) {
          endTime = new Date(startTime.getTime() + durationMs);
        }
        
        // Format the adjusted time for user display (HH:MM)
        const adjustedTime = startTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        
        // Update the data with adjusted times
        data.startTime = startTime.toISOString();
        if (endTime) {
          data.endTime = endTime.toISOString();
        }
        
        // Set message to return with success
        adjustmentMessage = `Your session was automatically adjusted to start at ${adjustedTime} to avoid conflicts.`;
      } else {
        // No available time slot found
        return { 
          error: "This time slot conflicts with another session. Please choose a different time." 
        };
      }
    }
  } catch (error) {
    console.error("Failed to check session overlap:", error);
    return { error: "Failed to validate session timing" };
  }

  // 4. Update session via data helper
  try {
    const session = await updateLoadingSession({
      id: data.id,
      stationId: data.stationId,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    // 5. Revalidate dashboard to show updated session
    revalidatePath("/dashboard");

    return { success: true, data: session, message: adjustmentMessage };
  } catch (error) {
    console.error("Failed to update loading session:", error);
    return { error: "Failed to update charging session" };
  }
}

export async function deleteSession(id: number) {
  // 1. Check authentication
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  // 2. Delete session via data helper
  try {
    await deleteLoadingSession(id);

    // 3. Revalidate dashboard to remove deleted session
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete loading session:", error);
    return { error: "Failed to delete charging session" };
  }
}

// ==================== Station Actions ====================

const createStationSchema = z.object({
  name: z.string().min(1, "Station name is required").max(100),
  description: z.string().max(500).optional(),
});

interface CreateStationInput {
  name: string;
  description?: string;
}

export async function createStationAction(data: CreateStationInput) {
  // 1. Check authentication
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  // 2. Validate input
  try {
    createStationSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Invalid input" };
  }

  // 3. Create station via data helper
  try {
    const station = await createStation({
      name: data.name,
      description: data.description,
    });

    // 4. Revalidate dashboard to show new station
    revalidatePath("/dashboard");

    return { success: true, data: station };
  } catch (error) {
    console.error("Failed to create station:", error);
    return { error: "Failed to create station. Station name may already exist." };
  }
}

const updateStationSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Station name is required").max(100),
  description: z.string().max(500).optional(),
});

interface UpdateStationInput {
  id: number;
  name: string;
  description?: string;
}

export async function updateStationAction(data: UpdateStationInput) {
  // 1. Check authentication
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  // 2. Validate input
  try {
    updateStationSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Invalid input" };
  }

  // 3. Update station via data helper
  try {
    const station = await updateStation({
      id: data.id,
      name: data.name,
      description: data.description,
    });

    // 4. Revalidate dashboard to show updated station
    revalidatePath("/dashboard");

    return { success: true, data: station };
  } catch (error) {
    console.error("Failed to update station:", error);
    return { error: "Failed to update station. Station name may already exist." };
  }
}

export async function deleteStationAction(id: number) {
  // 1. Check authentication
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  // 2. Check if station has any sessions
  try {
    const hasSessions = await checkStationHasSessions(id);
    if (hasSessions) {
      return { error: "Cannot delete station with existing reservations" };
    }

    // 3. Delete station via data helper
    await deleteStation(id);

    // 4. Revalidate dashboard to remove deleted station
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete station:", error);
    return { error: "Failed to delete station" };
  }
}
