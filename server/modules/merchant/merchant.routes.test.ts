import { randomUUID } from 'node:crypto'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { createApp } from '../../app'
import { createDatabase } from '../../db/client'
import { seedDatabase } from '../../db/seed'
import { createOrderService } from '../orders/order.service'
import { createSessionService } from '../sessions/session.service'
import { createVerificationService } from '../verifications/verification.service'

let database:ReturnType<typeof createDatabase>;let app:ReturnType<typeof createApp>;let sessionId:string
beforeEach(async()=>{database=createDatabase(`file:./data/merchant-test-${randomUUID()}.db`);await migrate(database.db,{migrationsFolder:'./drizzle'});await seedDatabase(database.db);sessionId=(await createSessionService(database.db).create()).id;app=createApp(database.db)})
afterEach(async()=>database.client.close())

it('shows the same verified order and evidence in the merchant overview',async()=>{
  const orders=createOrderService(database.db);const order=await orders.create(sessionId,{storeId:'store-beef-01',items:[{menuItemId:'store-beef-01-trial',quantity:1}]});for(let step=0;step<4;step+=1)await orders.advance(sessionId,order.id);const objective=order.promises.find((promise)=>promise.kind==='objective')!;await createVerificationService(database.db).submit(sessionId,order.id,{objectiveResults:[{promiseSnapshotId:objective.id,result:'fulfilled'}],tasteResult:'light',repurchaseIntent:'yes'})
  const response=await app.request('/api/merchant/stores/store-beef-01/overview',{headers:{'x-demo-session':sessionId}});expect(response.status).toBe(200);expect(await response.json()).toMatchObject({store:{id:'store-beef-01'},todayOrders:1,pendingDisputes:0,metrics:{sealedPackaging:{positive:9,total:9},oilFit:{positive:8,total:9},repurchase:{positive:7,total:9}},growth:{current:9,threshold:10,remaining:1},activePlan:{version:1,status:'published'},lastSyncedAt:expect.any(String),sandbox:true})
})

it('keeps accepted objective totals unchanged while a negative claim is pending',async()=>{
  const orders=createOrderService(database.db)
  const order=await orders.create(sessionId,{storeId:'store-beef-01',items:[{menuItemId:'store-beef-01-trial',quantity:1}]})
  for(let step=0;step<4;step+=1)await orders.advance(sessionId,order.id)
  const objective=order.promises.find((promise)=>promise.kind==='objective')!
  await createVerificationService(database.db).submit(sessionId,order.id,{objectiveResults:[{promiseSnapshotId:objective.id,result:'unfulfilled'}],tasteResult:'rich',repurchaseIntent:'no',note:'没有使用独立密封容器'})
  const response=await app.request('/api/merchant/stores/store-beef-01/overview',{headers:{'x-demo-session':sessionId}})
  expect(await response.json()).toMatchObject({
    pendingDisputes:1,
    metrics:{sealedPackaging:{positive:8,total:8}},
  })
})
