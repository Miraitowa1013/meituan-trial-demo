import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Drawer } from '../../components/ui/Drawer'
import { getStore } from '../../shared/api/stores'
import './store-detail.css'

const evidenceStateCopy = {
  growing: {
    label: '可信度成长中',
    note: '证据少不等于不好，我们把不确定性说清楚。',
  },
  established: {
    label: '已形成稳定证据',
    note: '样本更多，但仍会展示不适配反馈与口味分歧。',
  },
  disputed: {
    label: '存在待核验争议',
    note: '争议结论暂不计入兑现率，确认后再更新。',
  },
}

export function StoreDetailPage() {
  const { storeId = '' } = useParams()
  const navigate = useNavigate()
  const [lensOpen, setLensOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'menu' | 'evidence' | 'merchant'>('menu')
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const storeQuery = useQuery({ queryKey: ['store', storeId], queryFn: () => getStore(storeId), enabled: Boolean(storeId) })

  if (storeQuery.isPending) return <main className="store-detail-loading">正在打开可信档案…</main>
  if (storeQuery.isError || !storeQuery.data) return <main className="store-detail-error"><h1>店铺没有加载出来</h1><Link to="/trial">返回频道</Link></main>

  const store = storeQuery.data
  const currentPlan = store.currentPlan
  const effectivePlan = currentPlan ?? (store.trialPlan ? {
    ...store.trialPlan,
    trialPrice: store.trialPlan.trialPrice ?? store.menu.find((item) => item.isTrial)?.price ?? store.fromPrice,
    version: store.trialPlan.version ?? 1,
    claims: [],
  } : null)
  const publishedClaims = effectivePlan?.claims.filter((claim) => claim.decision !== 'rejected') ?? []
  const objectiveClaims = publishedClaims.filter((claim) => claim.kind === 'objective')
  const preferenceClaims = publishedClaims.filter((claim) => claim.kind === 'preference')
  const itemPrice = (item: typeof store.menu[number]) => item.isTrial && effectivePlan ? effectivePlan.trialPrice : item.price
  const evidenceState = evidenceStateCopy[store.evidenceState]
  const legacyMetric=(type:'objective'|'subjective'|'behavioral')=>{const row=store.evidence.find((item)=>item.evidenceType===type);return{aspect:row?.aspect??'',positive:row?.positiveCount??0,total:(row?.positiveCount??0)+(row?.neutralCount??0)+(row?.negativeCount??0),disputed:row?.disputedCount??0}}
  const summary=store.evidenceSummary??{validOrders:legacyMetric('objective').total,objective:legacyMetric('objective'),oilFit:legacyMetric('subjective'),repurchase:legacyMetric('behavioral'),growth:{current:legacyMetric('objective').total,threshold:10},records:[]}
  const selectedCount = Object.values(selectedItems).reduce((sum, quantity) => sum + quantity, 0)
  const selectedTotal = store.menu.reduce((sum, item) => sum + itemPrice(item) * (selectedItems[item.id] ?? 0), 0)
  const toggleItem = (itemId: string) => setSelectedItems((current) => current[itemId]
    ? Object.fromEntries(Object.entries(current).filter(([id]) => id !== itemId))
    : { ...current, [itemId]: 1 })
  const openCheckout = () => {
    if (!selectedCount && store.menu[0]) setSelectedItems({ [store.menu[0].id]: 1 })
    setCheckoutOpen(true)
  }
  const continueToCheckout = () => {
    const effectiveItems = selectedCount ? selectedItems : (store.menu[0] ? { [store.menu[0].id]: 1 } : {})
    const search = new URLSearchParams({ storeId })
    Object.entries(effectiveItems).forEach(([itemId, quantity]) => search.append('item', `${itemId}:${quantity}`))
    setCheckoutOpen(false)
    navigate(`/checkout?${search.toString()}`)
  }
  return (
    <main className="store-detail-page">
      <header className="store-detail-hero">
        <Link to="/trial" aria-label="返回试新频道">←</Link>
        <div className="store-detail-hero__visual"><span>{store.heroDish.slice(0, 1)}</span><i /></div>
        <div className="store-detail-hero__content">
          <p>{store.category} · {store.distanceMeters}m · 预计{store.deliveryMinutes}分钟</p>
          <h1>{store.name}</h1>
          <span>{store.heroDish} · 人均¥{store.averagePrice}</span>
          <div><b>{evidenceState.label}</b><span>{evidenceState.note}</span></div>
        </div>
      </header>

      <nav className="store-tabs" role="tablist" aria-label="店铺内容">
        <button type="button" role="tab" aria-selected={activeTab === 'menu'} className={activeTab === 'menu' ? 'is-active' : ''} onClick={() => setActiveTab('menu')}>点菜</button>
        <button type="button" role="tab" aria-selected={activeTab === 'evidence'} className={activeTab === 'evidence' ? 'is-active' : ''} onClick={() => setActiveTab('evidence')}>证据</button>
        <button type="button" role="tab" aria-selected={activeTab === 'merchant'} className={activeTab === 'merchant' ? 'is-active' : ''} onClick={() => setActiveTab('merchant')}>商家</button>
      </nav>

      {effectivePlan && <section hidden={activeTab !== 'menu'} className="trial-plan-banner"><div><span>美团试新 · 承诺版本 V{effectivePlan.version}</span><h2>{effectivePlan.title}</h2><p>今日剩余 {effectivePlan.remainingQuota}/{effectivePlan.dailyQuota} 份 · 试新价 ¥{effectivePlan.trialPrice}</p></div><b>{effectivePlan.benefitLabel}</b></section>}

      <section hidden={activeTab !== 'evidence'} className="store-decision">
        <header><div><span>本次试新判断</span><h2>这次是否适合你</h2></div><b>{summary.validOrders} 笔有效订单</b></header>
        <div className="store-decision__verdict"><i aria-hidden="true">✓</i><div><strong>{store.decisionProfile.verdict}</strong><p>{summary.objective.aspect} {summary.objective.positive}/{summary.objective.total}，{summary.oilFit.aspect} {summary.oilFit.positive}/{summary.oilFit.total} 符合。</p></div></div>
        <div className="store-fit-grid">
          <div><span>更适合</span><b>{store.decisionProfile.fitFor}</b></div>
          <div><span>下单前注意</span><b>{store.decisionProfile.notFor}</b><p>当前有 {summary.validOrders} 笔有效订单，{Math.max(0, summary.oilFit.total - summary.oilFit.positive)} 份口味反馈未完全符合少油偏好。</p></div>
        </div>
      </section>

      <section hidden={activeTab !== 'menu'} className="store-promises">
        <header><div><span>下单后随订单留存</span><h2>本店可锁定的承诺</h2></div><small>版本 V{effectivePlan?.version ?? 1}</small></header>
        <div className="store-promises__list">
          {(objectiveClaims.length ? objectiveClaims : [{ id: 'summary-objective', content: summary.objective.aspect }]).map((claim) => (
            <article key={claim.id}><i>承诺</i><div><b>{claim.content}</b><span>来自商家确认，餐后可逐项验证</span></div><strong>{summary.objective.positive}/{summary.objective.total}</strong></article>
          ))}
          {preferenceClaims.map((claim) => <article key={claim.id}><i>可选</i><div><b>{claim.content}</b><span>属于口味偏好，结果展示为感受分布</span></div><strong>{summary.oilFit.positive}/{summary.oilFit.total}</strong></article>)}
        </div>
        {(store.specifications??[]).map((spec)=><p className="store-specification" key={spec.label}>{spec.label}：{spec.value} <small>商家商品信息，不计入兑现率</small></p>)}
      </section>

      <section hidden={activeTab !== 'evidence'} className="store-evidence">
        <header><div><span>近 30 天</span><h2>真实订单验证</h2></div><button aria-label="证据透镜" onClick={() => setLensOpen(true)}>查看验证明细</button></header>
        <div className="store-proof-strip">
          <article><b>{summary.objective.positive}/{summary.objective.total}</b><span>{summary.objective.aspect}兑现</span></article>
          <article><b>{summary.oilFit.positive}/{summary.oilFit.total}</b><span>{summary.oilFit.aspect}符合</span></article>
          <article><b>{summary.repurchase.positive}/{summary.repurchase.total}</b><span>{summary.repurchase.aspect}</span></article>
        </div>
        <p className="store-risk-note"><b>当前风险</b>样本仍在增长；{Math.max(0, summary.oilFit.total - summary.oilFit.positive)} 份口味反馈未完全符合少油偏好。</p>
      </section>

      <section hidden={activeTab !== 'menu'} className="store-menu"><header><div><span>MENU</span><h2>试新套餐</h2><p>选好餐品后，本店公开承诺会随订单锁定。</p></div><small>{store.menu.length} 个可选商品</small></header><div>{store.menu.map((item) => {
        const selected = Boolean(selectedItems[item.id])
        return <article className={selected ? 'is-selected' : ''} data-testid="menu-item" key={item.id}><div className="menu-food"><span>{item.name.slice(0, 1)}</span></div><div><p>{item.isTrial ? `试新专享 · V${effectivePlan?.version ?? 1}` : '店内热卖'}</p><h3>{item.name}</h3><span>{item.description}</span><strong>¥{itemPrice(item)}</strong></div><button aria-label={`${selected ? '减少' : '添加'}${item.name}`} onClick={() => toggleItem(item.id)}>{selected ? '✓' : '＋'}</button></article>
      })}</div></section>

      {activeTab === 'merchant' && <section className="store-public-info">
        <span>消费者可见信息</span>
        <h2>商家信息</h2>
        <dl>
          <div><dt>店铺名称</dt><dd>{store.name}</dd></div>
          <div><dt>主营品类</dt><dd>{store.category}</dd></div>
          <div><dt>配送距离</dt><dd>{store.distanceMeters}m</dd></div>
          <div><dt>试新状态</dt><dd>{evidenceState.label}</dd></div>
        </dl>
        <p>经营数据、AI 建议和承诺发布工具仅在独立商家经营台展示，不向消费者公开。</p>
      </section>}

      {activeTab === 'menu' && <div className="store-action-bar"><div><span>{selectedCount ? `已选 ${selectedCount} 份` : '试新价'}</span><b>¥{selectedCount ? selectedTotal.toFixed(1) : store.fromPrice}</b></div><button onClick={openCheckout}>{selectedCount ? '确认套餐与承诺' : '选择套餐与承诺'}</button></div>}
      <p className="store-data-notice">{store.dataNotice}</p>
      <Drawer open={lensOpen} title="证据透镜" onClose={() => setLensOpen(false)}>
        <div className="evidence-lens"><p>每条证据均来自完成订单；不展示自由评论，不隐藏反证。</p>{summary.records.length?summary.records.slice(-9).reverse().map((record) => <article key={record.id}><b>{record.aspect}</b><span>{record.result==='fulfilled'?'已兑现':record.result==='rich'?'偏油':record.result==='light'?'偏清淡':record.result==='yes'?'愿意复购':record.result}</span><small>{new Date(record.occurredAt).toLocaleDateString('zh-CN')} · 完成订单 · {record.status==='pending'?'待核验':'已计入'}</small></article>):store.evidence.map((evidence)=><article key={evidence.id}><b>{evidence.aspect}</b><span>匿名沙盒数据</span><small>待核验 {evidence.disputedCount} 份</small></article>)}</div>
      </Drawer>
      <Drawer open={checkoutOpen} title="确认试新订单" onClose={() => setCheckoutOpen(false)}>
        <div className="checkout-drawer"><p>已选 {selectedCount || 1} 份套餐 · 合计 ¥{(selectedCount ? selectedTotal : store.menu[0] ? itemPrice(store.menu[0]) : 0).toFixed(1)}</p><h3>随本单锁定的承诺</h3><ul>{objectiveClaims.length?objectiveClaims.map((claim)=><li key={claim.id}>客观承诺：{claim.content}</li>):<li>客观承诺：{summary.objective.aspect}</li>}<li>承诺版本 V{effectivePlan?.version ?? 1} 随订单留档</li><li>未兑现可在订单完成后提交核验</li></ul><button type="button" onClick={continueToCheckout}>继续核对配送信息</button></div>
      </Drawer>
    </main>
  )
}
