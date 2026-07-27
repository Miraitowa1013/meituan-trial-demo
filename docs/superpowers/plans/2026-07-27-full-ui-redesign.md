# 美团试新全站 UI 精修 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `test-driven-development` and `frontend-design` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变业务逻辑和数据口径的前提下，把消费者端与商家端统一为可提交比赛的“美团原生升级版”界面。

**Architecture:** 保留现有 React 页面、路由、查询和数据模型，以 `src/styles/tokens.css` 为视觉契约，先统一基础组件，再逐页调整展示结构和局部样式。行为变化只限于视觉语义和交互反馈；关键页面使用 Testing Library 验证信息顺序与可访问语义，最终使用浏览器完成多尺寸回归。

**Tech Stack:** React 19、TypeScript、Vite、Vitest、Testing Library、CSS

---

## 文件结构

- `src/styles/tokens.css`：颜色、字体、阴影、圆角和布局变量
- `src/styles/global.css`：全局重置、基础组件和可访问交互状态
- `src/styles/motion.css`：有限且支持 reduced-motion 的动效
- `src/app/ConsumerLayout.tsx`、`src/App.css`：消费者端外壳与底部导航
- `src/consumer/channel/*`：首页、筛选和店铺卡片
- `src/consumer/recommendations/*`：AI 推荐结果
- `src/consumer/store/*`：店铺点餐、承诺与证据
- `src/consumer/checkout/*`：结算
- `src/consumer/orders/*`：订单中心和订单详情
- `src/consumer/profile/*`：我的
- `src/consumer/verification/*`：餐后验证和证据成长
- `src/consumer/understanding/*`：AI 需求理解过程
- `src/merchant/*`：经营总览与承诺方案

当前工作区已有大量未提交改动。实施中只修改计划列出的文件，不执行自动提交、重置或暂存。

### Task 1：统一视觉 Token 与基础组件

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `src/styles/motion.css`
- Test: `src/components/ui/ui.test.tsx`

- [ ] **Step 1: 写入基础视觉契约测试**

在 `src/components/ui/ui.test.tsx` 增加主按钮和状态标签的语义测试：

```tsx
it('keeps the primary action and evidence states semantically distinct', () => {
  render(
    <>
      <Button>提交订单</Button>
      <Tag tone="verified">可信稳定</Tag>
      <Tag tone="uncertain">证据成长中</Tag>
      <Tag tone="risk">存在待核验</Tag>
    </>,
  )
  expect(screen.getByRole('button', { name: '提交订单' })).toBeEnabled()
  expect(screen.getByText('可信稳定')).toHaveClass('ui-tag--verified')
  expect(screen.getByText('证据成长中')).toHaveClass('ui-tag--uncertain')
  expect(screen.getByText('存在待核验')).toHaveClass('ui-tag--risk')
})
```

- [ ] **Step 2: 运行测试并确认当前契约**

Run: `npm test -- src/components/ui/ui.test.tsx`  
Expected: PASS；若组件 API 与示例不一致，按现有 API 调整断言，不新增业务属性。

- [ ] **Step 3: 重建 Token**

`tokens.css` 统一使用：

```css
:root {
  --color-brand: #ffd100;
  --color-brand-hover: #ffc400;
  --color-ink: #22211f;
  --color-ink-secondary: #68645c;
  --color-page: #f7f6f2;
  --color-surface: #fff;
  --color-line: #e8e5dd;
  --color-verified: #12805c;
  --color-verified-soft: #eaf7f1;
  --color-uncertain: #9b6a08;
  --color-uncertain-soft: #fff6d8;
  --color-risk: #c24d3c;
  --color-risk-soft: #fff0ed;
  --radius-control: 10px;
  --radius-card: 14px;
  --radius-feature: 20px;
  --shadow-card: 0 8px 24px rgb(34 33 31 / 7%);
  --font-body: "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
}
```

- [ ] **Step 4: 统一按钮、卡片、标签和焦点状态**

在 `global.css` 删除硬黑投影、斜角和宋体展示规则，确保：

```css
.ui-button { min-height: 44px; border-radius: var(--radius-control); }
.ui-button--primary { background: var(--color-brand); box-shadow: none; }
.ui-card { border: 1px solid var(--color-line); border-radius: var(--radius-card); box-shadow: var(--shadow-card); }
:where(button, a, input):focus-visible { outline: 3px solid rgb(255 209 0 / 45%); outline-offset: 2px; }
```

- [ ] **Step 5: 限制动效**

`motion.css` 只保留淡入、筛选切换和数字成长，并添加：

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

- [ ] **Step 6: 验证**

Run: `npm test -- src/components/ui/ui.test.tsx`  
Expected: PASS.

### Task 2：首页、筛选与店铺列表

**Files:**
- Modify: `src/consumer/channel/ChannelHomePage.tsx`
- Modify: `src/consumer/channel/ChannelHero.tsx`
- Modify: `src/consumer/channel/ChannelFilters.tsx`
- Modify: `src/consumer/channel/StoreFeed.tsx`
- Modify: `src/consumer/channel/channel.css`
- Test: `src/consumer/channel/channel.test.tsx`

- [ ] **Step 1: 写首页顺序与状态测试**

```tsx
it('shows discovery controls before a comparable store feed', async () => {
  renderChannel()
  expect(await screen.findByRole('heading', { name: '附近正在试新' })).toBeVisible()
  expect(screen.getByRole('region', { name: '先选什么时候吃' })).toBeVisible()
  expect(await screen.findAllByTestId('store-card')).toHaveLength(12)
  expect(screen.getAllByText(/可信稳定|证据成长中|存在待核验/).length).toBeGreaterThan(0)
})
```

- [ ] **Step 2: 运行测试**

Run: `npm test -- src/consumer/channel/channel.test.tsx`  
Expected: 新的统一状态断言在文案未收敛时 FAIL。

- [ ] **Step 3: 精简 Hero**

保留品牌、标题、说明、搜索和快捷需求；删除海报化装饰。搜索框保持唯一主操作。

- [ ] **Step 4: 合并筛选视觉容器**

保持时段、品类、价格、距离、证据排序可组合；使用统一分组标题、胶囊按钮和明确选中态。

- [ ] **Step 5: 重做店铺卡片**

`StoreFeed.tsx` 保留现有数据字段，将卡片展示收敛为：

```tsx
<article className="store-card" data-testid="store-card">
  <div className="store-card__media">{/* image or category fallback */}</div>
  <div className="store-card__body">
    <header>{/* name, dish, price */}</header>
    <div className="store-card__meta">{/* distance, time, average */}</div>
    <div className="store-card__evidence">{/* one proof */}</div>
    <footer>{/* one state + detail link */}</footer>
  </div>
</article>
```

状态文案固定为“可信稳定 / 证据成长中 / 存在待核验”，解释文案根据现有样本和争议字段生成。

- [ ] **Step 6: 修复导航遮挡**

为列表增加底部安全距离：

```css
.channel-page { padding-bottom: calc(88px + env(safe-area-inset-bottom)); }
```

- [ ] **Step 7: 验证**

Run: `npm test -- src/consumer/channel/channel.test.tsx src/consumer/channel/channel-v1.test.tsx`  
Expected: PASS.

### Task 3：AI 理解、推荐结果与店铺详情

**Files:**
- Modify: `src/consumer/understanding/understanding.css`
- Modify: `src/consumer/recommendations/RecommendationsPage.tsx`
- Modify: `src/consumer/recommendations/RecommendationCard.tsx`
- Modify: `src/consumer/recommendations/recommendations.css`
- Modify: `src/consumer/store/StoreDetailPage.tsx`
- Modify: `src/consumer/store/store-detail.css`
- Test: `src/consumer/recommendations/recommendations.test.tsx`
- Test: `src/consumer/store/store-detail.test.tsx`

- [ ] **Step 1: 写推荐与店铺决策测试**

```tsx
it('separates recommendation reason from current risk', async () => {
  renderPage()
  expect(await screen.findByText('为什么推荐')).toBeVisible()
  expect(screen.getByText('当前风险')).toBeVisible()
})
```

```tsx
it('shows promises before the menu checkout action', async () => {
  renderStore()
  const promiseHeading = await screen.findByRole('heading', { name: '本店可锁定的承诺' })
  const menuHeading = screen.getByRole('heading', { name: '试新套餐' })
  expect(promiseHeading.compareDocumentPosition(menuHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})
```

- [ ] **Step 2: 运行测试**

Run: `npm test -- src/consumer/recommendations/recommendations.test.tsx src/consumer/store/store-detail.test.tsx`  
Expected: 新标题或顺序断言 FAIL。

- [ ] **Step 3: 精修 AI 理解页**

把过程态设计为 1–2 秒可跳过的居中卡片；依次展示预算、品类、口味和可执行履约条件，突出“汤别洒 → 独立密封容器”。

- [ ] **Step 4: 精修推荐卡**

每张推荐卡明确展示“为什么推荐”和“当前风险”，主推荐只用边框和小型标签区分，不使用夸张投影。

- [ ] **Step 5: 重排店铺详情**

店铺信息 → 标签页 → 可锁定承诺 → 商品列表 → 购物车。证据页保留客观兑现、主观分布、复购意愿和结构化记录；商家标签只展示公开信息。

- [ ] **Step 6: 替换单字图片表现**

使用稳定比例的餐品容器和品类插画回退，不改变 store 数据模型。CSS 回退必须有 `aspect-ratio`，避免布局跳动。

- [ ] **Step 7: 验证**

Run: `npm test -- src/consumer/understanding/understanding.test.tsx src/consumer/recommendations/recommendations.test.tsx src/consumer/store/store-detail.test.tsx`  
Expected: PASS.

### Task 4：结算、订单中心与“我的”

**Files:**
- Modify: `src/consumer/checkout/CheckoutPage.tsx`
- Modify: `src/consumer/checkout/checkout.css`
- Modify: `src/consumer/orders/OrderDetailPage.tsx`
- Modify: `src/consumer/orders/OrdersPage.tsx`
- Modify: `src/consumer/orders/orders.css`
- Modify: `src/consumer/profile/MyTrialPage.tsx`
- Modify: `src/consumer/profile/profile.css`
- Modify: `src/app/ConsumerLayout.tsx`
- Modify: `src/App.css`
- Test: `src/consumer/orders/orders.test.tsx`
- Test: `src/checkout.regression-1.test.tsx`

- [ ] **Step 1: 写订单状态与可达性测试**

```tsx
it('keeps every order status reachable from My Trial', async () => {
  renderMyTrial()
  expect(screen.getByRole('button', { name: '待验证' })).toBeVisible()
  expect(screen.getByRole('button', { name: '进行中' })).toBeVisible()
  expect(screen.getByRole('button', { name: '已完成' })).toBeVisible()
  expect(screen.getByRole('button', { name: '争议中' })).toBeVisible()
})
```

- [ ] **Step 2: 运行测试**

Run: `npm test -- src/consumer/orders/orders.test.tsx src/checkout.regression-1.test.tsx`  
Expected: 若当前状态控件不是按钮，语义断言 FAIL。

- [ ] **Step 3: 精修结算页**

统一商品、价格、承诺快照和提交按钮层级；保留“体验环境不扣款”作为弱提示。

- [ ] **Step 4: 精修订单详情**

时间轴展示当前节点，首屏出现下一步操作。演示工具继续收纳在 `<details>` 边缘区域，不进入主要卡片。

- [ ] **Step 5: 精修“我的”**

采用订单中心布局，将状态摘要、订单列表和验证记录放在同一页面；商家演示入口降级为底部辅助卡片。

- [ ] **Step 6: 统一底部导航**

导航高度控制在 64px 左右，并包含安全区：

```css
.consumer-nav {
  min-height: 64px;
  padding-bottom: env(safe-area-inset-bottom);
}
```

- [ ] **Step 7: 验证**

Run: `npm test -- src/consumer/orders/orders.test.tsx src/checkout.regression-1.test.tsx src/app/AppRouter.test.tsx`  
Expected: PASS.

### Task 5：餐后验证与证据成长

**Files:**
- Modify: `src/consumer/verification/VerificationPage.tsx`
- Modify: `src/consumer/verification/EvidenceGrowthPage.tsx`
- Modify: `src/consumer/verification/verification.css`
- Test: `src/consumer/verification/verification.test.tsx`

- [ ] **Step 1: 写逐项验证与异常分支测试**

```tsx
it('reveals evidence upload only after an objective promise is marked unfulfilled', async () => {
  renderVerification()
  expect(screen.queryByLabelText('上传图片凭证')).not.toBeInTheDocument()
  await user.click(await screen.findByRole('button', { name: '未兑现' }))
  expect(screen.getByLabelText('上传图片凭证')).toBeVisible()
})
```

- [ ] **Step 2: 运行测试**

Run: `npm test -- src/consumer/verification/verification.test.tsx`  
Expected: PASS 或在可访问标签不一致时 FAIL。

- [ ] **Step 3: 重构验证视觉**

客观承诺、主观口味和复购意愿分别使用轻量问题卡；按钮文案短、触控区域至少 44px。

- [ ] **Step 4: 重构成长页**

8 → 9 为唯一视觉主角，其余指标为次级列表；三个后续操作按主次排列。

- [ ] **Step 5: 验证**

Run: `npm test -- src/consumer/verification/verification.test.tsx`  
Expected: PASS.

### Task 6：商家经营台与承诺方案

**Files:**
- Modify: `src/merchant/MerchantOverviewPage.tsx`
- Modify: `src/merchant/merchant.css`
- Modify: `src/merchant/MerchantPlanPage.tsx`
- Modify: `src/merchant/merchant-plan.css`
- Test: `src/merchant/merchant.test.tsx`
- Test: `src/merchant/MerchantPlanPage.test.tsx`

- [ ] **Step 1: 写经营指标分块测试**

```tsx
it('separates objective, subjective, repurchase, and pending metrics', async () => {
  renderMerchant()
  expect(await screen.findByText('客观承诺兑现率')).toBeVisible()
  expect(screen.getByText('主观感受符合率')).toBeVisible()
  expect(screen.getByText('正常价复购意愿')).toBeVisible()
  expect(screen.getByText('待核验')).toBeVisible()
})
```

- [ ] **Step 2: 写方案步骤测试**

```tsx
it('shows the complete publish path as distinct steps', async () => {
  renderPlan()
  for (const step of ['选择商品', 'AI 提取', '商家确认', '设置名额', '预览', '发布']) {
    expect(screen.getByText(step)).toBeVisible()
  }
})
```

- [ ] **Step 3: 运行测试**

Run: `npm test -- src/merchant/merchant.test.tsx src/merchant/MerchantPlanPage.test.tsx`  
Expected: 旧步骤文案或结构断言 FAIL。

- [ ] **Step 4: 精修经营总览**

建立桌面后台结构：侧栏、顶部店铺身份、指标条、主证据、成长进度、最近验证与 AI 建议。移动端降为单列，不隐藏关键数据。

- [ ] **Step 5: 精修承诺方案**

把当前 01–04 导航改成业务步骤表达，支持完成、当前和未开始三种状态；保留现有确认、修改、拒绝和发布行为。

- [ ] **Step 6: 验证**

Run: `npm test -- src/merchant/merchant.test.tsx src/merchant/MerchantPlanPage.test.tsx`  
Expected: PASS.

### Task 7：全站回归与浏览器验收

**Files:**
- Modify only if defects are found in files already listed above
- Test: existing Vitest suites
- Test: browser routes

- [ ] **Step 1: 运行全量单元测试**

Run: `npm test`  
Expected: all test files PASS.

- [ ] **Step 2: 运行构建**

Run: `npm run build`  
Expected: TypeScript and Vite build complete with exit code 0.

- [ ] **Step 3: 检查消费者端关键路线**

浏览器依次检查：

```text
/#/trial
/#/trial/understanding
/#/trial/recommendations
/#/trial/stores/store-beef-01
/#/checkout
/#/orders
/#/me
```

确认 390px、768px 和桌面宽度无横向溢出、底部遮挡和伪按钮。

- [ ] **Step 4: 检查商家端**

浏览器检查：

```text
/#/merchant/store-beef-01
/#/merchant/store-beef-01/plans
```

确认指标口径分块、步骤完整、消费者预览入口可达。

- [ ] **Step 5: 最终视觉一致性检查**

检查全站：

- 无默认蓝色链接
- 无宋体和海报式断行
- 无硬黑阴影、斜角和装饰性虚线框
- 所有主按钮使用品牌黄
- 所有可信、成长、风险状态使用统一颜色和文案
- 所有页面底部内容均可完整滚动查看

- [ ] **Step 6: 交付结果**

输出修改文件、测试结果、本地网址和仍未纳入本轮的明确范围。不自动提交 Git。
