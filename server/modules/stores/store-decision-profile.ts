export interface StoreDecisionProfile {
  verdict: string
  fitFor: string
  fitReason: string
  notFor: string
  riskReason: string
}

const profiles: Record<string, StoreDecisionProfile> = {
  'store-beef-01': {
    verdict: '需求最匹配，但证据仍在成长',
    fitFor: '需要独立密封分装、偏好清淡口味的人',
    fitReason: '独立密封分装 8/8，少油感受 7/8 符合。',
    notFor: '只接受大量成熟样本、完全不接受口味波动的人',
    riskReason: '当前只有 8 笔有效订单，且有 1 笔反馈偏油。',
  },
  'store-beef-02': {
    verdict: '验证更充分，但口味明显偏浓',
    fitFor: '更看重牛肉分量、希望参考更多历史验证的人',
    fitReason: '已有 34 笔有效订单，牛肉足量 31/34。',
    notFor: '偏好清淡口味、介意黑椒风味偏浓的人',
    riskReason: '34 笔验证中有 11 笔认为偏油，和清淡诉求存在冲突。',
  },
  'store-chicken-01': {
    verdict: '预算与包装更稳妥，但属于相邻品类',
    fitFor: '预算更低、偏好清淡汤饭与稳定分装的人',
    fitReason: '试新价更低，汤饭分装 18/19，清淡感受 17/19。',
    notFor: '只想吃牛肉饭、不接受相邻品类替代的人',
    riskReason: '它满足清淡和分装要求，但主菜是鸡汤饭而不是牛肉饭。',
  },
}

const fallback: StoreDecisionProfile = {
  verdict: '证据与风险同时展示',
  fitFor: '愿意根据具体履约证据尝试新店的人',
  fitReason: '系统根据完成订单验证展示该店的可见优势。',
  notFor: '只依赖成熟评分、完全不接受样本波动的人',
  riskReason: '试新店证据仍在积累，结论可能随新订单变化。',
}

export function getStoreDecisionProfile(storeId: string) {
  return profiles[storeId] ?? fallback
}
