/**
 * 변경 버스 — emit(event) 단일 쓰기 경로 + 구독 + 탭 간 동기화(storage 이벤트)
 */
import type { EventType, OpsEvent, Actor } from '../../../types/domain/ops'
import { applyEventToLeg, canApply } from '../../../engine/ops'
import { eventRepo } from './event.repo'
import { legRepo } from './leg.repo'
import { LAB_KEY_LIST } from './keys'

type Listener = () => void
const listeners = new Set<Listener>()

export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function notify(): void {
  listeners.forEach(fn => fn())
}

let seq = 0
export function makeOpsEventId(): string {
  seq += 1
  return `EV-${Date.now().toString(36)}-${seq}-${Math.random().toString(36).slice(2, 6)}`
}

export interface EmitInput {
  type: EventType
  actor: Actor
  order_id: string
  leg_id?: string
  payload?: unknown
  at?: string
}

/**
 * 이벤트 발행. Leg 전이가 허용되지 않으면 거부(null 반환, 이벤트 미발행).
 */
export function emit(input: EmitInput, opts: { silent?: boolean } = {}): OpsEvent | null {
  const ev: OpsEvent = { id: makeOpsEventId(), at: input.at ?? new Date().toISOString(), ...input }
  if (ev.leg_id) {
    const leg = legRepo.get(ev.leg_id)
    if (!leg || !canApply(leg, ev.type)) return null
    legRepo.saveAll(legRepo.list().map(l => applyEventToLeg(l, ev)))
  }
  eventRepo.append(ev)
  if (!opts.silent) notify()
  return ev
}

let syncInstalled = false
/** 다른 탭에서 lab: 키가 바뀌면 구독자에게 알림 */
export function installStorageSync(): void {
  if (syncInstalled || typeof window === 'undefined') return
  syncInstalled = true
  window.addEventListener('storage', e => {
    if (e.key === null || LAB_KEY_LIST.includes(e.key)) notify()
  })
}
