import { permanentRedirect } from 'next/navigation'

// A lista de capítulos é a home.
export default function ManejoIndex() {
  permanentRedirect('/')
}
