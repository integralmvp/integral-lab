/**
 * 구간 분해 (설계서 §3 deriveLegs) — 순수 함수
 * 입도(본토→제주) = 내륙→선사→도내 3구간. 출도 = 거울상(§10-②). 도내 단독·자동화물형 = 1구간.
 */
import type { Leg, Order, Stage } from '../../types/domain/ops'
import { ROUTE_DICT, type RouteDict } from '../../data/lab/routeDict'
import { TYPE_META } from './meta'

function toRegion(text: string, dict: RouteDict): string {
  const hit = dict.regions.find(r => text.includes(r.keyword))
  return hit ? hit.region : text
}

function isJeju(text: string, dict: RouteDict): boolean {
  return dict.jejuKeywords.some(k => text.includes(k))
}

export function deriveLegs(order: Order, dict: RouteDict = ROUTE_DICT): Leg[] {
  const from = toRegion(order.상차, dict)
  const to = toRegion(order.하차, dict)
  const port = (order.선사명 && dict.carriers[order.선사명]) || dict.defaultPort
  const fromJeju = isJeju(order.상차, dict)
  const toJeju = isJeju(order.하차, dict)

  const mk = (단계: Stage, seq: number, 경로_원본: string): Leg => ({
    id: `${order.id}-L${seq}`,
    order_id: order.id,
    단계,
    seq,
    경로_원본,
    status: 'WAITING',
    quote: null,
  })

  if (TYPE_META[order.type].singleLeg || fromJeju === toJeju) {
    const stage: Stage = fromJeju ? '도내' : '내륙'
    return [mk(stage, 0, `${from}-${to}`)]
  }
  if (toJeju) {
    return [
      mk('내륙', 0, `${from}-${port}`),
      mk('선사', 1, `${port}-${dict.jejuPort}`),
      mk('도내', 2, `${dict.jejuPort}-${to}`),
    ]
  }
  return [
    mk('도내', 0, `${from}-${dict.jejuPort}`),
    mk('선사', 1, `${dict.jejuPort}-${port}`),
    mk('내륙', 2, `${port}-${to}`),
  ]
}
