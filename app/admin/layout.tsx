import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Afterfounder Admin Dashboard',
  description: 'Administratörsportal för Afterfounder',
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

