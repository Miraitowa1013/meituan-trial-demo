import { Link } from 'react-router-dom'
import type { StoreSummary } from '../../shared/api/contracts'

const stateCopy = {
  growing: { label: '证据成长中', note: '样本较少，结论可能波动' },
  established: { label: '可信稳定', note: '多笔真实订单验证稳定' },
  disputed: { label: '存在待核验', note: '反向反馈正在处理中' },
}

function FoodTile({ store }: { store: StoreSummary }) {
  const hasUsableImage = /^(https?:|data:image\/)/.test(store.heroImage)
  if (hasUsableImage) {
    return <img className="food-tile food-tile--image" src={store.heroImage} alt="" />
  }

  return (
    <div className={`food-tile food-tile--${store.id.split('-')[1] ?? 'default'}`} aria-hidden="true">
      <div className="food-tile__plate"><i /><b /></div>
      <span>{store.category}</span>
    </div>
  )
}

export function StoreFeed({ stores }: { stores: StoreSummary[] }) {
  if (stores.length === 0) {
    return <div className="channel-empty"><b>这次没找到完全匹配的店</b><span>试试放宽预算，或者换一种菜品关键词。</span></div>
  }

  return (
    <section className="store-feed" aria-label="附近试新店铺">
      <div className="store-grid">
        {stores.map((store, index) => {
          const evidence = stateCopy[store.evidenceState]
          return (
            <article className="store-card" data-testid="store-card" key={store.id}>
              <Link to={`/trial/stores/${store.id}`} aria-label={`查看${store.name}`}>
                <div className="store-card__media">
                  <FoodTile store={store} />
                  <span className={`evidence-seal evidence-seal--${store.evidenceState}`}>{evidence.label}</span>
                  {index < 3 && <b className="store-card__rank">0{index + 1}</b>}
                </div>
                <div className="store-card__body">
                  <div className="store-card__title"><div><h3>{store.name}</h3><p>{store.heroDish}</p></div><strong>¥{store.fromPrice}</strong></div>
                  <div className="store-card__meta"><span>{store.distanceMeters < 1000 ? `${store.distanceMeters}m` : `${(store.distanceMeters / 1000).toFixed(1)}km`}</span><span>{store.deliveryMinutes}分钟</span><span>人均¥{store.averagePrice}</span></div>
                  <div className="store-card__proof">
                    <i />
                    <b>{store.evidenceState === 'established' ? '密封分装 9/9' : store.evidenceState === 'growing' ? '密封分装 8/8' : '有 1 份待核验'}</b>
                    <span>{evidence.note}</span>
                  </div>
                  <div className="store-card__footer">
                    <span className={`store-risk store-risk--${store.evidenceState}`}>
                      {evidence.label}
                    </span>
                    <b>查看店铺 →</b>
                  </div>
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
