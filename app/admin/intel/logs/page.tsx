import { getIngestionLogs } from '@/app/actions/intel/logs'
import LogsClient from './page-client'

export default async function LogsPage() {
  const { data } = await getIngestionLogs(1, 50)
  return <LogsClient initialLogs={data || []} />
}
