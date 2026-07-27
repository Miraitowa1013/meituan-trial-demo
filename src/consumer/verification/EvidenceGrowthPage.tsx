import { useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import type { VerificationResult } from '../../shared/api/contracts'
import './verification.css'

export function EvidenceGrowthPage() {
  const { orderId = '' } = useParams()
  const result = useQueryClient().getQueryData<VerificationResult>(['verification-result', orderId])

  if (!result) {
    return <main className="growth-page">
      <h1>验证已经保存</h1>
      <p>返回订单中心查看最新状态。</p>
      <Link to="/orders">回到我的订单</Link>
    </main>
  }

  const { before, after } = result
  const remaining = Math.max(0, after.growth.threshold - after.growth.current)
  const displayedCurrent = Math.min(after.growth.current, after.growth.threshold)
  const exceededBy = Math.max(0, after.growth.current - after.growth.threshold)

  return <main className="growth-page">
    <span className="growth-kicker">有效验证已写入</span>
    <h1>你完成了第 {after.validOrders} 份有效验证</h1>
    <p className="growth-intro">下一位有相同顾虑的用户，会多一份真实依据。</p>

    <section className="growth-progress">
      <div><span>可信成长进度</span><b>{displayedCurrent}/{after.growth.threshold}</b></div>
      <div className="growth-track"><i style={{ width: `${Math.min(100, after.growth.current / after.growth.threshold * 100)}%` }} /></div>
      <small>{remaining ? `还差 ${remaining} 份进入精准推荐实验候选池` : '已达到本轮可信成长标准'}</small>
      <div className="growth-number">
        {exceededBy
          ? `当前累计 ${after.growth.current} 份有效验证，超出标准 ${exceededBy} 份`
          : `${before.growth.current}/${before.growth.threshold} → ${after.growth.current}/${after.growth.threshold}`}
      </div>
    </section>

    <div className="growth-metrics">
      <article><b>{after.objective.positive}/{after.objective.total}</b><span>独立密封分装</span></article>
      <article><b>{after.oilFit.positive}/{after.oilFit.total}</b><span>少油感受符合</span></article>
      <article><b>{after.repurchase.positive}/{after.repurchase.total}</b><span>正常价复购意愿</span></article>
    </div>
    <p className="growth-note">{result.disputeCreated ? '本次客观反馈正在核验，暂不计入兑现率。' : '本次验证已同步到店铺证据和商家经营台。'}</p>
    <Link className="growth-primary" to={`/merchant/${result.storeId}`}>查看商家经营台同步结果</Link>
    <Link className="growth-secondary" to={`/trial/stores/${result.storeId}`}>查看更新后的店铺证据</Link>
  </main>
}
