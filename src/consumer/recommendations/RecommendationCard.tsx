import { Link } from 'react-router-dom'
import type { RecommendationItem } from '../../shared/api/recommendations'

type RecommendationCardProps = {
  item: RecommendationItem
  index: number
}

export function RecommendationCard({ item, index }: RecommendationCardProps) {
  const label = index === 0 ? '主推荐' : `备选 ${index}`
  const distance = item.store.distanceMeters < 1000
    ? `${item.store.distanceMeters}m`
    : `${(item.store.distanceMeters / 1000).toFixed(1)}km`

  return (
    <article className={`recommendation-card ${item.role === 'primary' ? 'recommendation-card--primary' : ''}`}>
      <header>
        <span>{label}</span>
        <small>{item.decisionLabel}</small>
      </header>
      <div className="recommendation-card__store">
        <div aria-hidden="true"><b>{item.store.heroDish.slice(0, 1)}</b><i /></div>
        <section>
          <h2>{item.store.name}</h2>
          <p>{item.store.heroDish} · {distance}</p>
          <strong>¥{item.store.fromPrice}<small> 起</small></strong>
        </section>
      </div>
      <div className="recommendation-card__tradeoff">
        <span>这家的取舍</span>
        <b>{item.tradeoff}</b>
      </div>
      <ul className="recommendation-card__reasons">
        {item.reasons.map((reason) => <li key={reason}><i>✓</i>{reason}</li>)}
      </ul>
      <div className="recommendation-card__risk">
        <span>注意</span>
        <p>{item.risks.join('；')}</p>
      </div>
      <footer>
        <span><b>{item.evidence.validOrders}</b> 份有效验证</span>
        <Link
          to={`/trial/stores/${item.store.id}`}
          aria-label={`查看${item.store.name}可信证据`}
        >
          查看证据并选择套餐 →
        </Link>
      </footer>
    </article>
  )
}
