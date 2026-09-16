import { useQuery } from '@tanstack/react-query'
import { VIEW_TITLES } from '@/config/nav'
import { PageHeader } from '@/components/page-header'
import { SectionSkeleton } from '@/components/page-skeletons'
import { QueryGate } from '@/components/query-gate'
import { dashboardQueryOptions } from '@/features/overview/queries'
import { CredentialFlow } from './credential-flow'

export function ImportPage() {
  const dash = useQuery(dashboardQueryOptions())
  return (
    <PageHeader title={VIEW_TITLES.import}>
      <QueryGate
        loading={dash.isLoading}
        error={dash.error}
        skeleton={
          <SectionSkeleton
            className='max-w-2xl'
            titleWidth='w-28'
            showDescription={false}
            rows={8}
          />
        }
      >
        <CredentialFlow />
      </QueryGate>
    </PageHeader>
  )
}
