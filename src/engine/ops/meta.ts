/**
 * 유형_메타 (선가공 유형 dict의 TS 이식, placeholder) — 설계서 §3 큐브환산
 * 유형 분기는 이 데이터로 한다. 엔진 코드에 유형별 if 분기를 흩뿌리지 않는다.
 */
import type { OrderType } from '../../types/domain/ops'

export type CubeBasis = '실존_중량' | '실질_차량매칭' | '실질_규격' | '실질_화물부피'

export interface TypeMeta {
  basis: CubeBasis
  /** 실질_규격일 때 1단위 규격큐브 (컨테이너 20ft 가정 — §10) */
  규격큐브?: number
  /** 수송 단위가 바다를 건너는가 (자동화물형은 단일 구간) */
  singleLeg: boolean
}

export const TYPE_META: Record<OrderType, TypeMeta> = {
  중량형: { basis: '실존_중량', singleLeg: false },
  컨테이너형: { basis: '실질_규격', 규격큐브: 4000, singleLeg: false },
  차량형: { basis: '실질_차량매칭', singleLeg: false },
  자동화물형: { basis: '실질_화물부피', singleLeg: true },
}

/** 1큐브 = 0.2m³ → 0.008 CBM */
export const CBM_PER_CUBE = 0.008
