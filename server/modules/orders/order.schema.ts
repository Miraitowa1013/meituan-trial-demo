import { z } from 'zod'

export const createOrderSchema = z.object({
  storeId: z.string().min(1),
  items: z.array(z.object({
    menuItemId: z.string().min(1),
    quantity: z.number().int().min(1).max(10),
  })).min(1),
})

export const orderStatuses = [
  'created',
  'preparing',
  'delivering',
  'delivered',
  'pending_verification',
  'completed',
  'disputed',
] as const

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type OrderStatus = typeof orderStatuses[number]
