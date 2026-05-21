'use client'

import { useEffect } from 'react'

export default function PageViewTracker({ token }: { token: string }) {
  useEffect(() => {
    fetch('/api/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).catch(() => {})
  }, [token])

  return null
}
