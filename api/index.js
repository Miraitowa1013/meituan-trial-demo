var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/vercel.ts
import { handle } from "hono/vercel";
import { join } from "node:path";

// server/app.ts
import { sql as sql2 } from "drizzle-orm";
import { Hono as Hono10 } from "hono";

// server/modules/sessions/session.routes.ts
import { Hono } from "hono";
import { ZodError } from "zod";

// server/modules/sessions/session.schema.ts
import { z } from "zod";
var sessionIdSchema = z.string().regex(/^demo_[0-9a-f-]{36}$/);
var sessionResponseSchema = z.object({
  id: sessionIdSchema,
  createdAt: z.string().datetime(),
  resetAt: z.string().datetime()
});

// server/modules/sessions/session.service.ts
import { randomUUID } from "node:crypto";
import { and, eq, inArray, ne } from "drizzle-orm";

// server/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  demoSessions: () => demoSessions,
  disputes: () => disputes,
  evidenceAggregates: () => evidenceAggregates,
  evidenceRecords: () => evidenceRecords,
  menuItems: () => menuItems,
  orderItems: () => orderItems,
  orderPromiseSnapshots: () => orderPromiseSnapshots,
  orders: () => orders,
  stores: () => stores,
  trialPlanClaims: () => trialPlanClaims,
  trialPlans: () => trialPlans,
  verificationItems: () => verificationItems,
  verifications: () => verifications
});
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
var demoSessions = sqliteTable("demo_sessions", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  resetAt: integer("reset_at", { mode: "timestamp_ms" }).notNull()
});
var stores = sqliteTable("stores", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  heroDish: text("hero_dish").notNull(),
  heroImage: text("hero_image").notNull(),
  distanceMeters: integer("distance_meters").notNull(),
  deliveryMinutes: integer("delivery_minutes").notNull(),
  averagePrice: real("average_price").notNull(),
  evidenceState: text("evidence_state", {
    enum: ["growing", "established", "disputed"]
  }).notNull(),
  depth: text("depth", { enum: ["deep", "browse"] }).notNull(),
  sandbox: integer("sandbox", { mode: "boolean" }).notNull().default(true)
}, (table) => [uniqueIndex("stores_slug_unique").on(table.slug)]);
var menuItems = sqliteTable("menu_items", {
  id: text("id").primaryKey(),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  price: real("price").notNull(),
  isTrial: integer("is_trial", { mode: "boolean" }).notNull().default(false)
});
var trialPlans = sqliteTable("trial_plans", {
  id: text("id").primaryKey(),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  menuItemId: text("menu_item_id").notNull().references(() => menuItems.id),
  title: text("title").notNull(),
  benefitLabel: text("benefit_label").notNull(),
  dailyQuota: integer("daily_quota").notNull(),
  remainingQuota: integer("remaining_quota").notNull(),
  trialPrice: real("trial_price").notNull(),
  version: integer("version").notNull(),
  status: text("status", { enum: ["draft", "published", "paused", "archived"] }).notNull(),
  publishedAt: integer("published_at", { mode: "timestamp_ms" })
}, (table) => [
  uniqueIndex("trial_plans_store_version_unique").on(table.storeId, table.version)
]);
var trialPlanClaims = sqliteTable("trial_plan_claims", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull().references(() => trialPlans.id, { onDelete: "cascade" }),
  kind: text("kind", {
    enum: ["objective", "preference", "specification", "unverifiable"]
  }).notNull(),
  content: text("content").notNull(),
  sourceText: text("source_text").notNull(),
  decision: text("decision", { enum: ["confirmed", "modified", "rejected"] }).notNull(),
  sortOrder: integer("sort_order").notNull()
});
var evidenceAggregates = sqliteTable("evidence_aggregates", {
  id: text("id").primaryKey(),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  aspect: text("aspect").notNull(),
  evidenceType: text("evidence_type", {
    enum: ["objective", "subjective", "behavioral"]
  }).notNull(),
  positiveCount: integer("positive_count").notNull(),
  neutralCount: integer("neutral_count").notNull(),
  negativeCount: integer("negative_count").notNull(),
  disputedCount: integer("disputed_count").notNull().default(0),
  sourceLayer: text("source_layer", {
    enum: ["public", "derived", "sandbox"]
  }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull()
});
var evidenceRecords = sqliteTable("evidence_records", {
  id: text("id").primaryKey(),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  orderId: text("order_id"),
  evidenceType: text("evidence_type", {
    enum: ["objective", "subjective", "behavioral"]
  }).notNull(),
  aspect: text("aspect").notNull(),
  result: text("result").notNull(),
  status: text("status", { enum: ["accepted", "pending", "rejected"] }).notNull(),
  occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
  sandbox: integer("sandbox", { mode: "boolean" }).notNull().default(true)
});
var orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => demoSessions.id, { onDelete: "cascade" }),
  storeId: text("store_id").notNull().references(() => stores.id),
  status: text("status", {
    enum: ["created", "preparing", "delivering", "delivered", "pending_verification", "completed", "disputed"]
  }).notNull(),
  totalAmount: real("total_amount").notNull(),
  sandbox: integer("sandbox", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull()
});
var orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: text("menu_item_id").notNull().references(() => menuItems.id),
  nameSnapshot: text("name_snapshot").notNull(),
  unitPriceSnapshot: real("unit_price_snapshot").notNull(),
  quantity: integer("quantity").notNull()
});
var orderPromiseSnapshots = sqliteTable("order_promise_snapshots", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  planId: text("plan_id").references(() => trialPlans.id),
  claimId: text("claim_id").references(() => trialPlanClaims.id),
  kind: text("kind", {
    enum: ["objective", "preference", "specification"]
  }),
  aspect: text("aspect").notNull(),
  version: integer("version").notNull(),
  merchantConfirmedAt: integer("merchant_confirmed_at", { mode: "timestamp_ms" }).notNull()
});
var verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  objectiveResult: text("objective_result", { enum: ["fulfilled", "unfulfilled", "unknown"] }).notNull(),
  tasteResult: text("taste_result", { enum: ["light", "balanced", "rich"] }).notNull(),
  repurchaseIntent: text("repurchase_intent", { enum: ["yes", "maybe", "no"] }).notNull(),
  note: text("note"),
  imagePath: text("image_path"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
}, (table) => [uniqueIndex("verification_order_unique").on(table.orderId)]);
var verificationItems = sqliteTable("verification_items", {
  id: text("id").primaryKey(),
  verificationId: text("verification_id").notNull().references(() => verifications.id, { onDelete: "cascade" }),
  promiseSnapshotId: text("promise_snapshot_id").notNull().references(() => orderPromiseSnapshots.id),
  result: text("result", { enum: ["fulfilled", "unfulfilled", "unknown"] }).notNull()
});
var disputes = sqliteTable("disputes", {
  id: text("id").primaryKey(),
  verificationId: text("verification_id").notNull().references(() => verifications.id, { onDelete: "cascade" }),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull(),
  reason: text("reason").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
});

// server/db/seed-data.ts
function makeStore(input) {
  const positive = Math.max(2, Math.round(input.sampleCount * 0.75));
  const negative = Math.max(0, input.sampleCount - positive - 1);
  return {
    ...input,
    menu: [
      {
        id: `${input.id}-trial`,
        name: `${input.heroDish}\u8BD5\u65B0\u5957\u9910`,
        description: `${input.verifiedLabel}\uFF0C\u627F\u8BFA\u968F\u8BA2\u5355\u9501\u5B9A`,
        image: input.heroImage,
        price: input.trialPrice,
        isTrial: true
      },
      {
        id: `${input.id}-standard`,
        name: input.heroDish,
        description: "\u95E8\u5E97\u65E5\u5E38\u83DC\u5355\uFF0C\u652F\u6301\u6B63\u5E38\u4EF7\u683C\u590D\u8D2D\u53E3\u5F84",
        image: input.heroImage,
        price: input.averagePrice,
        isTrial: false
      }
    ],
    trialPlan: {
      id: `${input.id}-plan-v1`,
      menuItemId: `${input.id}-trial`,
      title: `${input.heroDish}\u53EF\u4FE1\u8BD5\u65B0`,
      benefitLabel: "\u9996\u8F6E\u8BC1\u636E\u4E13\u4EAB",
      dailyQuota: 20,
      remainingQuota: 12,
      trialPrice: input.trialPrice,
      version: 1,
      status: "published",
      publishedAt: /* @__PURE__ */ new Date("2026-07-20T18:30:00+08:00")
    },
    trialPlanClaims: [
      {
        id: `${input.id}-v1-objective`,
        kind: "objective",
        content: input.verifiedLabel,
        sourceText: input.verifiedLabel,
        decision: "confirmed",
        sortOrder: 1
      },
      {
        id: `${input.id}-v1-preference`,
        kind: "preference",
        content: "\u652F\u6301\u6309\u53E3\u5473\u504F\u597D\u8C03\u6574",
        sourceText: "\u652F\u6301\u53E3\u5473\u5907\u6CE8",
        decision: "confirmed",
        sortOrder: 2
      }
    ],
    evidence: [
      {
        id: `${input.id}-objective`,
        aspect: input.verifiedLabel,
        evidenceType: "objective",
        positiveCount: positive,
        neutralCount: 1,
        negativeCount: negative,
        disputedCount: 0,
        sourceLayer: "sandbox"
      },
      {
        id: `${input.id}-subjective`,
        aspect: "\u53E3\u5473\u9002\u914D",
        evidenceType: "subjective",
        positiveCount: Math.max(1, positive - 1),
        neutralCount: Math.max(1, Math.round(input.sampleCount * 0.2)),
        negativeCount: Math.max(0, input.sampleCount - positive),
        disputedCount: 0,
        sourceLayer: "derived"
      },
      {
        id: `${input.id}-behavioral`,
        aspect: "\u6B63\u5E38\u4EF7\u590D\u8D2D\u610F\u613F",
        evidenceType: "behavioral",
        positiveCount: Math.max(1, Math.round(input.sampleCount * 0.65)),
        neutralCount: Math.max(1, Math.round(input.sampleCount * 0.2)),
        negativeCount: Math.max(0, Math.round(input.sampleCount * 0.15)),
        disputedCount: 0,
        sourceLayer: "sandbox"
      }
    ],
    evidenceRecords: []
  };
}
function withHeroLedger(store) {
  const dates = Array.from({ length: 8 }, (_, index) => /* @__PURE__ */ new Date(`2026-07-${String(13 + index).padStart(2, "0")}T12:00:00+08:00`));
  return {
    ...store,
    trialPlan: {
      ...store.trialPlan,
      title: "\u62DB\u724C\u73B0\u5207\u725B\u8089\u996D\u53EF\u4FE1\u8BD5\u65B0",
      benefitLabel: "\u8BD5\u65B0\u4FDD\u969C",
      dailyQuota: 10,
      remainingQuota: 7,
      trialPrice: 23.9
    },
    trialPlanClaims: [
      {
        id: "beef-v1-sealed",
        kind: "objective",
        content: "\u6C64\u4E0E\u7C73\u996D\u4F7F\u7528\u72EC\u7ACB\u5BC6\u5C01\u5BB9\u5668",
        sourceText: "\u6C64\u996D\u5206\u5F00\u88C5",
        decision: "confirmed",
        sortOrder: 1
      },
      {
        id: "beef-v1-low-oil",
        kind: "preference",
        content: "\u652F\u6301\u5C11\u6CB9\u5236\u4F5C",
        sourceText: "\u53EF\u6309\u5907\u6CE8\u5C11\u6CB9",
        decision: "confirmed",
        sortOrder: 2
      },
      {
        id: "beef-v1-80g",
        kind: "specification",
        content: "\u5546\u5BB6\u6807\u79F0\u725B\u8089 80g",
        sourceText: "\u725B\u8089\u6807\u79F080g",
        decision: "confirmed",
        sortOrder: 3
      },
      {
        id: "beef-v1-tasty",
        kind: "unverifiable",
        content: "\u62DB\u724C\u597D\u5403\u4E0D\u8E29\u96F7",
        sourceText: "\u62DB\u724C\u597D\u5403\u4E0D\u8E29\u96F7",
        decision: "rejected",
        sortOrder: 4
      }
    ],
    evidence: [
      { id: `${store.id}-objective`, aspect: "\u72EC\u7ACB\u5BC6\u5C01\u5206\u88C5", evidenceType: "objective", positiveCount: 8, neutralCount: 0, negativeCount: 0, disputedCount: 0, sourceLayer: "sandbox" },
      { id: `${store.id}-subjective`, aspect: "\u5C11\u6CB9\u611F\u53D7", evidenceType: "subjective", positiveCount: 7, neutralCount: 0, negativeCount: 1, disputedCount: 0, sourceLayer: "sandbox" },
      { id: `${store.id}-behavioral`, aspect: "\u6B63\u5E38\u4EF7\u590D\u8D2D\u610F\u613F", evidenceType: "behavioral", positiveCount: 6, neutralCount: 1, negativeCount: 1, disputedCount: 0, sourceLayer: "sandbox" }
    ],
    evidenceRecords: dates.flatMap((occurredAt, index) => {
      const orderId = `historical-beef-${index + 1}`;
      return [
        { id: `${orderId}-objective`, orderId, evidenceType: "objective", aspect: "\u72EC\u7ACB\u5BC6\u5C01\u5206\u88C5", result: "fulfilled", status: "accepted", occurredAt },
        { id: `${orderId}-subjective`, orderId, evidenceType: "subjective", aspect: "\u5C11\u6CB9\u611F\u53D7", result: index === 7 ? "rich" : "suitable", status: "accepted", occurredAt },
        { id: `${orderId}-behavioral`, orderId, evidenceType: "behavioral", aspect: "\u6B63\u5E38\u4EF7\u590D\u8D2D\u610F\u613F", result: index < 6 ? "yes" : index === 6 ? "maybe" : "no", status: "accepted", occurredAt }
      ];
    })
  };
}
function withDecisionLedger(store, counts) {
  const sampleCount = counts.objective.positive + counts.objective.neutral + counts.objective.negative;
  const objectiveAspect = store.evidence.find((item) => item.evidenceType === "objective").aspect;
  const dates = Array.from(
    { length: sampleCount },
    (_, index) => /* @__PURE__ */ new Date(`2026-07-${String(1 + index % 20).padStart(2, "0")}T12:00:00+08:00`)
  );
  const resultAt = (index, countsForType, values) => index < countsForType.positive ? values[0] : index < countsForType.positive + countsForType.neutral ? values[1] : values[2];
  return {
    ...store,
    evidence: [
      {
        id: `${store.id}-objective`,
        aspect: objectiveAspect,
        evidenceType: "objective",
        positiveCount: counts.objective.positive,
        neutralCount: counts.objective.neutral,
        negativeCount: counts.objective.negative,
        disputedCount: 0,
        sourceLayer: "sandbox"
      },
      {
        id: `${store.id}-subjective`,
        aspect: "\u5C11\u6CB9\u611F\u53D7",
        evidenceType: "subjective",
        positiveCount: counts.subjective.positive,
        neutralCount: counts.subjective.neutral,
        negativeCount: counts.subjective.negative,
        disputedCount: 0,
        sourceLayer: "sandbox"
      },
      {
        id: `${store.id}-behavioral`,
        aspect: "\u6B63\u5E38\u4EF7\u590D\u8D2D\u610F\u613F",
        evidenceType: "behavioral",
        positiveCount: counts.behavioral.positive,
        neutralCount: counts.behavioral.neutral,
        negativeCount: counts.behavioral.negative,
        disputedCount: 0,
        sourceLayer: "sandbox"
      }
    ],
    evidenceRecords: dates.flatMap((occurredAt, index) => {
      const orderId = `historical-${store.id}-${index + 1}`;
      return [
        {
          id: `${orderId}-objective`,
          orderId,
          evidenceType: "objective",
          aspect: objectiveAspect,
          result: resultAt(index, counts.objective, ["fulfilled", "unknown", "unfulfilled"]),
          status: "accepted",
          occurredAt
        },
        {
          id: `${orderId}-subjective`,
          orderId,
          evidenceType: "subjective",
          aspect: "\u5C11\u6CB9\u611F\u53D7",
          result: resultAt(index, counts.subjective, ["suitable", "balanced", "rich"]),
          status: "accepted",
          occurredAt
        },
        {
          id: `${orderId}-behavioral`,
          orderId,
          evidenceType: "behavioral",
          aspect: "\u6B63\u5E38\u4EF7\u590D\u8D2D\u610F\u613F",
          result: resultAt(index, counts.behavioral, ["yes", "maybe", "no"]),
          status: "accepted",
          occurredAt
        }
      ];
    })
  };
}
var seedStores = [
  withHeroLedger(makeStore({ id: "store-beef-01", slug: "xiangkou-beef-rice", name: "\u5DF7\u53E3\u725B\u8089\u996D", category: "\u76D6\u996D", heroDish: "\u62DB\u724C\u73B0\u5207\u725B\u8089\u996D", heroImage: "/images/food/beef-rice.webp", distanceMeters: 680, deliveryMinutes: 31, averagePrice: 28, evidenceState: "growing", depth: "deep", trialPrice: 23.9, sampleCount: 8, verifiedLabel: "\u72EC\u7ACB\u5BC6\u5C01\u5206\u88C5" })),
  withDecisionLedger(
    makeStore({ id: "store-beef-02", slug: "laozao-beef-rice", name: "\u8001\u7076\u725B\u8089\u76D6\u996D", category: "\u76D6\u996D", heroDish: "\u9ED1\u6912\u725B\u8089\u76D6\u996D", heroImage: "/images/food/pepper-beef.webp", distanceMeters: 920, deliveryMinutes: 35, averagePrice: 29, evidenceState: "established", depth: "deep", trialPrice: 25, sampleCount: 34, verifiedLabel: "\u725B\u8089\u8DB3\u91CF" }),
    {
      objective: { positive: 31, neutral: 1, negative: 2 },
      subjective: { positive: 18, neutral: 5, negative: 11 },
      behavioral: { positive: 24, neutral: 4, negative: 6 }
    }
  ),
  withDecisionLedger(
    makeStore({ id: "store-chicken-01", slug: "hewei-chicken-soup", name: "\u79BE\u5473\u9E21\u6C64\u996D", category: "\u6C64\u996D", heroDish: "\u83CC\u83C7\u9E21\u6C64\u996D", heroImage: "/images/food/chicken-soup.webp", distanceMeters: 760, deliveryMinutes: 29, averagePrice: 26, evidenceState: "established", depth: "deep", trialPrice: 22.8, sampleCount: 19, verifiedLabel: "\u6C64\u996D\u5206\u88C5" }),
    {
      objective: { positive: 18, neutral: 0, negative: 1 },
      subjective: { positive: 17, neutral: 1, negative: 1 },
      behavioral: { positive: 14, neutral: 2, negative: 3 }
    }
  ),
  makeStore({ id: "store-noodle-01", slug: "shijiu-noodle", name: "\u62FE\u7396\u624B\u4F5C\u9762", category: "\u9762\u98DF", heroDish: "\u756A\u8304\u725B\u8169\u9762", heroImage: "/images/food/tomato-noodle.webp", distanceMeters: 540, deliveryMinutes: 27, averagePrice: 27, evidenceState: "growing", depth: "browse", trialPrice: 21.9, sampleCount: 6, verifiedLabel: "\u6C64\u9762\u5206\u88C5" }),
  makeStore({ id: "store-salad-01", slug: "qingye-salad", name: "\u9752\u91CE\u8F7B\u98DF", category: "\u8F7B\u98DF", heroDish: "\u9999\u714E\u9E21\u80F8\u8C37\u7269\u7897", heroImage: "/images/food/salad.webp", distanceMeters: 1100, deliveryMinutes: 32, averagePrice: 32, evidenceState: "established", depth: "browse", trialPrice: 26.9, sampleCount: 27, verifiedLabel: "\u9171\u6C41\u5206\u88C5" }),
  makeStore({ id: "store-hunan-01", slug: "xiangli-small-bowl", name: "\u6E58\u91CC\u5C0F\u7897\u83DC", category: "\u5730\u65B9\u83DC", heroDish: "\u5C0F\u7092\u9EC4\u725B\u8089", heroImage: "/images/food/hunan-beef.webp", distanceMeters: 1450, deliveryMinutes: 38, averagePrice: 31, evidenceState: "established", depth: "browse", trialPrice: 25.9, sampleCount: 42, verifiedLabel: "\u8FA3\u5EA6\u53EF\u9009" }),
  makeStore({ id: "store-dumpling-01", slug: "youjian-dumpling", name: "\u6709\u95F4\u624B\u5DE5\u997A\u5B50", category: "\u9762\u98DF", heroDish: "\u7389\u7C73\u9C9C\u8089\u6C34\u997A", heroImage: "/images/food/dumpling.webp", distanceMeters: 830, deliveryMinutes: 30, averagePrice: 24, evidenceState: "growing", depth: "browse", trialPrice: 19.9, sampleCount: 9, verifiedLabel: "\u8BA1\u6570\u8DB3\u91CF" }),
  makeStore({ id: "store-curry-01", slug: "nanlu-curry", name: "\u5357\u9E93\u5496\u55B1\u6240", category: "\u76D6\u996D", heroDish: "\u6162\u7096\u725B\u8169\u5496\u55B1\u996D", heroImage: "/images/food/curry.webp", distanceMeters: 1260, deliveryMinutes: 36, averagePrice: 30, evidenceState: "growing", depth: "browse", trialPrice: 24.9, sampleCount: 7, verifiedLabel: "\u5496\u55B1\u5206\u88C5" }),
  makeStore({ id: "store-congee-01", slug: "chaoshi-congee", name: "\u6F6E\u98DF\u7802\u9505\u7CA5", category: "\u7CA5\u54C1", heroDish: "\u9C9C\u867E\u7802\u9505\u7CA5", heroImage: "/images/food/congee.webp", distanceMeters: 1600, deliveryMinutes: 41, averagePrice: 35, evidenceState: "disputed", depth: "browse", trialPrice: 29.9, sampleCount: 15, verifiedLabel: "\u4FDD\u6E29\u5C01\u7B7E" }),
  makeStore({ id: "store-bakery-01", slug: "maixi-bakery", name: "\u9EA6\u5915\u70D8\u7119", category: "\u751C\u54C1", heroDish: "\u6D77\u76D0\u53EF\u9882\u5957\u9910", heroImage: "/images/food/croissant.webp", distanceMeters: 470, deliveryMinutes: 24, averagePrice: 22, evidenceState: "established", depth: "browse", trialPrice: 17.9, sampleCount: 31, verifiedLabel: "\u5F53\u65E5\u73B0\u70E4" }),
  makeStore({ id: "store-tea-01", slug: "shanye-tea", name: "\u5C71\u91CE\u539F\u53F6\u8336", category: "\u996E\u54C1", heroDish: "\u6800\u5B50\u8F7B\u4E73\u8336", heroImage: "/images/food/tea.webp", distanceMeters: 710, deliveryMinutes: 26, averagePrice: 18, evidenceState: "growing", depth: "browse", trialPrice: 13.9, sampleCount: 5, verifiedLabel: "\u7CD6\u5EA6\u53EF\u9009" }),
  makeStore({ id: "store-bbq-01", slug: "xiaohuo-bbq", name: "\u5C0F\u706B\u70AD\u70E4", category: "\u70E7\u70E4", heroDish: "\u70AD\u70E4\u9E21\u817F\u996D", heroImage: "/images/food/bbq-rice.webp", distanceMeters: 1320, deliveryMinutes: 39, averagePrice: 29, evidenceState: "established", depth: "browse", trialPrice: 23.9, sampleCount: 23, verifiedLabel: "\u751F\u719F\u5206\u88C5" })
];

// server/modules/sessions/session.service.ts
function toResponse(row) {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    resetAt: row.resetAt.toISOString()
  };
}
var SessionNotFoundError = class extends Error {
};
function createSessionService(db) {
  return {
    async create() {
      const now = /* @__PURE__ */ new Date();
      const row = { id: `demo_${randomUUID()}`, createdAt: now, resetAt: now };
      await db.insert(demoSessions).values(row);
      return toResponse(row);
    },
    async get(id) {
      const row = await db.query.demoSessions.findFirst({ where: eq(demoSessions.id, id) });
      if (!row) throw new SessionNotFoundError(id);
      return toResponse(row);
    },
    async reset(id) {
      const existing = await db.query.demoSessions.findFirst({ where: eq(demoSessions.id, id) });
      if (!existing) throw new SessionNotFoundError(id);
      const resetAt = /* @__PURE__ */ new Date();
      await db.transaction(async (transaction) => {
        const sessionOrders = await transaction.select({ id: orders.id }).from(orders).where(eq(orders.sessionId, id));
        if (sessionOrders.length) await transaction.delete(evidenceRecords).where(inArray(evidenceRecords.orderId, sessionOrders.map((order) => order.id)));
        await transaction.delete(orders).where(eq(orders.sessionId, id));
        for (const store of seedStores) {
          const existingStore = await transaction.query.stores.findFirst({
            where: eq(stores.id, store.id)
          });
          if (!existingStore) continue;
          const versionOnePlan = await transaction.query.trialPlans.findFirst({
            where: and(
              eq(trialPlans.storeId, store.id),
              eq(trialPlans.version, 1)
            )
          });
          const basePlanId = versionOnePlan?.id ?? store.trialPlan.id;
          if (!versionOnePlan) {
            await transaction.insert(trialPlans).values({
              ...store.trialPlan,
              storeId: store.id
            });
          }
          await transaction.delete(trialPlans).where(and(
            eq(trialPlans.storeId, store.id),
            ne(trialPlans.id, basePlanId)
          ));
          await transaction.update(trialPlans).set({
            menuItemId: store.trialPlan.menuItemId,
            title: store.trialPlan.title,
            benefitLabel: store.trialPlan.benefitLabel,
            dailyQuota: store.trialPlan.dailyQuota,
            remainingQuota: store.trialPlan.remainingQuota,
            trialPrice: store.trialPlan.trialPrice,
            version: store.trialPlan.version,
            status: store.trialPlan.status,
            publishedAt: store.trialPlan.publishedAt
          }).where(eq(trialPlans.id, basePlanId));
          if (store.trialPlanClaims.length) {
            for (const claim of store.trialPlanClaims) {
              await transaction.insert(trialPlanClaims).values({
                ...claim,
                planId: basePlanId
              }).onConflictDoUpdate({
                target: trialPlanClaims.id,
                set: {
                  planId: basePlanId,
                  kind: claim.kind,
                  content: claim.content,
                  sourceText: claim.sourceText,
                  decision: claim.decision,
                  sortOrder: claim.sortOrder
                }
              });
            }
          }
          for (const evidence of store.evidence) {
            await transaction.update(evidenceAggregates).set({
              positiveCount: evidence.positiveCount,
              neutralCount: evidence.neutralCount,
              negativeCount: evidence.negativeCount,
              disputedCount: evidence.disputedCount,
              updatedAt: /* @__PURE__ */ new Date("2026-07-22T12:40:00+08:00")
            }).where(eq(evidenceAggregates.id, evidence.id));
          }
        }
        await transaction.update(demoSessions).set({ resetAt }).where(eq(demoSessions.id, id));
      });
      return { id, reset: true, resetAt: resetAt.toISOString() };
    }
  };
}

// server/modules/sessions/session.routes.ts
function createSessionRoutes(service) {
  return new Hono().post("/", async (context) => context.json(await service.create(), 201)).get("/:id", async (context) => context.json(await service.get(sessionIdSchema.parse(context.req.param("id"))))).post("/:id/reset", async (context) => context.json(await service.reset(sessionIdSchema.parse(context.req.param("id"))))).onError((error, context) => {
    if (error instanceof ZodError) return context.json({ code: "INVALID_SESSION_ID" }, 400);
    if (error instanceof SessionNotFoundError) return context.json({ code: "SESSION_NOT_FOUND" }, 404);
    throw error;
  });
}

// server/modules/orders/order.routes.ts
import { Hono as Hono2 } from "hono";
import { ZodError as ZodError2 } from "zod";

// server/modules/orders/order.schema.ts
import { z as z2 } from "zod";
var createOrderSchema = z2.object({
  storeId: z2.string().min(1),
  items: z2.array(z2.object({
    menuItemId: z2.string().min(1),
    quantity: z2.number().int().min(1).max(10)
  })).min(1)
});

// server/modules/orders/order.service.ts
import { randomUUID as randomUUID2 } from "node:crypto";
import { and as and2, asc, eq as eq2, gt, inArray as inArray2, ne as ne2, sql } from "drizzle-orm";
var OrderUnauthorizedError = class extends Error {
};
var OrderInvalidError = class extends Error {
};
var OrderNotFoundError = class extends Error {
};
var OrderTransitionError = class extends Error {
};
var nextStatus = {
  created: "preparing",
  preparing: "delivering",
  delivering: "delivered",
  delivered: "pending_verification"
};
function createOrderService(db) {
  async function requireSession2(sessionId) {
    if (!sessionId) throw new OrderUnauthorizedError("Missing demo session");
    const session = await db.query.demoSessions.findFirst({ where: eq2(demoSessions.id, sessionId) });
    if (!session) throw new OrderUnauthorizedError("Unknown demo session");
    return sessionId;
  }
  async function detailForSession(sessionId, orderId) {
    const order = await db.query.orders.findFirst({ where: and2(eq2(orders.id, orderId), eq2(orders.sessionId, sessionId)) });
    if (!order) throw new OrderNotFoundError(orderId);
    const [store, items, promises, verification] = await Promise.all([
      db.query.stores.findFirst({ where: eq2(stores.id, order.storeId) }),
      db.select().from(orderItems).where(eq2(orderItems.orderId, order.id)),
      db.select().from(orderPromiseSnapshots).where(eq2(orderPromiseSnapshots.orderId, order.id)),
      db.query.verifications.findFirst({ where: eq2(verifications.orderId, order.id) })
    ]);
    const submittedItems = verification ? await db.select().from(verificationItems).where(eq2(verificationItems.verificationId, verification.id)) : [];
    return {
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      store: store ? { id: store.id, name: store.name, heroDish: store.heroDish } : void 0,
      items: items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.nameSnapshot,
        unitPrice: item.unitPriceSnapshot,
        quantity: item.quantity
      })),
      promises: promises.map((promise) => ({
        id: promise.id,
        planId: promise.planId,
        claimId: promise.claimId,
        kind: promise.kind,
        aspect: promise.aspect,
        version: promise.version,
        merchantConfirmedAt: promise.merchantConfirmedAt.toISOString()
      })),
      verification: verification ? {
        id: verification.id,
        objectiveResult: verification.objectiveResult,
        tasteResult: verification.tasteResult,
        repurchaseIntent: verification.repurchaseIntent,
        note: verification.note,
        imagePath: verification.imagePath,
        createdAt: verification.createdAt.toISOString(),
        items: submittedItems.map((item) => ({
          promiseSnapshotId: item.promiseSnapshotId,
          result: item.result
        }))
      } : null
    };
  }
  return {
    async create(sessionId, input) {
      const validSessionId = await requireSession2(sessionId);
      const requestedIds = [...new Set(input.items.map((item) => item.menuItemId))];
      const selectedMenu = await db.select().from(menuItems).where(inArray2(menuItems.id, requestedIds));
      if (selectedMenu.length !== requestedIds.length || selectedMenu.some((item) => item.storeId !== input.storeId)) {
        throw new OrderInvalidError("Menu items must belong to the selected store");
      }
      const includesTrialItem = selectedMenu.some((item) => item.isTrial);
      const [activePlan] = includesTrialItem ? await db.select().from(trialPlans).where(and2(
        eq2(trialPlans.storeId, input.storeId),
        eq2(trialPlans.status, "published")
      )).limit(1) : [];
      if (includesTrialItem && (!activePlan || activePlan.remainingQuota < 1)) {
        throw new OrderInvalidError("Trial quota unavailable");
      }
      const activeClaims = activePlan ? await db.select().from(trialPlanClaims).where(and2(
        eq2(trialPlanClaims.planId, activePlan.id),
        ne2(trialPlanClaims.decision, "rejected"),
        ne2(trialPlanClaims.kind, "unverifiable")
      )).orderBy(asc(trialPlanClaims.sortOrder)) : [];
      const quantityById = new Map(input.items.map((item) => [item.menuItemId, item.quantity]));
      const unitPriceFor = (item) => item.isTrial && activePlan ? activePlan.trialPrice : item.price;
      const totalAmount = selectedMenu.reduce(
        (sum, item) => sum + unitPriceFor(item) * (quantityById.get(item.id) ?? 0),
        0
      );
      const orderId = `order_${randomUUID2()}`;
      const now = /* @__PURE__ */ new Date();
      for (let attempt = 0; ; attempt += 1) {
        try {
          await db.transaction(async (transaction) => {
            await transaction.insert(orders).values({
              id: orderId,
              sessionId: validSessionId,
              storeId: input.storeId,
              status: "created",
              totalAmount,
              sandbox: true,
              createdAt: now,
              updatedAt: now
            });
            await transaction.insert(orderItems).values(selectedMenu.map((item) => ({
              id: `item_${randomUUID2()}`,
              orderId,
              menuItemId: item.id,
              nameSnapshot: item.name,
              unitPriceSnapshot: unitPriceFor(item),
              quantity: quantityById.get(item.id) ?? 1
            })));
            if (activePlan && activeClaims.length) {
              await transaction.insert(orderPromiseSnapshots).values(activeClaims.map((claim) => ({
                id: `promise_${randomUUID2()}`,
                orderId,
                planId: activePlan.id,
                claimId: claim.id,
                kind: claim.kind,
                aspect: claim.content,
                version: activePlan.version,
                merchantConfirmedAt: activePlan.publishedAt ?? now
              })));
            }
            if (activePlan) {
              const quotaUpdate = await transaction.update(trialPlans).set({ remainingQuota: sql`${trialPlans.remainingQuota} - 1` }).where(and2(eq2(trialPlans.id, activePlan.id), gt(trialPlans.remainingQuota, 0)));
              if (quotaUpdate.rowsAffected !== 1) {
                throw new OrderInvalidError("Trial quota unavailable");
              }
            }
          });
          break;
        } catch (error) {
          const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
          if (code !== "SQLITE_BUSY" || attempt >= 2) throw error;
          await new Promise((resolve) => setTimeout(resolve, 15 * (attempt + 1)));
        }
      }
      return detailForSession(validSessionId, orderId);
    },
    async list(sessionId) {
      const validSessionId = await requireSession2(sessionId);
      const rows = await db.select().from(orders).where(eq2(orders.sessionId, validSessionId));
      return { items: await Promise.all(rows.map((row) => detailForSession(validSessionId, row.id))) };
    },
    async detail(sessionId, orderId) {
      const validSessionId = await requireSession2(sessionId);
      return detailForSession(validSessionId, orderId);
    },
    async advance(sessionId, orderId) {
      const validSessionId = await requireSession2(sessionId);
      const order = await db.query.orders.findFirst({ where: and2(eq2(orders.id, orderId), eq2(orders.sessionId, validSessionId)) });
      if (!order) throw new OrderNotFoundError(orderId);
      const status = nextStatus[order.status];
      if (!status) throw new OrderTransitionError(order.status);
      await db.update(orders).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(orders.id, order.id));
      return detailForSession(validSessionId, order.id);
    }
  };
}

// server/modules/orders/order.routes.ts
function createOrderRoutes(service) {
  const sessionId = (context) => context.req.header("x-demo-session");
  return new Hono2().post("/", async (context) => context.json(await service.create(sessionId(context), createOrderSchema.parse(await context.req.json())), 201)).get("/", async (context) => context.json(await service.list(sessionId(context)))).get("/:id", async (context) => context.json(await service.detail(sessionId(context), context.req.param("id")))).post("/:id/advance", async (context) => context.json(await service.advance(sessionId(context), context.req.param("id")))).onError((error, context) => {
    if (error instanceof ZodError2 || error instanceof OrderInvalidError) return context.json({ code: "INVALID_ORDER", message: error.message }, 400);
    if (error instanceof OrderUnauthorizedError) return context.json({ code: "DEMO_SESSION_REQUIRED" }, 401);
    if (error instanceof OrderNotFoundError) return context.json({ code: "ORDER_NOT_FOUND" }, 404);
    if (error instanceof OrderTransitionError) return context.json({ code: "ORDER_CANNOT_ADVANCE" }, 409);
    throw error;
  });
}

// server/modules/stores/store.routes.ts
import { Hono as Hono3 } from "hono";
import { ZodError as ZodError3 } from "zod";

// server/modules/stores/store.schema.ts
import { z as z3 } from "zod";
var storeQuerySchema = z3.object({
  q: z3.string().trim().max(50).optional(),
  mealPeriod: z3.enum(["breakfast", "lunch", "dinner", "lateNight"]).optional(),
  category: z3.string().trim().max(30).optional(),
  maxPrice: z3.coerce.number().positive().max(500).optional(),
  maxDistance: z3.coerce.number().int().positive().max(2e4).optional(),
  evidenceState: z3.enum(["growing", "established", "disputed"]).optional(),
  sort: z3.enum(["recommended", "distance", "price", "evidence"]).default("recommended")
});

// server/modules/stores/store.service.ts
import { and as and3, asc as asc2, eq as eq3 } from "drizzle-orm";

// server/modules/evidence/summary.ts
var total = (row) => row.positiveCount + row.neutralCount + row.negativeCount;
function buildEvidenceSummary(aggregates, records) {
  const objective = aggregates.find((row) => row.evidenceType === "objective");
  const subjective = aggregates.find((row) => row.evidenceType === "subjective");
  const behavioral = aggregates.find((row) => row.evidenceType === "behavioral");
  if (!objective || !subjective || !behavioral) throw new Error("Evidence aggregates are incomplete");
  const metric = (row) => ({
    aspect: row.aspect,
    positive: row.positiveCount,
    total: total(row),
    disputed: row.disputedCount
  });
  const validOrders = total(objective);
  return {
    validOrders,
    objective: metric(objective),
    oilFit: metric(subjective),
    repurchase: metric(behavioral),
    growth: { current: validOrders, threshold: 10 },
    records: records.map((record) => ({
      id: record.id,
      evidenceType: record.evidenceType,
      aspect: record.aspect,
      result: record.result,
      status: record.status,
      occurredAt: record.occurredAt.toISOString()
    }))
  };
}

// server/modules/stores/store-decision-profile.ts
var profiles = {
  "store-beef-01": {
    verdict: "\u9700\u6C42\u6700\u5339\u914D\uFF0C\u4F46\u8BC1\u636E\u4ECD\u5728\u6210\u957F",
    fitFor: "\u9700\u8981\u72EC\u7ACB\u5BC6\u5C01\u5206\u88C5\u3001\u504F\u597D\u6E05\u6DE1\u53E3\u5473\u7684\u4EBA",
    fitReason: "\u72EC\u7ACB\u5BC6\u5C01\u5206\u88C5 8/8\uFF0C\u5C11\u6CB9\u611F\u53D7 7/8 \u7B26\u5408\u3002",
    notFor: "\u53EA\u63A5\u53D7\u5927\u91CF\u6210\u719F\u6837\u672C\u3001\u5B8C\u5168\u4E0D\u63A5\u53D7\u53E3\u5473\u6CE2\u52A8\u7684\u4EBA",
    riskReason: "\u5F53\u524D\u53EA\u6709 8 \u7B14\u6709\u6548\u8BA2\u5355\uFF0C\u4E14\u6709 1 \u7B14\u53CD\u9988\u504F\u6CB9\u3002"
  },
  "store-beef-02": {
    verdict: "\u9A8C\u8BC1\u66F4\u5145\u5206\uFF0C\u4F46\u53E3\u5473\u660E\u663E\u504F\u6D53",
    fitFor: "\u66F4\u770B\u91CD\u725B\u8089\u5206\u91CF\u3001\u5E0C\u671B\u53C2\u8003\u66F4\u591A\u5386\u53F2\u9A8C\u8BC1\u7684\u4EBA",
    fitReason: "\u5DF2\u6709 34 \u7B14\u6709\u6548\u8BA2\u5355\uFF0C\u725B\u8089\u8DB3\u91CF 31/34\u3002",
    notFor: "\u504F\u597D\u6E05\u6DE1\u53E3\u5473\u3001\u4ECB\u610F\u9ED1\u6912\u98CE\u5473\u504F\u6D53\u7684\u4EBA",
    riskReason: "34 \u7B14\u9A8C\u8BC1\u4E2D\u6709 11 \u7B14\u8BA4\u4E3A\u504F\u6CB9\uFF0C\u548C\u6E05\u6DE1\u8BC9\u6C42\u5B58\u5728\u51B2\u7A81\u3002"
  },
  "store-chicken-01": {
    verdict: "\u9884\u7B97\u4E0E\u5305\u88C5\u66F4\u7A33\u59A5\uFF0C\u4F46\u5C5E\u4E8E\u76F8\u90BB\u54C1\u7C7B",
    fitFor: "\u9884\u7B97\u66F4\u4F4E\u3001\u504F\u597D\u6E05\u6DE1\u6C64\u996D\u4E0E\u7A33\u5B9A\u5206\u88C5\u7684\u4EBA",
    fitReason: "\u8BD5\u65B0\u4EF7\u66F4\u4F4E\uFF0C\u6C64\u996D\u5206\u88C5 18/19\uFF0C\u6E05\u6DE1\u611F\u53D7 17/19\u3002",
    notFor: "\u53EA\u60F3\u5403\u725B\u8089\u996D\u3001\u4E0D\u63A5\u53D7\u76F8\u90BB\u54C1\u7C7B\u66FF\u4EE3\u7684\u4EBA",
    riskReason: "\u5B83\u6EE1\u8DB3\u6E05\u6DE1\u548C\u5206\u88C5\u8981\u6C42\uFF0C\u4F46\u4E3B\u83DC\u662F\u9E21\u6C64\u996D\u800C\u4E0D\u662F\u725B\u8089\u996D\u3002"
  }
};
var fallback = {
  verdict: "\u8BC1\u636E\u4E0E\u98CE\u9669\u540C\u65F6\u5C55\u793A",
  fitFor: "\u613F\u610F\u6839\u636E\u5177\u4F53\u5C65\u7EA6\u8BC1\u636E\u5C1D\u8BD5\u65B0\u5E97\u7684\u4EBA",
  fitReason: "\u7CFB\u7EDF\u6839\u636E\u5B8C\u6210\u8BA2\u5355\u9A8C\u8BC1\u5C55\u793A\u8BE5\u5E97\u7684\u53EF\u89C1\u4F18\u52BF\u3002",
  notFor: "\u53EA\u4F9D\u8D56\u6210\u719F\u8BC4\u5206\u3001\u5B8C\u5168\u4E0D\u63A5\u53D7\u6837\u672C\u6CE2\u52A8\u7684\u4EBA",
  riskReason: "\u8BD5\u65B0\u5E97\u8BC1\u636E\u4ECD\u5728\u79EF\u7D2F\uFF0C\u7ED3\u8BBA\u53EF\u80FD\u968F\u65B0\u8BA2\u5355\u53D8\u5316\u3002"
};
function getStoreDecisionProfile(storeId) {
  return profiles[storeId] ?? fallback;
}

// server/modules/stores/store.service.ts
var StoreNotFoundError = class extends Error {
};
var mealCategories = {
  breakfast: ["\u9762\u98DF", "\u7CA5\u54C1", "\u751C\u54C1", "\u996E\u54C1"],
  lunch: ["\u76D6\u996D", "\u6C64\u996D", "\u9762\u98DF", "\u8F7B\u98DF", "\u5730\u65B9\u83DC"],
  dinner: ["\u76D6\u996D", "\u6C64\u996D", "\u9762\u98DF", "\u5730\u65B9\u83DC", "\u70E7\u70E4"],
  lateNight: ["\u9762\u98DF", "\u7CA5\u54C1", "\u5730\u65B9\u83DC", "\u70E7\u70E4"]
};
function createStoreService(db) {
  return {
    async list(query) {
      const allStores = await db.select().from(stores).orderBy(asc2(stores.distanceMeters));
      const allMenuItems = await db.select().from(menuItems);
      const allEvidence = await db.select().from(evidenceAggregates);
      const categories = [...new Set(allStores.map((store) => store.category))];
      const term = query.q?.toLocaleLowerCase("zh-CN");
      let items = allStores.map((store) => ({
        ...store,
        fromPrice: Math.min(...allMenuItems.filter((item) => item.storeId === store.id).map((item) => item.price))
      })).filter((store) => {
        if (term && !`${store.name} ${store.heroDish} ${store.category}`.toLocaleLowerCase("zh-CN").includes(term)) return false;
        if (query.mealPeriod && !mealCategories[query.mealPeriod].includes(store.category)) return false;
        if (query.category && store.category !== query.category) return false;
        if (query.maxPrice && store.fromPrice > query.maxPrice) return false;
        if (query.maxDistance && store.distanceMeters > query.maxDistance) return false;
        if (query.evidenceState && store.evidenceState !== query.evidenceState) return false;
        return true;
      });
      if (query.sort === "price") items = items.sort((a, b) => a.averagePrice - b.averagePrice);
      if (query.sort === "distance") items = items.sort((a, b) => a.distanceMeters - b.distanceMeters);
      if (query.sort === "evidence") items = items.sort((a, b) => {
        const count = (storeId) => allEvidence.filter((evidence) => evidence.storeId === storeId).reduce((sum, evidence) => sum + evidence.positiveCount + evidence.neutralCount + evidence.negativeCount, 0);
        return count(b.id) - count(a.id);
      });
      return { items, facets: { categories }, total: items.length, dataNotice: "\u5E97\u94FA\u4E0E\u4E1A\u52A1\u6307\u6807\u4E3A\u533F\u540D\u6C99\u76D2\u6570\u636E" };
    },
    async detail(id) {
      const store = await db.query.stores.findFirst({ where: eq3(stores.id, id) });
      if (!store) throw new StoreNotFoundError(id);
      const [menu, plan, evidence, records] = await Promise.all([
        db.select().from(menuItems).where(eq3(menuItems.storeId, id)),
        db.query.trialPlans.findFirst({
          where: and3(eq3(trialPlans.storeId, id), eq3(trialPlans.status, "published"))
        }),
        db.select().from(evidenceAggregates).where(eq3(evidenceAggregates.storeId, id)),
        db.select().from(evidenceRecords).where(eq3(evidenceRecords.storeId, id))
      ]);
      const claims = plan ? await db.select().from(trialPlanClaims).where(eq3(trialPlanClaims.planId, plan.id)).orderBy(asc2(trialPlanClaims.sortOrder)) : [];
      const fromPrice = Math.min(...menu.map((item) => item.price));
      return {
        ...store,
        fromPrice,
        menu,
        trialPlan: plan,
        currentPlan: plan ? { ...plan, claims } : null,
        evidence,
        evidenceSummary: buildEvidenceSummary(evidence, records),
        decisionProfile: getStoreDecisionProfile(id),
        specifications: id === "store-beef-01" ? [{ label: "\u725B\u8089\u89C4\u683C", value: "\u5546\u5BB6\u6807\u79F0 80g", source: "merchant" }] : [],
        dataNotice: "\u516C\u5F00\u8BC1\u636E\u4E0E\u6C99\u76D2\u4E1A\u52A1\u6570\u636E\u5206\u5C42\u5C55\u793A"
      };
    }
  };
}

// server/modules/stores/store.routes.ts
function createStoreRoutes(service) {
  return new Hono3().get("/", async (context) => context.json(await service.list(storeQuerySchema.parse(context.req.query())))).get("/:id", async (context) => context.json(await service.detail(context.req.param("id")))).onError((error, context) => {
    if (error instanceof ZodError3) return context.json({ code: "INVALID_STORE_QUERY", issues: error.issues }, 400);
    if (error instanceof StoreNotFoundError) return context.json({ code: "STORE_NOT_FOUND" }, 404);
    throw error;
  });
}

// server/modules/verifications/verification.routes.ts
import { Hono as Hono4 } from "hono";
import { ZodError as ZodError4 } from "zod";

// server/modules/verifications/verification.schema.ts
import { z as z4 } from "zod";
var submitVerificationSchema = z4.object({
  objectiveResults: z4.array(z4.object({
    promiseSnapshotId: z4.string().min(1),
    result: z4.enum(["fulfilled", "unfulfilled", "unknown"])
  })).min(1),
  tasteResult: z4.enum(["light", "balanced", "rich"]),
  repurchaseIntent: z4.enum(["yes", "maybe", "no"]),
  note: z4.string().trim().max(300).optional(),
  imagePath: z4.string().trim().max(500).nullable().optional()
}).superRefine((value, context) => {
  if (value.objectiveResults.some((item) => item.result === "unfulfilled") && !value.note && !value.imagePath) {
    context.addIssue({ code: "custom", path: ["note"], message: "\u672A\u5151\u73B0\u53CD\u9988\u9700\u8981\u8BF4\u660E\u6216\u56FE\u7247\u51ED\u8BC1" });
  }
});

// server/modules/verifications/verification.service.ts
import { randomUUID as randomUUID3 } from "node:crypto";
import { and as and4, eq as eq4 } from "drizzle-orm";
var VerificationUnauthorizedError = class extends Error {
};
var VerificationNotFoundError = class extends Error {
};
var VerificationConflictError = class extends Error {
};
function increment(row, bucket) {
  return {
    positiveCount: row.positiveCount + (bucket === "positive" ? 1 : 0),
    neutralCount: row.neutralCount + (bucket === "neutral" ? 1 : 0),
    negativeCount: row.negativeCount + (bucket === "negative" ? 1 : 0),
    disputedCount: row.disputedCount + (bucket === "disputed" ? 1 : 0),
    updatedAt: /* @__PURE__ */ new Date()
  };
}
function createVerificationService(db) {
  return {
    async submit(sessionId, orderId, input) {
      if (!sessionId) throw new VerificationUnauthorizedError("Missing demo session");
      const session = await db.query.demoSessions.findFirst({ where: eq4(demoSessions.id, sessionId) });
      if (!session) throw new VerificationUnauthorizedError("Unknown demo session");
      const order = await db.query.orders.findFirst({ where: and4(eq4(orders.id, orderId), eq4(orders.sessionId, sessionId)) });
      if (!order) throw new VerificationNotFoundError(orderId);
      if (order.status !== "pending_verification") throw new VerificationConflictError("Order is not ready for verification");
      if (await db.query.verifications.findFirst({ where: eq4(verifications.orderId, orderId) })) {
        throw new VerificationConflictError("Order already verified");
      }
      const submittedIds = [...new Set(input.objectiveResults.map((item) => item.promiseSnapshotId))];
      if (submittedIds.length !== input.objectiveResults.length) {
        throw new VerificationConflictError("Duplicate promise result");
      }
      const snapshots = await db.select().from(orderPromiseSnapshots).where(eq4(orderPromiseSnapshots.orderId, orderId));
      const objectiveSnapshots = snapshots.filter((snapshot) => snapshot.kind === "objective");
      if (objectiveSnapshots.length !== submittedIds.length || objectiveSnapshots.some((snapshot) => !submittedIds.includes(snapshot.id))) {
        throw new VerificationConflictError("Every objective promise must be verified exactly once");
      }
      const aggregates = await db.select().from(evidenceAggregates).where(eq4(evidenceAggregates.storeId, order.storeId));
      const byType = new Map(aggregates.map((row) => [row.evidenceType, row]));
      const objective = byType.get("objective");
      const subjective = byType.get("subjective");
      const behavioral = byType.get("behavioral");
      if (!objective || !subjective || !behavioral) throw new VerificationConflictError("Evidence aggregates are incomplete");
      const beforeRecords = await db.select().from(evidenceRecords).where(eq4(evidenceRecords.storeId, order.storeId));
      const before = buildEvidenceSummary(aggregates, beforeRecords);
      const verificationId = `verification_${randomUUID3()}`;
      const now = /* @__PURE__ */ new Date();
      const hasUnfulfilled = input.objectiveResults.some((item) => item.result === "unfulfilled");
      const allUnknown = input.objectiveResults.every((item) => item.result === "unknown");
      const objectiveResult = hasUnfulfilled ? "unfulfilled" : allUnknown ? "unknown" : "fulfilled";
      await db.transaction(async (transaction) => {
        await transaction.insert(verifications).values({
          id: verificationId,
          orderId,
          objectiveResult,
          tasteResult: input.tasteResult,
          repurchaseIntent: input.repurchaseIntent,
          note: input.note,
          imagePath: input.imagePath,
          createdAt: now
        });
        await transaction.insert(verificationItems).values(input.objectiveResults.map((item) => ({
          id: `verification_item_${randomUUID3()}`,
          verificationId,
          promiseSnapshotId: item.promiseSnapshotId,
          result: item.result
        })));
        const subjectiveBucket = input.tasteResult === "light" ? "positive" : input.tasteResult === "balanced" ? "neutral" : "negative";
        const behavioralBucket = input.repurchaseIntent === "yes" ? "positive" : input.repurchaseIntent === "maybe" ? "neutral" : "negative";
        await transaction.update(evidenceAggregates).set(increment(subjective, subjectiveBucket)).where(eq4(evidenceAggregates.id, subjective.id));
        await transaction.update(evidenceAggregates).set(increment(behavioral, behavioralBucket)).where(eq4(evidenceAggregates.id, behavioral.id));
        await transaction.insert(evidenceRecords).values([
          { id: `evidence_${randomUUID3()}`, storeId: order.storeId, orderId, evidenceType: "subjective", aspect: subjective.aspect, result: input.tasteResult, status: "accepted", occurredAt: now, sandbox: true },
          { id: `evidence_${randomUUID3()}`, storeId: order.storeId, orderId, evidenceType: "behavioral", aspect: behavioral.aspect, result: input.repurchaseIntent, status: "accepted", occurredAt: now, sandbox: true }
        ]);
        if (objectiveResult === "fulfilled") {
          await transaction.update(evidenceAggregates).set(increment(objective, "positive")).where(eq4(evidenceAggregates.id, objective.id));
          await transaction.insert(evidenceRecords).values(input.objectiveResults.filter((item) => item.result === "fulfilled").map((item) => {
            const snapshot = snapshots.find((candidate2) => candidate2.id === item.promiseSnapshotId);
            return { id: `evidence_${randomUUID3()}`, storeId: order.storeId, orderId, evidenceType: "objective", aspect: snapshot.aspect, result: "fulfilled", status: "accepted", occurredAt: now, sandbox: true };
          }));
          await transaction.update(orders).set({ status: "completed", updatedAt: now }).where(eq4(orders.id, orderId));
        } else if (objectiveResult === "unfulfilled") {
          await transaction.update(evidenceAggregates).set(increment(objective, "disputed")).where(eq4(evidenceAggregates.id, objective.id));
          await transaction.insert(evidenceRecords).values(input.objectiveResults.filter((item) => item.result === "unfulfilled").map((item) => {
            const snapshot = snapshots.find((candidate2) => candidate2.id === item.promiseSnapshotId);
            return { id: `evidence_${randomUUID3()}`, storeId: order.storeId, orderId, evidenceType: "objective", aspect: snapshot.aspect, result: "unfulfilled", status: "pending", occurredAt: now, sandbox: true };
          }));
          await transaction.insert(disputes).values({
            id: `dispute_${randomUUID3()}`,
            verificationId,
            orderId,
            status: "pending",
            reason: input.note || "\u7528\u6237\u63D0\u4EA4\u4E86\u56FE\u7247\u51ED\u8BC1",
            createdAt: now
          });
          await transaction.update(orders).set({ status: "disputed", updatedAt: now }).where(eq4(orders.id, orderId));
        } else {
          await transaction.update(orders).set({ status: "completed", updatedAt: now }).where(eq4(orders.id, orderId));
        }
      });
      const updated = await db.select().from(evidenceAggregates).where(eq4(evidenceAggregates.storeId, order.storeId));
      const updatedRecords = await db.select().from(evidenceRecords).where(eq4(evidenceRecords.storeId, order.storeId));
      return {
        id: verificationId,
        orderId,
        storeId: order.storeId,
        before,
        after: buildEvidenceSummary(updated, updatedRecords),
        disputeCreated: objectiveResult === "unfulfilled"
      };
    }
  };
}

// server/modules/verifications/verification.routes.ts
function createVerificationRoutes(service) {
  return new Hono4().post("/:id/verification", async (context) => context.json(await service.submit(
    context.req.header("x-demo-session"),
    context.req.param("id"),
    submitVerificationSchema.parse(await context.req.json())
  ), 201)).onError((error, context) => {
    if (error instanceof ZodError4) return context.json({ code: "INVALID_VERIFICATION", issues: error.issues }, 400);
    if (error instanceof VerificationUnauthorizedError) return context.json({ code: "DEMO_SESSION_REQUIRED" }, 401);
    if (error instanceof VerificationNotFoundError) return context.json({ code: "ORDER_NOT_FOUND" }, 404);
    if (error instanceof VerificationConflictError) return context.json({ code: "VERIFICATION_CONFLICT", message: error.message }, 409);
    throw error;
  });
}

// server/modules/merchant/merchant.routes.ts
import { Hono as Hono5 } from "hono";

// server/modules/merchant/merchant.service.ts
import { and as and5, eq as eq5, inArray as inArray3 } from "drizzle-orm";
var MerchantUnauthorizedError = class extends Error {
};
var MerchantStoreNotFoundError = class extends Error {
};
function createMerchantService(db) {
  return { async overview(sessionId, storeId) {
    if (!sessionId || !await db.query.demoSessions.findFirst({ where: eq5(demoSessions.id, sessionId) })) throw new MerchantUnauthorizedError();
    const store = await db.query.stores.findFirst({ where: eq5(stores.id, storeId) });
    if (!store) throw new MerchantStoreNotFoundError();
    const storeOrders = await db.select().from(orders).where(and5(eq5(orders.sessionId, sessionId), eq5(orders.storeId, storeId)));
    const orderIds = storeOrders.map((order) => order.id);
    const pendingDisputes = orderIds.length ? (await db.select().from(disputes).where(inArray3(disputes.orderId, orderIds))).filter((item) => item.status === "pending").length : 0;
    const evidence = await db.select().from(evidenceAggregates).where(eq5(evidenceAggregates.storeId, storeId));
    const records = await db.select().from(evidenceRecords).where(eq5(evidenceRecords.storeId, storeId));
    const summary = buildEvidenceSummary(evidence, records);
    const objectiveRow = evidence.find((item) => item.evidenceType === "objective");
    const activePlan = await db.query.trialPlans.findFirst({ where: and5(eq5(trialPlans.storeId, storeId), eq5(trialPlans.status, "published")) });
    const lastSyncedAt = evidence.reduce((latest, row) => row.updatedAt > latest ? row.updatedAt : latest, /* @__PURE__ */ new Date(0)).toISOString();
    const objective = objectiveRow ? { aspect: objectiveRow.aspect, total: objectiveRow.positiveCount + objectiveRow.neutralCount + objectiveRow.negativeCount, positiveCount: objectiveRow.positiveCount, neutralCount: objectiveRow.neutralCount, negativeCount: objectiveRow.negativeCount, disputedCount: objectiveRow.disputedCount } : void 0;
    return { store: { id: store.id, name: store.name, heroDish: store.heroDish }, todayOrders: storeOrders.length, pendingVerification: storeOrders.filter((item) => item.status === "pending_verification").length, pendingDisputes, objective, evidence, evidenceSummary: summary, metrics: { sealedPackaging: { positive: summary.objective.positive, total: summary.objective.total }, oilFit: { positive: summary.oilFit.positive, total: summary.oilFit.total }, repurchase: { positive: summary.repurchase.positive, total: summary.repurchase.total } }, growth: { ...summary.growth, remaining: Math.max(0, summary.growth.threshold - summary.growth.current) }, activePlan: activePlan ? { id: activePlan.id, version: activePlan.version, status: activePlan.status } : null, lastSyncedAt, recentOrders: storeOrders.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })), advice: `${summary.objective.aspect}\u5DF2\u83B7\u5F97 ${summary.objective.positive}/${summary.objective.total} \u4EFD\u5151\u73B0\u9A8C\u8BC1\uFF0C\u662F\u5F53\u524D\u6700\u7A33\u5B9A\u7684\u53EF\u8BC1\u660E\u4F18\u52BF\uFF1B\u5EFA\u8BAE\u4FDD\u6301\u4E3A\u4E3B\u627F\u8BFA\u3002`, sandbox: true };
  } };
}

// server/modules/merchant/merchant.routes.ts
function createMerchantRoutes(service) {
  return new Hono5().get("/stores/:storeId/overview", async (context) => context.json(await service.overview(context.req.header("x-demo-session"), context.req.param("storeId")))).onError((error, context) => {
    if (error instanceof MerchantUnauthorizedError) return context.json({ code: "DEMO_SESSION_REQUIRED" }, 401);
    if (error instanceof MerchantStoreNotFoundError) return context.json({ code: "STORE_NOT_FOUND" }, 404);
    throw error;
  });
}

// server/modules/ai/demand.routes.ts
import { Hono as Hono6 } from "hono";
import { ZodError as ZodError5 } from "zod";

// server/modules/ai/demand.schema.ts
import { z as z5 } from "zod";
var demandRequestSchema = z5.object({
  text: z5.string().trim().min(2).max(300)
});
var fulfillmentNeedSchema = z5.object({
  raw: z5.string().min(1),
  normalized: z5.string().min(1),
  responsibleParty: z5.enum(["merchant", "delivery", "unknown"])
});
var parsedDemandSchema = z5.object({
  budgetMax: z5.number().positive().nullable(),
  category: z5.string().nullable(),
  taste: z5.array(z5.string()).max(4),
  fulfillmentNeeds: z5.array(fulfillmentNeedSchema).max(6),
  source: z5.enum(["model", "fallback"])
});

// server/modules/ai/demand.routes.ts
function createDemandRoutes(service) {
  return new Hono6().post("/parse-demand", async (context) => {
    const input = demandRequestSchema.parse(await context.req.json());
    return context.json(await service.parse(input.text));
  }).onError((error, context) => {
    if (error instanceof ZodError5) {
      return context.json({ code: "INVALID_DEMAND", issues: error.issues }, 400);
    }
    throw error;
  });
}

// server/modules/ai/demand.service.ts
function parseFallback(text2) {
  const budget = text2.match(/(\d+(?:\.\d+)?)\s*元/);
  const category = ["\u725B\u8089\u996D", "\u9E21\u6C64\u996D", "\u76D6\u996D", "\u8F7B\u98DF", "\u9762"].find((item) => text2.includes(item)) ?? null;
  const taste = [
    .../少油|清淡/.test(text2) ? ["\u504F\u6E05\u6DE1"] : [],
    .../重口|浓郁/.test(text2) ? ["\u504F\u6D53\u90C1"] : []
  ];
  const fulfillmentNeeds = [
    .../汤.*(别洒|不洒)|别洒/.test(text2) ? [{
      raw: "\u6C64\u522B\u6D12",
      normalized: "\u6C64\u4E0E\u7C73\u996D\u4F7F\u7528\u72EC\u7ACB\u5BC6\u5C01\u5BB9\u5668",
      responsibleParty: "merchant"
    }] : [],
    .../分装/.test(text2) && !/汤.*(别洒|不洒)|别洒/.test(text2) ? [{
      raw: "\u5206\u88C5",
      normalized: "\u4E3B\u98DF\u4E0E\u6C64\u6C41\u72EC\u7ACB\u5206\u88C5",
      responsibleParty: "merchant"
    }] : []
  ];
  return parsedDemandSchema.parse({
    budgetMax: budget ? Number(budget[1]) : null,
    category,
    taste,
    fulfillmentNeeds,
    source: "fallback"
  });
}
async function parseWithModel(text2, config) {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "\u5C06\u5916\u5356\u9700\u6C42\u8F6C\u6210JSON\u3002\u53EA\u63D0\u53D6budgetMax\u3001category\u3001taste\u3001fulfillmentNeeds\u3002\u628A\u914D\u9001\u7ED3\u679C\u6539\u5199\u6210\u5546\u5BB6\u53EF\u63A7\u6761\u4EF6\u3002"
        },
        { role: "user", content: text2 }
      ]
    }),
    signal: AbortSignal.timeout(4500)
  });
  if (!response.ok) throw new Error(`MODEL_HTTP_${response.status}`);
  const body = await response.json();
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("MODEL_EMPTY_RESPONSE");
  return parsedDemandSchema.parse({ ...JSON.parse(content), source: "model" });
}
function createDemandService(config) {
  return {
    async parse(text2) {
      if (config.provider === "deepseek" && config.apiKey) {
        try {
          return await parseWithModel(text2, config);
        } catch {
          return parseFallback(text2);
        }
      }
      return parseFallback(text2);
    }
  };
}

// server/modules/ai/claim-extraction.routes.ts
import { Hono as Hono7 } from "hono";
import { ZodError as ZodError6 } from "zod";

// server/modules/ai/claim-extraction.schema.ts
import { z as z6 } from "zod";
var claimKindSchema = z6.enum([
  "objective",
  "preference",
  "specification",
  "unverifiable"
]);
var claimExtractionRequestSchema = z6.object({
  text: z6.string().trim().min(2).max(500)
});
var extractedClaimSchema = z6.object({
  id: z6.string().min(1),
  kind: claimKindSchema,
  content: z6.string().min(1),
  sourceText: z6.string().min(1),
  rationale: z6.string().min(1)
});
var claimExtractionResponseSchema = z6.object({
  source: z6.enum(["model", "fallback"]),
  candidates: z6.array(extractedClaimSchema).max(8)
});

// server/modules/ai/claim-extraction.routes.ts
function createClaimExtractionRoutes(service) {
  return new Hono7().post("/extract-claims", async (context) => {
    const input = claimExtractionRequestSchema.parse(await context.req.json());
    return context.json(await service.extract(input.text));
  }).onError((error, context) => {
    if (error instanceof ZodError6) {
      return context.json({ code: "INVALID_MERCHANT_COPY", issues: error.issues }, 400);
    }
    throw error;
  });
}

// server/modules/ai/claim-extraction.service.ts
function candidate(id, kind, content, sourceText, rationale) {
  return { id, kind, content, sourceText, rationale };
}
function extractFallback(text2) {
  const candidates = [];
  if (/汤饭分开|汤饭分装|独立密封|密封容器/.test(text2)) {
    candidates.push(candidate(
      "claim-objective-sealed",
      "objective",
      "\u6C64\u4E0E\u7C73\u996D\u4F7F\u7528\u72EC\u7ACB\u5BC6\u5C01\u5BB9\u5668",
      text2.match(/汤饭分开装|汤饭分装|独立密封(?:容器)?|密封容器/)?.[0] ?? "\u6C64\u996D\u5206\u88C5",
      "\u5305\u88C5\u65B9\u5F0F\u7531\u5546\u5BB6\u76F4\u63A5\u63A7\u5236\uFF0C\u7528\u6237\u6536\u9910\u65F6\u53EF\u4EE5\u5BA2\u89C2\u786E\u8BA4\u3002"
    ));
  }
  if (/少油|清淡/.test(text2)) {
    candidates.push(candidate(
      "claim-preference-low-oil",
      "preference",
      "\u652F\u6301\u5C11\u6CB9\u5236\u4F5C",
      text2.match(/(?:可按备注)?少油|清淡/)?.[0] ?? "\u5C11\u6CB9",
      "\u6CB9\u5EA6\u611F\u53D7\u56E0\u4EBA\u800C\u5F02\uFF0C\u5E94\u5F62\u6210\u53E3\u5473\u5206\u5E03\uFF0C\u4E0D\u4F5C\u4E3A\u5BA2\u89C2\u8D54\u4ED8\u627F\u8BFA\u3002"
    ));
  }
  const weight = text2.match(/牛肉(?:标称|约|不少于|≥)?\s*(\d+)\s*g/i);
  if (weight) {
    candidates.push(candidate(
      "claim-specification-beef-weight",
      "specification",
      `\u5546\u5BB6\u6807\u79F0\u725B\u8089 ${weight[1]}g`,
      weight[0],
      "\u91CD\u91CF\u662F\u5546\u5BB6\u5546\u54C1\u89C4\u683C\u58F0\u660E\uFF0C\u666E\u901A\u7528\u6237\u65E0\u6CD5\u76F4\u63A5\u7CBE\u786E\u6838\u9A8C\u3002"
    ));
  }
  if (/好吃|不踩雷|最好|必点|绝对|保证.*送到|不会洒|不洒/.test(text2)) {
    const sourceText = text2.split(/[，,。；;]/).find((part) => /好吃|不踩雷|最好|必点|绝对|保证.*送到|不会洒|不洒/.test(part))?.trim() ?? text2;
    candidates.push(candidate(
      "claim-unverifiable-marketing",
      "unverifiable",
      sourceText,
      sourceText,
      "\u5305\u542B\u4E3B\u89C2\u5BA3\u4F20\u3001\u914D\u9001\u7ED3\u679C\u6216\u7EDD\u5BF9\u5316\u8868\u8FF0\uFF0C\u4E0D\u80FD\u53D1\u5E03\u4E3A\u5546\u5BB6\u5BA2\u89C2\u627F\u8BFA\u3002"
    ));
  }
  return claimExtractionResponseSchema.parse({ source: "fallback", candidates });
}
async function extractWithModel(text2, config) {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        {
          role: "system",
          content: [
            "\u5C06\u5546\u5BB6\u5546\u54C1\u6587\u6848\u62C6\u6210\u53EF\u9A8C\u8BC1\u5356\u70B9JSON\u3002",
            "\u5206\u7C7B\u53EA\u80FD\u662F objective\u3001preference\u3001specification\u3001unverifiable\u3002",
            "\u914D\u9001\u7ED3\u679C\u3001\u7EDD\u5BF9\u5316\u5BA3\u4F20\u548C\u4E3B\u89C2\u597D\u5403\u4E0D\u80FD\u6210\u4E3A objective\u3002",
            '\u8FD4\u56DE {"candidates":[{"id","kind","content","sourceText","rationale"}]}\u3002'
          ].join("")
        },
        { role: "user", content: text2 }
      ]
    }),
    signal: AbortSignal.timeout(4500)
  });
  if (!response.ok) throw new Error(`MODEL_HTTP_${response.status}`);
  const body = await response.json();
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("MODEL_EMPTY_RESPONSE");
  return claimExtractionResponseSchema.parse({ ...JSON.parse(content), source: "model" });
}
function createClaimExtractionService(config) {
  return {
    async extract(text2) {
      if (config.provider === "deepseek" && config.apiKey) {
        try {
          return await extractWithModel(text2, config);
        } catch {
          return extractFallback(text2);
        }
      }
      return extractFallback(text2);
    }
  };
}

// server/config.ts
import { z as z7 } from "zod";
var environmentSchema = z7.object({
  DATABASE_URL: z7.string().min(1).default("file:./data/trial-demo.db"),
  DATABASE_AUTH_TOKEN: z7.string().optional(),
  API_PORT: z7.coerce.number().int().positive().max(65535).default(8787),
  LLM_PROVIDER: z7.enum(["fallback", "deepseek"]).default("fallback"),
  DEEPSEEK_API_KEY: z7.string().optional(),
  AI_BASE_URL: z7.string().url().default("https://api.deepseek.com"),
  AI_MODEL: z7.string().min(1).default("deepseek-chat")
});
function parseServerConfig(environment) {
  const parsed = environmentSchema.parse(environment);
  return {
    databaseUrl: parsed.DATABASE_URL,
    databaseAuthToken: parsed.DATABASE_AUTH_TOKEN,
    apiPort: parsed.API_PORT,
    llmProvider: parsed.LLM_PROVIDER,
    deepseekApiKey: parsed.DEEPSEEK_API_KEY,
    aiBaseUrl: parsed.AI_BASE_URL,
    aiModel: parsed.AI_MODEL
  };
}
var serverConfig = parseServerConfig(process.env);

// server/modules/recommendations/recommendation.routes.ts
import { Hono as Hono8 } from "hono";
import { ZodError as ZodError7 } from "zod";

// server/modules/recommendations/recommendation.schema.ts
import { z as z8 } from "zod";
var recommendationRequestSchema = z8.object({
  budgetMax: z8.number().positive().nullable(),
  category: z8.string().nullable(),
  taste: z8.array(z8.string()).max(4),
  fulfillmentNeeds: z8.array(z8.string()).max(6)
});

// server/modules/recommendations/recommendation.routes.ts
function createRecommendationRoutes(service) {
  return new Hono8().post("/", async (context) => {
    const input = recommendationRequestSchema.parse(await context.req.json());
    return context.json(await service.recommend(input));
  }).onError((error, context) => {
    if (error instanceof ZodError7) {
      return context.json({ code: "INVALID_RECOMMENDATION_REQUEST", issues: error.issues }, 400);
    }
    throw error;
  });
}

// server/modules/recommendations/recommendation.service.ts
import { asc as asc3 } from "drizzle-orm";
function evidenceTotal(rows) {
  return Math.max(0, ...rows.map((row) => row.positiveCount + row.neutralCount + row.negativeCount));
}
function objectiveRate(rows) {
  const row = rows.find((item) => item.evidenceType === "objective");
  if (!row) return 0;
  const total2 = row.positiveCount + row.neutralCount + row.negativeCount;
  return total2 ? row.positiveCount / total2 : 0;
}
function matchesCategory(store, category) {
  if (!category) return true;
  if (category.includes("\u725B\u8089")) {
    return store.category === "\u76D6\u996D" && /牛肉|牛腩/.test(`${store.name}${store.heroDish}`);
  }
  if (category.includes("\u9E21")) return /鸡/.test(`${store.name}${store.heroDish}`);
  return `${store.category}${store.heroDish}`.includes(category);
}
function hasPackagingEvidence(rows) {
  return rows.some((row) => /密封|分装/.test(row.aspect));
}
function explain(candidate2, need, role) {
  const withinBudget = need.budgetMax === null || candidate2.fromPrice <= need.budgetMax;
  const categoryMatch = matchesCategory(candidate2.store, need.category);
  const packaging = hasPackagingEvidence(candidate2.evidence);
  if (role === "primary") {
    return {
      decisionLabel: "\u9700\u6C42\u6700\u5339\u914D \xB7 \u6837\u672C\u4ECD\u5728\u6210\u957F",
      tradeoff: "\u6700\u7B26\u5408\u8FD9\u6B21\u5177\u4F53\u9700\u6C42\uFF0C\u4F46\u6709\u6548\u9A8C\u8BC1\u91CF\u8F83\u5C11",
      reasons: [
        withinBudget ? `\u8BD5\u65B0\u4EF7 \xA5${candidate2.fromPrice}\uFF0C\u5728\u9884\u7B97\u5185` : `\u4EF7\u683C\u63A5\u8FD1\u4F60\u7684\u9884\u7B97`,
        categoryMatch ? "\u725B\u8089\u996D\u54C1\u7C7B\u76F4\u63A5\u5339\u914D" : "\u54C1\u7C7B\u76F8\u8FD1",
        packaging ? `${candidate2.objectivePositive}/${candidate2.sampleSize} \u4EFD\u8BA2\u5355\u9A8C\u8BC1\u5305\u88C5\u627F\u8BFA` : "\u652F\u6301\u53EF\u9A8C\u8BC1\u7684\u51FA\u9910\u627F\u8BFA"
      ],
      risks: [`\u76EE\u524D\u4EC5 ${candidate2.sampleSize} \u4EFD\u6709\u6548\u9A8C\u8BC1\uFF0C\u7ED3\u8BBA\u53EF\u80FD\u6CE2\u52A8`]
    };
  }
  if (role === "stable") {
    return {
      decisionLabel: "\u9A8C\u8BC1\u66F4\u5145\u5206 \xB7 \u53E3\u5473\u5B58\u5728\u53D6\u820D",
      tradeoff: "\u6837\u672C\u66F4\u5145\u8DB3\uFF0C\u4F46\u90E8\u5206\u7528\u6237\u8BA4\u4E3A\u53E3\u5473\u504F\u6CB9",
      reasons: [
        `${candidate2.sampleSize} \u4EFD\u6709\u6548\u8BA2\u5355\u9A8C\u8BC1\uFF0C\u7A33\u5B9A\u6027\u66F4\u9AD8`,
        categoryMatch ? "\u540C\u5C5E\u725B\u8089\u76D6\u996D\u9009\u62E9" : "\u54C1\u7C7B\u63A5\u8FD1"
      ],
      risks: ["\u90E8\u5206\u771F\u5B9E\u8BA2\u5355\u53CD\u9988\u504F\u6CB9\uFF0C\u4E0D\u5B8C\u5168\u7B26\u5408\u6E05\u6DE1\u504F\u597D"]
    };
  }
  return {
    decisionLabel: "\u53E3\u5473\u66F4\u7A33\u59A5 \xB7 \u54C1\u7C7B\u66FF\u4EE3",
    tradeoff: "\u4EF7\u683C\u4E0E\u5305\u88C5\u66F4\u7A33\u59A5\uFF0C\u4F46\u4E0D\u662F\u7EAF\u725B\u8089\u996D",
    reasons: [
      withinBudget ? `\u8BD5\u65B0\u4EF7 \xA5${candidate2.fromPrice}\uFF0C\u9884\u7B97\u538B\u529B\u66F4\u5C0F` : "\u4EF7\u683C\u63A5\u8FD1\u9884\u7B97",
      packaging ? "\u6C64\u996D\u5206\u88C5\u8BC1\u636E\u66F4\u5145\u5206" : "\u51FA\u9910\u65B9\u5F0F\u76F8\u5BF9\u7A33\u5B9A"
    ],
    risks: ["\u5C5E\u4E8E\u9E21\u6C64\u996D\uFF0C\u662F\u76F8\u90BB\u54C1\u7C7B\u800C\u975E\u725B\u8089\u996D"]
  };
}
function createRecommendationService(db) {
  return {
    async rankCandidates(need) {
      const [storeRows, menuRows, evidenceRows] = await Promise.all([
        db.select().from(stores).orderBy(asc3(stores.distanceMeters)),
        db.select().from(menuItems),
        db.select().from(evidenceAggregates)
      ]);
      return storeRows.map((store) => {
        const evidence = evidenceRows.filter((row) => row.storeId === store.id);
        const prices = menuRows.filter((row) => row.storeId === store.id).map((row) => row.price);
        const fromPrice = Math.min(...prices);
        const sampleSize = evidenceTotal(evidence);
        const objective = evidence.find((row) => row.evidenceType === "objective");
        const score = (need.budgetMax === null || fromPrice <= need.budgetMax ? 28 : -18) + (matchesCategory(store, need.category) ? 38 : 5) + (hasPackagingEvidence(evidence) && need.fulfillmentNeeds.length ? 24 : 0) + Math.min(sampleSize, 35) * 0.25 + objectiveRate(evidence) * 12;
        return {
          store,
          fromPrice,
          evidence,
          sampleSize,
          objectivePositive: objective?.positiveCount ?? 0,
          score
        };
      }).sort((left, right) => right.score - left.score);
    },
    async recommend(need) {
      const candidates = await this.rankCandidates(need);
      const primary = candidates[0];
      if (!primary) return { items: [], dataNotice: "\u9644\u8FD1\u7B26\u5408\u6761\u4EF6\u7684\u65B0\u5E97\u4ECD\u5728\u79EF\u7D2F" };
      const remaining = candidates.filter((candidate2) => candidate2.store.id !== primary.store.id);
      const stable = [...remaining].filter((candidate2) => matchesCategory(candidate2.store, need.category)).sort((left, right) => right.sampleSize - left.sampleSize)[0] ?? remaining[0];
      const adjacent = remaining.filter((candidate2) => candidate2.store.id !== stable?.store.id).sort((left, right) => {
        const adjacencyScore = (candidate2) => (candidate2.store.category === "\u6C64\u996D" ? 20 : 0) + (hasPackagingEvidence(candidate2.evidence) ? 8 : 0) + (need.budgetMax === null || candidate2.fromPrice <= need.budgetMax ? 4 : 0);
        return adjacencyScore(right) - adjacencyScore(left) || left.fromPrice - right.fromPrice;
      })[0];
      const selected = [
        { candidate: primary, role: "primary", explanationRole: "primary" },
        ...stable ? [{ candidate: stable, role: "alternative", explanationRole: "stable" }] : [],
        ...adjacent ? [{ candidate: adjacent, role: "alternative", explanationRole: "adjacent" }] : []
      ];
      return {
        items: selected.map(({ candidate: candidate2, role, explanationRole }) => ({
          role,
          store: { ...candidate2.store, fromPrice: candidate2.fromPrice },
          evidence: {
            validOrders: candidate2.sampleSize,
            objectivePositive: candidate2.objectivePositive,
            objectiveTotal: candidate2.sampleSize
          },
          ...explain(candidate2, need, explanationRole)
        })),
        dataNotice: "\u63A8\u8350\u7531\u9700\u6C42\u5339\u914D\u3001\u6709\u6548\u8BC1\u636E\u548C\u98CE\u9669\u89C4\u5219\u5171\u540C\u751F\u6210"
      };
    }
  };
}

// server/modules/merchant-plans/merchant-plan.routes.ts
import { Hono as Hono9 } from "hono";
import { ZodError as ZodError8 } from "zod";

// server/modules/merchant-plans/merchant-plan.schema.ts
import { z as z9 } from "zod";
var saveDraftSchema = z9.object({
  benefitLabel: z9.string().trim().min(1).max(40),
  dailyQuota: z9.number().int().min(1).max(100),
  trialPrice: z9.number().positive().max(999),
  claims: z9.array(z9.object({
    kind: claimKindSchema,
    content: z9.string().trim().min(1).max(80),
    sourceText: z9.string().trim().min(1).max(160),
    decision: z9.enum(["confirmed", "modified", "rejected"]),
    sortOrder: z9.number().int().nonnegative()
  })).max(8)
});

// server/modules/merchant-plans/merchant-plan.service.ts
import { randomUUID as randomUUID4 } from "node:crypto";
import { and as and6, asc as asc4, desc, eq as eq6 } from "drizzle-orm";
var MerchantPlanUnauthorizedError = class extends Error {
};
var MerchantPlanStoreNotFoundError = class extends Error {
};
var MerchantPlanNotFoundError = class extends Error {
};
var MerchantPlanNotEditableError = class extends Error {
};
var ObjectivePromiseRequiredError = class extends Error {
};
function requireSession(sessionId) {
  if (!sessionId) throw new MerchantPlanUnauthorizedError();
}
function createMerchantPlanService(db) {
  async function requireStore(storeId) {
    const [store] = await db.select({ id: stores.id }).from(stores).where(eq6(stores.id, storeId)).limit(1);
    if (!store) throw new MerchantPlanStoreNotFoundError();
  }
  async function claimsFor(planId) {
    return db.select().from(trialPlanClaims).where(eq6(trialPlanClaims.planId, planId)).orderBy(asc4(trialPlanClaims.sortOrder));
  }
  async function hydrate(plan) {
    return plan ? { ...plan, claims: await claimsFor(plan.id) } : null;
  }
  return {
    async workbench(sessionId, storeId) {
      requireSession(sessionId);
      await requireStore(storeId);
      const plans = await db.select().from(trialPlans).where(eq6(trialPlans.storeId, storeId)).orderBy(desc(trialPlans.version));
      const active = plans.find((plan) => plan.status === "published");
      const draft = plans.find((plan) => plan.status === "draft");
      return {
        active: await hydrate(active),
        draft: await hydrate(draft),
        history: plans.filter((plan) => plan.status === "archived").map((plan) => ({ id: plan.id, version: plan.version, status: plan.status, publishedAt: plan.publishedAt }))
      };
    },
    async createDraft(sessionId, storeId) {
      requireSession(sessionId);
      await requireStore(storeId);
      const [existingDraft] = await db.select().from(trialPlans).where(and6(eq6(trialPlans.storeId, storeId), eq6(trialPlans.status, "draft"))).limit(1);
      if (existingDraft) return hydrate(existingDraft);
      const [active] = await db.select().from(trialPlans).where(and6(eq6(trialPlans.storeId, storeId), eq6(trialPlans.status, "published"))).orderBy(desc(trialPlans.version)).limit(1);
      if (!active) throw new MerchantPlanNotFoundError();
      const sourceClaims = await claimsFor(active.id);
      const draftId = `${storeId}-plan-v${active.version + 1}-${randomUUID4().slice(0, 8)}`;
      await db.transaction(async (transaction) => {
        await transaction.insert(trialPlans).values({
          ...active,
          id: draftId,
          version: active.version + 1,
          status: "draft",
          publishedAt: null
        });
        if (sourceClaims.length) {
          await transaction.insert(trialPlanClaims).values(sourceClaims.map((claim) => ({
            ...claim,
            id: randomUUID4(),
            planId: draftId
          })));
        }
      });
      const [draft] = await db.select().from(trialPlans).where(eq6(trialPlans.id, draftId)).limit(1);
      return hydrate(draft);
    },
    async saveDraft(sessionId, storeId, planId, input) {
      requireSession(sessionId);
      const [plan] = await db.select().from(trialPlans).where(and6(eq6(trialPlans.id, planId), eq6(trialPlans.storeId, storeId))).limit(1);
      if (!plan) throw new MerchantPlanNotFoundError();
      if (plan.status !== "draft") throw new MerchantPlanNotEditableError();
      await db.transaction(async (transaction) => {
        await transaction.update(trialPlans).set({
          benefitLabel: input.benefitLabel,
          dailyQuota: input.dailyQuota,
          remainingQuota: Math.min(plan.remainingQuota, input.dailyQuota),
          trialPrice: input.trialPrice
        }).where(eq6(trialPlans.id, planId));
        await transaction.delete(trialPlanClaims).where(eq6(trialPlanClaims.planId, planId));
        if (input.claims.length) {
          await transaction.insert(trialPlanClaims).values(input.claims.map((claim) => ({
            ...claim,
            id: randomUUID4(),
            planId
          })));
        }
      });
      const [saved] = await db.select().from(trialPlans).where(eq6(trialPlans.id, planId)).limit(1);
      return hydrate(saved);
    },
    async publish(sessionId, storeId, planId) {
      requireSession(sessionId);
      const [plan] = await db.select().from(trialPlans).where(and6(eq6(trialPlans.id, planId), eq6(trialPlans.storeId, storeId))).limit(1);
      if (!plan) throw new MerchantPlanNotFoundError();
      if (plan.status !== "draft") throw new MerchantPlanNotEditableError();
      const claims = await claimsFor(planId);
      const hasObjective = claims.some((claim) => claim.kind === "objective" && (claim.decision === "confirmed" || claim.decision === "modified"));
      if (!hasObjective) throw new ObjectivePromiseRequiredError();
      const publishedAt = /* @__PURE__ */ new Date();
      await db.transaction(async (transaction) => {
        await transaction.update(trialPlans).set({ status: "archived" }).where(and6(eq6(trialPlans.storeId, storeId), eq6(trialPlans.status, "published")));
        await transaction.update(trialPlans).set({ status: "published", publishedAt }).where(eq6(trialPlans.id, planId));
      });
      const [published] = await db.select().from(trialPlans).where(eq6(trialPlans.id, planId)).limit(1);
      return hydrate(published);
    }
  };
}

// server/modules/merchant-plans/merchant-plan.routes.ts
function createMerchantPlanRoutes(service) {
  const sessionId = (context) => context.req.header("x-demo-session");
  return new Hono9().get("/stores/:storeId/plans/workbench", async (context) => context.json(await service.workbench(sessionId(context), context.req.param("storeId")))).post("/stores/:storeId/plans/draft", async (context) => context.json(await service.createDraft(sessionId(context), context.req.param("storeId")), 201)).put("/stores/:storeId/plans/:planId", async (context) => context.json(await service.saveDraft(
    sessionId(context),
    context.req.param("storeId"),
    context.req.param("planId"),
    saveDraftSchema.parse(await context.req.json())
  ))).post("/stores/:storeId/plans/:planId/publish", async (context) => context.json(await service.publish(
    sessionId(context),
    context.req.param("storeId"),
    context.req.param("planId")
  ))).onError((error, context) => {
    if (error instanceof MerchantPlanUnauthorizedError) {
      return context.json({ code: "DEMO_SESSION_REQUIRED" }, 401);
    }
    if (error instanceof MerchantPlanStoreNotFoundError) {
      return context.json({ code: "STORE_NOT_FOUND" }, 404);
    }
    if (error instanceof MerchantPlanNotFoundError) {
      return context.json({ code: "PLAN_NOT_FOUND" }, 404);
    }
    if (error instanceof MerchantPlanNotEditableError) {
      return context.json({ code: "PLAN_NOT_EDITABLE" }, 409);
    }
    if (error instanceof ObjectivePromiseRequiredError) {
      return context.json({ code: "OBJECTIVE_PROMISE_REQUIRED" }, 400);
    }
    if (error instanceof ZodError8) {
      return context.json({ code: "INVALID_PLAN", issues: error.issues }, 400);
    }
    throw error;
  });
}

// server/app.ts
function createApp(db) {
  const app2 = new Hono10();
  app2.get("/api/health", async (context) => {
    await db.run(sql2`select 1`);
    return context.json({
      status: "ok",
      database: "ready",
      service: "meituan-trial-api"
    });
  });
  app2.route("/api/sessions", createSessionRoutes(createSessionService(db)));
  app2.route("/api/stores", createStoreRoutes(createStoreService(db)));
  app2.route("/api/orders", createOrderRoutes(createOrderService(db)));
  app2.route("/api/orders", createVerificationRoutes(createVerificationService(db)));
  app2.route("/api/merchant", createMerchantRoutes(createMerchantService(db)));
  app2.route("/api/merchant", createMerchantPlanRoutes(createMerchantPlanService(db)));
  app2.route("/api/ai", createDemandRoutes(createDemandService({
    provider: serverConfig.llmProvider,
    apiKey: serverConfig.deepseekApiKey,
    baseUrl: serverConfig.aiBaseUrl,
    model: serverConfig.aiModel
  })));
  app2.route("/api/ai", createClaimExtractionRoutes(createClaimExtractionService({
    provider: serverConfig.llmProvider,
    apiKey: serverConfig.deepseekApiKey,
    baseUrl: serverConfig.aiBaseUrl,
    model: serverConfig.aiModel
  })));
  app2.route("/api/recommendations", createRecommendationRoutes(createRecommendationService(db)));
  app2.notFound((context) => {
    if (context.req.path.startsWith("/api/")) {
      return context.json({ code: "API_ROUTE_NOT_FOUND" }, 404);
    }
    return context.text("Not Found", 404);
  });
  app2.onError((error, context) => {
    console.error(error);
    return context.json({ code: "INTERNAL_SERVER_ERROR" }, 500);
  });
  return app2;
}

// server/db/client.ts
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
function createDatabase(url, authToken) {
  if (url.startsWith("file:")) {
    const databasePath = url.slice("file:".length);
    mkdirSync(dirname(databasePath), { recursive: true });
  }
  const client = createClient({
    url,
    ...authToken ? { authToken } : {}
  });
  return {
    client,
    db: drizzle(client, { schema: schema_exports })
  };
}

// server/db/deployment.ts
import { copyFileSync, existsSync } from "node:fs";
function prepareDeploymentDatabase(options) {
  if (options.configuredUrl) return options.configuredUrl;
  if (!existsSync(options.runtimePath)) copyFileSync(options.seedPath, options.runtimePath);
  return `file:${options.runtimePath}`;
}

// server/vercel.ts
var databaseUrl = prepareDeploymentDatabase({
  configuredUrl: process.env.DATABASE_URL,
  seedPath: join(process.cwd(), "server/assets/deploy-seed.sqlite"),
  runtimePath: "/tmp/meituan-trial-demo.db"
});
var database = createDatabase(databaseUrl, process.env.DATABASE_AUTH_TOKEN);
var app = createApp(database.db);
var honoHandler = handle(app);
async function handler(request) {
  const incomingUrl = new URL(request.url);
  const route = incomingUrl.searchParams.get("__route");
  if (!route) return honoHandler(request);
  incomingUrl.pathname = `/api/${route}`;
  incomingUrl.searchParams.delete("__route");
  return honoHandler(new Request(incomingUrl, request));
}
var GET = handler;
var POST = handler;
var PUT = handler;
var PATCH = handler;
var DELETE = handler;
export {
  DELETE,
  GET,
  PATCH,
  POST,
  PUT
};
