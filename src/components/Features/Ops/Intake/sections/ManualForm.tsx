import { ORDER_TYPES } from '../../../../../layers/ops/opsCommands'
import type { OrderType } from '../../../../../types/domain/ops'
import { fmtMoney } from '../../common'
import type { OrderView } from '../../common'
import Field, { INPUT_CLS } from '../ui/Field'
import { useIntakeForm } from '../hooks/useIntakeForm'

const CARRIERS = ['선사A', '선사B', '선사C']

export default function ManualForm({ views }: { views: OrderView[] }) {
  const { form, errors, created, setField, submit, reset } = useIntakeForm()
  const createdView = created ? views.find(v => v.order.id === created.id) : undefined
  const text = (k: 'length_mm' | 'width_mm' | 'height_mm' | 'weight_kg' | '차량대수' | '운송중량_ton') => (
    <input type="number" className={INPUT_CLS} value={form[k]} onChange={e => setField(k, e.target.value)} />
  )
  const str = (k: '거래처' | '품목' | '상차' | '하차') => (
    <input className={INPUT_CLS} value={form[k]} onChange={e => setField(k, e.target.value)} />
  )
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4 max-w-3xl">
      {created && (
        <div className="rounded border border-teal-700 bg-teal-50 p-3 text-sm text-teal-900">
          접수 완료: <b className="font-mono">{created.id}</b> · 견적 합계{' '}
          <b>
            {createdView?.hasUnregistered ? '단가 미등록' : createdView?.quoted ? fmtMoney(createdView.total) : '미견적'}
          </b>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="거래처" error={errors.거래처}>{str('거래처')}</Field>
        <Field label="품목" error={errors.품목}>{str('품목')}</Field>
        <Field label="상차" error={errors.상차}>{str('상차')}</Field>
        <Field label="하차" error={errors.하차}>{str('하차')}</Field>
        <Field label="선사명 (선택)">
          <select className={INPUT_CLS} value={form.선사명} onChange={e => setField('선사명', e.target.value)}>
            <option value="">선택 안 함</option>
            {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="운송구분 (선택)">
          <select className={INPUT_CLS} value={form.운송구분} onChange={e => setField('운송구분', e.target.value as '' | '시내' | '시외')}>
            <option value="">선택 안 함</option>
            <option value="시내">시내</option>
            <option value="시외">시외</option>
          </select>
        </Field>
        <Field label="type">
          <select className={INPUT_CLS} value={form.type} onChange={e => setField('type', e.target.value as OrderType)}>
            {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="차량대수" error={errors.차량대수}>{text('차량대수')}</Field>
        <Field label="length (mm)" error={errors.length_mm}>{text('length_mm')}</Field>
        <Field label="width (mm)" error={errors.width_mm}>{text('width_mm')}</Field>
        <Field label="height (mm)" error={errors.height_mm}>{text('height_mm')}</Field>
        <Field label="weight (kg)" error={errors.weight_kg}>{text('weight_kg')}</Field>
        {form.type === '중량형' && <Field label="운송중량 (ton)" error={errors.운송중량_ton}>{text('운송중량_ton')}</Field>}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={submit} className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
          접수 등록
        </button>
        <button type="button" onClick={reset} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          초기화
        </button>
      </div>
    </div>
  )
}
