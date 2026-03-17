import { pgTable, integer, text, timestamp } from 'drizzle-orm/pg-core';

export const loadingSessions = pgTable('loading_sessions', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: text('user_id').notNull(),
  stationId: text('station_id').notNull(),
  startTime: timestamp('start_time').notNull().defaultNow(),
  endTime: timestamp('end_time'),
});
