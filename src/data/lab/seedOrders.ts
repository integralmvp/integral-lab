/**
 * 시연용 접수건 (가상 거래처·품목). created_at은 시드 시점에 채운다.
 * 화주앱 유입 3 + 오프라인 5 / 중량·컨테이너·차량·자동화물 / 단가 미등록 1건(자동화물형 도내).
 * ORD-007 = 접수 직후 미견적(R1), ORD-008 = 전 구간 하차 완료·정산 미확정(R5, 정산 창).
 */
import type { Order } from '../../types/domain/ops'

export type SeedOrder = Omit<Order, 'created_at'>

/** 시드 시나리오: 접수 후 어디까지 진행된 상태로 재생할지 (전부 emit 경로로 재생) */
export type SeedStage = 'QUOTED' | 'RECEIVED_ONLY' | 'ALL_DONE'

export interface SeedScenario {
  order: SeedOrder
  stage: SeedStage
}

export const SEED_ORDERS: SeedOrder[] = [
  {
    id: 'ORD-001', intake: 'SHIPPER_APP', sourceRef: 'DEAL-DEMO-1', 거래처: '가상상사A', 품목: '품목A',
    상차: '경기 평택', 하차: '제주시 연동', 선사명: '선사A', type: '차량형',
    cargo: { length_mm: 6000, width_mm: 600, height_mm: 600, weight_kg: 300 }, 차량대수: 1,
  },
  {
    id: 'ORD-002', intake: 'SHIPPER_APP', sourceRef: 'DEAL-DEMO-2', 거래처: '가상상사B', 품목: '품목B',
    상차: '부산 사상', 하차: '서귀포 대정', 선사명: '선사A', type: '중량형',
    cargo: { length_mm: 1200, width_mm: 1000, height_mm: 1000, weight_kg: 8000 }, 차량대수: 1, 운송중량_ton: 8,
  },
  {
    id: 'ORD-003', intake: 'SHIPPER_APP', sourceRef: 'DEAL-DEMO-3', 거래처: '가상상사D', 품목: '품목C',
    상차: '제주시 노형', 하차: '제주시 이도', type: '자동화물형',
    cargo: { length_mm: 1000, width_mm: 800, height_mm: 600, weight_kg: 40 }, 차량대수: 2,
  },
  {
    id: 'ORD-004', intake: 'OFFLINE', 거래처: '가상상사C', 품목: '품목B',
    상차: '제주시 화북', 하차: '서귀포 남원', type: '중량형', 운송구분: '시외',
    cargo: { length_mm: 2000, width_mm: 1000, height_mm: 1000, weight_kg: 3500 }, 차량대수: 1, 운송중량_ton: 3.5,
  },
  {
    id: 'ORD-005', intake: 'OFFLINE', 거래처: '가상상사E', 품목: '품목D',
    상차: '전남 목포', 하차: '서귀포 성산', 선사명: '선사B', type: '컨테이너형',
    cargo: { length_mm: 5900, width_mm: 2350, height_mm: 2390, weight_kg: 12000 }, 차량대수: 1,
  },
  {
    id: 'ORD-006', intake: 'OFFLINE', 거래처: '가상상사A', 품목: '품목E',
    상차: '제주시 애월', 하차: '제주시 조천', type: '차량형', 운송구분: '시내',
    cargo: { length_mm: 2000, width_mm: 1000, height_mm: 800, weight_kg: 200 }, 차량대수: 1,
  },
]

/** 추가 시나리오 시드 (기존 6건 의미 불변) */
export const SEED_EXTRA: SeedScenario[] = [
  {
    stage: 'RECEIVED_ONLY',
    order: {
      id: 'ORD-007', intake: 'OFFLINE', 거래처: '가상상사F', 품목: '품목C',
      상차: '제주시 연동', 하차: '서귀포 중문', type: '차량형', 운송구분: '시외',
      cargo: { length_mm: 3000, width_mm: 1200, height_mm: 1000, weight_kg: 800 }, 차량대수: 1,
    },
  },
  {
    stage: 'ALL_DONE',
    order: {
      id: 'ORD-008', intake: 'OFFLINE', 거래처: '가상상사B', 품목: '품목B',
      상차: '제주시 화북', 하차: '제주시 한림', type: '중량형',
      cargo: { length_mm: 2000, width_mm: 1000, height_mm: 1000, weight_kg: 5000 }, 차량대수: 1, 운송중량_ton: 5,
    },
  },
]

/** 재생 순서대로의 전체 시나리오 */
export const SEED_SCENARIOS: SeedScenario[] = [
  ...SEED_ORDERS.map(order => ({ order, stage: 'QUOTED' as const })),
  ...SEED_EXTRA,
]
