# 美团试新产品精修 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不增加业务范围的前提下，把现有可运行 MVP 精修成信息层级清楚、交互有反馈、两端数据一致、可以直接提交比赛的“小型美团业务产品”。

**Architecture:** 保留现有 React Router、TanStack Query、Hono API 与本地数据库链路，只重组页面信息架构和视觉组件。消费者端围绕“试新—店铺—订单—验证—我的”展开，商家端保留独立入口并采用经营总览优先；所有证据数字继续读取同一 API，不在页面中制造第二套统计口径。

**Tech Stack:** React 19、TypeScript、React Router、TanStack Query、CSS、Vitest、Testing Library、Hono、Drizzle/libSQL。

---

## 文件结构

- `src/styles/tokens.css`：全站色彩、字号、间距、圆角、阴影变量。
- `src/styles/global.css`：全局字体、背景、链接与交互基础规则。
- `src/app/ConsumerLayout.tsx`：消费者端两项底部导航。
- `src/consumer/channel/*`：试新首页、组合筛选、紧凑店铺列表。
- `src/consumer/store/*`：点菜、证据、商家三页签和商品加购。
- `src/consumer/checkout/*`：承诺快照、数量修改和提交状态。
- `src/consumer/orders/*`：订单中心与订单履约状态。
- `src/consumer/verification/*`：逐项验证和证据成长。
- `src/consumer/profile/*`：“我的”订单中心。
- `src/merchant/*`：经营总览、承诺方案、核验入口与视觉系统。
- 对应 `*.test.tsx`：行为与回归测试。

### Task 1：首页层级与紧凑店铺列表

**Files:**
- Modify: `src/consumer/channel/ChannelHomePage.tsx`
- Modify: `src/consumer/channel/ChannelHero.tsx`
- Modify: `src/consumer/channel/ChannelFilters.tsx`
- Modify: `src/consumer/channel/StoreFeed.tsx`
- Modify: `src/consumer/channel/channel.css`
- Test: `src/consumer/channel/channel.test.tsx`
- Test: `src/consumer/channel/channel-v1.test.tsx`

- [ ] **Step 1: 写失败测试**

新增断言：页面只保留一个需求输入主操作；早午晚餐、品类、价格/排序可以组合；不存在独立“高兑现新店”入口；每张店铺卡显示一项兑现证据和一项风险状态。

- [ ] **Step 2: 运行首页测试并确认失败**

Run: `npm test -- src/consumer/channel/channel.test.tsx src/consumer/channel/channel-v1.test.tsx`

Expected: 新增的层级或文案断言失败。

- [ ] **Step 3: 实现首页精修**

压缩首屏宣传区，以搜索为主操作；把时段、品类、决策条件分为三层；将大海报店铺卡改为图片、店名、价格、距离、时间、核心证据、风险状态组成的紧凑列表；所有筛选点击后显示选中状态并刷新列表。

- [ ] **Step 4: 运行首页测试**

Run: `npm test -- src/consumer/channel/channel.test.tsx src/consumer/channel/channel-v1.test.tsx`

Expected: PASS。

### Task 2：店铺详情与点菜决策

**Files:**
- Modify: `src/consumer/store/StoreDetailPage.tsx`
- Modify: `src/consumer/store/store-detail.css`
- Test: `src/consumer/store/store-detail.test.tsx`

- [ ] **Step 1: 写失败测试**

断言“点菜 / 证据 / 商家”页签可切换；点菜页直接展示可锁定承诺、兑现数据、可信状态和样本风险；商品加购后能进入结算；消费者页面不暴露商家经营后台数据。

- [ ] **Step 2: 运行店铺测试并确认失败**

Run: `npm test -- src/consumer/store/store-detail.test.tsx`

Expected: 页签、承诺区或加购断言失败。

- [ ] **Step 3: 重组店铺页**

将顶部改为常规外卖店铺信息；在菜单前加入紧凑的“本店可锁定承诺”；删除说明书式文案；证据页按有效订单、客观兑现、主观分布、复购意愿、风险记录组织；商家页只显示消费者可见的资质与说明。

- [ ] **Step 4: 运行店铺测试**

Run: `npm test -- src/consumer/store/store-detail.test.tsx`

Expected: PASS。

### Task 3：结算、订单、验证与证据成长

**Files:**
- Modify: `src/consumer/checkout/CheckoutPage.tsx`
- Modify: `src/consumer/checkout/checkout.css`
- Modify: `src/consumer/orders/OrderDetailPage.tsx`
- Modify: `src/consumer/orders/orders.css`
- Modify: `src/consumer/verification/VerificationPage.tsx`
- Modify: `src/consumer/verification/EvidenceGrowthPage.tsx`
- Modify: `src/consumer/verification/verification.css`
- Test: `src/checkout.regression-1.test.tsx`
- Test: `src/consumer/orders/orders.test.tsx`
- Test: `src/consumer/verification/verification.test.tsx`

- [ ] **Step 1: 写失败测试**

覆盖数量修改、提交订单、承诺版本快照、履约状态推进、逐项验证、负向反馈展开核验入口、正向提交后 8→9 数据变化。

- [ ] **Step 2: 运行链路测试并确认失败**

Run: `npm test -- src/checkout.regression-1.test.tsx src/consumer/orders/orders.test.tsx src/consumer/verification/verification.test.tsx`

Expected: 新增交互或状态断言失败。

- [ ] **Step 3: 实现交易闭环精修**

结算页突出商品与随单承诺；提交按钮提供 loading、错误与成功反馈；订单页明确制作中、配送中、待验证等状态；验证页使用“确认包装密封无误”加主观轻量选项；证据成长页从统一接口呈现有效验证、密封分装、少油感受、复购意愿的变化。

- [ ] **Step 4: 运行链路测试**

Run: `npm test -- src/checkout.regression-1.test.tsx src/consumer/orders/orders.test.tsx src/consumer/verification/verification.test.tsx`

Expected: PASS。

### Task 4：“我的”订单中心与消费者导航

**Files:**
- Modify: `src/app/ConsumerLayout.tsx`
- Modify: `src/consumer/profile/MyTrialPage.tsx`
- Modify: `src/consumer/profile/profile.css`
- Modify: `src/consumer/orders/OrdersPage.tsx`
- Test: `src/app/AppRouter.test.tsx`
- Test: `src/consumer/orders/orders.test.tsx`

- [ ] **Step 1: 写失败测试**

断言底部只有“试新 / 我的”；“我的”展示待验证、进行中、已完成、争议中入口和真实订单；每张订单能进入详情、验证或证据成长。

- [ ] **Step 2: 运行导航和订单测试并确认失败**

Run: `npm test -- src/app/AppRouter.test.tsx src/consumer/orders/orders.test.tsx`

Expected: 导航数量或订单入口断言失败。

- [ ] **Step 3: 实现美团式个人订单中心**

移除“附近想吃”独立入口；把订单状态入口和订单列表合并进“我的”；让空状态有明确解释和返回试新的操作，不保留无响应入口。

- [ ] **Step 4: 运行导航和订单测试**

Run: `npm test -- src/app/AppRouter.test.tsx src/consumer/orders/orders.test.tsx`

Expected: PASS。

### Task 5：商家经营总览与承诺方案

**Files:**
- Modify: `src/merchant/MerchantOverviewPage.tsx`
- Modify: `src/merchant/merchant.css`
- Modify: `src/merchant/MerchantPlanPage.tsx`
- Modify: `src/merchant/merchant-plan.css`
- Test: `src/merchant/merchant.test.tsx`
- Test: `src/merchant/MerchantPlanPage.test.tsx`

- [ ] **Step 1: 写失败测试**

断言经营首页分块展示有效验证、密封兑现率、少油符合率、复购意愿、今日新增、待核验、9/10 成长进度与有依据的 AI 建议；承诺方案支持确认、修改、拒绝、设置名额、预览和发布。

- [ ] **Step 2: 运行商家端测试并确认失败**

Run: `npm test -- src/merchant/merchant.test.tsx src/merchant/MerchantPlanPage.test.tsx`

Expected: 指标分块、操作入口或反馈断言失败。

- [ ] **Step 3: 实现经营后台精修**

建立深色导航加美团黄重点操作的商家视觉；经营总览优先展示结果与下一步；将承诺创建放入二级页；发布后以 Toast 和更新时间反馈，并保持消费者端新订单读取最新承诺版本。

- [ ] **Step 4: 运行商家端测试**

Run: `npm test -- src/merchant/merchant.test.tsx src/merchant/MerchantPlanPage.test.tsx`

Expected: PASS。

### Task 6：全站视觉统一与最终回归

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `src/App.css`
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Card.tsx`
- Modify: `src/components/ui/Tag.tsx`
- Test: `src/components/ui/ui.test.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: 补充 UI 约束测试**

断言按钮、链接、卡片状态类稳定存在；页面不再依赖浏览器默认蓝色链接；禁用和加载状态可辨认。

- [ ] **Step 2: 统一设计令牌与组件**

统一暖白背景、美团黄主操作、深黑正文、绿色兑现、琥珀风险、红色争议；建立三层圆角、阴影和间距；正文不小于 14px，关键决策信息不小于 16px。

- [ ] **Step 3: 运行完整自动化测试**

Run: `npm test`

Expected: 全部测试 PASS。

- [ ] **Step 4: 运行静态检查和生产构建**

Run: `npm run lint`

Expected: 无 error。

Run: `npm run build`

Expected: TypeScript 与 Vite 构建成功。

- [ ] **Step 5: 浏览器逐页回归**

从 `/trial` 依次检查需求输入、组合筛选、店铺点菜、结算、订单、验证、证据成长、“我的”和商家经营台；验证所有可点击元素均产生选中、加载、Toast、跳转、展开或数据刷新反馈。

---

## 自检结果

- 规格覆盖：已覆盖首页、AI 反馈、店铺决策、交易验证、“我的”、商家端、视觉系统和交互反馈。
- 范围控制：未加入登录、公网部署、社区、积分商城、完整仲裁或真实美团接口。
- 数据一致性：证据成长与商家指标均要求读取现有统一聚合接口。
- 占位符检查：计划中无 TBD、TODO 或未定义的“以后再做”步骤。
