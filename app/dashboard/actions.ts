"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createLoadingSession, updateLoadingSession, deleteLoadingSession } from "@/data/loading-sessions";
import { revalidatePath } from "next/cache";

const createSessionSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

interface CreateSessionInput {
  stationId: string;
  startTime?: string;
  endTime?: string;
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

  // 3. Create session via data helper
  try {
    const session = await createLoadingSession({
      userId,
      stationId: data.stationId,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    // 4. Revalidate dashboard to show new session
    revalidatePath("/dashboard");

    return { success: true, data: session };
  } catch (error) {
    console.error("Failed to create loading session:", error);
    return { error: "Failed to create charging session" };
  }
}

const updateSessionSchema = z.object({
  id: z.number(),
  stationId: z.string().min(1, "Station ID is required"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

interface UpdateSessionInput {
  id: number;
  stationId: string;
  startTime?: string;
  endTime?: string;
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

  // 3. Update session via data helper
  try {
    const session = await updateLoadingSession({
      id: data.id,
      stationId: data.stationId,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    // 4. Revalidate dashboard to show updated session
    revalidatePath("/dashboard");

    return { success: true, data: session };
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
