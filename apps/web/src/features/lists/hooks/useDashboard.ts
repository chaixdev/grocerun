import { useQuery } from "@tanstack/react-query"
import { api } from "@/core/lib/api"

// ----- Types -----

export interface DashboardList {
  id: string
  name: string
  status: string
  updatedAt: string
  _count: { items: number }
}

export interface DashboardStore {
  id: string
  name: string
  location: string | null
  lists: DashboardList[]
}

export interface DashboardHousehold {
  id: string
  name: string
  stores: DashboardStore[]
}

// ----- Query Keys -----

export const dashboardKeys = {
  all: ["dashboard"] as const,
}

// ----- Queries -----

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: () => api.get<DashboardHousehold[]>("/household-overview"),
  })
}
