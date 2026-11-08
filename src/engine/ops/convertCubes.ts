/**
 * 큐브환산 (설계서 §3) — 200mm cubeCoordinate 엔진 재사용. 순수 함수.
 */
import type { Order } from '../../types/domain/ops'
import { cargoCubes, matchVehicle, VEHICLE_DB } from '../cubeCoordinate'
import { TYPE_META } from './meta'

export interface CubeConversion {
  청구큐브: number
  /** 차량형 매칭 차종 id (없으면 null) */
  vehicle: string | null
}

export function orderTons(order: Order): number {
  return order.운송중량_ton ?? order.cargo.weight_kg / 1000
}

export function convertCubes(order: Order): CubeConversion {
  const meta = TYPE_META[order.type]
  const count = Math.max(1, order.차량대수 || 1)
  const { length_mm, width_mm, height_mm, weight_kg } = order.cargo
  switch (meta.basis) {
    case '실존_중량':
      return { 청구큐브: Math.floor(orderTons(order) * 200 + 0.5), vehicle: null }
    case '실질_규격':
      return { 청구큐브: (meta.규격큐브 ?? 0) * count, vehicle: null }
    case '실질_차량매칭': {
      const match = matchVehicle(cargoCubes(length_mm, width_mm, height_mm, weight_kg), VEHICLE_DB)
      if (!match.vehicle) return { 청구큐브: 0, vehicle: null }
      return { 청구큐브: match.vehicle.volume_cube * count, vehicle: match.vehicle.id }
    }
    case '실질_화물부피':
      return { 청구큐브: cargoCubes(length_mm, width_mm, height_mm, weight_kg).volume_cube * count, vehicle: null }
  }
}
