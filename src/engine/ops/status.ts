/**
 * 상태 기계 (설계서 §4) — 순수 함수
 * Leg 상태가 진실. Order 상태는 Leg + 정산 + 취소 이벤트에서 파생한다.
 */
import type { EventType, Leg, LegStatus, OpsEvent, OrderStatus, Settlement } from '../../types/domain/ops'

export const LEG_FLOW: LegStatus[] = ['WAITING', 'DISPATCHED', 'LOADED', 'IN_TRANSIT', 'DONE']

/** 다음 상태로 가는 이벤트 타입 (허용 전이표) */
export const LEG_TRANSITION_EVENT: Record<LegStatus, EventType | null> = {
  WAITING: 'LEG_DISPATCHED',
  DISPATCHED: 'LEG_LOADED',
  LOADED: 'LEG_IN_TRANSIT',
  IN_TRANSIT: 'LEG_DONE',
  DONE: null,
}

const EVENT_TO_STATUS: Partial<Record<EventType, { from: LegStatus; to: LegStatus }>> = {
  LEG_DISPATCHED: { from: 'WAITING', to: 'DISPATCHED' },
  LEG_LOADED: { from: 'DISPATCHED', to: 'LOADED' },
  LEG_IN_TRANSIT: { from: 'LOADED', to: 'IN_TRANSIT' },
  LEG_DONE: { from: 'IN_TRANSIT', to: 'DONE' },
}

export function nextLegStatus(status: LegStatus): LegStatus | null {
  const i = LEG_FLOW.indexOf(status)
  return i >= 0 && i < LEG_FLOW.length - 1 ? LEG_FLOW[i + 1] : null
}

/** 이 이벤트가 이 Leg에 허용되는 전이인가 */
export function canApply(leg: Leg, type: EventType): boolean {
  const t = EVENT_TO_STATUS[type]
  if (!t) return type === 'QUOTE_DONE' || type === 'QUOTE_UNREGISTERED'
  return leg.status === t.from
}

/** 이벤트를 Leg 캐시에 반영 (허용되지 않으면 원본 그대로 반환) */
export function applyEventToLeg(leg: Leg, ev: OpsEvent): Leg {
  if (ev.leg_id !== leg.id) return leg
  if (ev.type === 'QUOTE_DONE' || ev.type === 'QUOTE_UNREGISTERED') {
    const p = ev.payload as { quote?: Leg['quote'] } | undefined
    return p?.quote ? { ...leg, quote: p.quote } : leg
  }
  const t = EVENT_TO_STATUS[ev.type]
  if (!t || leg.status !== t.from) return leg
  const p = ev.payload as { vehicle_label?: string } | undefined
  return { ...leg, status: t.to, 수단_세부: p?.vehicle_label ?? leg.수단_세부 }
}

export function isQuoted(legs: Leg[]): boolean {
  return legs.length > 0 && legs.every(l => l.quote !== null && !l.quote.unregistered)
}

export function deriveOrderStatus(
  legs: Leg[],
  settlement: Settlement | null = null,
  cancelled = false
): OrderStatus {
  if (cancelled) return 'CANCELLED'
  if (legs.length > 0 && legs.every(l => l.status === 'DONE')) {
    return settlement?.status === 'CONFIRMED' ? 'SETTLED' : 'COMPLETED'
  }
  if (legs.some(l => l.status !== 'WAITING')) return 'IN_OPERATION'
  if (isQuoted(legs)) return 'QUOTED'
  return 'RECEIVED'
}

/** 이벤트 로그에서 주문별 정산·취소 상태 파생 */
export function settlementFromEvents(events: OpsEvent[], orderId: string): Settlement | null {
  const ev = [...events].reverse().find(e => e.order_id === orderId && e.type === 'SETTLEMENT_CONFIRMED')
  if (!ev) return null
  const p = ev.payload as Partial<Settlement> | undefined
  return {
    order_id: orderId,
    매출: p?.매출 ?? 0,
    매입: p?.매입 ?? 0,
    마진: p?.마진 ?? 0,
    status: 'CONFIRMED',
    settled_at: ev.at,
  }
}

export function isCancelled(events: OpsEvent[], orderId: string): boolean {
  return events.some(e => e.order_id === orderId && e.type === 'ORDER_CANCELLED')
}
