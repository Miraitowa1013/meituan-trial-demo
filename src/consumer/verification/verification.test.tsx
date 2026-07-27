import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProviders } from '../../app/AppProviders'
import { DemoSessionProvider } from '../../demo/DemoSessionProvider'
import { EvidenceGrowthPage } from './EvidenceGrowthPage'
import { VerificationPage } from './VerificationPage'

const result = { id:'verification-1',orderId:'order-1',storeId:'store-beef-01',disputeCreated:false,before:{validOrders:8,objective:{aspect:'独立密封分装',positive:8,total:8,disputed:0},oilFit:{aspect:'少油感受',positive:7,total:8,disputed:0},repurchase:{aspect:'正常价复购意愿',positive:6,total:8,disputed:0},growth:{current:8,threshold:10},records:[]},after:{validOrders:9,objective:{aspect:'独立密封分装',positive:9,total:9,disputed:0},oilFit:{aspect:'少油感受',positive:8,total:9,disputed:0},repurchase:{aspect:'正常价复购意愿',positive:7,total:9,disputed:0},growth:{current:9,threshold:10},records:[]} }
const server=setupServer(
  http.post('/api/sessions',()=>HttpResponse.json({id:'demo-test',createdAt:'2026-07-22T00:00:00.000Z',resetAt:'2026-07-22T00:00:00.000Z'},{status:201})),
  http.get('/api/orders/order-1',()=>HttpResponse.json({id:'order-1',storeId:'store-beef-01',status:'pending_verification',store:{name:'巷口牛肉饭'},promises:[{id:'p1',kind:'objective',aspect:'汤与米饭使用独立密封容器',version:1}],items:[]})),
  http.post('/api/orders/order-1/verification',async({request})=>{expect(await request.json()).toMatchObject({objectiveResults:[{promiseSnapshotId:'p1',result:'fulfilled'}]});return HttpResponse.json(result,{status:201})}),
)
beforeAll(()=>server.listen({onUnhandledRequest:'error'}));afterAll(()=>server.close());beforeEach(()=>localStorage.clear())

it('submits a truthful verification and shows evidence growth',async()=>{
  const user=userEvent.setup()
  render(<AppProviders><DemoSessionProvider><MemoryRouter initialEntries={['/orders/order-1/verify']}><Routes><Route path="/orders/:orderId/verify" element={<VerificationPage/>}/><Route path="/orders/:orderId/evidence-growth" element={<EvidenceGrowthPage/>}/></Routes></MemoryRouter></DemoSessionProvider></AppProviders>)
  expect(await screen.findByRole('heading',{name:'20 秒，帮下一位少踩坑'})).toBeInTheDocument()
  await user.click(screen.getByLabelText('已兑现'));await user.click(screen.getByLabelText('偏清淡'));await user.click(screen.getByLabelText('愿意正常价复购'));await user.click(screen.getByRole('button',{name:'提交有效验证'}))
  expect(await screen.findByText('8/10 → 9/10')).toBeInTheDocument()
  expect(screen.getByText('你完成了第 9 份有效验证')).toBeInTheDocument()
  expect(screen.getByText('还差 1 份进入精准推荐实验候选池')).toBeInTheDocument()
  expect(screen.getByRole('link',{name:'查看商家经营台同步结果'})).toHaveAttribute('href','/merchant/store-beef-01')
})

it('requires a note when the user reports an unfulfilled promise',async()=>{
  const user=userEvent.setup()
  render(<AppProviders><DemoSessionProvider><MemoryRouter initialEntries={['/orders/order-1/verify']}><Routes><Route path="/orders/:orderId/verify" element={<VerificationPage/>}/></Routes></MemoryRouter></DemoSessionProvider></AppProviders>)
  await screen.findByRole('heading',{name:'20 秒，帮下一位少踩坑'});await user.click(screen.getByLabelText('未兑现'))
  expect(screen.getByLabelText('补充说明')).toBeInTheDocument();expect(screen.getByText('如实负向反馈同样获得完成验证权益')).toBeInTheDocument()
})

it('offers a fast truthful path and explains the evidence destination',async()=>{
  render(<AppProviders><DemoSessionProvider><MemoryRouter initialEntries={['/orders/order-1/verify']}><Routes><Route path="/orders/:orderId/verify" element={<VerificationPage/>}/></Routes></MemoryRouter></DemoSessionProvider></AppProviders>)
  expect(await screen.findByRole('button',{name:'包装承诺均已做到'})).toBeInTheDocument()
  expect(screen.getByText('你的答案会进入店铺证据，不会变成一条模糊好评')).toBeInTheDocument()
})

it('caps completed growth progress at the threshold while preserving the real total', () => {
  const queryClient = new QueryClient()
  queryClient.setQueryData(['verification-result', 'order-over-threshold'], {
    ...result,
    orderId: 'order-over-threshold',
    before: { ...result.before, validOrders: 11, growth: { current: 11, threshold: 10 } },
    after: { ...result.after, validOrders: 12, growth: { current: 12, threshold: 10 } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/orders/order-over-threshold/evidence-growth']}>
        <Routes>
          <Route path="/orders/:orderId/evidence-growth" element={<EvidenceGrowthPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )

  expect(screen.getByText('10/10')).toBeInTheDocument()
  expect(screen.getByText('当前累计 12 份有效验证，超出标准 2 份')).toBeInTheDocument()
  expect(screen.queryByText('12/10')).not.toBeInTheDocument()
})
