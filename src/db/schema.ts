import { sqliteTableCreator, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const sqliteTable = sqliteTableCreator((name) => `sagebin_${name}`);

export const bins = sqliteTable('bins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serialNumber: text('serial_number').unique().notNull(),
  fillLevel: integer('fill_level').notNull().default(0),
  status: text('status', { enum: ['open', 'close'] })
    .notNull()
    .default('open'),
  lastOnlineAt: integer('last_online_at', { mode: 'timestamp' }),
  lastUpdated: integer('last_updated', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
});

export const binFillLevelHistory = sqliteTable('bin_fill_level_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  binId: integer('bin_id')
    .notNull()
    .references(() => bins.id, { onDelete: 'cascade' }),
  fillLevel: integer('fill_level').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
});

export const binStatusHistory = sqliteTable('bin_status_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  binId: integer('bin_id')
    .notNull()
    .references(() => bins.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['open', 'close'] }).notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
});

export const binsRelations = relations(bins, ({ many }) => ({
  fillLevelHistory: many(binFillLevelHistory),
  statusHistory: many(binStatusHistory),
}));

export const binFillLevelHistoryRelations = relations(
  binFillLevelHistory,
  ({ one }) => ({
    bin: one(bins, {
      fields: [binFillLevelHistory.binId],
      references: [bins.id],
    }),
  }),
);

export const binStatusHistoryRelations = relations(
  binStatusHistory,
  ({ one }) => ({
    bin: one(bins, {
      fields: [binStatusHistory.binId],
      references: [bins.id],
    }),
  }),
);
