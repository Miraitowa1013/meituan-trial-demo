import { and, eq, inArray } from 'drizzle-orm'
import type { AppDatabase } from '../../db/client'
import { demoSessions, disputes, evidenceAggregates, evidenceRecords, orders, stores, trialPlans } from '../../db/schema'
import { buildEvidenceSummary } from '../evidence/summary'

export class MerchantUnauthorizedError extends Error{}
export class MerchantStoreNotFoundError extends Error{}

export function createMerchantService(db:AppDatabase){return{async overview(sessionId:string|undefined,storeId:string){
  if(!sessionId||!await db.query.demoSessions.findFirst({where:eq(demoSessions.id,sessionId)}))throw new MerchantUnauthorizedError()
  const store=await db.query.stores.findFirst({where:eq(stores.id,storeId)});if(!store)throw new MerchantStoreNotFoundError()
  const storeOrders=await db.select().from(orders).where(and(eq(orders.sessionId,sessionId),eq(orders.storeId,storeId)))
  const orderIds=storeOrders.map((order)=>order.id);const pendingDisputes=orderIds.length?(await db.select().from(disputes).where(inArray(disputes.orderId,orderIds))).filter((item)=>item.status==='pending').length:0
  const evidence=await db.select().from(evidenceAggregates).where(eq(evidenceAggregates.storeId,storeId));const records=await db.select().from(evidenceRecords).where(eq(evidenceRecords.storeId,storeId));const summary=buildEvidenceSummary(evidence,records);const objectiveRow=evidence.find((item)=>item.evidenceType==='objective')
  const activePlan=await db.query.trialPlans.findFirst({where:and(eq(trialPlans.storeId,storeId),eq(trialPlans.status,'published'))})
  const lastSyncedAt=evidence.reduce((latest,row)=>row.updatedAt>latest?row.updatedAt:latest,new Date(0)).toISOString()
  const objective=objectiveRow?{aspect:objectiveRow.aspect,total:objectiveRow.positiveCount+objectiveRow.neutralCount+objectiveRow.negativeCount,positiveCount:objectiveRow.positiveCount,neutralCount:objectiveRow.neutralCount,negativeCount:objectiveRow.negativeCount,disputedCount:objectiveRow.disputedCount}:undefined
  return{store:{id:store.id,name:store.name,heroDish:store.heroDish},todayOrders:storeOrders.length,pendingVerification:storeOrders.filter((item)=>item.status==='pending_verification').length,pendingDisputes,objective,evidence,evidenceSummary:summary,metrics:{sealedPackaging:{positive:summary.objective.positive,total:summary.objective.total},oilFit:{positive:summary.oilFit.positive,total:summary.oilFit.total},repurchase:{positive:summary.repurchase.positive,total:summary.repurchase.total}},growth:{...summary.growth,remaining:Math.max(0,summary.growth.threshold-summary.growth.current)},activePlan:activePlan?{id:activePlan.id,version:activePlan.version,status:activePlan.status}:null,lastSyncedAt,recentOrders:storeOrders.map((item)=>({...item,createdAt:item.createdAt.toISOString(),updatedAt:item.updatedAt.toISOString()})),advice:`${summary.objective.aspect}已获得 ${summary.objective.positive}/${summary.objective.total} 份兑现验证，是当前最稳定的可证明优势；建议保持为主承诺。`,sandbox:true}
}}}
export type MerchantService=ReturnType<typeof createMerchantService>
