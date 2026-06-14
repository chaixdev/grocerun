import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { PageLoading } from '@/components/ui/page-loading'

export const router = createRouter({
  routeTree,
  defaultPendingComponent: PageLoading,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
