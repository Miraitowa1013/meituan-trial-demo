import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getStores } from '../../shared/api/stores'
import { ChannelFilters } from './ChannelFilters'
import { ChannelHero } from './ChannelHero'
import { StoreFeed } from './StoreFeed'
import './channel.css'

const mealPeriods = [
  { icon: '早', label: '早餐', value: 'breakfast', note: '粥面 · 烘焙 · 饮品' },
  { icon: '午', label: '午餐', value: 'lunch', note: '工作餐 · 轻食 · 米饭' },
  { icon: '晚', label: '晚餐', value: 'dinner', note: '热饭 · 地方菜 · 烧烤' },
  { icon: '夜', label: '夜宵', value: 'lateNight', note: '暖胃粥面 · 炭烤' },
] as const

type MealPeriod = typeof mealPeriods[number]['value']

export function ChannelHomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [queryInput, setQueryInput] = useState(searchParams.get('q') ?? '')
  const query = searchParams.get('q') ?? undefined
  const mealPeriod = (searchParams.get('mealPeriod') || undefined) as MealPeriod | undefined
  const category = searchParams.get('category') ?? undefined
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
  const maxDistance = searchParams.get('maxDistance') ? Number(searchParams.get('maxDistance')) : undefined
  const sort = (searchParams.get('sort') ?? 'recommended') as 'recommended' | 'distance' | 'evidence'

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        if (queryInput.trim()) next.set('q', queryInput.trim())
        else next.delete('q')
        return next
      }, { replace: true })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [queryInput, setSearchParams])

  const storesQuery = useQuery({
    queryKey: ['stores', { query, mealPeriod, category, maxPrice, maxDistance, sort }],
    queryFn: () => getStores({ q: query, mealPeriod, category, maxPrice, maxDistance, sort }),
  })

  const updateParam = (key: string, value?: string | number) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (value === undefined) next.delete(key)
      else next.set(key, String(value))
      return next
    })
  }

  const submitDemand = () => {
    if (!queryInput.trim()) return
    navigate(`/trial/understand?q=${encodeURIComponent(queryInput.trim())}`)
  }

  return (
    <main className="channel-page">
      <ChannelHero
        query={queryInput}
        onQueryChange={setQueryInput}
        onSubmit={submitDemand}
        inputRef={searchInputRef}
      />

      <section className="channel-feed-title">
        <div>
          <span>NEARBY TRIAL STORES</span>
          <h2>附近正在试新</h2>
          <p>先看附近新店，再按时段、品类和可信证据缩小范围。</p>
        </div>
        <div className="channel-feed-title__actions"><Link to="/me">我的试新</Link></div>
      </section>

      <div className="channel-discovery-controls">
      <section className="scenario-themes" aria-labelledby="scenario-title">
        <header>
          <span>MEAL TIME</span>
          <h2 id="scenario-title">先选什么时候吃</h2>
          <small>用餐时段与菜品、价格可以组合选择</small>
        </header>
        <div>
          {mealPeriods.map((period) => (
            <button
              type="button"
              key={period.value}
              className={mealPeriod === period.value ? 'is-active' : ''}
              aria-label={period.label}
              aria-pressed={mealPeriod === period.value}
              onClick={() => updateParam('mealPeriod', mealPeriod === period.value ? undefined : period.value)}
            >
              <i>{period.icon}</i><b>{period.label}</b><span>{period.note}</span>
            </button>
          ))}
        </div>
      </section>

      <ChannelFilters
        categories={storesQuery.data?.facets.categories ?? []}
        category={category}
        onCategoryChange={(value) => updateParam('category', value)}
        maxPrice={maxPrice}
        onMaxPriceChange={(value) => updateParam('maxPrice', value)}
        maxDistance={maxDistance}
        onMaxDistanceChange={(value) => updateParam('maxDistance', value)}
        sort={sort}
        onSortChange={(value) => updateParam('sort', value)}
        onClear={() => setSearchParams((current) => {
          const next = new URLSearchParams()
          const q = current.get('q')
          if (q) next.set('q', q)
          return next
        })}
      />
      </div>

      {storesQuery.isPending && <div className="store-skeleton" aria-label="正在加载店铺"><i /><i /><i /><i /></div>}
      {storesQuery.isError && <div className="channel-error"><b>店铺暂时没有加载出来</b><button onClick={() => storesQuery.refetch()}>重新加载</button></div>}
      {storesQuery.data && <p className="channel-result-count">{storesQuery.data.total} 家符合当前条件</p>}
      {storesQuery.data && <StoreFeed stores={storesQuery.data.items} />}
      {storesQuery.data && <p className="channel-data-notice">数据说明：{storesQuery.data.dataNotice}</p>}
    </main>
  )
}
