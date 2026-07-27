import {
  claimExtractionResponseSchema,
  type ClaimExtractionResponse,
  type ExtractedClaim,
} from './claim-extraction.schema'

type ClaimExtractionConfig = {
  provider: 'fallback' | 'deepseek'
  apiKey?: string
  baseUrl: string
  model: string
}

function candidate(
  id: string,
  kind: ExtractedClaim['kind'],
  content: string,
  sourceText: string,
  rationale: string,
): ExtractedClaim {
  return { id, kind, content, sourceText, rationale }
}

function extractFallback(text: string): ClaimExtractionResponse {
  const candidates: ExtractedClaim[] = []

  if (/汤饭分开|汤饭分装|独立密封|密封容器/.test(text)) {
    candidates.push(candidate(
      'claim-objective-sealed',
      'objective',
      '汤与米饭使用独立密封容器',
      text.match(/汤饭分开装|汤饭分装|独立密封(?:容器)?|密封容器/)?.[0] ?? '汤饭分装',
      '包装方式由商家直接控制，用户收餐时可以客观确认。',
    ))
  }

  if (/少油|清淡/.test(text)) {
    candidates.push(candidate(
      'claim-preference-low-oil',
      'preference',
      '支持少油制作',
      text.match(/(?:可按备注)?少油|清淡/)?.[0] ?? '少油',
      '油度感受因人而异，应形成口味分布，不作为客观赔付承诺。',
    ))
  }

  const weight = text.match(/牛肉(?:标称|约|不少于|≥)?\s*(\d+)\s*g/i)
  if (weight) {
    candidates.push(candidate(
      'claim-specification-beef-weight',
      'specification',
      `商家标称牛肉 ${weight[1]}g`,
      weight[0],
      '重量是商家商品规格声明，普通用户无法直接精确核验。',
    ))
  }

  if (/好吃|不踩雷|最好|必点|绝对|保证.*送到|不会洒|不洒/.test(text)) {
    const sourceText = text
      .split(/[，,。；;]/)
      .find((part) => /好吃|不踩雷|最好|必点|绝对|保证.*送到|不会洒|不洒/.test(part))
      ?.trim() ?? text
    candidates.push(candidate(
      'claim-unverifiable-marketing',
      'unverifiable',
      sourceText,
      sourceText,
      '包含主观宣传、配送结果或绝对化表述，不能发布为商家客观承诺。',
    ))
  }

  return claimExtractionResponseSchema.parse({ source: 'fallback', candidates })
}

async function extractWithModel(text: string, config: ClaimExtractionConfig): Promise<ClaimExtractionResponse> {
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
          content: [
            '将商家商品文案拆成可验证卖点JSON。',
            '分类只能是 objective、preference、specification、unverifiable。',
            '配送结果、绝对化宣传和主观好吃不能成为 objective。',
            '返回 {"candidates":[{"id","kind","content","sourceText","rationale"}]}。',
          ].join(''),
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
  return claimExtractionResponseSchema.parse({ ...JSON.parse(content), source: 'model' })
}

export function createClaimExtractionService(config: ClaimExtractionConfig) {
  return {
    async extract(text: string) {
      if (config.provider === 'deepseek' && config.apiKey) {
        try {
          return await extractWithModel(text, config)
        } catch {
          return extractFallback(text)
        }
      }
      return extractFallback(text)
    },
  }
}

export type ClaimExtractionService = ReturnType<typeof createClaimExtractionService>
