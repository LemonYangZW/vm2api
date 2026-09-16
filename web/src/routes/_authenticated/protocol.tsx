import { createFileRoute } from '@tanstack/react-router'
import { ProtocolPage } from '@/features/protocol'

export const Route = createFileRoute('/_authenticated/protocol')({
  component: ProtocolPage,
})
