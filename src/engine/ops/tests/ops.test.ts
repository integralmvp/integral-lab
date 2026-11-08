import { describe, it, expect } from 'vitest'
import type { Leg, OpsEvent, Order, PriceRow } from '../../../types/domain/ops'
import {
  convertCubes, deriveLegs, lookupPrice, quoteLeg, deriveOrderStatus, deriveMessages, applyEventToLeg, canApply, canDispatchLeg,
} from '../index'
import { placeholderSource } from '../../../data/lab/placeholderPriceTable'

const rows = placeholderSource.getRows()

const base: Order = {
  id: 'T1', intake: 'OFFLINE', 거래처: '가상상사Z', 품목: '품목Z', 상차: '경기 평택', 하차: '제주시 연동',
  type: '차량형', cargo: { length_mm: 6000, width_mm: 600, height_mm: 600, weight_kg: 300 }, 차량대수: 1,
  created_at: '2026-11-08T00:00:00.000Z',
}

const legFor = (o: Order, 단계: Leg['단계'], 경로_원본 = 'X-Y'): Leg =>
  ({ id: `${o.id}-L`, order_id: o.id, 단계, seq: 0, 경로_원본, status: 'WAITING', quote: null })

describe('convertCubes', () => {
  it('골든: 6m 파이프 차량형 → 5t · 청구큐브 2,500', () => {
    expect(convertCubes(base)).toEqual({ 청구큐브: 2500, vehicle: '5t' })
  })
  it('중량형 = 운송중량 × 200 (실존)', () => {
    expect(convertCubes({ ...base, type: '중량형', 운송중량_ton: 3.5 }).청구큐브).toBe(700)
  })
})

describe('deriveLegs', () => {
  it('입도 주문 → 내륙·선사·도내 3구간', () => {
    const legs = deriveLegs({ ...base, 선사명: '선사A' })
    expect(legs.map(l => l.단계)).toEqual(['내륙', '선사', '도내'])
    expect(legs[0].경로_원본).toBe('수도권-부산항')
    expect(legs[2].경로_원본).toBe('제주항-제주시')
  })
  it('도내 단독 → 1구간', () => {
    const legs = deriveLegs({ ...base, 상차: '제주시 애월', 하차: '서귀포 남원' })
    expect(legs).toHaveLength(1)
    expect(legs[0].단계).toBe('도내')
  })
})

describe('lookupPrice', () => {
  it('구체성(조건 축 수) 우선: 거래처+품목+수단 일치 → 조건행', () => {
    const o = { ...base, 거래처: '가상상사A', 품목: '품목A' }
    expect(lookupPrice(rows, o, legFor(o, '도내', '제주항-제주시'), { 수단: '5t' })?.id).toBe('P-V-JJ-5T-A-X')
  })
  it('기타 행은 더 구체적이어도 제외된다', () => {
    const o = { ...base, 거래처: '가상상사A', 품목: '품목A' }
    expect(lookupPrice(rows, o, legFor(o, '도내', '제주항-제주시'), { 수단: '5t' })?.역할).not.toBe('기타')
  })
  it('전속은 거래처 일치 시만, 축 수 같으면 위계 높은 행', () => {
    const extra: PriceRow = { ...rows.find(r => r.id === 'P-W-JJ-NEG')!, id: 'X-EXC', 역할: '전속', 위계: 4, conditions: { 거래처: '가상상사B' } }
    const o = { ...base, type: '중량형' as const, 거래처: '가상상사B' }
    expect(lookupPrice([...rows, extra], o, legFor(o, '도내'))?.id).toBe('X-EXC')
    const other = { ...o, 거래처: '가상상사Q' }
    expect(lookupPrice([...rows, extra], other, legFor(other, '도내'))?.id).toBe('P-W-JJ-STD')
  })
  it('후보 없음 → null', () => {
    const o = { ...base, type: '자동화물형' as const }
    expect(lookupPrice(rows, o, legFor(o, '도내'))).toBeNull()
  })
})

describe('quoteLeg', () => {
  it('금액 = 실단가 × 수량 (큐브당×큐브 아님)', () => {
    const o = { ...base, 차량대수: 1 }
    const q = quoteLeg(rows, o, legFor(o, '도내', '제주항-제주시'), 'v')
    expect(q.applied_row_id).toBe('P-V-JJ-5T')
    expect(q.amount).toBe(100000)
    expect(q.청구큐브).toBe(2500)
  })
  it('중량형 원/톤', () => {
    const o = { ...base, type: '중량형' as const, 운송중량_ton: 3.5 }
    expect(quoteLeg(rows, o, legFor(o, '도내'), 'v').amount).toBe(42000)
  })
  it('미등록 → unregistered true, amount null (0원 아님)', () => {
    const o = { ...base, type: '자동화물형' as const }
    const q = quoteLeg(rows, o, legFor(o, '도내'), 'v')
    expect(q.unregistered).toBe(true)
    expect(q.amount).toBeNull()
  })
})

describe('deriveOrderStatus / 전이', () => {
  const o = base
  const legs = deriveLegs(o).map(l => ({ ...l, quote: quoteLeg(rows, o, l, 'v') }))
  it('견적 완료 → QUOTED, 첫 배차 → IN_OPERATION, 전부 DONE → COMPLETED/SETTLED', () => {
    expect(deriveOrderStatus(legs.map(l => ({ ...l, quote: null })))).toBe('RECEIVED')
    expect(deriveOrderStatus(legs)).toBe('QUOTED')
    expect(deriveOrderStatus([{ ...legs[0], status: 'DISPATCHED' }, ...legs.slice(1)])).toBe('IN_OPERATION')
    const done = legs.map(l => ({ ...l, status: 'DONE' as const }))
    expect(deriveOrderStatus(done)).toBe('COMPLETED')
    expect(deriveOrderStatus(done, { order_id: o.id, 매출: 1, 매입: 1, 마진: 0, status: 'CONFIRMED' })).toBe('SETTLED')
    expect(deriveOrderStatus(legs, null, true)).toBe('CANCELLED')
  })
  it('허용되지 않은 전이는 거부', () => {
    expect(canApply(legs[0], 'LEG_LOADED')).toBe(false)
    const ev: OpsEvent = { id: 'e', at: '', actor: '현장', type: 'LEG_LOADED', order_id: o.id, leg_id: legs[0].id }
    expect(applyEventToLeg(legs[0], ev).status).toBe('WAITING')
  })
})

describe('deriveMessages', () => {
  const now = new Date('2026-11-08T01:00:00.000Z')
  const o = base
  const at = '2026-11-08T00:00:00.000Z'
  it('R1 미견적 / R2 미등록', () => {
    const auto = { ...o, id: 'A', type: '자동화물형' as const, 상차: '제주시 노형', 하차: '제주시 이도' }
    const legsA = deriveLegs(auto).map(l => ({ ...l, quote: quoteLeg(rows, auto, l, 'v') }))
    const legsB = deriveLegs(o)
    const ids = deriveMessages({ orders: [auto, o], legs: [...legsA, ...legsB], events: [], now }).map(m => m.rule_id)
    expect(ids).toContain('R1')
    expect(ids).toContain('R2')
  })
  it('R3 SLA 초과 / R4 다음 구간 대기 / R5 정산 대기', () => {
    const legs = deriveLegs(o).map(l => ({ ...l, quote: quoteLeg(rows, o, l, 'v') }))
    const ev = (type: OpsEvent['type'], leg_id?: string): OpsEvent => ({ id: `${type}${leg_id}`, at, actor: '시스템', type, order_id: o.id, leg_id })
    const q = legs.map(l => ev('QUOTE_DONE', l.id))
    let msgs = deriveMessages({ orders: [o], legs, events: q, now })
    expect(msgs.some(m => m.rule_id === 'R3' && m.leg_id === legs[0].id)).toBe(true)

    const legs2 = [{ ...legs[0], status: 'DONE' as const }, legs[1], legs[2]]
    msgs = deriveMessages({ orders: [o], legs: legs2, events: [...q, ev('LEG_DONE', legs[0].id)], now })
    expect(msgs.some(m => m.rule_id === 'R4' && m.leg_id === legs[1].id)).toBe(true)

    const legs3 = legs.map(l => ({ ...l, status: 'DONE' as const }))
    msgs = deriveMessages({ orders: [o], legs: legs3, events: q, now })
    expect(msgs.some(m => m.rule_id === 'R5')).toBe(true)
  })
})

describe('canDispatchLeg (구간 순서 가드)', () => {
  const legs = deriveLegs(base)
  it('첫 구간은 배차 가능', () => {
    expect(canDispatchLeg(legs[0], legs)).toEqual({ ok: true, reason: null })
  })
  it('앞 구간이 DONE이 아니면 뒤 구간 배차 불가 + 사유', () => {
    const r = canDispatchLeg(legs[2], legs)
    expect(r.ok).toBe(false)
    expect(r.reason).toContain('내륙')
    const partial = [{ ...legs[0], status: 'DONE' as const }, { ...legs[1], status: 'IN_TRANSIT' as const }, legs[2]]
    expect(canDispatchLeg(partial[2], partial).reason).toContain('선사')
  })
  it('앞 구간 전부 DONE이면 가능, WAITING 아니면 불가', () => {
    const done = [{ ...legs[0], status: 'DONE' as const }, { ...legs[1], status: 'DONE' as const }, legs[2]]
    expect(canDispatchLeg(done[2], done).ok).toBe(true)
    expect(canDispatchLeg({ ...legs[0], status: 'DISPATCHED' }, legs).ok).toBe(false)
  })
  it('다른 주문의 구간은 영향 없음', () => {
    const other = deriveLegs({ ...base, id: 'T2' })
    expect(canDispatchLeg(legs[0], [...legs, ...other]).ok).toBe(true)
  })
})
