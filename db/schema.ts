import { pgTable, integer, text, timestamp, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Stations table
export const stations = pgTable('stations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: text('user_id').notNull(),
  stationId: integer('station_id')
    .notNull()
    .references(() => stations.id),
  startTime: timestamp('start_time').notNull().defaultNow(),
  endTime: timestamp('end_time'),
});

// Relations
export const stationsRelations = relations(stations, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  station: one(stations, {
    fields: [sessions.stationId],
    references: [stations.id],
  }),
}));
