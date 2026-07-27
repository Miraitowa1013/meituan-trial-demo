import { parsedDemandSchema, type ParsedDemand } from './demand.schema'

type DemandServiceConfig = {
  provider: 'fallback' | 'deepseek'
  apiKey?: string
  baseUrl: string
  model: string
}

function parseFallback(text: string): ParsedDemand {
  const budget = text.match(/(\d+(?:\.\d+)?)\s*元/)
  const category = ['牛肉饭', '鸡汤饭', '盖饭', '轻食', '面'].find((item) => text.includes(item)) ?? null
  const taste = [
    ...(/少油|清淡/.test(text) ? ['偏清淡'] : []),
    ...(/重口|浓郁/.test(text) ? ['偏浓郁'] : []),
  ]
  const fulfillmentNeeds = [
    ...(/汤.*(别洒|不洒)|别洒/.test(text)
      ? [{
          raw: '汤别洒',
          normalized: '汤与米饭使用独立密封容器',
          responsibleParty: 'merchant' as const,
        }]
      : []),
    ...(/分装/.test(text) && !/汤.*(别洒|不洒)|别洒/.test(text)
      ? [{
          raw: '分装',
          normalized: '主食与汤汁独立分装',
          responsibleParty: 'merchant' as const,
        }]
      : []),
  ]

  return parsedDemandSchema.parse({
    budgetMax: budget ? Number(budget[1]) : null,
    category,
    taste,
    fulfillmentNeeds,
    source: 'fallback',
  })
}

async function parseWithModel(text: string, config: DemandServiceConfig): Promise<ParsedDemand> {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      response_format: { type: 'json_object' },
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: '将外卖需求转成JSON。只提取budgetMax、category、taste、fulfillmentNeeds。把配送结果改写成商家可控条件。',
        },
        { role: 'user', content: text },
      ],
    }),
    signal: AbortSignal.timeout(4500),
  })
  if (!response.ok) throw new Error(`MODEL_HTTP_${response.status}`)
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  const content = body.choices?.[0]?.message?.content
  if (!content) throw new Error('MODEL_EMPTY_RESPONSE')
  return parsedDemandSchema.parse({ ...JSON.parse(content), source: 'model' })
}

export function createDemandService(config: DemandServiceConfig) {
  return {
    async parse(text: string) {
      if (config.provider === 'deepseek' && config.apiKey) {
        try {
          return await parseWithModel(text, config)
        } catch {
          return parseFallback(text)
        }
      }
      return parseFallback(text)
    },
  }
}

export type DemandService = ReturnType<typeof createDemandService>
