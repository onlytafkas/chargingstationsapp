import { pgTable, integer, text, timestamp, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Stations table
export const stations = pgTable('stations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
});

// Loading sessions table
export const loadingSessions = pgTable('loading_sessions', {
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
  loadingSessions: many(loadingSessions),
}));

export const loadingSessionsRelations = relations(loadingSessions, ({ one }) => ({
  station: one(stations, {
    fields: [loadingSessions.stationId],
    references: [stations.id],
  }),
}));
