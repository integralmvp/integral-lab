import { useState } from 'react'
import type { Order } from '../../../../../types/domain/ops'
import { registerOrder } from '../../../../../layers/ops/opsCommands'
import { DEMO_FORM, validateIntake } from '../utils/validation'
import type { FormErrors, IntakeFormState } from '../utils/validation'

export function useIntakeForm() {
  const [form, setForm] = useState<IntakeFormState>(DEMO_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [created, setCreated] = useState<Order | null>(null)

  const setField = <K extends keyof IntakeFormState>(k: K, v: IntakeFormState[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const submit = () => {
    const errs = validateIntake(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const order = registerOrder({
      intake: 'OFFLINE',
      거래처: form.거래처.trim(),
      품목: form.품목.trim(),
      상차: form.상차.trim(),
      하차: form.하차.trim(),
      선사명: form.선사명 || undefined,
      운송구분: form.운송구분 || undefined,
      type: form.type,
      cargo: {
        length_mm: Number(form.length_mm),
        width_mm: Number(form.width_mm),
        height_mm: Number(form.height_mm),
        weight_kg: Number(form.weight_kg),
      },
      차량대수: Number(form.차량대수),
      운송중량_ton: form.type === '중량형' ? Number(form.운송중량_ton) : undefined,
    })
    setCreated(order)
  }

  const reset = () => {
    setForm(DEMO_FORM)
    setErrors({})
    setCreated(null)
  }

  return { form, errors, created, setField, submit, reset }
}
