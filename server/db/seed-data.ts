type EvidenceType = 'objective' | 'subjective' | 'behavioral'
type EvidenceState = 'growing' | 'established' | 'disputed'

interface SeedMenuItem {
  id: string
  name: string
  description: string
  image: string
  price: number
  isTrial: boolean
}

interface SeedEvidence {
  id: string
  aspect: string
  evidenceType: EvidenceType
  positiveCount: number
  neutralCount: number
  negativeCount: number
  disputedCount: number
  sourceLayer: 'public' | 'derived' | 'sandbox'
}

interface SeedEvidenceRecord {
  id: string
  orderId: string
  evidenceType: EvidenceType
  aspect: string
  result: string
  status: 'accepted' | 'pending' | 'rejected'
  occurredAt: Date
}

interface SeedTrialPlanClaim {
  id: string
  kind: 'objective' | 'preference' | 'specification' | 'unverifiable'
  content: string
  sourceText: string
  decision: 'confirmed' | 'modified' | 'rejected'
  sortOrder: number
}

export interface SeedStore {
  id: string
  slug: string
  name: string
  category: string
  heroDish: string
  heroImage: string
  distanceMeters: number
  deliveryMinutes: number
  averagePrice: number
  evidenceState: EvidenceState
  depth: 'deep' | 'browse'
  menu: SeedMenuItem[]
  trialPlan: {
    id: string
    menuItemId: string
    title: string
    benefitLabel: string
    dailyQuota: number
    remainingQuota: number
    trialPrice: number
    version: number
    status: 'published'
    publishedAt: Date
  }
  trialPlanClaims: SeedTrialPlanClaim[]
  evidence: SeedEvidence[]
  evidenceRecords: SeedEvidenceRecord[]
}

function makeStore(input: Omit<SeedStore, 'menu' | 'trialPlan' | 'trialPlanClaims' | 'evidence' | 'evidenceRecords'> & {
  trialPrice: number
  sampleCount: number
  verifiedLabel: string
}): SeedStore {
  const positive = Math.max(2, Math.round(input.sampleCount * 0.75))
  const negative = Math.max(0, input.sampleCount - positive - 1)
  return {
    ...input,
    menu: [
      {
        id: `${input.id}-trial`,
        name: `${input.heroDish}试新套餐`,
        description: `${input.verifiedLabel}，承诺随订单锁定`,
        image: input.heroImage,
        price: input.trialPrice,
        isTrial: true,
      },
      {
        id: `${input.id}-standard`,
        name: input.heroDish,
        description: '门店日常菜单，支持正常价格复购口径',
        image: input.heroImage,
        price: input.averagePrice,
        isTrial: false,
      },
    ],
    trialPlan: {
      id: `${input.id}-plan-v1`,
      menuItemId: `${input.id}-trial`,
      title: `${input.heroDish}可信试新`,
      benefitLabel: '首轮证据专享',
      dailyQuota: 20,
      remainingQuota: 12,
      trialPrice: input.trialPrice,
      version: 1,
      status: 'published',
      publishedAt: new Date('2026-07-20T18:30:00+08:00'),
    },
    trialPlanClaims: [
      {
        id: `${input.id}-v1-objective`,
        kind: 'objective',
        content: input.verifiedLabel,
        sourceText: input.verifiedLabel,
        decision: 'confirmed',
        sortOrder: 1,
      },
      {
        id: `${input.id}-v1-preference`,
        kind: 'preference',
        content: '支持按口味偏好调整',
        sourceText: '支持口味备注',
        decision: 'confirmed',
        sortOrder: 2,
      },
    ],
    evidence: [
      {
        id: `${input.id}-objective`,
        aspect: input.verifiedLabel,
        evidenceType: 'objective',
        positiveCount: positive,
        neutralCount: 1,
        negativeCount: negative,
        disputedCount: 0,
        sourceLayer: 'sandbox',
      },
      {
        id: `${input.id}-subjective`,
        aspect: '口味适配',
        evidenceType: 'subjective',
        positiveCount: Math.max(1, positive - 1),
        neutralCount: Math.max(1, Math.round(input.sampleCount * 0.2)),
        negativeCount: Math.max(0, input.sampleCount - positive),
        disputedCount: 0,
        sourceLayer: 'derived',
      },
      {
        id: `${input.id}-behavioral`,
        aspect: '正常价复购意愿',
        evidenceType: 'behavioral',
        positiveCount: Math.max(1, Math.round(input.sampleCount * 0.65)),
        neutralCount: Math.max(1, Math.round(input.sampleCount * 0.2)),
        negativeCount: Math.max(0, Math.round(input.sampleCount * 0.15)),
        disputedCount: 0,
        sourceLayer: 'sandbox',
      },
    ],
    evidenceRecords: [],
  }
}

function withHeroLedger(store: SeedStore): SeedStore {
  const dates = Array.from({ length: 8 }, (_, index) => new Date(`2026-07-${String(13 + index).padStart(2, '0')}T12:00:00+08:00`))
  return {
    ...store,
    trialPlan: {
      ...store.trialPlan,
      title: '招牌现切牛肉饭可信试新',
      benefitLabel: '试新保障',
      dailyQuota: 10,
      remainingQuota: 7,
      trialPrice: 23.9,
    },
    trialPlanClaims: [
      {
        id: 'beef-v1-sealed',
        kind: 'objective',
        content: '汤与米饭使用独立密封容器',
        sourceText: '汤饭分开装',
        decision: 'confirmed',
        sortOrder: 1,
      },
      {
        id: 'beef-v1-low-oil',
        kind: 'preference',
        content: '支持少油制作',
        sourceText: '可按备注少油',
        decision: 'confirmed',
        sortOrder: 2,
      },
      {
        id: 'beef-v1-80g',
        kind: 'specification',
        content: '商家标称牛肉 80g',
        sourceText: '牛肉标称80g',
        decision: 'confirmed',
        sortOrder: 3,
      },
      {
        id: 'beef-v1-tasty',
        kind: 'unverifiable',
        content: '招牌好吃不踩雷',
        sourceText: '招牌好吃不踩雷',
        decision: 'rejected',
        sortOrder: 4,
      },
    ],
    evidence: [
      { id: `${store.id}-objective`, aspect: '独立密封分装', evidenceType: 'objective', positiveCount: 8, neutralCount: 0, negativeCount: 0, disputedCount: 0, sourceLayer: 'sandbox' },
      { id: `${store.id}-subjective`, aspect: '少油感受', evidenceType: 'subjective', positiveCount: 7, neutralCount: 0, negativeCount: 1, disputedCount: 0, sourceLayer: 'sandbox' },
      { id: `${store.id}-behavioral`, aspect: '正常价复购意愿', evidenceType: 'behavioral', positiveCount: 6, neutralCount: 1, negativeCount: 1, disputedCount: 0, sourceLayer: 'sandbox' },
    ],
    evidenceRecords: dates.flatMap((occurredAt, index) => {
      const orderId = `historical-beef-${index + 1}`
      return [
        { id: `${orderId}-objective`, orderId, evidenceType: 'objective' as const, aspect: '独立密封分装', result: 'fulfilled', status: 'accepted' as const, occurredAt },
        { id: `${orderId}-subjective`, orderId, evidenceType: 'subjective' as const, aspect: '少油感受', result: index === 7 ? 'rich' : 'suitable', status: 'accepted' as const, occurredAt },
        { id: `${orderId}-behavioral`, orderId, evidenceType: 'behavioral' as const, aspect: '正常价复购意愿', result: index < 6 ? 'yes' : index === 6 ? 'maybe' : 'no', status: 'accepted' as const, occurredAt },
      ]
    }),
  }
}

interface LedgerCounts {
  objective: { positive: number; neutral: number; negative: number }
  subjective: { positive: number; neutral: number; negative: number }
  behavioral: { positive: number; neutral: number; negative: number }
}

function withDecisionLedger(store: SeedStore, counts: LedgerCounts): SeedStore {
  const sampleCount = counts.objective.positive + counts.objective.neutral + counts.objective.negative
  const objectiveAspect = store.evidence.find((item) => item.evidenceType === 'objective')!.aspect
  const dates = Array.from(
    { length: sampleCount },
    (_, index) => new Date(`2026-07-${String(1 + (index % 20)).padStart(2, '0')}T12:00:00+08:00`),
  )
  const resultAt = (
    index: number,
    countsForType: { positive: number; neutral: number; negative: number },
    values: [string, string, string],
  ) => index < countsForType.positive
    ? values[0]
    : index < countsForType.positive + countsForType.neutral
      ? values[1]
      : values[2]

  return {
    ...store,
    evidence: [
      {
        id: `${store.id}-objective`,
        aspect: objectiveAspect,
        evidenceType: 'objective',
        positiveCount: counts.objective.positive,
        neutralCount: counts.objective.neutral,
        negativeCount: counts.objective.negative,
        disputedCount: 0,
        sourceLayer: 'sandbox',
      },
      {
        id: `${store.id}-subjective`,
        aspect: '少油感受',
        evidenceType: 'subjective',
        positiveCount: counts.subjective.positive,
        neutralCount: counts.subjective.neutral,
        negativeCount: counts.subjective.negative,
        disputedCount: 0,
        sourceLayer: 'sandbox',
      },
      {
        id: `${store.id}-behavioral`,
        aspect: '正常价复购意愿',
        evidenceType: 'behavioral',
        positiveCount: counts.behavioral.positive,
        neutralCount: counts.behavioral.neutral,
        negativeCount: counts.behavioral.negative,
        disputedCount: 0,
        sourceLayer: 'sandbox',
      },
    ],
    evidenceRecords: dates.flatMap((occurredAt, index) => {
      const orderId = `historical-${store.id}-${index + 1}`
      return [
        {
          id: `${orderId}-objective`,
          orderId,
          evidenceType: 'objective' as const,
          aspect: objectiveAspect,
          result: resultAt(index, counts.objective, ['fulfilled', 'unknown', 'unfulfilled']),
          status: 'accepted' as const,
          occurredAt,
        },
        {
          id: `${orderId}-subjective`,
          orderId,
          evidenceType: 'subjective' as const,
          aspect: '少油感受',
          result: resultAt(index, counts.subjective, ['suitable', 'balanced', 'rich']),
          status: 'accepted' as const,
          occurredAt,
        },
        {
          id: `${orderId}-behavioral`,
          orderId,
          evidenceType: 'behavioral' as const,
          aspect: '正常价复购意愿',
          result: resultAt(index, counts.behavioral, ['yes', 'maybe', 'no']),
          status: 'accepted' as const,
          occurredAt,
        },
      ]
    }),
  }
}

export const seedStores: SeedStore[] = [
  withHeroLedger(makeStore({ id: 'store-beef-01', slug: 'xiangkou-beef-rice', name: '巷口牛肉饭', category: '盖饭', heroDish: '招牌现切牛肉饭', heroImage: '/images/food/beef-rice.webp', distanceMeters: 680, deliveryMinutes: 31, averagePrice: 28, evidenceState: 'growing', depth: 'deep', trialPrice: 23.9, sampleCount: 8, verifiedLabel: '独立密封分装' })),
  withDecisionLedger(
    makeStore({ id: 'store-beef-02', slug: 'laozao-beef-rice', name: '老灶牛肉盖饭', category: '盖饭', heroDish: '黑椒牛肉盖饭', heroImage: '/images/food/pepper-beef.webp', distanceMeters: 920, deliveryMinutes: 35, averagePrice: 29, evidenceState: 'established', depth: 'deep', trialPrice: 25, sampleCount: 34, verifiedLabel: '牛肉足量' }),
    {
      objective: { positive: 31, neutral: 1, negative: 2 },
      subjective: { positive: 18, neutral: 5, negative: 11 },
      behavioral: { positive: 24, neutral: 4, negative: 6 },
    },
  ),
  withDecisionLedger(
    makeStore({ id: 'store-chicken-01', slug: 'hewei-chicken-soup', name: '禾味鸡汤饭', category: '汤饭', heroDish: '菌菇鸡汤饭', heroImage: '/images/food/chicken-soup.webp', distanceMeters: 760, deliveryMinutes: 29, averagePrice: 26, evidenceState: 'established', depth: 'deep', trialPrice: 22.8, sampleCount: 19, verifiedLabel: '汤饭分装' }),
    {
      objective: { positive: 18, neutral: 0, negative: 1 },
      subjective: { positive: 17, neutral: 1, negative: 1 },
      behavioral: { positive: 14, neutral: 2, negative: 3 },
    },
  ),
  makeStore({ id: 'store-noodle-01', slug: 'shijiu-noodle', name: '拾玖手作面', category: '面食', heroDish: '番茄牛腩面', heroImage: '/images/food/tomato-noodle.webp', distanceMeters: 540, deliveryMinutes: 27, averagePrice: 27, evidenceState: 'growing', depth: 'browse', trialPrice: 21.9, sampleCount: 6, verifiedLabel: '汤面分装' }),
  makeStore({ id: 'store-salad-01', slug: 'qingye-salad', name: '青野轻食', category: '轻食', heroDish: '香煎鸡胸谷物碗', heroImage: '/images/food/salad.webp', distanceMeters: 1_100, deliveryMinutes: 32, averagePrice: 32, evidenceState: 'established', depth: 'browse', trialPrice: 26.9, sampleCount: 27, verifiedLabel: '酱汁分装' }),
  makeStore({ id: 'store-hunan-01', slug: 'xiangli-small-bowl', name: '湘里小碗菜', category: '地方菜', heroDish: '小炒黄牛肉', heroImage: '/images/food/hunan-beef.webp', distanceMeters: 1_450, deliveryMinutes: 38, averagePrice: 31, evidenceState: 'established', depth: 'browse', trialPrice: 25.9, sampleCount: 42, verifiedLabel: '辣度可选' }),
  makeStore({ id: 'store-dumpling-01', slug: 'youjian-dumpling', name: '有间手工饺子', category: '面食', heroDish: '玉米鲜肉水饺', heroImage: '/images/food/dumpling.webp', distanceMeters: 830, deliveryMinutes: 30, averagePrice: 24, evidenceState: 'growing', depth: 'browse', trialPrice: 19.9, sampleCount: 9, verifiedLabel: '计数足量' }),
  makeStore({ id: 'store-curry-01', slug: 'nanlu-curry', name: '南麓咖喱所', category: '盖饭', heroDish: '慢炖牛腩咖喱饭', heroImage: '/images/food/curry.webp', distanceMeters: 1_260, deliveryMinutes: 36, averagePrice: 30, evidenceState: 'growing', depth: 'browse', trialPrice: 24.9, sampleCount: 7, verifiedLabel: '咖喱分装' }),
  makeStore({ id: 'store-congee-01', slug: 'chaoshi-congee', name: '潮食砂锅粥', category: '粥品', heroDish: '鲜虾砂锅粥', heroImage: '/images/food/congee.webp', distanceMeters: 1_600, deliveryMinutes: 41, averagePrice: 35, evidenceState: 'disputed', depth: 'browse', trialPrice: 29.9, sampleCount: 15, verifiedLabel: '保温封签' }),
  makeStore({ id: 'store-bakery-01', slug: 'maixi-bakery', name: '麦夕烘焙', category: '甜品', heroDish: '海盐可颂套餐', heroImage: '/images/food/croissant.webp', distanceMeters: 470, deliveryMinutes: 24, averagePrice: 22, evidenceState: 'established', depth: 'browse', trialPrice: 17.9, sampleCount: 31, verifiedLabel: '当日现烤' }),
  makeStore({ id: 'store-tea-01', slug: 'shanye-tea', name: '山野原叶茶', category: '饮品', heroDish: '栀子轻乳茶', heroImage: '/images/food/tea.webp', distanceMeters: 710, deliveryMinutes: 26, averagePrice: 18, evidenceState: 'growing', depth: 'browse', trialPrice: 13.9, sampleCount: 5, verifiedLabel: '糖度可选' }),
  makeStore({ id: 'store-bbq-01', slug: 'xiaohuo-bbq', name: '小火炭烤', category: '烧烤', heroDish: '炭烤鸡腿饭', heroImage: '/images/food/bbq-rice.webp', distanceMeters: 1_320, deliveryMinutes: 39, averagePrice: 29, evidenceState: 'established', depth: 'browse', trialPrice: 23.9, sampleCount: 23, verifiedLabel: '生熟分装' }),
]
