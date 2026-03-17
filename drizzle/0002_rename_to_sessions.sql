-- Rename the loading_sessions table to sessions (preserves all data and constraints)
ALTER TABLE "loading_sessions" RENAME TO "sessions";
--> statement-breakpoint

-- Rename the identity sequence to match the new table name
ALTER SEQUENCE "loading_sessions_id_seq" RENAME TO "sessions_id_seq";
