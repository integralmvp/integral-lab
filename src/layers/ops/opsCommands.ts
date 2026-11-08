/**
 * 운영 명령 (Order 등록·견적·Leg 진행·정산·데모 초기화)
 * engine(순수 계산) + repo/bus(영속) 조합. UI는 이 명령만 호출한다.
 */
import type { Actor, Order, OrderType } from '../../types/domain/ops'
import { deriveLegs, quoteLeg, LEG_TRANSITION_EVENT } from '../../engine/ops'
import { placeholderSource } from '../../data/lab/placeholderPriceTable'
import { SEED_SCENARIOS } from '../../data/lab/seedOrders'
import { emit, eventRepo, legRepo, notify, orderRepo } from '../../infra/storage/ops'

/** 현재 단가 소스 (교체 접점) */
export const priceSource = placeholderSource

/** 시연용 매입 비율 (§10-③) */
export const PURCHASE_RATIO = 0.82

export type NewOrderInput = Omit<Order, 'id' | 'created_at'>

function nextOrderId(): string {
  const n = orderRepo.list().length + 1
  return `ORD-${String(n).padStart(3, '0')}-${Date.now().toString(36).slice(-3).toUpperCase()}`
}

/** 접수 확정: Order + Leg 생성 → ORDER_RECEIVED → 구간별 견적 이벤트 */
export function registerOrder(
  input: NewOrderInput,
  opts: { id?: string; at?: string; silent?: boolean; skipQuote?: boolean } = {}
): Order {
  const order: Order = { ...input, id: opts.id ?? nextOrderId(), created_at: opts.at ?? new Date().toISOString() }
  orderRepo.insert(order)
  const legs = deriveLegs(order)
  legRepo.insertMany(legs)
  emit({ type: 'ORDER_RECEIVED', actor: '관리자', order_id: order.id, at: order.created_at }, { silent: true })
  if (!opts.skipQuote) quoteOrder(order.id, { silent: true, at: opts.at })
  if (!opts.silent) notify()
  return order
}

/** 주문의 전 구간 견적 (재견적도 새 이벤트로 append) */
export function quoteOrder(orderId: string, opts: { silent?: boolean; at?: string } = {}): void {
  const order = orderRepo.get(orderId)
  if (!order) return
  const rows = priceSource.getRows()
  for (const leg of legRepo.byOrder(orderId)) {
    const quote = quoteLeg(rows, order, leg, priceSource.version)
    emit(
      {
        type: quote.unregistered ? 'QUOTE_UNREGISTERED' : 'QUOTE_DONE',
        actor: '시스템',
        order_id: orderId,
        leg_id: leg.id,
        payload: { quote },
        at: opts.at,
      },
      { silent: true }
    )
  }
  if (!opts.silent) notify()
}

/** Leg 다음 단계로 진행 (배차 시 차량 라벨) */
export function advanceLeg(
  legId: string,
  actor: Actor,
  vehicleLabel?: string,
  opts: { at?: string; silent?: boolean } = {}
): boolean {
  const leg = legRepo.get(legId)
  if (!leg) return false
  const type = LEG_TRANSITION_EVENT[leg.status]
  if (!type) return false
  const payload = type === 'LEG_DISPATCHED' ? { vehicle_label: vehicleLabel || leg.quote?.matched_vehicle || '차량 미지정' } : undefined
  const ev = emit({ type, actor, order_id: leg.order_id, leg_id: leg.id, payload, at: opts.at }, { silent: opts.silent })
  if (ev && type === 'LEG_DONE' && legRepo.byOrder(leg.order_id).every(l => l.status === 'DONE')) {
    emit({ type: 'ORDER_COMPLETED', actor: '시스템', order_id: leg.order_id, at: opts.at }, { silent: opts.silent })
  }
  return ev !== null
}

/** 정산 확정 (매입 = 매출 × PURCHASE_RATIO 데모) */
export function confirmSettlement(orderId: string): void {
  const 매출 = legRepo.byOrder(orderId).reduce((s, l) => s + (l.quote?.amount ?? 0), 0)
  const 매입 = Math.round(매출 * PURCHASE_RATIO)
  emit({ type: 'SETTLEMENT_CONFIRMED', actor: '관리자', order_id: orderId, payload: { 매출, 매입, 마진: 매출 - 매입 } })
}

export function cancelOrder(orderId: string): void {
  emit({ type: 'ORDER_CANCELLED', actor: '관리자', order_id: orderId })
}

/** 데모 초기화: lab: 키 비우고 시드 재적재 (seed 시각은 몇 분 전으로 분산) */
export function resetDemo(): void {
  orderRepo.clear()
  legRepo.clear()
  eventRepo.clear()
  seedIfEmpty(true)
}

export function seedIfEmpty(force = false): void {
  if (!force && orderRepo.list().length > 0) return
  const now = Date.now()
  const n = SEED_SCENARIOS.length
  SEED_SCENARIOS.forEach(({ order, stage }, i) => {
    const at = new Date(now - (n - i) * 3 * 60000).toISOString()
    registerOrder(order, { id: order.id, at, silent: true, skipQuote: stage === 'RECEIVED_ONLY' })
    if (stage === 'ALL_DONE') playToDone(order.id, at)
  })
  notify()
}

/** 시드 재생: 전 구간을 이벤트 발행 경로로 끝까지 진행 (상태 직접 덮어쓰기 금지) */
function playToDone(orderId: string, at: string): void {
  for (const leg of legRepo.byOrder(orderId)) {
    for (let step = 0; step < 4; step++) {
      const actor: Actor = step === 0 ? '관리자' : '현장'
      if (!advanceLeg(leg.id, actor, undefined, { at, silent: true })) break
    }
  }
}

export const ORDER_TYPES: OrderType[] = ['차량형', '중량형', '컨테이너형', '자동화물형']
