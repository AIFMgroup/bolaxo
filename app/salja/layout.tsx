import AuthProviderWrapper from '@/components/AuthProviderWrapper'
import ToastProviderWrapper from '@/components/ToastProviderWrapper'

export default function SaljaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProviderWrapper>
      <ToastProviderWrapper>
        {children}
      </ToastProviderWrapper>
    </AuthProviderWrapper>
  )
}

