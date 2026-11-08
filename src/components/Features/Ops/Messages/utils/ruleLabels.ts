import type { Severity } from '../../../../../types/domain/ops'

export const RULE_LABELS: Record<string, string> = {
  R1: '미견적',
  R2: '단가 미등록',
  R3: '배차 대기 지연',
  R4: '다음 구간 배차 필요',
  R5: '정산 확정 대기',
  R6: '일일 요약',
}

export const SEVERITY_STYLE: Record<Severity, { box: string; badge: string; label: string }> = {
  alert: { box: 'border-red-300 bg-red-50', badge: 'bg-red-600 text-white', label: '긴급' },
  warn: { box: 'border-amber-300 bg-amber-50', badge: 'bg-amber-500 text-white', label: '주의' },
  info: { box: 'border-teal-200 bg-teal-50', badge: 'bg-teal-600 text-white', label: '안내' },
}

export function ruleLabel(id: string): string {
  return RULE_LABELS[id] ?? id
}
