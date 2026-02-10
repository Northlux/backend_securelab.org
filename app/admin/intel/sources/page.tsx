import { getSources } from '@/app/actions/intel/sources'
import SourcesClient from './page-client'

export default async function SourcesPage() {
  const sources = await getSources()

  return <SourcesClient initialSources={sources} />
}
