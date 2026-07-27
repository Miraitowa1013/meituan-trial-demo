import { getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import {
  disputes,
  orderItems,
  orderPromiseSnapshots,
  orders,
  verifications,
} from './schema'

describe('transaction database schema', () => {
  it('exports the session-scoped order-to-evidence tables', () => {
    expect([
      getTableName(orders),
      getTableName(orderItems),
      getTableName(orderPromiseSnapshots),
      getTableName(verifications),
      getTableName(disputes),
    ]).toEqual([
      'orders',
      'order_items',
      'order_promise_snapshots',
      'verifications',
      'disputes',
    ])
    expect(orders.sessionId).toBeDefined()
    expect(orderItems.orderId).toBeDefined()
    expect(orderPromiseSnapshots.orderId).toBeDefined()
    expect(verifications.orderId).toBeDefined()
    expect(disputes.verificationId).toBeDefined()
  })
})
