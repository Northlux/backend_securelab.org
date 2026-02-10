import { getTags } from '@/app/actions/intel/tags'
import TagsClient from './page-client'

export default async function TagsPage() {
  const tags = await getTags()
  return <TagsClient initialTags={tags} />
}
