/**
 * 메시지 엔진 (설계서 §6) — 규칙 = 순수 함수 배열. UI는 규칙을 모른다.
 */
import type { Leg, OpsEvent, OpsMessage, Order } from '../../types/domain/ops'
import { deriveOrderStatus, isCancelled, settlementFromEvents } from './status'

/** 시연용 배차 대기 SLA (분) */
export const DEMO_SLA_MIN = 1

export interface RuleContext {
  orders: Order[]
  legs: Leg[]
  events: OpsEvent[]
  now: Date
}

export type Rule = (ctx: RuleContext) => OpsMessage[]

const legsOf = (ctx: RuleContext, orderId: string) =>
  ctx.legs.filter(l => l.order_id === orderId).sort((a, b) => a.seq - b.seq)

const lastEventAt = (ctx: RuleContext, pred: (e: OpsEvent) => boolean): OpsEvent | undefined =>
  [...ctx.events].reverse().find(pred)

const statusOf = (ctx: RuleContext, o: Order) =>
  deriveOrderStatus(legsOf(ctx, o.id), settlementFromEvents(ctx.events, o.id), isCancelled(ctx.events, o.id))

/** R1 접수 후 미견적 */
export const R1: Rule = ctx =>
  ctx.orders
    .filter(o => !isCancelled(ctx.events, o.id) && legsOf(ctx, o.id).some(l => l.quote === null))
    .map(o => ({
      id: `R1:${o.id}`,
      rule_id: 'R1',
      audience: '실무자',
      severity: 'warn',
      order_id: o.id,
      text: `${o.거래처} 접수건(${o.id}) 견적이 아직 없습니다.`,
      at: o.created_at,
    }))

/** R2 단가 미등록 견적 */
export const R2: Rule = ctx =>
  ctx.legs
    .filter(l => l.quote?.unregistered)
    .map(l => {
      const ev = lastEventAt(ctx, e => e.type === 'QUOTE_UNREGISTERED' && e.leg_id === l.id)
      return {
        id: `R2:${l.id}`,
        rule_id: 'R2',
        audience: '실무자',
        severity: 'alert',
        order_id: l.order_id,
        leg_id: l.id,
        text: `${l.order_id} ${l.단계} 구간(${l.경로_원본}) 단가 미등록 — 단가 등록 필요`,
        event_id: ev?.id,
        at: ev?.at ?? ctx.now.toISOString(),
      }
    })

/** 이 Leg가 배차 가능해진 시각 (첫 구간 = 견적 시각, 이후 구간 = 직전 구간 완료 시각) */
function readyAt(ctx: RuleContext, leg: Leg): string | null {
  if (!leg.quote || leg.quote.unregistered) return null
  if (leg.seq === 0) {
    return lastEventAt(ctx, e => e.leg_id === leg.id && e.type === 'QUOTE_DONE')?.at ?? null
  }
  const prev = legsOf(ctx, leg.order_id).find(l => l.seq === leg.seq - 1)
  if (!prev || prev.status !== 'DONE') return null
  return lastEventAt(ctx, e => e.leg_id === prev.id && e.type === 'LEG_DONE')?.at ?? null
}

/** R3 배차 대기 SLA 초과 */
export const R3: Rule = ctx =>
  ctx.legs.flatMap(l => {
    if (l.status !== 'WAITING' || isCancelled(ctx.events, l.order_id)) return []
    const at = readyAt(ctx, l)
    if (!at) return []
    const waitedMin = (ctx.now.getTime() - new Date(at).getTime()) / 60000
    if (waitedMin < DEMO_SLA_MIN) return []
    return [{
      id: `R3:${l.id}`,
      rule_id: 'R3',
      audience: '실무자' as const,
      severity: 'warn' as const,
      order_id: l.order_id,
      leg_id: l.id,
      text: `${l.order_id} ${l.단계} 구간 배차 대기 ${Math.floor(waitedMin)}분 (기준 ${DEMO_SLA_MIN}분 초과)`,
      at,
    }]
  })

/** R4 구간 완료 후 다음 구간 대기 */
export const R4: Rule = ctx =>
  ctx.legs.flatMap(l => {
    if (l.status !== 'DONE') return []
    const next = legsOf(ctx, l.order_id).find(n => n.seq === l.seq + 1)
    if (!next || next.status !== 'WAITING') return []
    const ev = lastEventAt(ctx, e => e.leg_id === l.id && e.type === 'LEG_DONE')
    return [{
      id: `R4:${next.id}`,
      rule_id: 'R4',
      audience: '실무자' as const,
      severity: 'info' as const,
      order_id: l.order_id,
      leg_id: next.id,
      text: `${l.order_id} ${l.단계} 구간 완료 → ${next.단계} 구간(${next.경로_원본}) 배차 필요`,
      event_id: ev?.id,
      at: ev?.at ?? ctx.now.toISOString(),
    }]
  })

/** R5 완료·정산 미확정 */
export const R5: Rule = ctx =>
  ctx.orders
    .filter(o => statusOf(ctx, o) === 'COMPLETED')
    .map(o => {
      const ev = lastEventAt(ctx, e => e.order_id === o.id && e.type === 'LEG_DONE')
      return {
        id: `R5:${o.id}`,
        rule_id: 'R5',
        audience: '실무자',
        severity: 'info',
        order_id: o.id,
        text: `${o.거래처} 거래건(${o.id}) 운송 완료 — 정산 확정 대기`,
        event_id: ev?.id,
        at: ev?.at ?? ctx.now.toISOString(),
      }
    })

/** R6 대표 일일 요약 */
export const R6: Rule = ctx => {
  const statuses = ctx.orders.map(o => statusOf(ctx, o))
  const count = (s: string[]) => statuses.filter(x => s.includes(x)).length
  return [{
    id: 'R6:today',
    rule_id: 'R6',
    audience: '대표',
    severity: 'info',
    text: `오늘 요약 — 접수 ${ctx.orders.length}건 · 운행중 ${count(['IN_OPERATION'])}건 · 완료 ${count(['COMPLETED', 'SETTLED'])}건`,
    at: ctx.now.toISOString(),
  }]
}

export const RULES: Rule[] = [R1, R2, R3, R4, R5, R6]

export function deriveMessages(ctx: RuleContext, rules: Rule[] = RULES): OpsMessage[] {
  const rank = { alert: 0, warn: 1, info: 2 } as const
  return rules
    .flatMap(r => r(ctx))
    .sort((a, b) => rank[a.severity] - rank[b.severity] || b.at.localeCompare(a.at))
}
