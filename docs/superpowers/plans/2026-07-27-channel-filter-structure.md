# Channel Filter Structure Implementation Plan

> **For agentic workers:** Execute inline in the current task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make meal period, category, price, distance, and evidence sorting independently usable and remove the duplicate high-fulfillment entry.

**Architecture:** Keep URL search parameters as the single UI state source. Extend the existing store list endpoint with a meal-period query, and keep the advanced filter panel inside `ChannelFilters`.

**Tech Stack:** React, React Router, TanStack Query, Hono, Zod, Vitest, Testing Library.

---

### Task 1: Lock interaction behavior with tests

**Files:**
- Modify: `src/consumer/channel/channel.test.tsx`

- [ ] Assert meal period, category, price, and sorting parameters can coexist.
- [ ] Assert the filter trigger opens a panel and applies distance.
- [ ] Assert the independent “高兑现新店” control no longer exists.

### Task 2: Extend store filtering

**Files:**
- Modify: `src/shared/api/stores.ts`
- Modify: `server/modules/stores/store.schema.ts`
- Modify: `server/modules/stores/store.service.ts`
- Modify: `server/modules/stores/store.routes.test.ts`

- [ ] Add `mealPeriod` to the query contract.
- [ ] Map meal periods to suitable store categories.
- [ ] Preserve combination with category, price, distance, and sorting.

### Task 3: Rebuild channel controls

**Files:**
- Modify: `src/consumer/channel/ChannelHomePage.tsx`
- Modify: `src/consumer/channel/ChannelFilters.tsx`
- Modify: `src/consumer/channel/channel.css`

- [ ] Replace mixed shortcuts with breakfast, lunch, dinner, and late-night.
- [ ] Keep food categories as a separate row.
- [ ] Make advanced filters open, apply, reset, and close.
- [ ] Remove the duplicate high-fulfillment control.

### Task 4: Verify

- [ ] Run channel and store route tests.
- [ ] Run the production build.
- [ ] Click through combined filters in the browser and check responsive layout.
