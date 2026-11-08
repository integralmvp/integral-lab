/** 금액 표시는 항상 이 유틸 경유 (설계서 §7). DEMO_MASK 켜면 마스킹 */
import type { LegStatus, OrderStatus } from '../../../../../types/domain/ops'

export const DEMO_MASK = false

export function fmtMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return '단가 미등록'
  if (DEMO_MASK) return '₩ ●●●,000'
  return `₩ ${Math.round(n).toLocaleString('ko-KR')}`
}

export const LEG_STATUS_LABEL: Record<LegStatus, string> = {
  WAITING: '배차 대기',
  DISPATCHED: '배차 완료',
  LOADED: '상차 완료',
  IN_TRANSIT: '운송중',
  DONE: '하차 완료',
}

/** 현장 화면 다음 단계 버튼 문구 */
export const LEG_NEXT_ACTION: Record<LegStatus, string | null> = {
  WAITING: '배차',
  DISPATCHED: '상차 완료',
  LOADED: '출발',
  IN_TRANSIT: '하차 완료',
  DONE: null,
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  RECEIVED: '접수',
  QUOTED: '견적완료',
  IN_OPERATION: '운행중',
  COMPLETED: '운송완료',
  SETTLED: '정산완료',
  CANCELLED: '취소',
}

export function fmtTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
