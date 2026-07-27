import { z } from 'zod'

export const submitVerificationSchema = z.object({
  objectiveResults: z.array(z.object({
    promiseSnapshotId: z.string().min(1),
    result: z.enum(['fulfilled', 'unfulfilled', 'unknown']),
  })).min(1),
  tasteResult: z.enum(['light', 'balanced', 'rich']),
  repurchaseIntent: z.enum(['yes', 'maybe', 'no']),
  note: z.string().trim().max(300).optional(),
  imagePath: z.string().trim().max(500).nullable().optional(),
}).superRefine((value, context) => {
  if (value.objectiveResults.some((item) => item.result === 'unfulfilled') && !value.note && !value.imagePath) {
    context.addIssue({ code: 'custom', path: ['note'], message: '未兑现反馈需要说明或图片凭证' })
  }
})

export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>
