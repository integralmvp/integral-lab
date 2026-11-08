/** append-only 이벤트 로그 — 수정/삭제 API 없음 (보정은 새 이벤트) */
import type { OpsEvent } from '../../../types/domain/ops'
import { LAB_KEYS } from './keys'
import { readJson, writeJson } from './store'

export const eventRepo = {
  list(): OpsEvent[] {
    return readJson<OpsEvent[]>(LAB_KEYS.EVENTS, [])
  },
  append(ev: OpsEvent): void {
    writeJson(LAB_KEYS.EVENTS, [...this.list(), ev])
  },
  /** 데모 초기화 전용 */
  clear(): void {
    localStorage.removeItem(LAB_KEYS.EVENTS)
  },
}
