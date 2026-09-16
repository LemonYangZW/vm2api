import { createFileRoute } from '@tanstack/react-router'
import { LoadtestPage } from '@/features/loadtest'

export const Route = createFileRoute('/_authenticated/loadtest/$tab')({
  component: LoadtestPage,
})
