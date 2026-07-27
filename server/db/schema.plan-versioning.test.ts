import { getTableColumns } from 'drizzle-orm'
import { expect, it } from 'vitest'
import {
  orderPromiseSnapshots,
  trialPlanClaims,
  trialPlans,
  verificationItems,
} from './schema'

it('supports versioned plans and typed immutable promise verification', () => {
  expect(getTableColumns(trialPlans)).toMatchObject({
    version: expect.anything(),
    menuItemId: expect.anything(),
    trialPrice: expect.anything(),
    publishedAt: expect.anything(),
  })
  expect(getTableColumns(trialPlanClaims)).toMatchObject({
    planId: expect.anything(),
    kind: expect.anything(),
    content: expect.anything(),
    decision: expect.anything(),
  })
  expect(getTableColumns(orderPromiseSnapshots)).toMatchObject({
    planId: expect.anything(),
    claimId: expect.anything(),
    kind: expect.anything(),
  })
  expect(getTableColumns(verificationItems)).toMatchObject({
    verificationId: expect.anything(),
    promiseSnapshotId: expect.anything(),
    result: expect.anything(),
  })
})
