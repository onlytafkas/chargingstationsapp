import "server-only";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { WriteInternalAuditLogInput } from "@/data/audit";

export async function writeInternalAuditLog(entry: WriteInternalAuditLogInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      performedByUserId: entry.performedByUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      status: entry.status,
      errorMessage: entry.errorMessage ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeData: (entry.beforeData ?? null) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      afterData: (entry.afterData ?? null) as any,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    });
  } catch (err) {
    // Audit failures must never break the calling action
    console.error("[audit] Failed to insert audit log:", err);
  }
}