import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { parseDemand, type ParsedDemand } from '../../shared/api/ai'
import './understanding.css'

type EditableDemand = ParsedDemand

export function UnderstandingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const text = searchParams.get('q')?.trim() ?? ''
  const [demand, setDemand] = useState<EditableDemand | null>(null)
  const [showAll, setShowAll] = useState(false)

  const query = useQuery({
    queryKey: ['parse-demand', text],
    queryFn: () => parseDemand(text),
    enabled: text.length > 1,
    retry: false,
  })

  useEffect(() => {
    if (query.data) setDemand(query.data)
  }, [query.data])

  const removeTaste = (taste: string) => {
    setDemand((current) => current ? {
      ...current,
      taste: current.taste.filter((item) => item !== taste),
    } : current)
  }

  const resultCount = demand?.taste.length ? 3 : 5

  const continueToRecommendations = () => {
    if (!demand) return
    const params = new URLSearchParams({
      q: text,
      demand: JSON.stringify({
        budgetMax: demand.budgetMax,
        category: demand.category,
        taste: demand.taste,
        fulfillmentNeeds: demand.fulfillmentNeeds.map((item) => item.normalized),
      }),
    })
    navigate(`/trial/recommendations?${params.toString()}`)
  }

  if (!text) {
    return (
      <main className="understanding-page understanding-page--empty">
        <h1>还没有收到你的需求</h1>
        <button type="button" onClick={() => navigate('/trial')}>返回试新频道</button>
      </main>
    )
  }

  return (
    <main className="understanding-page">
      <header className="understanding-header">
        <button type="button" onClick={() => navigate(-1)} aria-label="返回">‹</button>
        <div><span>AI 需求翻译</span><b>先确认理解，再看选择</b></div>
        <small>{query.isPending ? '理解中' : '可修改'}</small>
      </header>

      <section className="understanding-quote">
        <span>你的原话</span>
        <h1>“{text}”</h1>
      </section>

      {query.isPending && (
        <section className="understanding-progress" aria-label="AI 正在理解需求">
          <span style={{ '--step': 0 } as React.CSSProperties}>识别预算与品类</span>
          <span style={{ '--step': 1 } as React.CSSProperties}>提取口味偏好</span>
          <span style={{ '--step': 2 } as React.CSSProperties}>翻译履约顾虑</span>
          <button type="button" onClick={() => setShowAll(true)}>跳过动画</button>
        </section>
      )}

      {query.isError && (
        <section className="understanding-error">
          <b>暂时没理解完整</b>
          <p>你可以返回重新描述，附近店铺仍可正常浏览。</p>
          <button type="button" onClick={() => query.refetch()}>重新理解</button>
        </section>
      )}

      {demand && (
        <>
          <section className={`understanding-result ${showAll ? 'is-complete' : ''}`}>
            <header><span>AI 理解结果</span><small>{demand.source === 'fallback' ? '基础理解模式' : '智能理解模式'}</small></header>
            <div className="understanding-tags">
              {demand.budgetMax && <button type="button" onClick={() => setDemand({ ...demand, budgetMax: demand.budgetMax === 25 ? 30 : 25 })}>预算 ≤ {demand.budgetMax} 元 <i>修改</i></button>}
              {demand.category && <button type="button">{demand.category}<i>品类</i></button>}
              {demand.taste.map((taste) => (
                <button type="button" key={taste} onClick={() => removeTaste(taste)} aria-label={`删除${taste}`}>
                  {taste}<i>×</i>
                </button>
              ))}
            </div>
          </section>

          {demand.fulfillmentNeeds.map((need) => (
            <section className="semantic-translation" key={need.normalized}>
              <header><span>AI 独有增量</span><b>AI 将配送顾虑改写为商家可控条件</b></header>
              <div>
                <p><small>用户原话</small><strong>{need.raw}</strong></p>
                <i aria-hidden="true">→</i>
                <p><small>随单验证条件</small><strong>{need.normalized}</strong></p>
              </div>
              <footer>只约束商家出餐环节，配送破损不计入商家失信率。</footer>
            </section>
          ))}

          <section className="understanding-control">
            <div><span>根据当前条件</span><b>预计找到 {resultCount} 家</b></div>
            <button type="button" onClick={continueToRecommendations}>查看 {Math.min(resultCount, 3)} 个合适选择</button>
            <small>AI 负责理解与翻译，真实订单证据负责排序和判断。</small>
          </section>
        </>
      )}
    </main>
  )
}
