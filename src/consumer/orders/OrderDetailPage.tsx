import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDemoSession } from '../../demo/DemoSessionProvider'
import { advanceOrder, getOrder } from '../../shared/api/orders'
const statusText={created:'已创建',preparing:'商家制作中',delivering:'配送中',delivered:'已送达',pending_verification:'待验证',completed:'已完成',disputed:'争议处理中'}
export function OrderDetailPage(){
  const {orderId=''}=useParams(); const navigate=useNavigate(); const {sessionId,status}=useDemoSession(); const client=useQueryClient(); const query=useQuery({queryKey:['order',orderId],queryFn:()=>getOrder(sessionId!,orderId),enabled:status==='ready'&&Boolean(sessionId&&orderId)}); const syncOrder=(order:Awaited<ReturnType<typeof advanceOrder>>)=>{client.setQueryData(['order',orderId],order);void client.invalidateQueries({queryKey:['orders']})}; const advance=useMutation({mutationFn:()=>advanceOrder(sessionId!,orderId),onSuccess:syncOrder}); const fastForward=useMutation({mutationFn:async()=>{let next=query.data!;for(let step=0;step<4&&next.status!=='pending_verification';step+=1)next=await advanceOrder(sessionId!,orderId);return next},onSuccess:(order)=>{syncOrder(order);navigate(`/orders/${order.id}/verify`)}})
  if(query.isPending)return <main className="order-detail-page">正在读取订单…</main>; if(!query.data)return <main className="order-detail-page"><h1>订单不存在</h1></main>; const order=query.data
  const typeLabel={objective:'客观承诺',preference:'主观偏好',specification:'规格声明'} as const
  const resultText={fulfilled:'已兑现',unfulfilled:'未兑现，核验中',unknown:'无法判断'} as const
  const tasteText={light:'偏清淡',balanced:'正合适',rich:'偏油'} as const
  const repurchaseText={yes:'愿意正常价再点',maybe:'可能会再点',no:'暂时不会再点'} as const
  const progressIndex={created:0,preparing:1,delivering:2,delivered:3,pending_verification:4,completed:5,disputed:5}[order.status]
  return <main className="order-detail-page">
    <Link to="/me">← 返回我的试新</Link>
    <header><span>试新保障订单</span><h1>试新订单详情</h1><b>{statusText[order.status]}</b></header>
    <section className="order-progress"><span>订单进度</span><div>{['已下单','制作中','配送中','已送达','待验证'].map((label,index)=><i className={index<=Math.min(progressIndex,4)?'is-done':''} key={label}><b>{index<progressIndex?'✓':index+1}</b><small>{label}</small></i>)}</div></section>
    <section className="order-card"><h2>{order.store?.name}</h2>{order.items.map((item)=><p key={item.id}>{item.name} × {item.quantity}<b>¥{(item.unitPrice*item.quantity).toFixed(1)}</b></p>)}</section>
    <section className="order-promises"><span>随单存证</span><h2>本单承诺快照</h2>{order.promises.map((promise)=><p key={promise.id}><i>✓</i><b>{promise.aspect}</b><small>{promise.kind?typeLabel[promise.kind]:'历史承诺'} · V{promise.version}</small></p>)}<small>下单时已锁定，商家后续修改不会改变本单记录。</small></section>
    {order.verification && <section className="order-verification-result">
      <span>已写入本单</span><h2>本次验证结果</h2>
      <div>{order.verification.items.map((item) => {
        const promise = order.promises.find((candidate) => candidate.id === item.promiseSnapshotId)
        return <p key={item.promiseSnapshotId}><b>{promise?.aspect ?? '客观承诺'}</b><strong>{resultText[item.result]}</strong></p>
      })}</div>
      <p><b>口味感受</b><strong>{tasteText[order.verification.tasteResult]}</strong></p>
      <p><b>复购意愿</b><strong>{repurchaseText[order.verification.repurchaseIntent]}</strong></p>
      {order.verification.note && <small>补充说明：{order.verification.note}</small>}
      <Link to={`/trial/stores/${order.storeId}`}>查看更新后的店铺证据</Link>
    </section>}
    {order.status==='pending_verification'&&<Link className="order-primary-link" to={`/orders/${order.id}/verify`}>去完成餐后验证</Link>}
    {['created','preparing','delivering','delivered'].includes(order.status)&&<><section className="order-next-step"><span>Demo 快速体验</span><h2>餐品送达后，将邀请你验证本单承诺</h2><p>正常业务会随配送状态自动推进；演示中可直接进入验证。</p><button onClick={()=>fastForward.mutate()} disabled={fastForward.isPending}>{fastForward.isPending?'正在模拟履约…':'模拟送达，开始验证'}</button></section><details className="order-sandbox-tools"><summary aria-label="展开演示控制器">演示控制</summary><p>逐步查看制作、配送、送达和待验证状态。</p><button onClick={()=>advance.mutate()} disabled={advance.isPending||fastForward.isPending}>推进订单状态</button></details></>}
  </main>
}
