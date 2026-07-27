import{render,screen}from'@testing-library/react';import userEvent from'@testing-library/user-event';import{HttpResponse,http}from'msw';import{setupServer}from'msw/node';import{afterAll,beforeAll,beforeEach,expect,it,vi}from'vitest';import{MemoryRouter,Route,Routes}from'react-router-dom';import{AppProviders}from'../app/AppProviders';import{DemoSessionProvider}from'../demo/DemoSessionProvider';import{MerchantOverviewPage}from'./MerchantOverviewPage'
const server=setupServer(http.post('/api/sessions',()=>HttpResponse.json({id:'demo-test',createdAt:'2026-07-22T00:00:00.000Z',resetAt:'2026-07-22T00:00:00.000Z'},{status:201})),http.get('/api/merchant/stores/store-beef-01/overview',()=>HttpResponse.json({store:{id:'store-beef-01',name:'巷口牛肉饭',heroDish:'招牌现切牛肉饭'},todayOrders:1,pendingVerification:0,pendingDisputes:0,metrics:{sealedPackaging:{positive:9,total:9},oilFit:{positive:8,total:9},repurchase:{positive:7,total:9}},growth:{current:9,threshold:10,remaining:1},evidenceSummary:{records:[{id:'record-1',aspect:'独立密封分装',result:'fulfilled',status:'accepted',occurredAt:'2026-07-22T00:00:00.000Z'},{id:'record-2',aspect:'少油感受',result:'rich',status:'accepted',occurredAt:'2026-07-20T00:00:00.000Z'}]},evidence:[],recentOrders:[{id:'order-1',status:'completed',createdAt:'2026-07-22T00:00:00.000Z'}],advice:'独立密封分装已获得 9/9 份兑现验证，是当前最稳定的可证明优势；建议保持为主承诺。',sandbox:true})))
beforeAll(()=>server.listen({onUnhandledRequest:'error'}));afterAll(()=>server.close());beforeEach(()=>localStorage.clear())
it('shows the consumer verification as grounded merchant evidence',async()=>{render(<AppProviders><DemoSessionProvider><MemoryRouter initialEntries={['/merchant/store-beef-01']}><Routes><Route path="/merchant/:storeId" element={<MerchantOverviewPage/>}/></Routes></MemoryRouter></DemoSessionProvider></AppProviders>);expect(await screen.findByRole('heading',{name:'试新经营台'})).toBeInTheDocument();expect(screen.getByText('9/9')).toBeInTheDocument();expect(screen.getByText('9/10')).toBeInTheDocument();expect(screen.getByRole('heading',{name:'最近验证记录'})).toBeInTheDocument();expect(screen.getByText('独立密封分装')).toBeInTheDocument();expect(screen.getByText('偏油')).toBeInTheDocument()})

it('scrolls to verification records without navigating away from the merchant route',async()=>{
  const user=userEvent.setup()
  const scrollIntoView=vi.fn()
  Element.prototype.scrollIntoView=scrollIntoView
  render(<AppProviders><DemoSessionProvider><MemoryRouter initialEntries={['/merchant/store-beef-01']}><Routes><Route path="/merchant/:storeId" element={<MerchantOverviewPage/>}/></Routes></MemoryRouter></DemoSessionProvider></AppProviders>)
  await screen.findByRole('heading',{name:'试新经营台'})
  await user.click(screen.getByRole('button',{name:'验证记录'}))
  expect(scrollIntoView).toHaveBeenCalledWith({behavior:'smooth',block:'start'})
  expect(screen.getByRole('heading',{name:'最近验证记录'})).toBeInTheDocument()
})

it('shows an achieved state without describing an over-threshold store as still approaching the goal',async()=>{
  server.use(http.get('/api/merchant/stores/store-beef-01/overview',()=>HttpResponse.json({
    store:{id:'store-beef-01',name:'巷口牛肉饭',heroDish:'招牌现切牛肉饭'},
    todayOrders:1,pendingVerification:0,pendingDisputes:0,
    metrics:{sealedPackaging:{positive:11,total:11},oilFit:{positive:9,total:11},repurchase:{positive:8,total:11}},
    growth:{current:11,threshold:10,remaining:0},
    evidenceSummary:{records:[]},evidence:[],recentOrders:[],
    advice:'保持已证明的优势。',sandbox:true,
  })))
  render(<AppProviders><DemoSessionProvider><MemoryRouter initialEntries={['/merchant/store-beef-01']}><Routes><Route path="/merchant/:storeId" element={<MerchantOverviewPage/>}/></Routes></MemoryRouter></DemoSessionProvider></AppProviders>)
  expect(await screen.findByRole('heading',{name:'已进入精准推荐实验候选池'})).toBeInTheDocument()
  expect(screen.getByText('10/10')).toBeInTheDocument()
  expect(screen.getByText('超出标准 1 份有效验证')).toBeInTheDocument()
  expect(screen.queryByText('距离进入精准推荐实验候选池')).not.toBeInTheDocument()
})
