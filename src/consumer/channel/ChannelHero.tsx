type ChannelHeroProps = {
  query: string
  onQueryChange: (value: string) => void
  onSubmit: () => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

const examples = [
  '今晚加班，25元以内牛肉饭，少油，汤别洒',
  '想吃清淡的一人食，30元以内',
  '找包装稳、适合带回公司的新店',
]

export function ChannelHero({ query, onQueryChange, onSubmit, inputRef }: ChannelHeroProps) {
  return (
    <section className="channel-hero">
      <div className="channel-hero__topline">
        <span>‹ 美团外卖</span>
        <span className="channel-hero__live"><i /> 12 家新店正在积累证据</span>
      </div>
      <div className="channel-hero__copy">
        <p>美团试新 · 可信新店频道</p>
        <h1>想吃什么，先说清楚</h1>
        <span>输入一次需求，直接匹配能兑现的附近新店。</span>
      </div>
      <form className="channel-demand" onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
        <label>
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            type="search"
            aria-label="说说这次想吃什么"
            placeholder="例如：25元内牛肉饭，少油，汤别洒"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <button type="submit" disabled={!query.trim()}>找合适的新店</button>
      </form>
      <div className="channel-hero__suggestions" aria-label="需求示例">
        {examples.map((example) => (
          <button type="button" key={example} onClick={() => onQueryChange(example)}>
            {example.length > 14 ? `${example.slice(0, 14)}…` : example}
          </button>
        ))}
      </div>
    </section>
  )
}
