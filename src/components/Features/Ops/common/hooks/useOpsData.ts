/**
 * 운영 데이터 구독 훅 — repo 스냅샷 + 파생(상태·메시지). 탭 간 동기화 포함.
 * 모든 창은 이 훅 하나로 같은 데이터를 본다 (단일 진실 소스).
 */
import { useEffect, useMemo, useState } from 'react'
import type { Leg, OpsEvent, OpsMessage, Order, OrderStatus } from '../../../../../types/domain/ops'
import { deriveMessages, deriveOrderStatus, isCancelled, settlementFromEvents } from '../../../../../engine/ops'
import { eventRepo, installStorageSync, legRepo, orderRepo, subscribe } from '../../../../../infra/storage/ops'
import { seedIfEmpty } from '../../../../../layers/ops/opsCommands'

export interface OrderView {
  order: Order
  legs: Leg[]
  status: OrderStatus
  /** 구간 견적 합계 (미등록 구간이 있으면 null) */
  total: number | null
  hasUnregistered: boolean
  quoted: boolean
}

export interface OpsData {
  orders: Order[]
  legs: Leg[]
  events: OpsEvent[]
  views: OrderView[]
  messages: OpsMessage[]
  now: Date
}

function snapshot() {
  return { orders: orderRepo.list(), legs: legRepo.list(), events: eventRepo.list() }
}

export function useOpsData(): OpsData {
  const [snap, setSnap] = useState(() => {
    seedIfEmpty()
    return snapshot()
  })
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    installStorageSync()
    const unsub = subscribe(() => setSnap(snapshot()))
    const t = window.setInterval(() => setNow(new Date()), 15000)
    return () => {
      unsub()
      window.clearInterval(t)
    }
  }, [])

  return useMemo(() => {
    const views: OrderView[] = snap.orders
      .map(order => {
        const legs = snap.legs.filter(l => l.order_id === order.id).sort((a, b) => a.seq - b.seq)
        const hasUnregistered = legs.some(l => l.quote?.unregistered)
        const quoted = legs.length > 0 && legs.every(l => l.quote !== null)
        const total = quoted && !hasUnregistered ? legs.reduce((s, l) => s + (l.quote?.amount ?? 0), 0) : null
        const status = deriveOrderStatus(
          legs,
          settlementFromEvents(snap.events, order.id),
          isCancelled(snap.events, order.id)
        )
        return { order, legs, status, total, hasUnregistered, quoted }
      })
      .sort((a, b) => b.order.created_at.localeCompare(a.order.created_at))
    const messages = deriveMessages({ ...snap, now })
    return { ...snap, views, messages, now }
  }, [snap, now])
}
