import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { hasSession } from '@/lib/session'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { meQueryOptions } from '@/features/auth/queries'
import { FleetActions } from '@/features/fleet/fleet-actions'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    if (!hasSession()) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: Authenticated,
})

function Authenticated() {
  const meQuery = useQuery(meQueryOptions())
  const setMe = useAuthStore((s) => s.setMe)
  useEffect(() => {
    if (meQuery.data) setMe(meQuery.data)
  }, [meQuery.data, setMe])
  return <AuthenticatedLayout headerActions={<FleetActions />} />
}
