import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDemoSession } from '../../demo/DemoSessionProvider'
import { createOrder } from '../../shared/api/orders'
import { getStore } from '../../shared/api/stores'
import './checkout.css'

export function CheckoutPage() {
  const [params] = useSearchParams(); const navigate = useNavigate(); const { sessionId, status } = useDemoSession(); const [created, setCreated] = useState(false)
  const storeId = params.get('storeId') ?? ''
  const selections = useMemo(() => params.getAll('item').map((value) => { const [menuItemId, raw] = value.split(':'); return { menuItemId, quantity: Math.max(1, Number(raw) || 1) } }), [params])
  const storeQuery = useQuery({ queryKey: ['store', storeId], queryFn: () => getStore(storeId), enabled: Boolean(storeId) })
  const mutation = useMutation({ mutationFn: () => createOrder(sessionId!, { storeId, items: selections }), onSuccess: (order) => { setCreated(true); window.setTimeout(() => navigate(`/orders/${order.id}`), 650) } })
  if (storeQuery.isPending) return <main className="checkout-page">正在核对套餐…</main>
  if (!storeQuery.data || !selections.length) return <main className="checkout-page"><h1>订单信息不完整</h1><Link to="/trial">返回试新频道</Link></main>
  const store = storeQuery.data
  const currentPlan = store.currentPlan
  const selected = selections.flatMap((selection) => { const item = store.menu.find((candidate) => candidate.id === selection.menuItemId); return item ? [{ ...item, price: item.isTrial && currentPlan ? currentPlan.trialPrice : item.price, quantity: selection.quantity }] : [] })
  const total = selected.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const promises = currentPlan?.claims.filter((claim) => claim.kind === 'objective' && claim.decision !== 'rejected') ?? []
  return <main className="checkout-page">
    <header className="checkout-header">
      <Link to={`/trial/stores/${storeId}`}>← 返回店铺</Link>
      <span>试新保障</span>
      <h1>确认订单</h1>
      <p>送至 · 创新园 A 座</p>
    </header>
    <section className="checkout-store">
      <div className="checkout-section-heading"><span>01</span><h2>{store.name}</h2></div>
      {selected.map((item) => <div className="checkout-line" key={item.id}><span>{item.name} × {item.quantity}</span><b>¥{(item.price * item.quantity).toFixed(1)}</b></div>)}
    </section>
    <section className="checkout-promises">
      <div className="checkout-section-heading"><span>02</span><div><h2>本单承诺</h2><p>不是备注，而是随订单保存的履约依据</p></div></div>
      {promises.length ? promises.map((promise) => <div className="checkout-promise" key={promise.id}><i>✓</i><div><b>{promise.content}</b><span>商家已确认 · V{currentPlan?.version ?? 1} · 随单存证</span></div></div>) : <div className="checkout-promise"><i>✓</i><div><b>商家承诺随订单锁定</b><span>订单创建后可在承诺快照中查看</span></div></div>}
      <small>客观承诺未兑现，可在收餐后提交说明或图片核验；主观口味只进入感受分布。</small>
    </section>
    <section className="checkout-journey" aria-label="试新订单后续流程">
      <div><span>下单前</span><b>商家承诺随订单锁定</b></div>
      <em>→</em>
      <div><span>收餐后</span><b>用 20 秒验证真实履约</b></div>
    </section>
    <section className="checkout-total"><span>试新订单合计</span><b>¥{total.toFixed(1)}</b></section>
    {created && <p className="checkout-status" role="status">订单已创建，正在进入订单详情…</p>}
    {mutation.isError && <p role="alert">订单创建失败，请重试</p>}
    <div className="checkout-submit">
      <button disabled={status !== 'ready' || mutation.isPending || selected.length !== selections.length} onClick={() => mutation.mutate()}>{mutation.isPending ? '正在提交…' : '提交订单'}</button>
      <small className="checkout-data-note">产品体验环境 · 不会产生真实扣款</small>
    </div>
  </main>
}
