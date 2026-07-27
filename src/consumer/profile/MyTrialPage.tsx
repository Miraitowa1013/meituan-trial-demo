import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useOptionalDemoSession } from '../../demo/DemoSessionProvider'
import { getOrders } from '../../shared/api/orders'
import { OrdersPage } from '../orders/OrdersPage'
import './profile.css'

export function MyTrialPage() {
  const session = useOptionalDemoSession()
  const ordersQuery = useQuery({
    queryKey: ['orders', session?.sessionId],
    queryFn: () => getOrders(session!.sessionId!),
    enabled: session?.status === 'ready' && Boolean(session.sessionId),
  })
  const orders = ordersQuery.data?.items ?? []
  const verifiedCount = orders.filter((order) => Boolean(order.verification)).length
  const repurchaseStoreCount = new Set(
    orders
      .filter((order) => order.verification?.repurchaseIntent === 'yes')
      .map((order) => order.storeId),
  ).size

  return (
    <main className="profile-page">
      <header className="profile-hero">
        <div>
          <span>MY TRIAL</span>
          <h1>我的试新</h1>
          <p>订单、验证与常点，都在这里持续留下记录。</p>
        </div>
        <div className="profile-avatar" aria-hidden="true">新</div>
      </header>

      <section className="profile-shortcuts" aria-label="我的试新数据摘要">
        <article>
          <span>已完成验证</span>
          <b>{ordersQuery.isPending ? '—' : `${verifiedCount} 份`}</b>
          <small>验证结果随完成订单长期留存</small>
        </article>
        <article>
          <span>愿意正常价再点</span>
          <b>{ordersQuery.isPending ? '—' : `${repurchaseStoreCount} 家`}</b>
          <small>按已提交的真实复购意愿统计</small>
        </article>
      </section>

      <section className="profile-orders">
        <div className="profile-section-title">
          <div><span>ORDER CENTER</span><h2>我的订单</h2></div>
          <Link to="/trial">继续发现新店</Link>
        </div>
        <OrdersPage embedded />
      </section>

      <aside className="merchant-demo-entry">
        <div><span>比赛演示入口</span><b>切换到商家经营视角</b><small>查看承诺如何发布、验证如何同步。</small></div>
        <Link to="/merchant/store-beef-01">打开商家端</Link>
      </aside>
    </main>
  )
}
