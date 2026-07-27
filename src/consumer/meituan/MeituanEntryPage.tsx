import { Link } from 'react-router-dom'
import './meituan-entry.css'

const services = [
  { icon: '餐', label: '外卖', tone: 'orange' },
  { icon: '店', label: '美食', tone: 'red' },
  { icon: '酒', label: '酒店', tone: 'blue' },
  { icon: '休', label: '休闲玩乐', tone: 'violet' },
]

export function MeituanEntryPage() {
  return (
    <main className="meituan-entry">
      <header className="meituan-entry__header">
        <div>
          <span className="meituan-entry__location">神木路 · 公司⌄</span>
          <h1>美团外卖</h1>
        </div>
        <button type="button" aria-label="消息">···</button>
      </header>

      <label className="meituan-entry__search">
        <span aria-hidden="true">⌕</span>
        <input aria-label="搜索商家或商品" placeholder="搜商家、商品或具体需求" />
        <b>搜索</b>
      </label>

      <section className="meituan-entry__services" aria-label="美团服务">
        {services.map((service) => (
          <button type="button" key={service.label}>
            <i data-tone={service.tone}>{service.icon}</i>
            <span>{service.label}</span>
          </button>
        ))}
        <Link className="meituan-entry__trial-service" to="/trial" aria-label="试新，新店也有可信依据">
          <i>新</i>
          <span>试新</span>
          <small>可信首单</small>
        </Link>
      </section>

      <Link className="meituan-entry__trial-banner" to="/trial">
        <div>
          <span>MEITUAN · 试新</span>
          <h2>新店第一次点，<br />也能先看真实依据</h2>
          <p>说出顾虑 · AI 翻译 · 订单验证</p>
        </div>
        <strong>去试新 <b>→</b></strong>
      </Link>

      <section className="meituan-entry__feed">
        <header>
          <div><h2>附近好店</h2><span>综合排序⌄</span></div>
          <p>外卖日常推荐，也能发现正在积累证据的新店</p>
        </header>
        <Link className="meituan-entry__store" to="/trial/stores/store-beef-01">
          <div className="meituan-entry__store-cover"><b>巷</b><span>新店</span></div>
          <div>
            <h3>巷口牛肉饭</h3>
            <p>招牌现切牛肉饭 · 月售 26</p>
            <div><b>¥23.9 起</b><span>配送约 32 分钟</span></div>
            <small>正在试新 · 8 份有效验证</small>
          </div>
        </Link>
      </section>
    </main>
  )
}
