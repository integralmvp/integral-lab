import type { Order } from '../../../types/domain/ops'
import { LAB_KEYS } from './keys'
import { readJson, writeJson } from './store'

export const orderRepo = {
  list(): Order[] {
    return readJson<Order[]>(LAB_KEYS.ORDERS, [])
  },
  get(id: string): Order | undefined {
    return this.list().find(o => o.id === id)
  },
  insert(order: Order): void {
    writeJson(LAB_KEYS.ORDERS, [...this.list().filter(o => o.id !== order.id), order])
  },
  clear(): void {
    localStorage.removeItem(LAB_KEYS.ORDERS)
  },
}
