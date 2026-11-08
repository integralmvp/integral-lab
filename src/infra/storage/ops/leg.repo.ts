/** Leg 캐시 저장소 — 상태 변경은 bus.emit(이벤트) 경유로만 (applyEventToLeg) */
import type { Leg } from '../../../types/domain/ops'
import { LAB_KEYS } from './keys'
import { readJson, writeJson } from './store'

export const legRepo = {
  list(): Leg[] {
    return readJson<Leg[]>(LAB_KEYS.LEGS, [])
  },
  get(id: string): Leg | undefined {
    return this.list().find(l => l.id === id)
  },
  byOrder(orderId: string): Leg[] {
    return this.list().filter(l => l.order_id === orderId).sort((a, b) => a.seq - b.seq)
  },
  insertMany(legs: Leg[]): void {
    const ids = new Set(legs.map(l => l.id))
    writeJson(LAB_KEYS.LEGS, [...this.list().filter(l => !ids.has(l.id)), ...legs])
  },
  saveAll(legs: Leg[]): void {
    writeJson(LAB_KEYS.LEGS, legs)
  },
  clear(): void {
    localStorage.removeItem(LAB_KEYS.LEGS)
  },
}
