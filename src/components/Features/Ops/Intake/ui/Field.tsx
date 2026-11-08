import type { ReactNode } from 'react'

export default function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-600 mt-0.5">{error}</span>}
    </label>
  )
}

export const INPUT_CLS =
  'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700'
