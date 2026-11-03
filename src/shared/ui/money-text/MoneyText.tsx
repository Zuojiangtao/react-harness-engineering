import { formatCents } from '@/shared/lib/format'

export function MoneyText({ cents }: { cents: number | null | undefined }) {
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCents(cents)}</span>
}
