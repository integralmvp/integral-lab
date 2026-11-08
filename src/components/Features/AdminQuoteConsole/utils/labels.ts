// 초과사유 코드 → 표시 라벨 (엔진 ExceedReason 코드를 UI 서사로 변환)
import type { ExceedReason, RateTier } from '../../../../engine/cubeCoordinate'

export const REASON_LABELS: Record<ExceedReason, string> = {
  LINE: '선초과',
  AREA: '면초과',
  VOLUME: '공간초과',
  WEIGHT: '중량초과',
  NO_AVAILABLE_VEHICLE: '적합 차량 없음',
}

/** 단가 룩업 적용행 → 표시 라벨 */
export const TIER_LABELS: Record<RateTier, string> = {
  조건: '조건행',
  세부: '세부행',
  표준: '표준행',
}

/** 품목 드롭다운 빈 값 라벨 — 선택 시 세부/표준행 fallback */
export const ITEM_UNSPECIFIED = '(품목 미지정)'

/**
 * 검증된 품목 옵션 — 전부 rateTable 품목군에 존재하는 정확일치 문자열.
 * 자유 입력의 오타·공백으로 조건행을 놓치는 문제를 원천 차단.
 */
export const ADMIN_ITEM_OPTIONS = [
  '품목A', '품목B', '품목C', '품목D', '품목E',
] as const

export function formatWon(value: number): string {
  return value.toLocaleString('ko-KR')
}

/** 탈락 차종 요약 문자열 (예: "1t~3.5t 선초과") — 연속 구간·동일 사유일 때 압축 */
export function summarizeRejected(
  rejected: { vehicle_name: string; reasons: ExceedReason[] }[]
): string | null {
  if (rejected.length === 0) return null
  const first = rejected[0]
  const last = rejected[rejected.length - 1]
  const allSameReasons = rejected.every(
    r => r.reasons.join(',') === first.reasons.join(','),
  )
  const range =
    rejected.length === 1 ? first.vehicle_name : `${first.vehicle_name}~${last.vehicle_name}`
  if (allSameReasons) {
    return `${range} ${first.reasons.map(r => REASON_LABELS[r]).join('·')}`
  }
  return rejected
    .map(r => `${r.vehicle_name} ${r.reasons.map(x => REASON_LABELS[x]).join('·')}`)
    .join(', ')
}
