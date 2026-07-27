import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const demoSessions = sqliteTable('demo_sessions', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  resetAt: integer('reset_at', { mode: 'timestamp_ms' }).notNull(),
})

export const stores = sqliteTable('stores', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  heroDish: text('hero_dish').notNull(),
  heroImage: text('hero_image').notNull(),
  distanceMeters: integer('distance_meters').notNull(),
  deliveryMinutes: integer('delivery_minutes').notNull(),
  averagePrice: real('average_price').notNull(),
  evidenceState: text('evidence_state', {
    enum: ['growing', 'established', 'disputed'],
  }).notNull(),
  depth: text('depth', { enum: ['deep', 'browse'] }).notNull(),
  sandbox: integer('sandbox', { mode: 'boolean' }).notNull().default(true),
}, (table) => [uniqueIndex('stores_slug_unique').on(table.slug)])

export const menuItems = sqliteTable('menu_items', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  image: text('image').notNull(),
  price: real('price').notNull(),
  isTrial: integer('is_trial', { mode: 'boolean' }).notNull().default(false),
})

export const trialPlans = sqliteTable('trial_plans', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  menuItemId: text('menu_item_id').notNull().references(() => menuItems.id),
  title: text('title').notNull(),
  benefitLabel: text('benefit_label').notNull(),
  dailyQuota: integer('daily_quota').notNull(),
  remainingQuota: integer('remaining_quota').notNull(),
  trialPrice: real('trial_price').notNull(),
  version: integer('version').notNull(),
  status: text('status', { enum: ['draft', 'published', 'paused', 'archived'] }).notNull(),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
}, (table) => [
  uniqueIndex('trial_plans_store_version_unique').on(table.storeId, table.version),
])

export const trialPlanClaims = sqliteTable('trial_plan_claims', {
  id: text('id').primaryKey(),
  planId: text('plan_id').notNull().references(() => trialPlans.id, { onDelete: 'cascade' }),
  kind: text('kind', {
    enum: ['objective', 'preference', 'specification', 'unverifiable'],
  }).notNull(),
  content: text('content').notNull(),
  sourceText: text('source_text').notNull(),
  decision: text('decision', { enum: ['confirmed', 'modified', 'rejected'] }).notNull(),
  sortOrder: integer('sort_order').notNull(),
})

export const evidenceAggregates = sqliteTable('evidence_aggregates', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  aspect: text('aspect').notNull(),
  evidenceType: text('evidence_type', {
    enum: ['objective', 'subjective', 'behavioral'],
  }).notNull(),
  positiveCount: integer('positive_count').notNull(),
  neutralCount: integer('neutral_count').notNull(),
  negativeCount: integer('negative_count').notNull(),
  disputedCount: integer('disputed_count').notNull().default(0),
  sourceLayer: text('source_layer', {
    enum: ['public', 'derived', 'sandbox'],
  }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

export const evidenceRecords = sqliteTable('evidence_records', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  orderId: text('order_id'),
  evidenceType: text('evidence_type', {
    enum: ['objective', 'subjective', 'behavioral'],
  }).notNull(),
  aspect: text('aspect').notNull(),
  result: text('result').notNull(),
  status: text('status', { enum: ['accepted', 'pending', 'rejected'] }).notNull(),
  occurredAt: integer('occurred_at', { mode: 'timestamp_ms' }).notNull(),
  sandbox: integer('sandbox', { mode: 'boolean' }).notNull().default(true),
})

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => demoSessions.id, { onDelete: 'cascade' }),
  storeId: text('store_id').notNull().references(() => stores.id),
  status: text('status', {
    enum: ['created', 'preparing', 'delivering', 'delivered', 'pending_verification', 'completed', 'disputed'],
  }).notNull(),
  totalAmount: real('total_amount').notNull(),
  sandbox: integer('sandbox', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: text('menu_item_id').notNull().references(() => menuItems.id),
  nameSnapshot: text('name_snapshot').notNull(),
  unitPriceSnapshot: real('unit_price_snapshot').notNull(),
  quantity: integer('quantity').notNull(),
})

export const orderPromiseSnapshots = sqliteTable('order_promise_snapshots', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  planId: text('plan_id').references(() => trialPlans.id),
  claimId: text('claim_id').references(() => trialPlanClaims.id),
  kind: text('kind', {
    enum: ['objective', 'preference', 'specification'],
  }),
  aspect: text('aspect').notNull(),
  version: integer('version').notNull(),
  merchantConfirmedAt: integer('merchant_confirmed_at', { mode: 'timestamp_ms' }).notNull(),
})

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  objectiveResult: text('objective_result', { enum: ['fulfilled', 'unfulfilled', 'unknown'] }).notNull(),
  tasteResult: text('taste_result', { enum: ['light', 'balanced', 'rich'] }).notNull(),
  repurchaseIntent: text('repurchase_intent', { enum: ['yes', 'maybe', 'no'] }).notNull(),
  note: text('note'),
  imagePath: text('image_path'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('verification_order_unique').on(table.orderId)])

export const verificationItems = sqliteTable('verification_items', {
  id: text('id').primaryKey(),
  verificationId: text('verification_id').notNull().references(() => verifications.id, { onDelete: 'cascade' }),
  promiseSnapshotId: text('promise_snapshot_id').notNull().references(() => orderPromiseSnapshots.id),
  result: text('result', { enum: ['fulfilled', 'unfulfilled', 'unknown'] }).notNull(),
})

export const disputes = sqliteTable('disputes', {
  id: text('id').primaryKey(),
  verificationId: text('verification_id').notNull().references(() => verifications.id, { onDelete: 'cascade' }),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'accepted', 'rejected'] }).notNull(),
  reason: text('reason').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

export type StoreRow = typeof stores.$inferSelect
export type MenuItemRow = typeof menuItems.$inferSelect
export type TrialPlanRow = typeof trialPlans.$inferSelect
export type TrialPlanClaimRow = typeof trialPlanClaims.$inferSelect
export type EvidenceAggregateRow = typeof evidenceAggregates.$inferSelect
export type EvidenceRecordRow = typeof evidenceRecords.$inferSelect
export type OrderRow = typeof orders.$inferSelect
export type OrderItemRow = typeof orderItems.$inferSelect
export type OrderPromiseSnapshotRow = typeof orderPromiseSnapshots.$inferSelect
export type VerificationRow = typeof verifications.$inferSelect
export type VerificationItemRow = typeof verificationItems.$inferSelect
export type DisputeRow = typeof disputes.$inferSelect
