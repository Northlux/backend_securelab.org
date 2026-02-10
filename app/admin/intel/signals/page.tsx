import { getSignals } from '@/app/actions/intel/signals'
import SignalsClient from './page-client'

export default async function SignalsPage() {
  const { data, count } = await getSignals(1, 20)
  return <SignalsClient initialSignals={data || []} initialCount={count} />
}
