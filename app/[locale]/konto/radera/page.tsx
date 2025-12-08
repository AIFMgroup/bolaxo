import AccountDeletionForm from '@/components/AccountDeletionForm'

// Next.js Page expects `params` as a Promise in app router typing
export default async function DeleteAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <AccountDeletionForm locale={locale || 'sv'} backHref={`/${locale}/dashboard`} />
}

