import { useState } from 'react'

type ChannelFiltersProps = {
  maxPrice?: number
  onMaxPriceChange: (value?: number) => void
  maxDistance?: number
  onMaxDistanceChange: (value?: number) => void
  category?: string
  categories: string[]
  onCategoryChange: (value?: string) => void
  sort?: 'recommended' | 'distance' | 'evidence'
  onSortChange: (value?: 'recommended' | 'distance' | 'evidence') => void
  onClear: () => void
}

export function ChannelFilters({
  maxPrice,
  onMaxPriceChange,
  maxDistance,
  onMaxDistanceChange,
  category,
  categories,
  onCategoryChange,
  sort,
  onSortChange,
  onClear,
}: ChannelFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const activeCount = [category, maxPrice, maxDistance, sort && sort !== 'recommended' ? sort : undefined].filter(Boolean).length

  return (
    <section className="channel-filter-panel" aria-label="试新筛选">
      <div className="channel-filter-heading"><b>吃什么</b><span>菜品分类可与其他条件叠加</span></div>
      <div className="channel-categories" aria-label="菜品分类">
        <button className={!category ? 'is-active' : ''} onClick={() => onCategoryChange(undefined)}>全部</button>
        {categories.map((item) => (
          <button key={item} className={category === item ? 'is-active' : ''} onClick={() => onCategoryChange(item)}>{item}</button>
        ))}
      </div>
      <div className="channel-filter-heading"><b>怎么选</b><span>价格是条件，距离和证据是排序方式</span></div>
      <div className="channel-filter-row">
        <button className={maxPrice === 25 ? 'is-active' : ''} onClick={() => onMaxPriceChange(maxPrice === 25 ? undefined : 25)}>25元以内</button>
        <button className={sort === 'distance' ? 'is-active' : ''} onClick={() => onSortChange(sort === 'distance' ? 'recommended' : 'distance')}>离我最近</button>
        <button className={sort === 'evidence' ? 'is-active' : ''} onClick={() => onSortChange(sort === 'evidence' ? 'recommended' : 'evidence')}>证据更充分</button>
        <button className={isOpen ? 'is-active channel-filter-trigger' : 'channel-filter-trigger'} onClick={() => setIsOpen(true)}>
          筛选{activeCount ? ` · ${activeCount}` : ''}
        </button>
      </div>

      {isOpen && (
        <div className="filter-sheet-backdrop" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setIsOpen(false)
        }}>
          <div className="filter-sheet" role="dialog" aria-modal="true" aria-label="更多筛选">
            <header><div><small>MORE FILTERS</small><h3>更多筛选</h3></div><button aria-label="关闭筛选" onClick={() => setIsOpen(false)}>×</button></header>
            <section>
              <b>人均预算</b>
              <div>
                {[20, 25, 30].map((price) => (
                  <button key={price} className={maxPrice === price ? 'is-active' : ''} onClick={() => onMaxPriceChange(maxPrice === price ? undefined : price)}>
                    {price}元以内
                  </button>
                ))}
              </div>
            </section>
            <section>
              <b>配送距离</b>
              <div>
                {[{ label: '1公里内', value: 1000 }, { label: '2公里内', value: 2000 }].map((distance) => (
                  <button key={distance.value} className={maxDistance === distance.value ? 'is-active' : ''} onClick={() => onMaxDistanceChange(maxDistance === distance.value ? undefined : distance.value)}>
                    {distance.label}
                  </button>
                ))}
              </div>
            </section>
            <footer>
              <button onClick={onClear}>重置条件</button>
              <button onClick={() => setIsOpen(false)}>完成筛选</button>
            </footer>
          </div>
        </div>
      )}
    </section>
  )
}
