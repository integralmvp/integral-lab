/**
 * 골든 데모 화물 테스트 (CUBE_MVP_SPEC.md §4 + adminRateTable.json 3계층 룩업)
 *
 * 입력: 길이 6000 · 폭 600 · 높이 600 (mm) · 중량 300 (kg) · 권역 "시외" · 품목 "품목A" · 대수 1
 * (장척 파이프 시나리오 — 단가는 lab placeholder)
 */

import { describe, it, expect } from 'vitest'
import {
  cargoCubes,
  matchVehicle,
  rejectedVehicles,
  billingCube,
  lookupRate,
  quote,
  VEHICLE_DB,
  RATE_TABLE,
} from '../index'

const GOLDEN = { L: 6000, W: 600, H: 600, kg: 300, 권역: '시외' as const, 품목: '품목A', 대수: 1 }

describe('골든 데모 화물 (스펙 §4 + 계층 단가)', () => {
  const cargo = cargoCubes(GOLDEN.L, GOLDEN.W, GOLDEN.H, GOLDEN.kg)

  it('큐브 좌표: 선 30 · 면 90 · 공간 270 · 중량 60', () => {
    expect(cargo.line_cube).toBe(30)
    expect(cargo.area_cube).toBe(90)
    expect(cargo.volume_cube).toBe(270)
    expect(cargo.weight_cube).toBe(60)
  })

  it('1t~3.5t는 선초과로 탈락 (선 30 > 14/15/21/23), 공간·중량은 여유', () => {
    const rejected = rejectedVehicles(cargo, VEHICLE_DB)
    expect(rejected.map(r => r.vehicle.id)).toEqual(['1t', '1.4t', '2.5t', '3.5t'])
    for (const r of rejected) {
      expect(r.reasons).toEqual(['LINE']) // 선초과만 — 공간·중량 사유 없음
    }
  })

  it('추천 차종: 5t (선 31 ≥ 30, 첫 적합)', () => {
    const match = matchVehicle(cargo, VEHICLE_DB)
    expect(match.matched).toBe(true)
    expect(match.vehicle?.id).toBe('5t')
    expect(match.reasons).toEqual([])
  })

  it('청구큐브 2,500 (5t 부피큐브 × 1대)', () => {
    const match = matchVehicle(cargo, VEHICLE_DB)
    expect(billingCube(match.vehicle!, GOLDEN.대수)).toBe(2500)
  })

  it('시외·5t·품목A → 조건행 120,000 · 큐브당 48 (placeholder)', () => {
    const match = matchVehicle(cargo, VEHICLE_DB)
    const result = quote(RATE_TABLE, GOLDEN.권역, match.vehicle!, GOLDEN.대수, GOLDEN.품목)
    expect(result.청구큐브).toBe(2500)
    expect(result.적용행).toBe('조건')
    expect(result.차량당).toBe(120000)
    expect(result.큐브당).toBe(48)
    expect(result.견적가).toBe(120000)
    expect(result.단가미등록).toBe(false)
  })
})

describe('3계층 룩업 우선순위 (조건 → 세부 → 표준 → 미등록)', () => {
  const v5t = VEHICLE_DB.find(v => v.id === '5t')!
  const v25t = VEHICLE_DB.find(v => v.id === '25t')!
  const v1t = VEHICLE_DB.find(v => v.id === '1t')!

  it('시외·5t·품목 없음 → 세부행 130,000', () => {
    const result = quote(RATE_TABLE, '시외', v5t, 1)
    expect(result.적용행).toBe('세부')
    expect(result.견적가).toBe(130000)
    expect(result.단가미등록).toBe(false)
  })

  it('시외·25t·품목B → 조건행 210,000', () => {
    const result = quote(RATE_TABLE, '시외', v25t, 1, '품목B')
    expect(result.적용행).toBe('조건')
    expect(result.견적가).toBe(210000)
  })

  it('시내·25t·품목 없음 → 세부 없음, 표준행 195,000 fallback', () => {
    const rate = lookupRate(RATE_TABLE, '시내', '25t')
    expect(rate).toEqual({ 단가: 195000, 적용행: '표준' })
  })

  it('시내·1t → 어느 행에도 없음 → 단가 미등록 (null, 크래시·0원 금지)', () => {
    expect(lookupRate(RATE_TABLE, '시내', '1t')).toBeNull()
    const result = quote(RATE_TABLE, '시내', v1t, 1)
    expect(result.단가미등록).toBe(true)
    expect(result.견적가).toBeNull()
    expect(result.큐브당).toBeNull()
    expect(result.적용행).toBeNull()
    expect(result.청구큐브).toBe(400) // 청구큐브는 단가와 무관하게 산출
  })

  it('품목이 품목군에 없으면 조건행 미적용 → 세부행 fallback (시외·5t·품목B)', () => {
    // "품목B"는 25t 조건 품목군에만 존재 — 5t 조건행에는 없음
    const result = quote(RATE_TABLE, '시외', v5t, 1, '품목B')
    expect(result.적용행).toBe('세부')
    expect(result.견적가).toBe(130000)
  })
})
