/** LAB 저장소 키 — 전부 `lab:` 네임스페이스 */
export const LAB_KEYS = {
  ORDERS: 'lab:orders',
  LEGS: 'lab:legs',
  EVENTS: 'lab:events',
} as const

export const LAB_KEY_LIST: string[] = Object.values(LAB_KEYS)
