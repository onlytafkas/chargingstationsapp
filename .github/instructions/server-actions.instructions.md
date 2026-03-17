---
description: Rules for implementing server actions and data mutations in the application. Use when creating or modifying server actions, handling form submissions, or performing database mutations.
---

# Server Actions & Data Mutations

## Core Principles

All data mutations in this application MUST be performed using Next.js Server Actions. Follow these strict rules:

## File Structure

- **File Naming**: Server action files MUST be named `actions.ts`
- **Colocation**: Place `actions.ts` in the same directory as the component that calls it
- **Client Components**: Server actions MUST be called from client components (marked with `"use client"`)

## Implementation Rules

### 1. Error Handling
❌ **Never throw errors** in server actions  
✅ **Always return** an object with `error` or `success` property

```typescript
// ✅ Correct
export async function updateChargingStation(data: UpdateStationInput) {
  // ... validation and logic
  if (error) {
    return { error: "Failed to update station" };
  }
  return { success: true, data: result };
}

// ❌ Wrong
export async function updateChargingStation(data: UpdateStationInput) {
  throw new Error("Failed to update"); // Never do this
}
```

### 2. Type Safety
❌ **Do NOT use** the `FormData` TypeScript type  
✅ **Define explicit** TypeScript interfaces/types for all inputs

```typescript
// ✅ Correct
interface CreateStationInput {
  name: string;
  location: string;
  capacity: number;
}

export async function createStation(data: CreateStationInput) {
  // ...
}

// ❌ Wrong
export async function createStation(data: FormData) {
  // Never use FormData type
}
```

### 3. Validation
**ALL input data MUST be validated using Zod schemas**

```typescript
import { z } from "zod";

const createStationSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  capacity: z.number().positive(),
});

export async function createStation(data: CreateStationInput) {
  const validated = createStationSchema.parse(data);
  // ... continue with validated data
}
```

### 4. Authentication Check
**ALWAYS check for authenticated user FIRST** before any database operations

```typescript
import { auth } from "@clerk/nextjs/server";

export async function createStation(data: CreateStationInput) {
  const { userId } = await auth();
  
  if (!userId) {
    return { error: "Unauthorized" };
  }
  
  // ... proceed with validation and database operations
}
```

### 5. Database Operations
❌ **Never use** Drizzle queries directly in server actions  
✅ **Always use** helper functions from the `/data` directory

```typescript
// ✅ Correct
import { createChargingStation } from "@/data/charging-stations";

export async function addStation(data: CreateStationInput) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };
  
  const validated = createStationSchema.parse(data);
  const station = await createChargingStation(validated);
  
  return { success: true, data: station };
}

// ❌ Wrong
import { db } from "@/db";
import { stations } from "@/db/schema";

export async function addStation(data: CreateStationInput) {
  // Never do direct database queries here
  const station = await db.insert(stations).values(data);
}
```

## Complete Example

```typescript
// app/dashboard/stations/actions.ts
"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createChargingStation } from "@/data/charging-stations";

const createStationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  capacity: z.number().positive("Capacity must be positive"),
});

interface CreateStationInput {
  name: string;
  location: string;
  capacity: number;
}

export async function createStation(data: CreateStationInput) {
  // 1. Check authentication
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }
  
  // 2. Validate input
  try {
    const validated = createStationSchema.parse(data);
    
    // 3. Use data helper function
    const station = await createChargingStation(validated);
    
    // 4. Return success
    return { success: true, data: station };
  } catch (error) {
    // 5. Return error (don't throw)
    return { error: "Failed to create charging station" };
  }
}
```

## Checklist

Before committing a server action, verify:
- [ ] File is named `actions.ts`
- [ ] File is colocated with calling component
- [ ] Returns object with `error` or `success` property
- [ ] Uses explicit TypeScript types (not FormData)
- [ ] Validates data with Zod schema
- [ ] Checks for authenticated user first
- [ ] Uses helper functions from `/data` directory
- [ ] Called from client component
