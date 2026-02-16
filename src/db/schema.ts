import { sqliteTableCreator, text, integer } from 'drizzle-orm/sqlite-core';

export const sqliteTable = sqliteTableCreator((name) => `sagebin_${name}`);

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
});
