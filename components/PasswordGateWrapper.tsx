'use client'

import dynamic from 'next/dynamic'

const PasswordGate = dynamic(() => import('./PasswordGate'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
    </div>
  )
})

export default function PasswordGateWrapper({ children }: { children: React.ReactNode }) {
  return <PasswordGate>{children}</PasswordGate>
}

