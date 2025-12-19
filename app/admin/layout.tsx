import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BOLAXO Admin Dashboard',
  description: 'Administratörsportal för BOLAXO',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
}

