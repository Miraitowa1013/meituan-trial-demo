import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOptionalDemoSession } from '../../demo/DemoSessionProvider'
import { getOrders } from '../../shared/api/orders'
import type { OrderDetail, OrderStatus } from '../../shared/api/contracts'
import './orders.css'

const statusText: Record<OrderStatus, string> = { created:'已创建', preparing:'商家制作中', delivering:'配送中', delivered:'已送达', pending_verification:'待验证', completed:'已完成', disputed:'争议处理中' }
type OrderFilter = 'all' | 'pending' | 'active' | 'completed' | 'disputed'
const filterMeta: Array<{ key: OrderFilter; label: string; statuses?: OrderStatus[]; empty: string }> = [
  { key: 'all', label: '全部', empty: '还没有试新订单' },
  { key: 'pending', label: '待验证', statuses: ['pending_verification'], empty: '当前没有待验证订单' },
  { key: 'active', label: '进行中', statuses: ['created', 'preparing', 'delivering', 'delivered'], empty: '当前没有进行中的订单' },
  { key: 'completed', label: '已完成', statuses: ['completed'], empty: '当前没有已完成订单' },
  { key: 'disputed', label: '争议中', statuses: ['disputed'], empty: '当前没有争议中的订单' },
]

function countFor(items: OrderDetail[], statuses?: OrderStatus[]) {
  return statuses ? items.filter((order) => statuses.includes(order.status)).length : items.length
}

export function OrdersPage({ embedded = false }: { embedded?: boolean }) {
  const session = useOptionalDemoSession()
  const sessionId = session?.sessionId
  const status = session?.status
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('all')
  const query = useQuery({ queryKey:['orders',sessionId], queryFn:()=>getOrders(sessionId!), enabled:status==='ready'&&Boolean(sessionId) })
  const orders = query.data?.items ?? []
  const selectedMeta = filterMeta.find((item) => item.key === activeFilter) ?? filterMeta[0]
  const visibleOrders = selectedMeta.statuses ? orders.filter((order) => selectedMeta.statuses!.includes(order.status)) : orders

  const content = <>
    {!embedded && <header><span>MY TRIALS</span><h1>我的试新订单</h1><p>订单完成后，承诺快照和验证结果都会保留。</p></header>}
    <div className="orders-status-label">订单状态</div>
    <nav aria-label="订单状态筛选">
      {filterMeta.map((item) => <button
        type="button"
        key={item.key}
        className={activeFilter === item.key ? 'is-active' : ''}
        aria-pressed={activeFilter === item.key}
        onClick={() => setActiveFilter(item.key)}
      >{item.label} <b>{countFor(orders, item.statuses)}</b></button>)}
    </nav>
    <section className="orders-list">{visibleOrders.map((order)=><article key={order.id}>
      <div><small>{statusText[order.status]}</small><h2>{order.store?.name}</h2><p>{order.items.map((item)=>`${item.name} × ${item.quantity}`).join('、')}</p></div>
      <b>¥{order.totalAmount.toFixed(1)}</b><Link to={`/orders/${order.id}`}>{order.status === 'pending_verification' ? '去验证' : '查看订单'}</Link>
    </article>)}</section>
    {!query.isPending && !visibleOrders.length && <div className="orders-empty"><b>{selectedMeta.empty}</b><span>{activeFilter === 'all' ? '先去发现一家真正适合你的新店吧。' : '新的状态会在订单推进后自动出现。'}</span>{activeFilter === 'all' && <Link to="/trial">去试新</Link>}</div>}
  </>
  return embedded
    ? <section className="orders-page orders-page--embedded">{content}</section>
    : <main className="orders-page">{content}</main>
}
