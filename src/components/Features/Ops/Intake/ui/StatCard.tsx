export default function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 min-w-[96px]">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${accent ? 'text-teal-700' : 'text-gray-900'}`}>{value}</div>
    </div>
  )
}
