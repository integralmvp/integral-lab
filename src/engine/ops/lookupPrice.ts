/**
 * 단가 룩업 (설계서 §3 규칙, §10-①) — 순수 함수
 * 1) 유형·단계 일치 + conditions의 non-null 축 전부 일치
 * 2) 기타·참고·전속_외부변수·미분류 제외, 전속(전속_단일 포함)은 거래처 조건이 있고 일치할 때만
 * 3) 정렬: non-null 축 개수 내림차순 → 위계 내림차순
 * 4) 후보 없음 → null (호출측에서 unregistered 처리)
 */
import type { Leg, Order, PriceRole, PriceRow } from '../../types/domain/ops'

const EXCLUDED: PriceRole[] = ['기타', '참고', '전속_외부변수', '미분류']
const EXCLUSIVE: PriceRole[] = ['전속', '전속_단일']

export interface LookupContext {
  /** 차량형 매칭 차종 등 수단 (leg.수단_세부보다 우선 순위 낮음) */
  수단?: string | null
}

function axisCount(row: PriceRow): number {
  return Object.values(row.conditions).filter(v => v !== undefined && v !== null && v !== '').length
}

export function lookupPrice(
  rows: PriceRow[],
  order: Order,
  leg: Leg,
  ctx: LookupContext = {}
): PriceRow | null {
  const actual = {
    거래처: order.거래처,
    품목: order.품목,
    경로_세부: leg.경로_원본,
    수단_세부: leg.수단_세부 ?? ctx.수단 ?? undefined,
  }
  const candidates = rows.filter(row => {
    if (row.유형 !== order.type || row.단계 !== leg.단계) return false
    if (EXCLUDED.includes(row.역할)) return false
    if (EXCLUSIVE.includes(row.역할) && !row.conditions.거래처) return false
    if (!(row.실단가 > 0)) return false // §10-⑨ 실단가 없는 행은 미등록 취급
    return (Object.keys(row.conditions) as Array<keyof typeof actual>).every(k => {
      const want = row.conditions[k]
      return want === undefined || want === null || want === '' || want === actual[k]
    })
  })
  if (candidates.length === 0) return null
  const sorted = [...candidates].sort((a, b) => axisCount(b) - axisCount(a) || b.위계 - a.위계)
  return sorted[0]
}
