import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDemoSession } from '../demo/DemoSessionProvider'
import type { TrialPlanClaimKind } from '../shared/api/contracts'
import { ApiError } from '../shared/api/http'
import {
  createPlanDraft,
  extractClaimCandidates,
  getPlanWorkbench,
  publishPlan,
  savePlanDraft,
  type ExtractedClaim,
} from '../shared/api/merchantPlans'
import './merchant-plan.css'

type EditableClaim = ExtractedClaim & {
  decision: 'confirmed' | 'modified' | 'rejected'
  sortOrder: number
}

const kindMeta: Record<TrialPlanClaimKind, { label: string; marker: string }> = {
  objective: { label: '客观承诺', marker: '可核验' },
  preference: { label: '主观偏好', marker: '做分布' },
  specification: { label: '规格声明', marker: '仅展示' },
  unverifiable: { label: '不可验证', marker: '不发布' },
}

function errorCode(error: unknown) {
  if (!(error instanceof ApiError)) return 'NETWORK_ERROR'
  const body = error.body as { code?: string } | null
  return body?.code ?? `HTTP_${error.status}`
}

export function MerchantPlanPage() {
  const { storeId = '' } = useParams()
  const { sessionId, status } = useDemoSession()
  const queryClient = useQueryClient()
  const [copy, setCopy] = useState('汤饭分开装，可按备注少油，牛肉标称80g，招牌好吃不踩雷')
  const [draftId, setDraftId] = useState<string>()
  const [benefitLabel, setBenefitLabel] = useState('试新保障')
  const [dailyQuota, setDailyQuota] = useState(10)
  const [trialPrice, setTrialPrice] = useState(23.9)
  const [claims, setClaims] = useState<EditableClaim[]>([])
  const [message, setMessage] = useState('')

  const workbench = useQuery({
    queryKey: ['merchant-plan', storeId],
    queryFn: () => getPlanWorkbench(sessionId!, storeId),
    enabled: status === 'ready' && Boolean(sessionId && storeId),
  })

  useEffect(() => {
    const draft = workbench.data?.draft
    if (!draft || draftId) return
    setDraftId(draft.id)
    setBenefitLabel(draft.benefitLabel)
    setDailyQuota(draft.dailyQuota)
    setTrialPrice(draft.trialPrice)
    setClaims(draft.claims.map((claim) => ({
      ...claim,
      rationale: '继承自当前已发布方案，可继续修改。',
    })))
  }, [draftId, workbench.data?.draft])

  const createDraftMutation = useMutation({
    mutationFn: () => createPlanDraft(sessionId!, storeId),
    onSuccess(draft) {
      setDraftId(draft.id)
      setBenefitLabel(draft.benefitLabel)
      setDailyQuota(draft.dailyQuota)
      setTrialPrice(draft.trialPrice)
      setClaims(draft.claims.map((claim) => ({
        ...claim,
        rationale: '继承自当前方案，等待商家确认。',
      })))
      setMessage(`V${draft.version} 草稿已创建`)
    },
  })

  const extractMutation = useMutation({
    mutationFn: () => extractClaimCandidates(copy),
    onSuccess(result) {
      setClaims(result.candidates.map((claim, index) => ({
        ...claim,
        decision: claim.kind === 'unverifiable' ? 'rejected' : 'confirmed',
        sortOrder: index + 1,
      })))
      setMessage(result.source === 'model' ? '模型识别完成' : '规则兜底识别完成，可继续编辑')
    },
  })

  const publishMutation = useMutation({
    async mutationFn() {
      if (!draftId) throw new Error('DRAFT_REQUIRED')
      await savePlanDraft(sessionId!, storeId, draftId, {
        benefitLabel,
        dailyQuota,
        trialPrice,
        claims: claims.map(({ kind, content, sourceText, decision, sortOrder }) => ({
          kind,
          content,
          sourceText,
          decision,
          sortOrder,
        })),
      })
      return publishPlan(sessionId!, storeId, draftId)
    },
    async onSuccess(plan) {
      setDraftId(undefined)
      setMessage(`V${plan.version} 已发布，新订单将锁定这一版本`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['merchant-plan', storeId] }),
        queryClient.invalidateQueries({ queryKey: ['store', storeId] }),
        queryClient.invalidateQueries({ queryKey: ['merchant', storeId] }),
      ])
    },
  })

  const active = workbench.data?.active
  const busy = createDraftMutation.isPending || extractMutation.isPending || publishMutation.isPending
  const error = createDraftMutation.error || extractMutation.error || publishMutation.error

  if (workbench.isPending) return <main className="plan-page plan-loading">正在打开方案工作台…</main>
  if (!active) return <main className="plan-page plan-loading">当前门店没有可编辑的试新方案。</main>

  return (
    <main className="plan-page">
      <header className="plan-header">
        <div>
          <span className="plan-eyebrow">MEITUAN TRIAL · SUPPLY STUDIO</span>
          <h1>方案与承诺</h1>
          <p>把商品卖点转成用户看得懂、订单锁得住、餐后验得了的证据。</p>
        </div>
        <div className="plan-version-stamp">
          <span>当前线上</span>
          <strong>V{active.version}</strong>
          <small>{active.status === 'published' ? '已发布' : active.status}</small>
        </div>
      </header>

      <nav className="plan-nav" aria-label="商家工作台导航">
        <Link to={`/merchant/${storeId}`}>← 经营概览</Link>
        <span>方案与承诺</span>
        <Link to={`/trial/stores/${storeId}`}>查看用户端 ↗</Link>
      </nav>

      {message && <div className="plan-status" role="status">{message}</div>}
      {error && <div className="plan-error" role="alert">操作未完成：{errorCode(error)}。表单内容已保留，可重试。</div>}

      <section className="plan-board">
        <aside className="plan-rail" aria-label="承诺方案发布进度">
          <span>承诺方案发布进度</span>
          <ol>
            <li className={draftId ? 'done' : 'current'}>
              <b>{draftId ? '✓' : '01'}</b>
              <p>创建 V{active.version + 1} 草稿<small>{draftId ? '已完成' : '当前步骤'}</small></p>
            </li>
            <li className={claims.length ? 'done' : draftId ? 'current' : ''}>
              <b>{claims.length ? '✓' : '02'}</b>
              <p>AI 提取候选卖点<small>{claims.length ? '已完成' : draftId ? '当前步骤' : '等待上一步'}</small></p>
            </li>
            <li className={claims.length ? 'current' : ''}>
              <b>03</b>
              <p>商家确认责任边界<small>{claims.length ? '当前步骤' : '等待上一步'}</small></p>
            </li>
            <li>
              <b>04</b>
              <p>发布并供新订单锁定<small>等待上一步</small></p>
            </li>
          </ol>
          <div className="plan-principle">
            <span>核心原则</span>
            <strong>AI 只提候选<br />商家做最终决定</strong>
          </div>
        </aside>

        <div className="plan-workspace">
          {!draftId ? (
            <section className="plan-active-card">
              <div>
                <span>试新方案 V{active.version}</span>
                <h2>{active.title}</h2>
                <p>试新价 ¥{active.trialPrice} · 每日 {active.dailyQuota} 份 · 剩余 {active.remainingQuota} 份</p>
              </div>
              <button type="button" onClick={() => createDraftMutation.mutate()} disabled={busy}>
                编辑为新版本
              </button>
              <div className="plan-claim-preview">
                {active.claims.filter((claim) => claim.decision !== 'rejected').map((claim) => (
                  <span key={claim.id}>{kindMeta[claim.kind].label} · {claim.content}</span>
                ))}
              </div>
            </section>
          ) : (
            <>
              <section className="plan-form-card">
                <div className="plan-section-title">
                  <span>V{active.version + 1} DRAFT</span>
                  <h2>先定义试新的边界</h2>
                </div>
                <div className="plan-fields">
                  <label>试新价（元）<input type="number" min="0.1" step="0.1" value={trialPrice} onChange={(event) => setTrialPrice(Number(event.target.value))} /></label>
                  <label>每日名额（份）<input type="number" min="1" max="100" value={dailyQuota} onChange={(event) => setDailyQuota(Number(event.target.value))} /></label>
                  <label>用户权益<input value={benefitLabel} onChange={(event) => setBenefitLabel(event.target.value)} /></label>
                </div>
                <label className="plan-copy-field">
                  商品卖点原文
                  <textarea aria-label="商品卖点原文" rows={3} value={copy} onChange={(event) => setCopy(event.target.value)} />
                </label>
                <button aria-label="AI 识别可验证卖点" className="plan-ai-button" type="button" onClick={() => extractMutation.mutate()} disabled={busy || copy.trim().length < 2}>
                  <span>AI</span>{extractMutation.isPending ? '正在识别责任边界…' : 'AI 识别可验证卖点'}
                </button>
              </section>

              {claims.length > 0 && (
                <section className="claim-decision-list">
                  <div className="plan-section-title">
                    <span>EVIDENCE-SAFE CLAIMS</span>
                    <h2>逐项确认，拒绝空泛宣传</h2>
                  </div>
                  {claims.map((claim, index) => {
                    const meta = kindMeta[claim.kind]
                    return (
                      <article key={claim.id} className={`claim-card claim-${claim.kind} ${claim.decision === 'rejected' ? 'is-rejected' : ''}`}>
                        <div className="claim-index">{String(index + 1).padStart(2, '0')}</div>
                        <div className="claim-body">
                          <div className="claim-heading"><span>{meta.label}</span><em>{meta.marker}</em></div>
                          <input
                            aria-label={`编辑 ${claim.content}`}
                            value={claim.content}
                            disabled={claim.decision === 'rejected'}
                            onChange={(event) => setClaims((items) => items.map((item) =>
                              item.id === claim.id ? { ...item, content: event.target.value, decision: 'modified' } : item))}
                          />
                          <p>{claim.rationale}</p>
                        </div>
                        <div className="claim-actions">
                          <button
                            type="button"
                            aria-label={`确认 ${claim.content}`}
                            className={claim.decision !== 'rejected' ? 'selected' : ''}
                            onClick={() => setClaims((items) => items.map((item) =>
                              item.id === claim.id ? { ...item, decision: 'confirmed' } : item))}
                          >确认</button>
                          <button
                            type="button"
                            aria-label={`拒绝 ${claim.content}`}
                            className={claim.decision === 'rejected' ? 'selected reject' : ''}
                            onClick={() => setClaims((items) => items.map((item) =>
                              item.id === claim.id ? { ...item, decision: 'rejected' } : item))}
                          >拒绝</button>
                        </div>
                      </article>
                    )
                  })}
                  <footer className="plan-publish-bar">
                    <div><span>发布后</span><p>仅影响新订单；历史订单继续保留原版本快照。</p></div>
                    <button type="button" onClick={() => publishMutation.mutate()} disabled={busy || !claims.some((claim) => claim.kind === 'objective' && claim.decision !== 'rejected')}>
                      {publishMutation.isPending ? '正在发布…' : '发布试新方案'}
                    </button>
                  </footer>
                </section>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}
