import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  getRecommendations,
  recommendationDemandSchema,
  type RecommendationDemand,
} from '../../shared/api/recommendations'
import { RecommendationCard } from './RecommendationCard'
import './recommendations.css'

function readDemand(raw: string | null): RecommendationDemand | null {
  if (!raw) return null
  try {
    return recommendationDemandSchema.parse(JSON.parse(raw))
  } catch {
    return null
  }
}

export function RecommendationsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const demand = readDemand(searchParams.get('demand'))
  const query = useQuery({
    queryKey: ['recommendations', demand],
    queryFn: () => getRecommendations(demand!),
    enabled: demand !== null,
    retry: false,
  })

  if (!demand) {
    return (
      <main className="recommendations-page recommendations-page--empty">
        <h1>还没有确认需求</h1>
        <button type="button" onClick={() => navigate('/trial')}>返回试新频道</button>
      </main>
    )
  }

  return (
    <main className="recommendations-page">
      <header className="recommendations-header">
        <button type="button" onClick={() => navigate(-1)} aria-label="返回">‹</button>
        <div><span>根据需求与真实证据</span><h1>为你找到 3 个选择</h1></div>
        <button type="button" onClick={() => navigate(`/trial/understand?q=${encodeURIComponent(searchParams.get('q') ?? '')}`)}>修改需求</button>
      </header>

      <section className="recommendations-summary" aria-label="已确认需求">
        {demand.budgetMax && <span>≤ {demand.budgetMax} 元</span>}
        {demand.category && <span>{demand.category}</span>}
        {demand.taste.map((taste) => <span key={taste}>{taste}</span>)}
        {demand.fulfillmentNeeds.map((need) => <span className="is-proof" key={need}>{need}</span>)}
      </section>

      <section className="recommendations-principle">
        <b>没有绝对最好，只有更适合</b>
        <p>把匹配理由、样本量与风险放在同一张桌面上。</p>
      </section>

      {query.isPending && <div className="recommendations-loading" aria-label="正在生成推荐"><i /><i /><i /></div>}
      {query.isError && (
        <section className="recommendations-error">
          <b>这次推荐暂时没有生成</b>
          <p>你仍可返回频道浏览附近新店。</p>
          <button type="button" onClick={() => query.refetch()}>重新生成</button>
        </section>
      )}
      {query.data && (
        <>
          <section className="recommendations-list">
            {query.data.items.map((item, index) => (
              <RecommendationCard item={item} index={index} key={item.store.id} />
            ))}
          </section>
          <p className="recommendations-notice">{query.data.dataNotice}</p>
        </>
      )}
    </main>
  )
}
