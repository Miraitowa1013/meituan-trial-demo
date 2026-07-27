import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Tag } from '../components/ui/Tag'
import { Drawer } from '../components/ui/Drawer'
import { Toast } from '../components/ui/Toast'
import { parseNeed } from '../ai/client'
import '../App.css'

const steps = ['/opening', '/trial', '/need', '/recommendations', '/store/store-beef-01', '/checkout', '/verify', '/growth', '/merchant']

const stores = [
  { id: 'store-beef-01', name: '巷口牛肉饭', dish: '招牌现切牛肉饭', price: 23.9, distance: '680m', samples: 8, role: '主推荐', decision: '需求最匹配 · 验证量少', tone: 'uncertain' as const, note: '8 份有效验证，结论可能波动', tags: ['可少油', '汤饭分装'] },
  { id: 'store-beef-02', name: '老灶牛肉盖饭', dish: '黑椒牛肉盖饭', price: 25, distance: '920m', samples: 34, role: '备选 1', decision: '验证更充分 · 口味偏浓', tone: 'risk' as const, note: '11 人认为偏油', tags: ['分量足', '验证较多'] },
  { id: 'store-chicken-01', name: '禾味鸡汤饭', dish: '菌菇鸡汤饭', price: 22.8, distance: '760m', samples: 19, role: '备选 2', decision: '口味更稳妥 · 品类替代', tone: 'verified' as const, note: '清淡匹配，但不是牛肉饭', tags: ['口味清淡', '汤饭分装'] },
]

function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return <header className="page-header"><span className="page-header__eyebrow">{eyebrow}</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</header>
}

function FoodVisual({ compact = false }: { compact?: boolean }) {
  return <div className={`food-visual ${compact ? 'food-visual--compact' : ''}`} aria-label="牛肉饭插画" role="img"><svg viewBox="0 0 160 120" aria-hidden="true"><ellipse cx="80" cy="92" rx="62" ry="17" fill="#8d361f"/><path d="M23 52h114l-13 45H36z" fill="#fff8e9" stroke="#251b15" strokeWidth="4"/><ellipse cx="80" cy="52" rx="57" ry="22" fill="#fff" stroke="#251b15" strokeWidth="4"/><path d="M31 51c12-22 33-25 47-8 13-19 35-14 48 8-23 17-73 20-95 0Z" fill="#b94f2c"/><path d="M43 48c8-8 15-9 23-2m23-4c9-7 17-5 25 3" fill="none" stroke="#ffcf70" strokeWidth="5" strokeLinecap="round"/><path d="M76 29c-8-13 10-15 3-25m20 29c13-12-3-18 7-29" fill="none" stroke="#fff4d0" strokeWidth="4" strokeLinecap="round" opacity=".8"/></svg><i>试新中</i></div>
}

function Opening() {
  const navigate = useNavigate()
  return <div className="screen screen--opening">
    <div className="brand-line"><b>美团 <em>MEITUAN</em></b><Tag>产品概念 Demo</Tag></div>
    <PageHeader eyebrow="一个真实但常被忽略的瞬间" title="不是没人想试，是不敢拿一顿饭冒险。" subtitle="新店没有评价；普通评价又回答不了：少油能做到吗？汤会不会洒？" />
    <Card className="opening-store"><FoodVisual /><div className="opening-store__body"><div className="store-title"><div><span>新店 · 开业 19 天</span><h2>巷口牛肉饭</h2></div><strong>¥23.9</strong></div><p className="vague-review">“味道还行，包装一般。”</p><div className="question-pills"><span>少油真能做到？</span><span>汤会不会洒？</span></div><div className="trial-corner">试新 · 正在积累可信证据</div></div></Card>
    <div className="opening-claim"><span>传统评价在说</span><b>“大家觉得怎样”</b><span>试新想回答</span><b>“它适不适合你”</b></div>
    <Button onClick={() => navigate('/legacy/trial')}>看看怎么放心试新</Button>
  </div>
}

function TrialEntry() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('25 元以内，想吃牛肉饭，清淡一点，汤饭分装')
  const [loading, setLoading] = useState(false)
  const find = async () => {
    setLoading(true)
    const result = await parseNeed(query, stores.map((store) => store.id))
    sessionStorage.setItem('meituan-trial-ai-source', result.source)
    setLoading(false)
    navigate('/legacy/need')
  }
  return <div className="screen">
    <div className="mini-nav"><b>美团外卖</b><span>神木路 · 公司</span></div>
    <PageHeader eyebrow="01 · 试新入口" title="今天想吃什么？" subtitle="不用研究评分，直接说出预算、口味和你真正担心的事。" />
    <div className="query-box"><textarea aria-label="试新需求" value={query} onChange={(event) => setQuery(event.target.value)} /><Button aria-label="帮我找合适的" disabled={loading} onClick={find}>{loading ? '正在理解…' : '帮我找合适的'} <span>→</span></Button><small>AI 只负责理解需求，推荐依据来自真实订单验证</small></div>
    <section className="nearby"><div className="section-title"><div><span className="live-dot" />附近正在积累口碑</div><small>演示数据</small></div>{stores.slice(0, 3).map((store) => <div className="nearby-row" key={store.id}><FoodVisual compact /><div><b>{store.name}</b><span>{store.distance} · ¥{store.price}</span></div><Tag tone={store.tone}>{store.samples} 份验证</Tag></div>)}</section>
    <div className="trust-strip"><b>试新保障</b><span>真实订单才可验证</span><span>承诺随订单锁定</span></div>
  </div>
}

function Need() {
  const navigate = useNavigate()
  const [chips, setChips] = useState(['预算 ≤ ¥25', '牛肉饭', '偏清淡', '汤饭分装'])
  const usedFallback = sessionStorage.getItem('meituan-trial-ai-source') === 'fallback'
  return <div className="screen">
    <div className="mini-nav"><button onClick={() => navigate(-1)}>‹</button><b>理解你的需求</b>{usedFallback ? <Tag tone="uncertain">已切换到基础匹配</Tag> : <span>可修改</span>}</div>
    <PageHeader eyebrow="02 · AI 理解" title="我理解成这 4 个条件" subtitle="AI 不替你做决定。删掉或调整任何条件，结果会重新匹配。" />
    <div className="need-orbit"><div className="need-orbit__core"><span>AI 已理解</span><b>4</b><small>个可控条件</small></div>{chips.map((chip, index) => <button key={chip} className={`need-chip need-chip--${index + 1}`} onClick={() => setChips((current) => current.filter((item) => item !== chip))}>{chip}<span>×</span></button>)}</div>
    <Card className="explain-card"><span>本次优先级</span><strong>履约要求 ＞ 口味匹配 ＞ 距离</strong><p>附近商家中已匹配到 3 个可解释选择</p></Card>
    <Button className="wide-button" disabled={chips.length === 0} onClick={() => navigate('/legacy/recommendations')}>查看 3 个合适选择</Button>
    <p className="fallback-note">模型不可用时，将使用相同条件的预设结果完成演示</p>
  </div>
}

function Recommendations() {
  const navigate = useNavigate()
  const results = useMemo(() => stores, [])
  return <div className="screen screen--results">
    <div className="mini-nav"><button onClick={() => navigate(-1)}>‹</button><b>为你找到 3 家</b><button onClick={() => navigate('/legacy/need')}>修改需求</button></div>
    <PageHeader eyebrow="03 · 一主两辅" title="没有绝对最好，只有更适合" subtitle="把匹配理由、样本量和风险同时摆在桌面上。" />
    <div className="result-list">{results.map((store, index) => <article className={`result-card ${index === 0 ? 'result-card--primary' : ''}`} key={store.id}><div className="result-card__role">{store.role}</div><div className="result-card__top"><FoodVisual compact /><div><h2>{store.name}</h2><p>{store.dish} · {store.distance}</p></div><strong>¥{store.price}</strong></div><div className="decision-label">{store.decision}</div><div className="tag-row">{store.tags.map((tag) => <Tag key={tag} tone="verified">{tag}</Tag>)}</div><div className={`evidence-note evidence-note--${store.tone}`}><b>{store.samples} 份有效验证</b><span>{store.note}</span></div><Button variant={index === 0 ? 'primary' : 'secondary'} aria-label={`查看${store.name}证据`} onClick={() => navigate(`/legacy/store/${store.id}`)}>查看可信证据 <span>→</span></Button></article>)}</div>
  </div>
}

function EvidencePage() {
  const navigate = useNavigate()
  const { id = 'store-beef-01' } = useParams()
  const store = stores.find((item) => item.id === id) ?? stores[0]
  const isHero = store.id === 'store-beef-01'
  const split = isHero ? '8/8' : store.id === 'store-beef-02' ? '20/34' : '18/19'
  const oil = isHero ? '7/8' : store.id === 'store-beef-02' ? '18/34' : '17/19'
  return <div className="screen screen--evidence">
    <div className="mini-nav"><button onClick={() => navigate(-1)}>‹</button><b>适配证据</b><Tag tone={store.tone}>{store.samples} 份有效验证</Tag></div>
    <PageHeader eyebrow="04 · 证据详情" title={store.name} subtitle="三类证据，不藏不确定性" />
    <div className={`confidence-banner confidence-banner--${store.tone}`}><b>{store.samples < 10 ? '可信度成长中' : '已有一定参考性'}</b><span>{store.note} · 更新于今天 12:40</span></div>
    <div className="fit-grid"><Card><Tag tone="verified">适合你</Tag><b>清淡口 · 工作日午餐</b><p>少油执行 {oil}，价格在 ¥25 预算内</p></Card><Card><Tag tone="risk">可能不适合你</Tag><b>{store.samples < 10 ? '只选成熟店的人' : '追求清淡口的人'}</b><p>{store.samples < 10 ? '当前样本量仍小，结论可能变化' : store.note}</p></Card></div>
    <section className="evidence-section"><div className="evidence-title"><span>01</span><div><b>客观履约</b><small>能被订单验证的事实</small></div></div><EvidenceBar label="汤饭分装" value={split} percent={isHero ? 100 : 72} /><EvidenceBar label="少油要求" value={oil} percent={isHero ? 88 : 58} /></section>
    <section className="evidence-section"><div className="evidence-title"><span>02</span><div><b>主观感受分布</b><small>不判断好坏，只呈现差异</small></div></div><div className="taste-scale"><i style={{ width: isHero ? '38%' : '18%' }}>偏清淡 {isHero ? 3 : 6}</i><i style={{ width: isHero ? '49%' : '50%' }}>正合适 {isHero ? 4 : 17}</i><i style={{ width: isHero ? '13%' : '32%' }}>偏油 {isHero ? 1 : 11}</i></div></section>
    <section className="evidence-section"><div className="evidence-title"><span>03</span><div><b>真实行为</b><small>意愿与真实复购分开计算</small></div></div><div className="behavior-row"><div><b>{isHero ? '7/8' : '21/34'}</b><span>愿意正常价复购</span></div><div><b>{isHero ? '5/8' : '14/34'}</b><span>加入常点</span></div><div><b>{isHero ? '2/8' : '8/34'}</b><span>已发生真实复购</span></div></div></section>
    <p className="source-note">所有证据来自完成订单的真实用户验证 · 当前内容为合成演示数据</p>
    <Button className="wide-button" onClick={() => navigate(`/legacy/checkout?store=${store.id}`)}>带着承诺去下单</Button>
  </div>
}

function EvidenceBar({ label, value, percent }: { label: string; value: string; percent: number }) {
  return <div className="metric"><div><b>{label}</b><span>{value} 已兑现</span></div><div className="metric__track"><i style={{ width: `${percent}%` }} /></div></div>
}

function CheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const store = stores.find((item) => item.id === searchParams.get('store')) ?? stores[0]
  const originalPrice = (store.price + 4.1).toFixed(1)
  return <div className="screen">
    <div className="mini-nav"><button onClick={() => navigate(-1)}>‹</button><b>确认订单</b><span>演示订单</span></div>
    <PageHeader eyebrow="05 · 承诺锁单" title="不是备注，是随订单生效的承诺" subtitle="商家宣传语被转成具体、可验证、可追溯的履约项目。" />
    <Card className="order-dish"><FoodVisual compact /><div><b>{store.dish}</b><span>试新尝鲜价 ¥{store.price}</span></div></Card>
    <section className="promise-lock"><div className="promise-lock__head"><div><Tag tone="verified">商家已确认</Tag><h2>本单承诺已锁定</h2></div><span className="seal">已存证</span></div><PromiseRow title="汤饭分装" detail="汤与米饭使用独立容器" /><PromiseRow title="执行少油要求" detail="制作端已收到少油参数" /><PromiseRow title="标准牛肉规格" detail="熟制牛肉不少于 80g" /><small>承诺版本 V1.2 · 商家于 2026-07-20 18:30 确认 · 随本订单锁定</small></section>
    <div className="assurance"><b>履约保障</b><span>客观承诺未兑现，可凭订单与图片申请平台核验；核验前暂不计入兑现率。</span></div>
    <Card className="price-card"><span>商品 ¥{originalPrice}</span><span>试新专享 -¥4.1</span><b>实付 ¥{store.price}</b></Card>
    <Button className="wide-button" onClick={() => navigate('/legacy/verify')}>模拟订单已送达</Button>
  </div>
}

function PromiseRow({ title, detail }: { title: string; detail: string }) { return <div className="promise-row"><span>✓</span><div><b>{title}</b><small>{detail}</small></div></div> }

function VerifyPage({ onVerified }: { onVerified: (disputed: boolean) => void }) {
  const navigate = useNavigate()
  const [split, setSplit] = useState(true)
  const [oil, setOil] = useState<'light' | 'right' | 'rich'>('right')
  const disputed = !split
  const submit = () => { onVerified(disputed); navigate('/legacy/growth') }
  return <div className="screen">
    <div className="mini-nav"><span>订单已完成</span><b>有效验证</b><Tag tone="verified">+10 试新值</Tag></div>
    <PageHeader eyebrow="06 · 餐后验证" title="20 秒，留下有效验证" subtitle="不写小作文，只回答与这单承诺直接相关的问题。" />
    <section className="verify-question"><b>汤和米饭是否分装？</b><div className="segmented"><button className={split ? 'selected' : ''} onClick={() => setSplit(true)}>是，已兑现</button><button className={!split ? 'selected negative' : ''} onClick={() => setSplit(false)}>否，未兑现</button></div></section>
    {disputed && <div className="dispute-panel"><Tag tone="risk">将进入平台核验</Tag><b>你的负向反馈同样有价值</b><p>可上传图片作为凭证；核验完成前，该项暂不改变商家兑现率。</p><label>＋ 上传图片凭证<input type="file" accept="image/*" /></label><span>完成验证仍可获得 +10 试新值，不会因选择“否”受惩罚。</span></div>}
    <section className="verify-question"><b>这份牛肉饭的油度感受？</b><div className="segmented segmented--three"><button className={oil === 'light' ? 'selected' : ''} onClick={() => setOil('light')}>偏清淡</button><button className={oil === 'right' ? 'selected' : ''} onClick={() => setOil('right')}>正合适</button><button className={oil === 'rich' ? 'selected' : ''} onClick={() => setOil('rich')}>偏油</button></div></section>
    <section className="verify-question"><b>正常价格，你还愿意再点吗？</b><div className="segmented"><button className="selected">愿意</button><button>暂时不会</button></div></section>
    <Button className="wide-button" onClick={submit}>提交有效验证</Button><p className="source-note">无论反馈好坏，完成真实验证均获得试新值</p>
  </div>
}

function GrowthPage({ disputed, frequent, onFrequent }: { disputed: boolean; frequent: boolean; onFrequent: () => void }) {
  const navigate = useNavigate()
  const [showToast, setShowToast] = useState(false)
  const add = () => { onFrequent(); setShowToast(true); window.setTimeout(() => setShowToast(false), 1200) }
  return <div className="screen screen--growth"><PageHeader eyebrow="07 · 证据成长" title={disputed ? '你的反馈已进入核验' : '你让证据，多长了一格'} subtitle="你的验证，会让下一位担心油不油、汤洒不洒的人，多一份真实参考。" />
    <div className="growth-number"><span>有效验证</span><b>{disputed ? '8 + 1 待核验' : '8 → 9'}</b><small>{disputed ? '争议项暂不计入兑现率' : '可信证据正在成长'}</small></div>
    <Card className="growth-detail"><div><span>汤饭分装</span><b>{disputed ? '8/8 · 待核验 1' : '8/8 → 9/9'}</b></div><div><span>少油执行</span><b>{disputed ? '7/8 · 本次不计入' : '7/8 → 8/9'}</b></div></Card>
    <div className="impact-note"><span>你帮助了</span><b>3 位附近有相同顾虑的用户</b></div>
    <Button className="wide-button" variant={frequent ? 'secondary' : 'primary'} onClick={add}>{frequent ? '已加入常点' : '加入我的常点'}</Button>
    <Button className="wide-button" variant="secondary" onClick={() => navigate('/legacy/merchant')}>看看商家如何使用这份证据</Button>
    {showToast && <Toast message="已加入我的常点" />}
  </div>
}

function MerchantPage() {
  const [drawer, setDrawer] = useState(false)
  return <div className="merchant-screen"><header className="merchant-top"><div><span>美团商家版 · 演示数据</span><h1>试新经营台</h1></div><Button variant="secondary" onClick={() => setDrawer(true)}>编辑本期承诺</Button></header>
    <div className="merchant-grid"><section className="merchant-main"><Card><div className="merchant-card-title"><div><span>本期可信证据</span><h2>巷口牛肉饭</h2></div><Tag tone="verified">9 份有效验证</Tag></div><div className="merchant-kpis"><div><b>9/9</b><span>汤饭分装兑现</span></div><div><b>8/9</b><span>少油执行</span></div><div><b>7/9</b><span>正常价复购意愿</span></div></div></Card><Card><span className="card-kicker">AI 经营建议 · 引用可追溯证据</span><h2>把“汤饭分装”设为主承诺</h2><p><b>9/9 用户验证分装</b>，这是店内目前兑现最稳定、也最能回应用户顾虑的承诺。</p><div className="merchant-actions"><Button>采纳建议</Button><Button variant="secondary">稍后处理</Button></div></Card></section><aside><Card><span className="card-kicker">试新带来的商业结果</span><div className="business-list"><div><b>24</b><span>累计新客</span></div><div><b>+15%</b><span>试新转化率</span></div><div><b>2</b><span>实际正常价复购</span></div></div><small>复购意愿与实际复购分开统计</small></Card><Card><span className="card-kicker">本期承诺来源</span><p>商品信息 → AI 提取候选 → 商家确认 → 平台规则校验</p><Button variant="secondary" onClick={() => setDrawer(true)}>查看提取过程</Button></Card></aside></div>
    <Drawer open={drawer} title="AI 提取候选承诺" onClose={() => setDrawer(false)}><div className="claim-list"><Claim original="汤饭分装" result="可确认：客观模板" tone="verified" /><Claim original="清淡好吃" result="转为：主观口味感受" tone="uncertain" /><Claim original="分量足" result="需修改：填写牛肉克重" tone="risk" /></div><p className="source-note">AI 只提取候选，最终由商家确认或拒绝，平台再校验是否可验证。</p><Button className="wide-button" onClick={() => setDrawer(false)}>确认并返回</Button></Drawer>
  </div>
}

function Claim({ original, result, tone }: { original: string; result: string; tone: 'verified' | 'uncertain' | 'risk' }) { return <div className="claim-row"><div><b>{original}</b><span>{result}</span></div><Tag tone={tone}>{tone === 'verified' ? '确认' : tone === 'risk' ? '修改' : '转换'}</Tag></div> }

function DemoShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const current = Math.max(0, steps.findIndex((step) => `/legacy${step}` === location.pathname))
  const saved = (() => { try { return JSON.parse(localStorage.getItem('meituan-trial-demo:v1') ?? '{}') as { disputed?: boolean; frequent?: boolean } } catch { return {} } })()
  const [disputed, setDisputed] = useState(Boolean(saved.disputed))
  const [frequent, setFrequent] = useState(Boolean(saved.frequent))
  useEffect(() => { localStorage.setItem('meituan-trial-demo:v1', JSON.stringify({ disputed, frequent })) }, [disputed, frequent])
  const reset = () => { setDisputed(false); setFrequent(false); localStorage.removeItem('meituan-trial-demo:v1'); sessionStorage.removeItem('meituan-trial-ai-source'); navigate('/legacy/opening') }
  const merchant = location.pathname === '/legacy/merchant'
  return <main className={`demo-stage ${merchant ? 'demo-stage--desktop' : ''}`}><section className="demo-stage__device" aria-label="试新产品演示"><div className="demo-stage__notch" /><div className="demo-stage__content"><Routes><Route path="/opening" element={<Opening />} /><Route path="/trial" element={<TrialEntry />} /><Route path="/need" element={<Need />} /><Route path="/recommendations" element={<Recommendations />} /><Route path="/store/:id" element={<EvidencePage />} /><Route path="/checkout" element={<CheckoutPage />} /><Route path="/verify" element={<VerifyPage onVerified={setDisputed} />} /><Route path="/growth" element={<GrowthPage disputed={disputed} frequent={frequent} onFrequent={() => setFrequent(true)} />} /><Route path="/merchant" element={<MerchantPage />} /><Route path="*" element={<Navigate to="/opening" replace />} /></Routes></div></section><nav className="demo-stage__control" aria-label="演示控制"><button type="button" disabled={current === 0} onClick={() => navigate(steps[current - 1])}>上一步</button><span className="demo-stage__step">{String(current).padStart(2, '0')} / 08</span><button type="button" disabled={current === 8} onClick={() => navigate(steps[current + 1])}>下一步</button><button type="button" onClick={reset}>重置</button></nav></main>
}

export default function LegacyDemo() { return <DemoShell /> }
