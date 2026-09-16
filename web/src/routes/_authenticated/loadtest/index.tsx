import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/loadtest/')({
  beforeLoad: () => {
    throw redirect({ to: '/loadtest/$tab', params: { tab: 'reports' } })
  },
})
