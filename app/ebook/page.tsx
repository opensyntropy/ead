import { redirect } from 'next/navigation'
import { CHAPTERS } from '@/config/chapters'

export default function EadIndex() {
  redirect(`/ebook/${CHAPTERS[0].id}`)
}
