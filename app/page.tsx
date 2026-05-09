import { redirect } from 'next/navigation'

// The middleware handles locale detection and redirects to /es or /en.
// This fallback exists for static prerendering — redirect to /es as default.
export default function Home() {
  redirect('/es')
}
