/**
 * 구간 견적 (설계서 §3 quoteLeg) — 순수 함수
 * 금액 = 실단가 × 수량. 실단가는 PriceRow 값을 그대로 사용(역산 금지).
 */
import type { Leg, LegQuote, Order, PriceRow, PriceUnit } from '../../types/domain/ops'
import { convertCubes, orderTons } from './convertCubes'
import { lookupPrice } from './lookupPrice'
import { CBM_PER_CUBE } from './meta'

function quantityFor(unit: PriceUnit, order: Order, 청구큐브: number): number {
  switch (unit) {
    case '원/차량':
      return Math.max(1, order.차량대수 || 1)
    case '원/톤':
      return orderTons(order)
    case '원/CBM':
      return 청구큐브 * CBM_PER_CUBE
  }
}

export function quoteLeg(rows: PriceRow[], order: Order, leg: Leg, priceVersion: string): LegQuote {
  const conv = convertCubes(order)
  const row = lookupPrice(rows, order, leg, { 수단: conv.vehicle })
  if (!row) {
    return {
      청구큐브: conv.청구큐브,
      큐브당: null,
      차량당: null,
      실단가: null,
      실단가_단위: null,
      수량: null,
      amount: null,
      applied_row_id: null,
      applied_role: null,
      price_version: priceVersion,
      unregistered: true,
      matched_vehicle: conv.vehicle,
    }
  }
  const 수량 = quantityFor(row.실단가_단위, order, conv.청구큐브)
  return {
    청구큐브: conv.청구큐브,
    큐브당: row.큐브당,
    차량당: row.실단가_단위 === '원/차량' ? row.실단가 : null,
    실단가: row.실단가,
    실단가_단위: row.실단가_단위,
    수량,
    amount: Math.floor(row.실단가 * 수량 + 0.5),
    applied_row_id: row.id,
    applied_role: row.역할,
    price_version: priceVersion,
    unregistered: false,
    matched_vehicle: conv.vehicle,
  }
}
