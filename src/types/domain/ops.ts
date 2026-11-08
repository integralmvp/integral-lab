/**
 * LAB 운영(Ops) 도메인 타입 — docs/LAB_ARCHITECTURE.md §2 (SPL 컬럼명 보존)
 * 200mm 큐브 세계 전용. 화주용 250mm 타입과 섞지 않는다.
 */

export type OrderType = '중량형' | '컨테이너형' | '차량형' | '자동화물형'
export type Stage = '내륙' | '선사' | '도내'
export type Intake = 'SHIPPER_APP' | 'OFFLINE'

export interface CargoSpec {
  length_mm: number
  width_mm: number
  height_mm: number
  weight_kg: number
}

export interface Order {
  id: string
  intake: Intake
  sourceRef?: string
  거래처: string
  품목: string
  상차: string
  하차: string
  선사명?: string
  운송구분?: '시내' | '시외'
  type: OrderType
  cargo: CargoSpec
  차량대수: number
  운송중량_ton?: number
  created_at: string
}

export type LegStatus = 'WAITING' | 'DISPATCHED' | 'LOADED' | 'IN_TRANSIT' | 'DONE'
export type OrderStatus = 'RECEIVED' | 'QUOTED' | 'IN_OPERATION' | 'COMPLETED' | 'SETTLED' | 'CANCELLED'

export type PriceRole =
  | '표준' | '세부' | '조건' | '협상' | '전속' | '전속_단일' | '전속_외부변수' | '미분류' | '기타'
  | '단가군_세부' | '단가군_조건' | '단가군_협상' | '참고'

export type PriceUnit = '원/차량' | '원/톤' | '원/CBM'

export interface LegQuote {
  청구큐브: number
  큐브당: number | null
  /** 원/차량 단위 행일 때만 채움 */
  차량당: number | null
  /** 적용 행의 실단가(후가공 산출물 그대로) */
  실단가: number | null
  실단가_단위: PriceUnit | null
  /** 실단가에 곱한 수량 (대수 / 톤 / CBM) */
  수량: number | null
  amount: number | null
  applied_row_id: string | null
  applied_role: PriceRole | null
  price_version: string
  unregistered: boolean
  /** 차량형 매칭 차종 (근거 표시용) */
  matched_vehicle?: string | null
}

export interface Leg {
  id: string
  order_id: string
  단계: Stage
  seq: number
  경로_원본: string
  수단_세부?: string
  status: LegStatus
  quote: LegQuote | null
}

export interface PriceRow {
  id: string
  유형: OrderType
  단계: Stage
  역할: PriceRole
  위계: number
  conditions: { 거래처?: string; 품목?: string; 경로_세부?: string; 수단_세부?: string }
  큐브당: number
  실단가: number
  실단가_단위: PriceUnit
  source: 'placeholder' | 'manual_v0' | `spl_v${number}`
  version: string
  meta?: Record<string, unknown>
}

export interface PriceTableSource {
  id: string
  version: string
  source: PriceRow['source']
  getRows(): PriceRow[]
}

export type EventType =
  | 'ORDER_RECEIVED'
  | 'QUOTE_DONE'
  | 'QUOTE_UNREGISTERED'
  | 'LEG_DISPATCHED'
  | 'LEG_LOADED'
  | 'LEG_IN_TRANSIT'
  | 'LEG_DONE'
  | 'ORDER_COMPLETED'
  | 'SETTLEMENT_CONFIRMED'
  | 'ORDER_CANCELLED'

export type Actor = '관리자' | '현장' | '시스템'

export interface OpsEvent {
  id: string
  at: string
  actor: Actor
  type: EventType
  order_id: string
  leg_id?: string
  payload?: unknown
}

export interface Dispatch {
  id: string
  leg_id: string
  vehicle_label: string
  driver_label?: string
  dispatched_at: string
}

export interface Settlement {
  order_id: string
  매출: number
  매입: number
  마진: number
  status: 'PENDING' | 'CONFIRMED'
  settled_at?: string
}

export type Audience = '실무자' | '대표'
export type Severity = 'info' | 'warn' | 'alert'

export interface OpsMessage {
  id: string
  rule_id: string
  audience: Audience
  severity: Severity
  order_id?: string
  leg_id?: string
  text: string
  event_id?: string
  at: string
}

/** Event 별칭 (요청 명세 호환) */
export type Event = OpsEvent
export type Message = OpsMessage
