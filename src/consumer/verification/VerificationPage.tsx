import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDemoSession } from '../../demo/DemoSessionProvider'
import type { SubmitVerificationInput } from '../../shared/api/contracts'
import { getOrder, submitVerification } from '../../shared/api/orders'
import './verification.css'

type ObjectiveResult = SubmitVerificationInput['objectiveResults'][number]['result']

export function VerificationPage() {
  const { orderId = '' } = useParams()
  const { sessionId, status } = useDemoSession()
  const navigate = useNavigate()
  const client = useQueryClient()
  const [objectiveResults, setObjectiveResults] = useState<Record<string, ObjectiveResult>>({})
  const [tasteResult, setTasteResult] = useState<SubmitVerificationInput['tasteResult']>()
  const [repurchaseIntent, setRepurchaseIntent] = useState<SubmitVerificationInput['repurchaseIntent']>()
  const [note, setNote] = useState('')
  const [imagePath, setImagePath] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(sessionId!, orderId),
    enabled: status === 'ready' && Boolean(sessionId && orderId),
  })
  const objectivePromises = query.data?.promises.filter((promise) => promise.kind === 'objective') ?? []
  const hasUnfulfilled = Object.values(objectiveResults).some((result) => result === 'unfulfilled')
  const objectiveComplete = objectivePromises.length > 0
    && objectivePromises.every((promise) => Boolean(objectiveResults[promise.id]))
  const valid = Boolean(
    objectiveComplete
    && tasteResult
    && repurchaseIntent
    && (!hasUnfulfilled || note.trim() || imagePath),
  )

  const mutation = useMutation({
    mutationFn: () => submitVerification(sessionId!, orderId, {
      objectiveResults: objectivePromises.map((promise) => ({
        promiseSnapshotId: promise.id,
        result: objectiveResults[promise.id],
      })),
      tasteResult: tasteResult!,
      repurchaseIntent: repurchaseIntent!,
      note: note.trim() || undefined,
      imagePath,
    }),
    onSuccess(result) {
      client.setQueryData(['verification-result', orderId], result)
      void client.invalidateQueries()
      navigate(`/orders/${orderId}/evidence-growth`)
    },
  })

  if (query.isPending) return <main className="verification-page">正在读取本单承诺…</main>
  if (!query.data || !objectivePromises.length) {
    return <main className="verification-page"><h1>本单没有可验证的客观承诺</h1></main>
  }

  const setAllFulfilled = () => setObjectiveResults(Object.fromEntries(
    objectivePromises.map((promise) => [promise.id, 'fulfilled' as const]),
  ))

  return (
    <main className="verification-page">
      <header>
        <span>餐后验证 · V{objectivePromises[0].version}</span>
        <h1>20 秒，帮下一位少踩坑</h1>
        <p>{query.data.store?.name} · 只记录具体事实和感受</p>
      </header>

      <section className="verification-promise">
        <span>本单随单锁定 · {objectivePromises.length} 项客观承诺</span>
        {objectivePromises.map((promise) => <h2 key={promise.id}>{promise.aspect}</h2>)}
        <small>只验证商家出餐环节；配送途中破损由原履约体系处理，不计入商家失信率。</small>
      </section>

      <button className="verification-quick" type="button" onClick={setAllFulfilled}>
        包装承诺均已做到
      </button>
      <p className="verification-destination">你的答案会进入店铺证据，不会变成一条模糊好评</p>

      {objectivePromises.map((promise) => (
        <fieldset key={promise.id}>
          <legend>{promise.aspect}是否做到？</legend>
          {([
            ['fulfilled', '已兑现'],
            ['unfulfilled', '未兑现'],
            ['unknown', '无法判断'],
          ] as const).map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name={`objective-${promise.id}`}
                aria-label={objectivePromises.length === 1 ? label : `${promise.aspect}：${label}`}
                checked={objectiveResults[promise.id] === value}
                onChange={() => setObjectiveResults((current) => ({ ...current, [promise.id]: value }))}
              />
              {label}
            </label>
          ))}
        </fieldset>
      ))}

      {hasUnfulfilled && (
        <section className="verification-dispute">
          <label>
            补充说明
            <textarea
              aria-label="补充说明"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="例如：没有使用独立密封容器"
            />
          </label>
          <label>
            图片凭证（可选）
            <input
              aria-label="图片凭证"
              type="file"
              accept="image/*"
              onChange={(event) => setImagePath(event.target.files?.[0]?.name ?? null)}
            />
          </label>
          <b>如实负向反馈同样获得完成验证权益</b>
          <small>该项进入待核验，核验完成前不直接降低商家客观兑现率。</small>
        </section>
      )}

      <fieldset>
        <legend>少油感受（主观分布，不做赔付判断）</legend>
        {([
          ['light', '偏清淡'],
          ['balanced', '正合适'],
          ['rich', '偏油'],
        ] as const).map(([value, label]) => (
          <label key={value}>
            <input type="radio" name="taste" aria-label={label} checked={tasteResult === value} onChange={() => setTasteResult(value)} />
            {label}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>正常价格还会再点吗？</legend>
        {([
          ['yes', '愿意正常价复购'],
          ['maybe', '可能会'],
          ['no', '不会'],
        ] as const).map(([value, label]) => (
          <label key={value}>
            <input type="radio" name="repurchase" aria-label={label} checked={repurchaseIntent === value} onChange={() => setRepurchaseIntent(value)} />
            {label}
          </label>
        ))}
      </fieldset>

      {mutation.isError && <p role="alert">提交失败，当前选择已保留，请重试。</p>}
      <button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
        {mutation.isPending ? '正在写入证据…' : '提交有效验证'}
      </button>
    </main>
  )
}
