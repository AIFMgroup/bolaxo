import AccountDeletionForm from '@/components/AccountDeletionForm'

type Props = {
  params: { locale: string }
}

export default function DeleteAccountPage({ params }: Props) {
  const locale = params.locale || 'sv'
  return <AccountDeletionForm locale={locale} backHref={`/${locale}/dashboard`} />
}

