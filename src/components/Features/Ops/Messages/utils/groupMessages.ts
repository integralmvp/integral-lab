import type { Audience, OpsMessage, Severity } from '../../../../../types/domain/ops'

export function filterByAudience(list: OpsMessage[], audience: Audience): OpsMessage[] {
  return list.filter(m => m.audience === audience)
}

export function countBySeverity(list: OpsMessage[]): Record<Severity, number> {
  const c: Record<Severity, number> = { alert: 0, warn: 0, info: 0 }
  for (const m of list) c[m.severity] += 1
  return c
}

export function groupByRule(list: OpsMessage[]): [string, OpsMessage[]][] {
  const map = new Map<string, OpsMessage[]>()
  for (const m of list) map.set(m.rule_id, [...(map.get(m.rule_id) ?? []), m])
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}
