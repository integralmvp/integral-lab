import type { OrderType } from '../../../../../types/domain/ops'

export interface IntakeFormState {
  거래처: string
  품목: string
  상차: string
  하차: string
  선사명: string
  운송구분: '' | '시내' | '시외'
  type: OrderType
  length_mm: string
  width_mm: string
  height_mm: string
  weight_kg: string
  차량대수: string
  운송중량_ton: string
}

export const DEMO_FORM: IntakeFormState = {
  거래처: '가상상사A',
  품목: '품목A',
  상차: '경기 평택',
  하차: '제주시 연동',
  선사명: '',
  운송구분: '',
  type: '차량형',
  length_mm: '6000',
  width_mm: '600',
  height_mm: '600',
  weight_kg: '300',
  차량대수: '1',
  운송중량_ton: '',
}

export type FormErrors = Partial<Record<keyof IntakeFormState, string>>

const POSITIVE_FIELDS: (keyof IntakeFormState)[] = ['length_mm', 'width_mm', 'height_mm', 'weight_kg', '차량대수']
const REQUIRED_TEXT: (keyof IntakeFormState)[] = ['거래처', '품목', '상차', '하차']

export function validateIntake(f: IntakeFormState): FormErrors {
  const errors: FormErrors = {}
  for (const k of REQUIRED_TEXT) if (!f[k].trim()) errors[k] = '필수 입력'
  for (const k of POSITIVE_FIELDS) {
    const n = Number(f[k])
    if (!Number.isFinite(n) || n <= 0) errors[k] = '0보다 큰 숫자'
  }
  if (f.type === '중량형') {
    const n = Number(f.운송중량_ton)
    if (!Number.isFinite(n) || n <= 0) errors.운송중량_ton = '0보다 큰 숫자'
  }
  return errors
}
