import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { requireActiveAdminUser } from "@/lib/require-active-admin";
import { desc } from "drizzle-orm";

export type AuditStatus =
  | "success"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "error"
  | "confirmation_required";

export type AuditAction =
  | "CREATE_SESSION"
  | "UPDATE_SESSION"
  | "DELETE_SESSION"
  | "TRIGGER_SESSION_REMINDERS"
  | "CREATE_STATION"
  | "UPDATE_STATION"
  | "DELETE_STATION"
  | "CREATE_USER"
  | "UPDATE_USER"
  | "DEACTIVATE_USER"
  | "ACTIVATE_USER";

export type AuditEntityType = "session" | "station" | "user";

export interface WriteInternalAuditLogInput {
  performedByUserId: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  status: AuditStatus;
  errorMessage?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

async function readAllAuditLogs() {
  return db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt));
}

export async function getAllAuditLogs() {
  const { userId } = await auth();
  await requireActiveAdminUser(userId);
  return readAllAuditLogs();
}
