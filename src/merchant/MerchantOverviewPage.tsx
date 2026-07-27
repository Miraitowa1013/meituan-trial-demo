import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useDemoSession } from '../demo/DemoSessionProvider'
import { getMerchantOverview } from '../shared/api/merchant'
import './merchant.css'

const resultLabel: Record<string, string> = {
  fulfilled: '已兑现',
  unfulfilled: '未兑现',
  light: '偏清淡',
  balanced: '正合适',
  rich: '偏油',
  yes: '愿意复购',
  maybe: '可能复购',
  no: '暂不复购',
}

function ratio(positive: number, total: number) {
  if (!total) return '—'
  return `${Math.round((positive / total) * 100)}%`
}

export function MerchantOverviewPage() {
  const { storeId = '' } = useParams()
  const { sessionId, status } = useDemoSession()
  const query = useQuery({
    queryKey: ['merchant', storeId],
    queryFn: () => getMerchantOverview(sessionId!, storeId),
    enabled: status === 'ready' && Boolean(sessionId && storeId),
    refetchInterval: 3000,
  })

  if (query.isPending) return <main className="merchant-loading">正在同步经营数据…</main>
  if (!query.data) return <main className="merchant-loading"><h1>经营台暂时无法打开</h1></main>

  const data = query.data
  const metrics = data.metrics ?? {
    sealedPackaging: { positive: data.objective?.positiveCount ?? 0, total: data.objective?.total ?? 0 },
    oilFit: { positive: 0, total: 0 },
    repurchase: { positive: 0, total: 0 },
  }
  const growth = data.growth ?? {
    current: data.objective?.total ?? 0,
    threshold: 10,
    remaining: Math.max(0, 10 - (data.objective?.total ?? 0)),
  }
  const growthReached = growth.current >= growth.threshold
  const growthDisplay = Math.min(growth.current, growth.threshold)
  const growthOverflow = Math.max(0, growth.current - growth.threshold)
  const activeVersion = data.activePlan?.version ?? 1
  const syncTime = data.lastSyncedAt
    ? new Date(data.lastSyncedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '刚刚'
  const records = data.evidenceSummary?.records ?? []
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="merchant-console">
      <aside className="merchant-sidebar">
        <Link className="merchant-brand" to={`/merchant/${storeId}`}>
          <span>美团</span>
          <strong>试新经营</strong>
        </Link>
        <div className="merchant-store-identity">
          <small>当前门店</small>
          <b>{data.store.name}</b>
          <span>{data.store.heroDish}</span>
        </div>
        <nav aria-label="商家经营台导航">
          <button aria-label="经营概览" className="is-active" type="button" onClick={() => scrollToSection('overview')}><span>01</span>经营概览</button>
          <Link to={`/merchant/${storeId}/plans`}><span>02</span>承诺方案</Link>
          <button aria-label="验证记录" type="button" onClick={() => scrollToSection('records')}><span>03</span>验证记录</button>
          <button aria-label="订单核验" type="button" onClick={() => scrollToSection('orders')}><span>04</span>订单核验</button>
        </nav>
        <Link className="merchant-consumer-link" to={`/trial/stores/${storeId}`}>
          查看用户端店铺
          <span aria-hidden="true">↗</span>
        </Link>
      </aside>

      <div className="merchant-workspace">
        <header className="merchant-topbar">
          <div>
            <span className="merchant-eyebrow">经营概览 · 方案 V{activeVersion}</span>
            <h1>试新经营台</h1>
            <p>看清用户验证了什么，再决定下一步经营动作。</p>
          </div>
          <div className="merchant-sync"><i aria-hidden="true" />数据已同步 · {syncTime}</div>
        </header>

        <section id="overview" className="merchant-stat-strip" aria-label="今日经营状态">
          <article><span>今日新增试新订单</span><b>+{data.todayOrders}</b><small>较上一时段实时更新</small></article>
          <article><span>待用户验证</span><b>{data.pendingVerification}</b><small>订单完成后邀请验证</small></article>
          <article><span>待核验争议</span><b>{data.pendingDisputes}</b><small>核验前不影响兑现率</small></article>
        </section>

        <section className="merchant-proof-board">
          <div className="merchant-proof-lead">
            <div className="merchant-section-heading">
              <div>
                <span className="merchant-eyebrow">当前最可信优势</span>
                <h2>密封分装是当前最可信优势</h2>
              </div>
              <Link to={`/merchant/${storeId}/plans`}>管理承诺方案</Link>
            </div>
            <div className="merchant-proof-score">
              <strong>{metrics.sealedPackaging.positive}/{metrics.sealedPackaging.total}</strong>
              <div>
                <b>{ratio(metrics.sealedPackaging.positive, metrics.sealedPackaging.total)} 兑现</b>
                <span>来自完成订单的有效验证</span>
              </div>
            </div>
            <div className="merchant-proof-scale" aria-hidden="true">
              <i style={{ width: ratio(metrics.sealedPackaging.positive, metrics.sealedPackaging.total) }} />
            </div>
            <p>这项客观承诺已经成为门店最稳定、最容易被用户理解的可信优势。</p>
          </div>

          <div className="merchant-proof-secondary">
            <article>
              <span>少油感受符合</span>
              <strong>{metrics.oilFit.positive}/{metrics.oilFit.total}</strong>
              <small>{ratio(metrics.oilFit.positive, metrics.oilFit.total)} 用户认为符合预期</small>
            </article>
            <article>
              <span>正常价复购意愿</span>
              <strong>{metrics.repurchase.positive}/{metrics.repurchase.total}</strong>
              <small>{ratio(metrics.repurchase.positive, metrics.repurchase.total)} 用户愿意再次购买</small>
            </article>
          </div>

          <aside className="merchant-action-note">
            <span>下一步建议</span>
            <h2>把已证明的优势放到用户最先看到的位置</h2>
            <p>{data.advice}</p>
            <Link to={`/merchant/${storeId}/plans`}>去调整承诺方案</Link>
          </aside>
        </section>

        <section className="merchant-growth">
          <div className="merchant-section-heading">
            <div>
              <span className="merchant-eyebrow">可信成长</span>
              <h2>{growthReached ? '已进入精准推荐实验候选池' : '距离进入精准推荐实验候选池'}</h2>
            </div>
            <strong>{growthDisplay}/{growth.threshold}</strong>
          </div>
          <div className="merchant-growth-track" aria-label={`当前 ${growth.current} 份，目标 ${growth.threshold} 份`}>
            {Array.from({ length: growth.threshold }, (_, index) => (
              <i key={index} className={index < growth.current ? 'is-done' : ''} />
            ))}
          </div>
          <div className="merchant-growth-copy">
            <b>{growth.remaining > 0
              ? `还差 ${growth.remaining} 份有效订单验证`
              : growthOverflow > 0
                ? `超出标准 ${growthOverflow} 份有效验证`
                : '已达到 Demo 可信标准'}</b>
            <span>10 份仅为演示阈值；真实上线将按品类、区域和风险动态判断。</span>
          </div>
        </section>

        <section id="records" className="merchant-records">
          <div className="merchant-section-heading">
            <div>
              <span className="merchant-eyebrow">订单绑定证据</span>
              <h2>最近验证记录</h2>
            </div>
            <small>历史数据与本次体验实时合并</small>
          </div>
          <div className="merchant-record-table" role="table" aria-label="最近验证记录">
            <div className="merchant-record-row merchant-record-head" role="row">
              <span>验证内容</span><span>来源</span><span>结果</span><span>状态</span>
            </div>
            {records.length ? records.slice(-6).reverse().map((record) => (
              <article className="merchant-record-row" role="row" key={record.id}>
                <div><b>{record.aspect}</b><small>{new Date(record.occurredAt).toLocaleDateString('zh-CN')}</small></div>
                <span>完成订单</span>
                <strong className={record.result === 'unfulfilled' || record.result === 'rich' ? 'is-warning' : ''}>
                  {resultLabel[record.result] ?? record.result}
                </strong>
                <span>{record.status === 'pending' ? '待核验' : '已计入证据'}</span>
              </article>
            )) : <p className="merchant-empty">暂无新增验证，历史聚合指标仍可正常查看。</p>}
          </div>
        </section>

        <section id="orders" className="merchant-order-status">
          <div>
            <span className="merchant-eyebrow">订单核验</span>
            <h2>{data.pendingDisputes > 0 ? `${data.pendingDisputes} 条反馈等待处理` : '当前没有待处理争议'}</h2>
          </div>
          <p>
            {data.recentOrders.length
              ? `体验空间已有 ${data.recentOrders.length} 笔订单，验证后会自动进入上方记录。`
              : '新订单完成后，会在这里进入验证与核验流程。'}
          </p>
        </section>
      </div>
    </main>
  )
}
